import type { Request, Response } from "express";
import {
  AgentMail,
  AgentMailTypes,
  getAgentMailClient,
} from "@workspace/common";
import {
  db,
  subTests,
  eq,
  testCases,
  subTextActivity,
} from "@workspace/drizzle";
import { TestSuiteRun } from "node_modules/@vapi-ai/server-sdk/dist/cjs/api";
import { draftFirstMessage, respondAgent } from "./respondAgent";
import { llmJudgeEmailTest } from "./llmJudgeEmailTest";

export const sendAgentMail = async (req: Request, res: Response) => {
  const agentMailEvent =
    req.body as AgentMailTypes.AgentMailMessageReceivedEvent;
  const threadId = agentMailEvent.message.thread_id;

  console.log(
    `[sendAgentMail] Webhook received. event_type=${agentMailEvent.event_type}, message_id=${agentMailEvent.message.message_id}, thread_id=${threadId}`
  );

  if (!threadId) {
    console.warn(
      `[sendAgentMail] Missing thread ID on inbound message_id=${agentMailEvent.message.message_id}`
    );
    res.status(400).send("Thread ID is required");
    return;
  }

  // Close connection immediately to avoid webhook timeouts
  res.status(200).send({ received: true });

  // Process asynchronously in background
  (async () => {
    try {
      const agentMailClient = getAgentMailClient();

      console.log(`[sendAgentMail] Fetching thread ${threadId} ...`);
      const threadMessage = await agentMailClient.threads.get(threadId);
      console.log(
        `[sendAgentMail] Thread fetched. labels=${(
          threadMessage.labels || []
        ).join(",")}, message_count=${threadMessage.messages?.length || 0}`
      );

      const prevMessages = threadMessage.messages.filter(
        (message) =>
          message.messageId !== agentMailEvent.message.message_id &&
          new Date(message.timestamp) <
            new Date(agentMailEvent.message.timestamp)
      );
      console.log(
        `[sendAgentMail] Computed prevMessages. prev_count=${prevMessages.length}`
      );

      const label = threadMessage.labels.find((label) =>
        label.startsWith("test-run-")
      );

      const testRunId = label ? parseInt(label.replace("test-run-", "")) : null;

      if (!testRunId || isNaN(testRunId)) {
        console.warn(
          `[sendAgentMail] Could not determine testRunId from labels=${(
            threadMessage.labels || []
          ).join(",")}`
        );
        return;
      }

      console.log(
        `[sendAgentMail] Loading test context for testRunId=${testRunId} ...`
      );
      const testRun = await db
        .select()
        .from(subTests)
        .innerJoin(testCases, eq(subTests.testCaseId, testCases.id))
        .where(eq(subTests.id, testRunId))
        .limit(1);
      console.log(
        `[sendAgentMail] Test context load result count=${testRun.length}`
      );

      const newMessage = agentMailEvent.message;

      // Skip if message is from agentmail domain to avoid self-replies
      if (newMessage.from && newMessage.from.includes("@agentmail.to")) {
        console.log(
          `[sendAgentMail] Skipping response: message from agentmail domain (${newMessage.from})`
        );
        return;
      }

      const subTestRecord = testRun[0]?.sub_tests ?? null;
      const testCaseRecord = testRun[0]?.test_cases ?? null;

      console.log(
        `[sendAgentMail] Drafting reply using respondAgent. message_id=${
          newMessage.message_id
        }, subTestId=${subTestRecord?.id ?? "null"}, testCaseId=${
          testCaseRecord?.id ?? "null"
        }`
      );
      const draft = await respondAgent(prevMessages, newMessage, {
        subTest: subTestRecord,
        testCase: testCaseRecord,
      });
      console.log(
        `[sendAgentMail] Draft generated. subject_preview="${(
          draft.subject || ""
        ).slice(0, 80)}" body_preview="${(draft.body || "").slice(0, 80)}"`
      );

      // if (draft.body === "NO_RESPONSE") {

      //   return;
      // }

      if (draft.startEvaluation || draft.body === "NO_RESPONSE") {
        console.log(
          `[sendAgentMail] Starting evaluation of the test case. message_id=${
            newMessage.message_id
          }, subTestId=${subTestRecord?.id ?? "null"}, testCaseId=${
            testCaseRecord?.id ?? "null"
          }`
        );
        // We will run LLM judge and judge the test case.
        const judge = await llmJudgeEmailTest({
          prevMessages,
          newMessage,
          subTestRecord,
          testCaseRecord,
        });

        const subTestActivity = await db
          .select()
          .from(subTextActivity)
          .where(eq(subTextActivity.misc_id, newMessage.thread_id));
        if (!subTestActivity || subTestActivity.length === 0) {
          console.warn(
            `[sendAgentMail] No subTestActivity found for threadId=${newMessage.thread_id}`
          );
          return;
        }

        // Updating the DB with the judge results

        await db
          .update(subTextActivity)
          .set({
            status: judge.succeeded ? "SUCCESS" : "FAILED",
            metadata: {
              threadId: newMessage.thread_id,
              messageData: {
                ...judge,
              },
            },
          })
          .where(eq(subTextActivity.misc_id, newMessage.thread_id));

        if (draft.body == "NO_RESPONSE") {
          console.log(
            `[sendAgentMail] Skipping send because draft indicated NO_RESPONSE.`
          );
          return;
        }
      }

      const labelsToApply = Array.from(
        new Set([...(threadMessage.labels || []), `test-run-${testRunId}`])
      );
      const inboxId = newMessage.inbox_id;
      console.log("inboxId and messageId", inboxId, newMessage.message_id);
      console.log(
        `[sendAgentMail] Sending reply email from testing-quantix@agentmail.to to visedtooth28@gmail.com with labels=${labelsToApply.join(
          ","
        )} ...`
      );
      // Retry sending the reply up to 3 times if it fails
      let sent = false;
      let attempt = 0;
      let lastError: any = null;
      while (!sent && attempt < 3) {
        try {
          await agentMailClient.inboxes.messages.reply(
            inboxId,
            newMessage.message_id,
            {
              text: draft.body,
            }
          );
          sent = true;
        } catch (err) {
          attempt++;
          lastError = err;
          console.warn(
            `[sendAgentMail] Attempt ${attempt} failed to send reply. Retrying...`
          );
          if (attempt >= 3) {
            throw err;
          }
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }
      console.log(`[sendAgentMail] Reply email sent successfully.`);
    } catch (err) {
      console.error(
        `[sendAgentMail] Failed to draft or send response for thread_id=${threadId}`,
        err
      );
    }
  })();
};

export const startTest = async (req: Request, res: Response) => {
  const { testRunId } = req.body;

  console.log(
    `[startTest] Received request to start test. testRunId: ${testRunId}`
  );

  if (!testRunId) {
    console.warn("[startTest] Test run ID is missing in request body.");
    res.status(400).send("Test run ID is required");
    return;
  }

  // Accept request and close connection immediately to avoid timeouts
  res.status(202).send({ started: true, testRunId });

  // Process asynchronously in background
  (async () => {
    console.log(`[startTest] Querying for test run with ID: ${testRunId}`);

    const testRun = await db
      .select()
      .from(subTests)
      .innerJoin(testCases, eq(subTests.testCaseId, testCases.id))
      .where(eq(subTests.id, testRunId))
      .limit(1);

    if (!testRun || testRun.length === 0) {
      console.warn(`[startTest] Test run not found for ID: ${testRunId}`);
      return;
    }

    const testRunData = testRun[0];
    const subTestRecord = testRunData.sub_tests;
    const testCaseRecord = testRunData.test_cases;

    console.log(`[startTest] Found test run. subTestRecord:`, subTestRecord);
    console.log(`[startTest] Corresponding testCaseRecord:`, testCaseRecord);

    try {
      console.log(
        `[startTest] Drafting the first message for testRunId: ${testRunId}`
      );
      const draft = await draftFirstMessage(subTestRecord, testCaseRecord);
      const agentMailClient = getAgentMailClient();

      console.log(
        `[startTest] Sending first message for testRunId: ${testRunId} to visedtooth28@gmail.com`
      );
      const firstMail = await agentMailClient.inboxes.messages.send(
        "testing-quantix-1@agentmail.to",
        {
          to: testCaseRecord.email || "visedtooth28@gmail.com",
          labels: [`test-run-${testRunId}`],
          subject: draft.subject,
          text: draft.body,
        }
      );

      console.log(
        `[startTest] First message sent successfully for testRunId: ${testRunId}`
      );

      // Store the first message activity
      await db.insert(subTextActivity).values({
        subTestId: testRunId,
        type: "EMAIL",
        status: "PENDING",
        metadata: {
          threadId: firstMail.threadId,
          messageData: {},
        },
        misc_id: firstMail.threadId,
      });
    } catch (err) {
      console.error(
        `[startTest] Failed to draft or send first message for testRunId: ${testRunId}`,
        err
      );
    }
  })();
};
