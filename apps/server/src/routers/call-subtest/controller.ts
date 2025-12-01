import { getVapiClient } from "@/lib/vapi";
import { db, subTests, testCases, subTextActivity } from "@workspace/drizzle";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { llmJudgePhoneCall } from "./llmJudgePhoneCall";

const router: Router = Router();

// Webhook endpoint - Vapi calls this when call status changes
router.post("/webhook", async (req, res) => {
  console.log(
    "[webhook] Received Vapi webhook:",
    JSON.stringify(req.body, null, 2)
  );

  // Respond immediately to avoid timeout
  res.status(200).json({ received: true });

  // Process asynchronously
  (async () => {
    try {
      const webhookData = req.body;
      const message = webhookData.message;

      // Only process "status-update" events when call ends
      if (message?.type !== "status-update" || message?.status !== "ended") {
        console.log(
          `[webhook] Ignoring event: type=${message?.type}, status=${message?.status}`
        );
        return;
      }

      const callId = message.call?.id;
      const testId = message.call?.assistantOverrides?.variableValues?.test_id;

      if (!callId) {
        console.warn("[webhook] No call ID in webhook payload");
        return;
      }

      console.log(
        `[webhook] Call ${callId} ended, starting evaluation for test ${testId}...`
      );

      // Wait a few seconds for Vapi to finalize transcript
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Fetch the call and run evaluation
      const vapi = getVapiClient();
      const call = await vapi.calls.get(callId);
      const callAny = call as any;

      // Check if transcript is available
      const rawMessages =
        callAny.artifact?.messages ||
        callAny.artifact?.messagesOpenAIFormatted ||
        [];

      if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
        console.warn(
          `[webhook] No transcript yet for call ${callId}, will need manual evaluation`
        );
        return;
      }

      // Convert transcript format (flip roles as needed)
      const transcript: Array<{
        role: string;
        message: string;
        time?: number;
      }> = rawMessages.map((item: any) => {
        const vapiRole = item.role || "assistant";
        const correctedRole = vapiRole === "user" ? "assistant" : "user";

        return {
          role: correctedRole,
          message: item.message || item.content || item.text || "",
          time: item.time || item.timestamp || item.secondsFromStart,
        };
      });

      console.log(`[webhook] Transcript has ${transcript.length} messages`);

      // Get test details
      if (!testId) {
        console.warn("[webhook] No test_id in call metadata");
        return;
      }

      const testData = await db
        .select()
        .from(subTests)
        .innerJoin(testCases, eq(subTests.testCaseId, testCases.id))
        .where(eq(subTests.id, parseInt(String(testId))))
        .limit(1);

      if (!testData || testData.length === 0) {
        console.warn(`[webhook] Test case ${testId} not found`);
        return;
      }

      const subTestRecord = testData[0].sub_tests;
      const testCaseRecord = testData[0].test_cases;

      // Calculate call duration
      const callDuration =
        callAny.duration || (callAny.endedAt && callAny.startedAt)
          ? (new Date(callAny.endedAt).getTime() -
              new Date(callAny.startedAt).getTime()) /
            1000
          : undefined;

      // Run the LLM judge
      console.log(`[webhook] Running LLM judge for test ${testId}...`);
      const judgment = await llmJudgePhoneCall({
        transcript,
        callDuration,
        subTestRecord,
        testCaseRecord,
      });

      console.log(
        `[webhook] Evaluation complete: ${
          judgment.succeeded ? "SUCCESS" : "FAILED"
        }`
      );

      // Update database
      await db
        .update(subTextActivity)
        .set({
          status: judgment.succeeded ? "SUCCESS" : "FAILED",
          metadata: {
            callId: callId,
            messageData: judgment,
          },
          cost: Math.round((callAny.cost || (callDuration ? callDuration * (0.05 / 60) : 0)) * 100),
          tokens: (judgment as any).usage?.totalTokens || 0,
          updatedAt: new Date(),
        })
        .where(eq(subTextActivity.misc_id, callId));

      console.log(`[webhook] Database updated for call ${callId}`);
    } catch (error) {
      console.error("[webhook] Error processing webhook:", error);
    }
  })();
});

// Health check for webhook
router.get("/webhook", (req, res) => {
  res.status(200).send("Vapi webhook endpoint is ready");
});

router.post("/", async (req, res) => {
  const vapi = getVapiClient();
  const { subTestId } = req.body;

  const subTest = await db
    .select()
    .from(subTests)
    .where(eq(subTests.id, subTestId))
    .innerJoin(testCases, eq(subTests.testCaseId, testCases.id))
    .limit(1);

  if (!subTest || !subTest.length) {
    throw new Error("Sub test not found");
  }

  if (!subTest[0].test_cases.testPhoneNumber) {
    throw new Error("Test phone number not found");
  }

  const [subTestData] = subTest;

  const callingAgentDescription = subTestData.test_cases.description;

  const taskDescription = subTestData.sub_tests.description;

  // Inject fulfillment-mode exclusivity guidance directly into the task given to the assistant.
  const guardrailHeader =
    "System policy: fulfillment_mode must be exactly one of ['pickup','delivery','dine_in']. If the user mentions multiple modes, ask them to choose one before proceeding. Do not proceed to checkout while ambiguous. If the user switches modes, clear conflicting fields from the previous mode and reconfirm. In confirmations, always state the chosen mode and omit any other mode.";

  const taskWithGuardrails = `${guardrailHeader}\n\nTask: ${taskDescription}`;

  const result = await vapi.calls.create({
    assistantId: "e6d0707e-8347-4c09-a93f-af1eed22fffe",
    customer: {
      number: subTestData.test_cases.testPhoneNumber as string,
    },
    phoneNumberId: "61077b28-602c-4417-9155-3b0ef6cb2d88",
    assistantOverrides: {
      variableValues: {
        test_id: subTestData.sub_tests.id,
        description: callingAgentDescription,
        task: taskWithGuardrails,
      },
    },
  } as any);

  // Store the call activity in database
  const callId = (result as any).id || (result as any).callId;
  try {
    await db.insert(subTextActivity).values({
      subTestId: subTestData.sub_tests.id,
      type: "PHONE",
      status: "PENDING",
      metadata: {
        callId: callId,
        messageData: {},
      },
      misc_id: callId,
    });
  } catch (dbError) {
    console.error("Error storing call activity:", dbError);
    // Continue even if DB insert fails
  }

  res.json({ result });
});

// Get call details and evaluate
router.post("/evaluate/:callId", async (req, res) => {
  const vapi = getVapiClient();
  const { callId } = req.params;

  try {
    console.log(`[evaluate] Fetching call ${callId} from Vapi...`);

    // Fetch the call details from Vapi
    const call = await vapi.calls.get(callId);

    console.log(`[evaluate] Call status: ${call.status}`);

    // Check if call is completed
    if (call.status !== "ended") {
      res.status(400).json({
        error: "Call not completed yet",
        status: call.status,
      });
      return;
    }

    // Get transcript from call artifact
    const callAny = call as any;

    console.log(`[evaluate] Call artifact structure:`, {
      hasArtifact: !!callAny.artifact,
      hasTranscript: !!callAny.artifact?.transcript,
      hasMessages: !!callAny.artifact?.messages,
      transcriptLength: callAny.artifact?.transcript?.length || 0,
      messagesLength: callAny.artifact?.messages?.length || 0,
    });

    // Prioritize structured messages over text transcript
    const rawMessages =
      callAny.artifact?.messages ||
      callAny.artifact?.messagesOpenAIFormatted ||
      [];

    // Convert to our format
    // NOTE: In Vapi calls, "user" = the agent being tested, "assistant" = our test system (customer)
    // We need to flip these so the judge evaluates correctly
    const transcript: Array<{
      role: string;
      message: string;
      time?: number;
    }> = Array.isArray(rawMessages)
      ? rawMessages.map((item: any) => {
          const vapiRole = item.role || "assistant";
          // Flip roles: Vapi's "user" is actually the agent, "assistant" is the customer
          const correctedRole = vapiRole === "user" ? "assistant" : "user";

          return {
            role: correctedRole,
            message: item.message || item.content || item.text || "",
            time: item.time || item.timestamp || item.secondsFromStart,
          };
        })
      : [];

    if (!transcript || transcript.length === 0) {
      console.error(`[evaluate] No transcript found. Call data:`, {
        callId,
        status: call.status,
        hasArtifact: !!callAny.artifact,
        artifactKeys: callAny.artifact ? Object.keys(callAny.artifact) : [],
        hasMessages: !!rawMessages,
        messagesLength: Array.isArray(rawMessages) ? rawMessages.length : 0,
      });

      res.status(400).json({
        error:
          "No transcript available for this call. The call may not have transcript generation enabled, or the transcript is still being processed. Please wait a few minutes and try again.",
      });
      return;
    }

    console.log(
      `[evaluate] Transcript has ${transcript.length} messages (converted from Vapi format)`
    );

    // Get the test_id from variable values
    const testIdRaw = callAny.assistantOverrides?.variableValues?.test_id;

    if (!testIdRaw) {
      res.status(400).json({
        error: "No test_id found in call metadata",
      });
      return;
    }

    const testId =
      typeof testIdRaw === "number" ? testIdRaw : parseInt(String(testIdRaw));

    // Fetch test case details
    const testData = await db
      .select()
      .from(subTests)
      .innerJoin(testCases, eq(subTests.testCaseId, testCases.id))
      .where(eq(subTests.id, testId))
      .limit(1);

    if (!testData || testData.length === 0) {
      res.status(404).json({ error: "Test case not found" });
      return;
    }

    const subTestRecord = testData[0].sub_tests;
    const testCaseRecord = testData[0].test_cases;

    console.log(`[evaluate] Running LLM judge for test ${testId}...`);

    // Get call duration (might be in different places depending on Vapi version)
    const callDuration =
      callAny.duration || (callAny.endedAt && callAny.startedAt)
        ? (new Date(callAny.endedAt).getTime() -
            new Date(callAny.startedAt).getTime()) /
          1000
        : undefined;

    // Run the LLM judge
    const judgment = await llmJudgePhoneCall({
      transcript,
      callDuration,
      subTestRecord,
      testCaseRecord,
    });

    console.log(
      `[evaluate] Judge result: ${judgment.succeeded ? "SUCCESS" : "FAILED"}`
    );
    console.log(`[evaluate] Judgment details:`, {
      succeeded: judgment.succeeded,
      explanation: judgment.explanation?.substring(0, 100),
      divergenceExplanation: judgment.divergenceExplanation?.substring(0, 100),
      conversationQuality: judgment.conversationQuality,
    });

    // Update the database with results
    await db
      .update(subTextActivity)
      .set({
        status: judgment.succeeded ? "SUCCESS" : "FAILED",
        metadata: {
          callId: callId,
          messageData: judgment,
        },
        cost: Math.round((callAny.cost || (callDuration ? callDuration * (0.05 / 60) : 0)) * 100),
        tokens: (judgment as any).usage?.totalTokens || 0,
        updatedAt: new Date(),
      })
      .where(eq(subTextActivity.misc_id, callId));

    console.log(`[evaluate] Database updated successfully`);

    res.json({
      success: true,
      callId,
      judgment,
      transcript,
      callDuration,
    });
  } catch (error) {
    console.error("[evaluate] Error evaluating call:", error);
    res.status(500).json({
      error: "Failed to evaluate call",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Debug endpoint: Get full call details
router.get("/debug/:callId", async (req, res) => {
  const vapi = getVapiClient();
  const { callId } = req.params;

  try {
    const call = await vapi.calls.get(callId);
    const callAny = call as any;

    res.json({
      callId,
      status: call.status,
      hasArtifact: !!callAny.artifact,
      artifactKeys: callAny.artifact ? Object.keys(callAny.artifact) : [],
      hasTranscript: !!callAny.artifact?.transcript,
      transcriptLength: callAny.artifact?.transcript?.length || 0,
      hasMessages: !!callAny.artifact?.messages,
      messagesLength: callAny.artifact?.messages?.length || 0,
      hasAssistantOverrides: !!callAny.assistantOverrides,
      testId: callAny.assistantOverrides?.variableValues?.test_id,
      duration: callAny.duration,
      startedAt: callAny.startedAt,
      endedAt: callAny.endedAt,
      // Include sample of transcript if available
      sampleTranscript:
        callAny.artifact?.transcript?.slice(0, 2) ||
        callAny.artifact?.messages?.slice(0, 2),
    });
  } catch (error) {
    console.error("Error fetching call debug info:", error);
    res.status(500).json({
      error: "Failed to fetch call details",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

router.get("/:subTestId", async (req, res) => {
  const vapi = getVapiClient();
  const { subTestId } = req.params;

  try {
    // First, fetch tracked calls from database
    const trackedCalls = await db
      .select()
      .from(subTextActivity)
      .where(eq(subTextActivity.subTestId, parseInt(subTestId)));

    console.log(
      `[get calls] Found ${trackedCalls.length} tracked calls in database`
    );

    if (trackedCalls.length === 0) {
      res.json({ calls: [] });
      return;
    }

    // Get call IDs that we're tracking
    const trackedCallIds = trackedCalls.map((activity) => activity.misc_id);

    // Fetch all calls from Vapi
    const allVapiCalls = await vapi.calls.list();

    // Filter to only include calls that:
    // 1. Match the subTestId
    // 2. Have a database record (not deleted)
    const filteredCalls = allVapiCalls.filter((call: any) => {
      const matchesSubTest =
        call.assistantOverrides?.variableValues?.test_id ===
        parseInt(subTestId);
      const isTracked = trackedCallIds.includes(call.id);

      return matchesSubTest && isTracked;
    });

    console.log(
      `[get calls] Returning ${filteredCalls.length} calls after filtering`
    );

    // Merge evaluation data with call data
    const callsWithEvaluation = filteredCalls.map((call: any) => {
      const evaluation = trackedCalls.find((e: any) => e.misc_id === call.id);

      return {
        ...call,
        evaluation: evaluation
          ? {
              status: evaluation.status,
              judgment: evaluation.metadata?.messageData,
              evaluatedAt: evaluation.updatedAt,
            }
          : null,
      };
    });

    res.json({ calls: callsWithEvaluation });
  } catch (error) {
    console.error("Error fetching calls:", error);
    res.status(500).json({ error: "Failed to fetch calls" });
  }
});

// Delete a call record from database
router.delete("/delete/:callId", async (req, res) => {
  const { callId } = req.params;

  try {
    console.log(`[delete] Attempting to delete call ${callId}...`);

    // Delete from database (subTextActivity table)
    await db.delete(subTextActivity).where(eq(subTextActivity.misc_id, callId));

    console.log(`[delete] Successfully deleted call ${callId} from database`);

    res.json({
      success: true,
      message: "Call deleted successfully",
      callId,
    });
  } catch (error) {
    console.error("[delete] Error deleting call:", error);
    res.status(500).json({
      error: "Failed to delete call",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
