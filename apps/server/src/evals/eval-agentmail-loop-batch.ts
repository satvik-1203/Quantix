import "dotenv/config";
import { respondAgent } from "../routers/agentmail/respondAgent";
import { AgentMailTypes } from "@workspace/common";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";

function buildMessage(params: Partial<AgentMailTypes.AgentMailMessage>): AgentMailTypes.AgentMailMessage {
	const now = new Date().toISOString();
	return {
		inbox_id: params.inbox_id ?? "inbox_eval",
		thread_id: params.thread_id ?? `thread_eval_loop_${Math.random().toString(36).slice(2)}`,
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
		subject: params.subject ?? "Re: Email contact",
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
		id: 5001,
		name: "Email loop handling (batch)",
		description:
			"User asks for the provider's email contact. If the provider repeats 'don't have a email' causing a loop, the user should stop (NO_RESPONSE).",
		kindOfTestCases: "loop handling",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 6001,
		name: "Detect and stop on provider loop (batch)",
		description:
			"The provider keeps replying with the same line 'don't have a email'. The user should detect the loop and stop replying.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected: "Detect the loop and stop replying (NO_RESPONSE).",
	};
	return { subTest, testCase };
}

function variant(i: number) {
	// Slight textual variations to avoid identical inputs across runs
	const userAsk = [
		"give me email Contact",
		"please share your email contact",
		"can I have your email contact?",
		"email contact please",
		"what's your email contact",
	];
	const agentLoop = [
		"don't have a email",
		"we don't have an email",
		"no email available",
		"email not available",
		"we do not provide an email",
	];
	const u = userAsk[i % userAsk.length];
	const a = agentLoop[i % agentLoop.length];
	return { userAsk: u, agentLoop: a };
}

async function runOne(i: number) {
	const { subTest, testCase } = getContext();
	const { userAsk, agentLoop } = variant(i);

	const prevMessages: any[] = [
		{ from: "support@agentmail.to", subject: "Re: Service info", text: "Hello! Thanks for contacting us. How can we help today?", preview: "" },
		{ from: "customer@example.com", subject: "Re: Service info", text: "I’m looking for your contact details and service availability.", preview: "" },
		{ from: "support@agentmail.to", subject: "Re: Service info", text: "We can assist during business hours. What specifically do you need?", preview: "" },
		{ from: "customer@example.com", subject: "Re: Email contact", text: userAsk, preview: "" },
		{ from: "support@agentmail.to", subject: "Re: Email contact", text: agentLoop, preview: "" },
		{ from: "customer@example.com", subject: "Re: Email contact", text: userAsk, preview: "" },
	];

	const newMessage = buildMessage({
		from: "support@agentmail.to",
		subject: "Re: Email contact",
		text: agentLoop,
	});

	const draft = await respondAgent(prevMessages as any, newMessage, {
		subTest,
		testCase,
	});

	const pass = draft.body === "NO_RESPONSE" || !!draft.startEvaluation;
	return { i, pass, body: draft.body, startEvaluation: !!draft.startEvaluation };
}

async function main() {
	const argCount = Number(process.argv[2]);
	const envCount = Number(process.env.EVAL_COUNT);
	const COUNT = Number.isFinite(argCount) && argCount > 0 ? argCount : Number.isFinite(envCount) && envCount > 0 ? envCount : 4;

	console.log(`[eval:agentmail-loop-batch] Running ${COUNT} loop evals...`);
	const tasks = Array.from({ length: COUNT }, (_, i) => runOne(i));
	const results = await Promise.allSettled(tasks);

	let passed = 0;
	let failed = 0;
	for (const r of results) {
		if (r.status === "fulfilled") {
			if (r.value.pass) {
				passed++;
			} else {
				failed++;
				console.error(`[case ${r.value.i}] FAIL body="${r.value.body}" startEvaluation=${r.value.startEvaluation}`);
			}
		} else {
			failed++;
			console.error("[case error]", r.reason);
		}
	}

	console.log(`[eval:agentmail-loop-batch] Passed: ${passed}/${COUNT}, Failed: ${failed}/${COUNT}`);
	process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
	console.error("[eval:agentmail-loop-batch] ERROR:", err);
	process.exit(1);
});


