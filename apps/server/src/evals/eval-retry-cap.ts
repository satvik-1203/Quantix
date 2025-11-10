import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
	const here = fileURLToPath(import.meta.url);
	const servicePath = path.resolve(here, "../../routers/agentmail/service.ts");
	const code = fs.readFileSync(servicePath, "utf8");

	let ok = true;
	const errs: string[] = [];

	// Check retry loop with cap at 3 and progressive delay
	if (!/while\s*\(\s*!sent\s*&&\s*attempt\s*<\s*3\s*\)/.test(code)) {
		ok = false;
		errs.push("Missing retry cap at 3 attempts");
	}
	if (!/Attempt\s+\$\{attempt\}\s+failed/.test(code) && !/Attempt \${attempt} failed/.test(code)) {
		ok = false;
		errs.push("Missing attempt failure log");
	}
	if (!/setTimeout\(resolve,\s*500\s*\*\s*attempt\)/.test(code)) {
		ok = false;
		errs.push("Missing progressive backoff delay (500 * attempt)");
	}

	if (ok) {
		console.log("[eval:retry-cap] PASS");
		process.exit(0);
	} else {
		console.error("[eval:retry-cap] FAIL:", errs.join(" | "));
		process.exit(1);
	}
}

main().catch((e) => {
	console.error("[eval:retry-cap] ERROR:", e);
	process.exit(1);
});


