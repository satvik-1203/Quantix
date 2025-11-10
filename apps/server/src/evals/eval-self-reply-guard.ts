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

	// Check self-reply skip
	if (!code.includes('includes("@agentmail.to")')) {
		ok = false;
		errs.push("Missing self-reply guard for @agentmail.to");
	}
	if (!/Skipping response: message from agentmail domain/i.test(code)) {
		ok = false;
		errs.push("Missing log/branch for skipping agentmail domain messages");
	}

	if (ok) {
		console.log("[eval:self-reply-guard] PASS");
		process.exit(0);
	} else {
		console.error("[eval:self-reply-guard] FAIL:", errs.join(" | "));
		process.exit(1);
	}
}

main().catch((e) => {
	console.error("[eval:self-reply-guard] ERROR:", e);
	process.exit(1);
});


