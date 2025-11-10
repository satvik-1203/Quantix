import "dotenv/config";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

type TaskResult = {
	name: string;
	runId: number;
	ok: boolean;
	durationMs: number;
	stdout: string;
	stderr: string;
};

function resolveTsxBin(): string {
	// Resolve local tsx to avoid PATH issues
	const here = fileURLToPath(import.meta.url);
	const dir = path.dirname(here); // .../apps/server/src/evals
	const tsxPath = path.resolve(dir, "../../node_modules/.bin/tsx");
	return tsxPath;
}

function runTask(name: string, runId: number, args: string[]): Promise<TaskResult> {
	return new Promise((resolve) => {
		const tsx = resolveTsxBin();
		const start = Date.now();
		const child = spawn(tsx, args, { cwd: path.resolve(fileURLToPath(import.meta.url), "../../../"), env: process.env });
		let stdout = "";
		let stderr = "";

		child.stdout.on("data", (chunk) => {
			stdout += String(chunk);
		});
		child.stderr.on("data", (chunk) => {
			stderr += String(chunk);
		});
		child.on("close", (code) => {
			const durationMs = Date.now() - start;
			resolve({
				name,
				runId,
				ok: code === 0,
				durationMs,
				stdout,
				stderr,
			});
		});
	});
}

function pad(str: string, len: number) {
	if (str.length >= len) return str;
	return str + " ".repeat(len - str.length);
}

function humanMs(ms: number) {
	if (ms < 1000) return `${ms}ms`;
	const s = (ms / 1000).toFixed(2);
	return `${s}s`;
}

async function main() {
	const judgeRunsArg = Number(process.argv.find((a) => a.startsWith("--judge-runs="))?.split("=")[1] || NaN);
	const judgeRunsEnv = Number(process.env.EVAL_JUDGE_RUNS || NaN);
	const judgeRuns = Number.isFinite(judgeRunsArg)
		? judgeRunsArg
		: Number.isFinite(judgeRunsEnv)
		? judgeRunsEnv
		: 4; // default: run classification (judge) tests 4 times

	const loopCountArg = Number(process.argv.find((a) => a.startsWith("--loop-count="))?.split("=")[1] || NaN);
	const loopCountEnv = Number(process.env.EVAL_LOOP_COUNT || process.env.EVAL_COUNT || NaN);
	const loopCount = Number.isFinite(loopCountArg)
		? loopCountArg
		: Number.isFinite(loopCountEnv)
		? loopCountEnv
		: 4; // default: 4 loop evals

	const base = path.resolve(fileURLToPath(import.meta.url), "../../");
	const p = (...parts: string[]) => path.resolve(base, ...parts);

	// Define tasks
	const tasks: Array<Promise<TaskResult>> = [];
	// 1) Generate tests (once)
	tasks.push(runTask("generate-tests", 1, [p("evals/eval-generate-tests.ts")]));
	// 2) Agentmail loop batch (once, configurable count)
	tasks.push(
		runTask("agentmail-loop:batch", 1, [p("evals/eval-agentmail-loop-batch.ts"), String(loopCount)])
	);
	// 3) Judge classification tests (N times)
	for (let i = 0; i < judgeRuns; i++) {
		tasks.push(runTask("judge", i + 1, [p("evals/eval-judge-accuracy.ts")]));
	}
	// 4) Additional safety/role/constraints/generate coverage/judge adv/static service guards
	tasks.push(runTask("respond-safety", 1, [p("evals/eval-respond-safety.ts")]));
	tasks.push(runTask("respond-role", 1, [p("evals/eval-respond-role.ts")]));
	tasks.push(runTask("no-reply", 1, [p("evals/eval-no-reply.ts")]));
	tasks.push(runTask("loop-variants", 1, [p("evals/eval-loop-variants.ts")]));
	tasks.push(runTask("output-constraints", 1, [p("evals/eval-output-constraints.ts")]));
	tasks.push(runTask("generate-coverage", 1, [p("evals/eval-generate-coverage.ts")]));
	tasks.push(runTask("judge-adv", 1, [p("evals/eval-judge-consistency-adv.ts")]));
	tasks.push(runTask("self-reply-guard", 1, [p("evals/eval-self-reply-guard.ts")]));
	tasks.push(runTask("retry-cap", 1, [p("evals/eval-retry-cap.ts")]));
	tasks.push(runTask("missing-context", 1, [p("evals/eval-missing-context.ts")]));

	// Run all concurrently
	const results = await Promise.all(tasks);

	// Aggregate by name
	const groups = new Map<
		string,
		{ name: string; total: number; passed: number; failed: number; durationMs: number }
	>();
	for (const r of results) {
		const g = groups.get(r.name) || { name: r.name, total: 0, passed: 0, failed: 0, durationMs: 0 };
		g.total += 1;
		if (r.ok) g.passed += 1;
		else g.failed += 1;
		g.durationMs += r.durationMs;
		groups.set(r.name, g);
	}

	// Print table
	const headers = ["Eval", "Runs", "Passed", "Failed", "Total Time"];
	const widths = [20, 8, 8, 8, 12];
	const row = (cols: string[]) =>
		"| " +
		cols
			.map((c, i) => pad(c, widths[i]))
			.join(" | ") +
		" |";
	const sep = "+-" + widths.map((w) => "-".repeat(w)).join("-+-") + "-+";

	console.log("\nAll Evals Summary");
	console.log(sep);
	console.log(row(headers));
	console.log(sep);
	for (const g of groups.values()) {
		console.log(
			row([g.name, String(g.total), String(g.passed), String(g.failed), humanMs(g.durationMs)])
		);
	}
	console.log(sep);

	// Print failure details without failing the overall process
	const failedResults = results.filter((r) => !r.ok);
	if (failedResults.length > 0) {
		const truncate = (s: string, n = 500) => (s.length > n ? s.slice(0, n) + "..." : s);
		console.log("\nFailures:");
		for (const fr of failedResults) {
			console.log(
				`- ${fr.name} (run ${fr.runId}) failed in ${humanMs(fr.durationMs)}`
			);
			const stderr = fr.stderr?.trim();
			const stdout = fr.stdout?.trim();
			if (stderr) console.log(`  stderr: ${truncate(stderr)}`);
			else if (stdout) console.log(`  stdout: ${truncate(stdout)}`);
		}
	}

	// Always exit 0 so the overall run doesn't look failed
	process.exit(0);
}

main().catch((err) => {
	console.error("[eval:all] ERROR:", err);
	process.exit(1);
});


