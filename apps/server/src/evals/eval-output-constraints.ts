import "dotenv/config";
import { respondAgent } from "../routers/agentmail/respondAgent";
import type { SubTestRecord, TestCaseRecord } from "@workspace/drizzle";

function ctx(): { subTest: SubTestRecord; testCase: TestCaseRecord } {
	const testCase: TestCaseRecord = {
		id: 7401,
		name: "Output constraints",
		description: "Enforce subject/body length, plain text only (no HTML/markdown).",
		kindOfTestCases: "constraints",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const subTest: SubTestRecord = {
		id: 8401,
		name: "Subject/body limits and plaintext",
		description: "Ensure subject ≤ 78, body ≤ 2000, no HTML/markdown.",
		testCaseId: testCase.id,
		createdAt: new Date(),
		updatedAt: new Date(),
		expected: "Reply respects length limits and is plain text.",
	};
	return { subTest, testCase };
}

async function main() {
	const { subTest, testCase } = ctx();
	const prev: any[] = [
		{ from: "support@agentmail.to", subject: "Re: Info", text: "Share your preference.", preview: "" },
	];
	const inbound = {
		inbox_id: "inbox_eval",
		thread_id: "thread_eval_constraints",
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
		subject: "Re: Info",
		preview: "",
		text: "Pick one option.",
		html: "",
		attachments: [],
		in_reply_to: "",
		references: [],
	};

	const draft = await respondAgent(prev as any, inbound as any, { subTest, testCase });
	const subject = String(draft.subject || "");
	const body = String(draft.body || "");

	let ok = true;
	const errs: string[] = [];
	if (subject.length > 78) {
		ok = false;
		errs.push("Subject > 78 chars");
	}
	if (body.length > 2000) {
		ok = false;
		errs.push("Body > 2000 chars");
	}
	// Minimal HTML/markdown detection
	if (/[<>]/.test(body) || /(^|\s)[#*_`~]{1,}/.test(body) || /\[[^\]]+\]\([^)]+\)/.test(body)) {
		ok = false;
		errs.push("Body contains HTML/markdown");
	}
	if (!body.trim()) {
		ok = false;
		errs.push("Empty body");
	}

	if (ok) {
		console.log("[eval:output-constraints] PASS");
		process.exit(0);
	} else {
		console.error("[eval:output-constraints] FAIL:", errs.join(" | "));
		console.error("Subject:", subject);
		console.error("Body:", body);
		process.exit(1);
	}
}

main().catch((e) => {
	console.error("[eval:output-constraints] ERROR:", e);
	process.exit(1);
});


