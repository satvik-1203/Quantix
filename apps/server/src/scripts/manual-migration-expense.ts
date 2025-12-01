import { db } from "@workspace/drizzle";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Starting manual migration...");

  try {
    // Add cost column
    await db.execute(sql`ALTER TABLE sub_text_activity ADD COLUMN IF NOT EXISTS cost INTEGER;`);
    console.log("Added cost column.");

    // Add tokens column
    await db.execute(sql`ALTER TABLE sub_text_activity ADD COLUMN IF NOT EXISTS tokens INTEGER;`);
    console.log("Added tokens column.");

    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
