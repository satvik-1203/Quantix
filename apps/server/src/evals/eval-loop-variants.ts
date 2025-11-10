import "dotenv/config";
import { respondAgent } from "../routers/agentmail/respondAgent";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";

function ctx(): { subTest: SubTestRecord; testCase: TestCaseRecord } {
	const testCase: TestCaseRecord = {
		id: 7301,
		name: "Loop variants",
		description: "User asks for email contact; provider loops with paraphrases. Must stop.",
		kindOfTestCases: "loop handling",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 8301,
		name: "Paraphrased loop detection",
		description: "Detect loops with typos/synonyms and stop.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected: "Return NO_RESPONSE or set startEvaluation on loops.",
	};
	return { subTest, testCase };
}

const userAsks = [
	"give me email Contact",
	"email contact please",
	"pls email contact",
	"can i get your email contact?",
];
const agentLoops = [
	"don't have a email",
	"we don't have an email",
	"email not available",
	"no email available",
];

async function runOne(i: number) {
	const { subTest, testCase } = ctx();
	const prev: any[] = [
		{ from: "support@agentmail.to", subject: "Re: Info", text: "How can we help?", preview: "" },
		{ from: "customer@example.com", subject: "Re: Info", text: "Looking for contact details.", preview: "" },
		{ from: "support@agentmail.to", subject: "Re: Info", text: "What exactly do you need?", preview: "" },
		{ from: "customer@example.com", subject: "Re: Email contact", text: userAsks[i % userAsks.length], preview: "" },
		{ from: "support@agentmail.to", subject: "Re: Email contact", text: agentLoops[i % agentLoops.length], preview: "" },
		{ from: "customer@example.com", subject: "Re: Email contact", text: userAsks[i % userAsks.length], preview: "" },
	];
	const inbound = {
		inbox_id: "inbox_eval",
		thread_id: "thread_eval_loop_variants",
		message_id: Math.random().toString(36).slice(2),
		labels: [],
		timestamp: new Date().toISOString(),
		from: "support@agentmail.to",
		to: ["customer@example.com"],
		size: 0,
		updated_at: new Date().toISOString(),
		created_at: new Date().toISOString(),
		reply_to: [],
		cc: [],
		bcc: [],
		subject: "Re: Email contact",
		preview: "",
		text: agentLoops[i % agentLoops.length],
		html: "",
		attachments: [],
		in_reply_to: "",
		references: [],
	};
	const draft = await respondAgent(prev as any, inbound as any, { subTest, testCase });
	return draft.body === "NO_RESPONSE" || !!draft.startEvaluation;
}

async function main() {
	const COUNT = 4;
	const results = await Promise.allSettled(Array.from({ length: COUNT }, (_, i) => runOne(i)));
	const passes = results.filter((r) => r.status === "fulfilled" && r.value).length;

	if (passes === COUNT) {
		console.log("[eval:loop-variants] PASS");
		process.exit(0);
	} else {
		console.error("[eval:loop-variants] FAIL: some variants did not stop.");
		process.exit(1);
	}
}

main().catch((e) => {
	console.error("[eval:loop-variants] ERROR:", e);
	process.exit(1);
});


