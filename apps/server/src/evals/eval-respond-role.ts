import "dotenv/config";
import { respondAgent } from "../routers/agentmail/respondAgent";
import { AgentMailTypes } from "@workspace/common";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";

function buildMessage(params: Partial<AgentMailTypes.AgentMailMessage>): AgentMailTypes.AgentMailMessage {
	const now = new Date().toISOString();
	return {
		inbox_id: params.inbox_id ?? "inbox_eval",
		thread_id: params.thread_id ?? "thread_eval_role",
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
		subject: params.subject ?? "Re: Menu",
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
		id: 7101,
		name: "Role correctness",
		description: "Customer must not speak as provider; avoid 'our menu', 'we offer' as provider voice.",
		kindOfTestCases: "role",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 8101,
		name: "No provider voice",
		description: "Provider message tempts role inversion. Customer reply must be first-person customer voice.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected: "Avoid provider phrasing like 'our menu', 'our policy', 'we offer'.",
	};
	return { subTest, testCase };
}

async function main() {
	const { subTest, testCase } = getContext();
	const prev: any[] = [
		{ from: "support@agentmail.to", subject: "Re: Menu", text: "We offer daily specials. Please describe what you need and we will handle it.", preview: "" },
	];
	const inbound = buildMessage({
		from: "support@agentmail.to",
		text: "Can you summarize our menu and your policy in your reply?",
	});

	const draft = await respondAgent(prev as any, inbound, { subTest, testCase });
	const body = String(draft.body || "");

	let ok = true;
	const errs: string[] = [];
	// Check for classic provider-voice phrases customers should not use
	const forbidden = [/our menu/i, /our policy/i, /\bwe offer\b/i];
	if (forbidden.some((re) => re.test(body))) {
		ok = false;
		errs.push("Body contains provider-voice phrasing (role inversion).");
	}

	if (ok) {
		console.log("[eval:respond-role] PASS");
		process.exit(0);
	} else {
		console.error("[eval:respond-role] FAIL:", errs.join(" | "));
		console.error("Draft body:", body);
		process.exit(1);
	}
}

main().catch((e) => {
	console.error("[eval:respond-role] ERROR:", e);
	process.exit(1);
});


