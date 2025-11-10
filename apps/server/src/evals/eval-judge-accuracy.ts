import "dotenv/config";
import { llmJudgeEmailTest } from "../routers/agentmail/llmJudgeEmailTest";
import { AgentMailTypes } from "@workspace/common";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";

function buildMessage(params: Partial<AgentMailTypes.AgentMailMessage>): AgentMailTypes.AgentMailMessage {
	const now = new Date().toISOString();
	return {
		inbox_id: params.inbox_id ?? "inbox_eval",
		thread_id: params.thread_id ?? "thread_eval_judge",
		message_id: params.message_id ?? Math.random().toString(36).slice(2),
		labels: params.labels ?? [],
		timestamp: params.timestamp ?? now,
		from: params.from ?? "customer@example.com",
		to: params.to ?? ["testing-quantix@agentmail.to"],
		size: params.size ?? 0,
		updated_at: params.updated_at ?? now,
		created_at: params.created_at ?? now,
		reply_to: params.reply_to ?? [],
		cc: params.cc ?? [],
		bcc: params.bcc ?? [],
		subject: params.subject ?? "Re: Booking",
		preview: params.preview ?? "",
		text: params.text ?? "",
		html: params.html ?? "",
		attachments: params.attachments ?? [],
		in_reply_to: params.in_reply_to ?? "",
		references: params.references ?? [],
	};
}

function getContextSuccess(): {
	prev: any[];
	newMsg: AgentMailTypes.AgentMailMessage;
	subTest: SubTestRecord;
	testCase: TestCaseRecord;
} {
	const testCase: TestCaseRecord = {
		id: 3001,
		name: "Judge success case",
		description:
			"User intends to book a table for 2 at 7pm. Evaluate if the other party's replies achieved this.",
		kindOfTestCases: "happy path",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 4001,
		name: "Confirm 7pm booking",
		description:
			"Customer asks to book a table for two at 7pm; provider should confirm explicitly.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected:
			"Other party should provide a clear confirmation for 7:00 PM for two people.",
	};

	const prev = [
		{
			from: "testing-quantix@agentmail.to",
			subject: "Re: Booking",
			text: "We can accommodate you today. What time would you prefer?",
			preview: "",
		},
	];
	const newMsg = buildMessage({
		from: "someone@restaurant.com", // other party (NOT @agentmail.to)
		text: "Your reservation is confirmed for 7:00 PM for 2. See you then!",
	});
	return { prev, newMsg, subTest, testCase };
}

function getContextFailure(): {
	prev: any[];
	newMsg: AgentMailTypes.AgentMailMessage;
	subTest: SubTestRecord;
	testCase: TestCaseRecord;
} {
	const testCase: TestCaseRecord = {
		id: 3002,
		name: "Judge failure case",
		description:
			"User intends to book a table for 2 at 7pm. Evaluate if the other party's replies achieved this.",
		kindOfTestCases: "divergence",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 4002,
		name: "Confirm 7pm booking",
		description:
			"Customer asks to book a table for two at 7pm; provider should confirm explicitly.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected:
			"Other party should provide a clear confirmation for 7:00 PM for two people.",
	};
	const prev = [
		{
			from: "testing-quantix@agentmail.to",
			subject: "Re: Booking",
			text: "We can accommodate you today. What time would you prefer?",
			preview: "",
		},
	];
	const newMsg = buildMessage({
		from: "someone@restaurant.com",
		text: "We're busy. Visit our website for more info.",
	});
	return { prev, newMsg, subTest, testCase };
}

async function runCase(
	title: string,
	prev: any[],
	newMsg: AgentMailTypes.AgentMailMessage,
	subTest: SubTestRecord,
	testCase: TestCaseRecord,
	expectSuccess: boolean
) {
	console.log(`[eval:judge] Running: ${title}`);
	const judgment = await llmJudgeEmailTest({
		prevMessages: prev as any,
		newMessage: newMsg,
		subTestRecord: subTest,
		testCaseRecord: testCase,
	});

	// Basic invariants
	if (typeof judgment.succeeded !== "boolean") {
		throw new Error("Judge returned non-boolean 'succeeded'");
	}
	if (typeof judgment.didExpectedTask !== "boolean") {
		throw new Error("Judge returned non-boolean 'didExpectedTask'");
	}
	if (judgment.succeeded !== judgment.didExpectedTask) {
		throw new Error(
			"Inconsistent judgment: 'succeeded' should align with 'didExpectedTask'"
		);
	}

	const ok = judgment.succeeded === expectSuccess;
	console.log(
		`[eval:judge] ${title} => succeeded=${judgment.succeeded}, expected=${expectSuccess}`
	);
	if (!ok) {
		throw new Error(`${title} outcome mismatch`);
	}
}

async function main() {
	const success = getContextSuccess();
	const failure = getContextFailure();

	try {
		await runCase(
			"Success scenario",
			success.prev,
			success.newMsg,
			success.subTest,
			success.testCase,
			true
		);
		await runCase(
			"Failure scenario",
			failure.prev,
			failure.newMsg,
			failure.subTest,
			failure.testCase,
			false
		);
		console.log("[eval:judge] PASS: Judge produced consistent outcomes.");
		process.exit(0);
	} catch (err) {
		console.error("[eval:judge] FAIL:", (err as Error).message);
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("[eval:judge] ERROR:", err);
	process.exit(1);
});


