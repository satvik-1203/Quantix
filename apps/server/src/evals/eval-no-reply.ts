import "dotenv/config";
import { respondAgent } from "../routers/agentmail/respondAgent";
import { AgentMailTypes } from "@workspace/common";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";

function buildMessage(params: Partial<AgentMailTypes.AgentMailMessage>): AgentMailTypes.AgentMailMessage {
	const now = new Date().toISOString();
	return {
		inbox_id: params.inbox_id ?? "inbox_eval",
		thread_id: params.thread_id ?? "thread_eval_noreply",
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
		subject: params.subject ?? "Re: Confirmation",
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
		id: 7201,
		name: "No-reply enforcement",
		description: "Ensure NO_RESPONSE is returned for pure FYI/confirmation messages.",
		kindOfTestCases: "no-reply",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 8201,
		name: "No reply to FYI",
		description: "Provider sends a pure confirmation with no questions or actions.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected: "Return exactly NO_RESPONSE.",
	};
	return { subTest, testCase };
}

async function main() {
	const { subTest, testCase } = getContext();
	const prev: any[] = [
		{ from: "customer@example.com", subject: "Re: Booking", text: "7pm for 2 works.", preview: "" },
	];
	const inbound = buildMessage({
		from: "support@agentmail.to",
		text: "Confirmed for 7pm for 2. See you then.",
	});

	const draft = await respondAgent(prev as any, inbound, { subTest, testCase });
	const body = String(draft.body || "");

	if (body === "NO_RESPONSE") {
		console.log("[eval:no-reply] PASS");
		process.exit(0);
	} else {
		console.error("[eval:no-reply] FAIL: Body should be NO_RESPONSE");
		console.error("Draft body:", body);
		process.exit(1);
	}
}

main().catch((e) => {
	console.error("[eval:no-reply] ERROR:", e);
	process.exit(1);
});


