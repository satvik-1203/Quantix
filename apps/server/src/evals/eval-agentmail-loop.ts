import "dotenv/config";
import { respondAgent } from "../routers/agentmail/respondAgent";
import { AgentMailTypes } from "@workspace/common";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";

function buildMessage(
  params: Partial<AgentMailTypes.AgentMailMessage>
): AgentMailTypes.AgentMailMessage {
  const now = new Date().toISOString();
  return {
    inbox_id: params.inbox_id ?? "inbox_eval",
    thread_id: params.thread_id ?? "thread_eval_loop",
    message_id: params.message_id ?? Math.random().toString(36).slice(2),
    labels: params.labels ?? [],
    timestamp: params.timestamp ?? now,
    from: params.from ?? "support@agentmail.to",
    to: params.to ?? ["customer@example.com"],
    size: params.size ?? 0,
    updated_at: params.updated_at ?? now,
    created_at: params.created_at ?? now,
    reply_to: params.reply_to ?? [],
    cc: params.cc ?? [],
    bcc: params.bcc ?? [],
    subject: params.subject ?? "Re: Reservation request",
    preview: params.preview ?? "",
    text: params.text ?? "",
    html: params.html ?? "",
    attachments: params.attachments ?? [],
    in_reply_to: params.in_reply_to ?? "",
    references: params.references ?? [],
  };
}

function getContext(): { subTest: SubTestRecord; testCase: TestCaseRecord } {
  const testCase: TestCaseRecord = {
    id: 1001,
    name: "Email loop handling",
    description:
      "User asks for the provider's email contact. If the provider replies repeatedly with the same 'don't have an email' response causing a loop, the user should stop (NO_RESPONSE). Include some normal context before the loop begins.",
    kindOfTestCases: "loop handling",
    email: null as any,
    testPhoneNumber: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const subTest: SubTestRecord = {
    id: 2001,
    name: "Detect and stop on provider loop (email contact)",
    description:
      "The provider keeps replying with the same line 'don't have an email' when the user asks for an email contact. The user should detect the loop and stop replying.",
    testCaseId: testCase.id,
    createdAt: new Date(),
    updatedAt: new Date(),
    expected: "Detect the loop and stop replying (NO_RESPONSE).",
  };
  return { subTest, testCase };
}

async function main() {
  const { subTest, testCase } = getContext();

  // Simulate a thread with some pre-loop context followed by a clear loop
  const prevMessages: any[] = [
    {
      from: "support@agentmail.to",
      subject: "Re: Service info",
      text: "Hello! Thanks for contacting us. How can we help today?",
      preview: "",
    },
    {
      from: "customer@example.com",
      subject: "Re: Service info",
      text: "I’m looking for your contact details and service availability.",
      preview: "",
    },
    {
      from: "support@agentmail.to",
      subject: "Re: Service info",
      text: "We can assist during business hours. What specifically do you need?",
      preview: "",
    },
    // Start loop
    {
      from: "customer@example.com",
      subject: "Re: Email contact",
      text: "give me email Contact",
      preview: "",
    },
    {
      from: "support@agentmail.to",
      subject: "Re: Email contact",
      text: "don't have a email",
      preview: "",
    },
    {
      from: "customer@example.com",
      subject: "Re: Email contact",
      text: "give me email Contact",
      preview: "",
    },
    {
      from: "support@agentmail.to",
      subject: "Re: Email contact",
      text: "don't have a email",
      preview: "",
    },
  ];

  // Latest inbound from provider repeating itself again (clear loop signal)
  const newMessage = buildMessage({
    from: "support@agentmail.to",
    subject: "Re: Email contact",
    text: "don't have a email",
  });

  console.log("[eval:agentmail-loop] Calling respondAgent on loop scenario...");
  const draft = await respondAgent(prevMessages as any, newMessage, {
    subTest,
    testCase,
  });

  const shouldStopOnLoop = draft.body === "NO_RESPONSE";
  const readyToEvaluate = !!draft.startEvaluation;

  if (shouldStopOnLoop) {
    console.log(
      "[eval:agentmail-loop] PASS: Model returned NO_RESPONSE on loop."
    );
    process.exit(0);
  } else if (readyToEvaluate) {
    console.log(
      "[eval:agentmail-loop] SOFT PASS: Model flagged startEvaluation in loop, body not NO_RESPONSE. Service will still evaluate."
    );
    process.exit(0);
  } else {
    console.error(
      "[eval:agentmail-loop] FAIL: Model neither returned NO_RESPONSE nor set startEvaluation in a clear loop."
    );
    console.error("Draft body:", draft.body);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[eval:agentmail-loop] ERROR:", err);
  process.exit(1);
});
