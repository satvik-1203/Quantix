import "dotenv/config";
import { llmJudgeEmailTest } from "../routers/agentmail/llmJudgeEmailTest";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";
import { AgentMailTypes } from "@workspace/common";

function msg(p: Partial<AgentMailTypes.AgentMailMessage>): AgentMailTypes.AgentMailMessage {
	const now = new Date().toISOString();
	return {
		inbox_id: p.inbox_id ?? "inbox_eval",
		thread_id: p.thread_id ?? "thread_eval_judge_adv",
		message_id: p.message_id ?? Math.random().toString(36).slice(2),
		labels: p.labels ?? [],
		timestamp: p.timestamp ?? now,
		from: p.from ?? "customer@example.com",
		to: p.to ?? ["testing-quantix@agentmail.to"],
		size: p.size ?? 0,
		updated_at: p.updated_at ?? now,
		created_at: p.created_at ?? now,
		reply_to: p.reply_to ?? [],
		cc: p.cc ?? [],
		bcc: p.bcc ?? [],
		subject: p.subject ?? "Re: Booking",
		preview: p.preview ?? "",
		text: p.text ?? "",
		html: p.html ?? "",
		attachments: p.attachments ?? [],
		in_reply_to: p.in_reply_to ?? "",
		references: p.references ?? [],
	};
}

function ctx(): { subTest: SubTestRecord; testCase: TestCaseRecord } {
	const testCase: TestCaseRecord = {
		id: 9501,
		name: "Judge consistency advanced",
		description: "Evaluate only OTHER PARTY (NOT @agentmail.to).",
		kindOfTestCases: "judge",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 9601,
		name: "Other party confirmation",
		description: "Other party should confirm 7pm for 2.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected: "Other party confirms 7pm for 2 explicitly.",
	};
	return { subTest, testCase };
}

async function main() {
	const { subTest, testCase } = ctx();
	// Case A: Other party clearly confirms (should succeed)
	const prevA: any[] = [
		{ from: "testing-quantix@agentmail.to", subject: "Re: Booking", text: "What time?", preview: "" },
	];
	const newA = msg({ from: "someone@restaurant.com", text: "Confirmed for 7:00 PM for two." });
	const ja = await llmJudgeEmailTest({ prevMessages: prevA as any, newMessage: newA, subTestRecord: subTest, testCaseRecord: testCase });
	if (typeof ja.succeeded !== "boolean" || typeof ja.didExpectedTask !== "boolean" || ja.succeeded !== ja.didExpectedTask || !ja.succeeded) {
		console.error("[eval:judge-adv] FAIL: Case A inconsistent or not successful.");
		process.exit(1);
	}
	// Case B: Provider says it (agentmail.to), other party does not (should fail)
	const prevB: any[] = [
		{ from: "testing-quantix@agentmail.to", subject: "Re: Booking", text: "Confirmed for 7:00 PM for two.", preview: "" },
	];
	const newB = msg({ from: "someone@restaurant.com", text: "Okay." });
	const jb = await llmJudgeEmailTest({ prevMessages: prevB as any, newMessage: newB, subTestRecord: subTest, testCaseRecord: testCase });
	if (typeof jb.succeeded !== "boolean" || typeof jb.didExpectedTask !== "boolean" || jb.succeeded !== jb.didExpectedTask || jb.succeeded) {
		console.error("[eval:judge-adv] FAIL: Case B inconsistent or incorrectly successful.");
		process.exit(1);
	}
	console.log("[eval:judge-adv] PASS");
	process.exit(0);
}

main().catch((e) => {
	console.error("[eval:judge-adv] ERROR:", e);
	process.exit(1);
});


