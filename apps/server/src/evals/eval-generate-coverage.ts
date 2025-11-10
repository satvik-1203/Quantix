import "dotenv/config";
import { generateTestCases } from "../routers/generate-test/ai/generate-test";
import type { TestCaseRecord } from "@workspace/drizzle";

type SubTestType =
	| "happy_path"
	| "disambiguation"
	| "correction"
	| "no_availability_edge"
	| "policy_compliance"
	| "error_handling"
	| "guardrails_adversarial";

function classify(prompt: string, expected: string): SubTestType {
	const text = `${prompt} ${expected}`.toLowerCase();
	if (/(jailbreak|ignore (previous|prior) (instructions|message)|prompt injection|hack|bypass|override)/.test(text)) return "guardrails_adversarial";
	if (/(policy|cannot|not allowed|refuse|decline|restricted|prohibited|safety)/.test(text)) return "policy_compliance";
	if (/(error|fail(ed|ure)|timeout|crash|bug|exception|retry)/.test(text)) return "error_handling";
	if (/(no (availability|tables|slots)|fully booked|sold out|out of stock|unavailable|cannot accommodate)/.test(text)) return "no_availability_edge";
	if (/(clarify|clarification|disambiguate|which (one|option)|do you mean|could you specify|not sure which)/.test(text)) return "disambiguation";
	if (/(change|actually|correction|i meant|update that|switch to|edit the)/.test(text)) return "correction";
	return "happy_path";
}

function oneModeOnly(text: string) {
	const modes = ["pickup", "delivery", "dine-in", "dine in", "dine_in"];
	const present = modes.filter((m) => text.toLowerCase().includes(m));
	return new Set(present).size <= 1;
}

function mockCase(): TestCaseRecord {
	return {
		id: 99001,
		name: "Coverage eval",
		description: process.env.EVAL_TESTCASE_DESCRIPTION ?? "Restaurant booking assistant.",
		kindOfTestCases: "balanced coverage",
		email: null as any,
		testPhoneNumber: null as any,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

async function main() {
	const tc = mockCase();
	const subTests = await generateTestCases(tc);

	// Diversity: require at least 5 distinct categories
	const kinds = new Set<SubTestType>();
	for (const st of subTests) {
		kinds.add(classify(st.prompt, st.expected));
		// mode exclusivity
		if (!oneModeOnly(st.prompt)) {
			console.error("[eval:generate-coverage] FAIL: mode exclusivity violated in prompt:", st.prompt);
			process.exit(1);
		}
	}
	if (kinds.size < 5) {
		console.error("[eval:generate-coverage] FAIL: insufficient diversity; got", Array.from(kinds).join(", "));
		process.exit(1);
	}
	console.log("[eval:generate-coverage] PASS: categories =", Array.from(kinds).join(", "));
	process.exit(0);
}

main().catch((e) => {
	console.error("[eval:generate-coverage] ERROR:", e);
	process.exit(1);
});


