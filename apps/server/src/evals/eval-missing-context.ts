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

	// testRunId missing -> warn and return
	if (!/Could not determine testRunId/i.test(code)) {
		ok = false;
		errs.push("Missing warning when testRunId cannot be determined");
	}

	// subTextActivity empty -> warn and return
	if (!/No subTestActivity found/i.test(code)) {
		ok = false;
		errs.push("Missing guard when no subTestActivity found");
	}

	if (ok) {
		console.log("[eval:missing-context] PASS");
		process.exit(0);
	} else {
		console.error("[eval:missing-context] FAIL:", errs.join(" | "));
		process.exit(1);
	}
}

main().catch((e) => {
	console.error("[eval:missing-context] ERROR:", e);
	process.exit(1);
});


