import { db } from "@workspace/drizzle";
import { subTextActivity } from "@workspace/drizzle/schema";
import { desc, isNotNull, sql } from "drizzle-orm";

async function main() {
  console.log("Starting expense data debug...");

  try {
    // 1. Check for any non-zero cost
    const nonZeroCost = await db
      .select()
      .from(subTextActivity)
      .where(sql`${subTextActivity.cost} > 0`)
      .limit(5);

    console.log("Rows with cost > 0:", nonZeroCost);

    // 2. Check recent activities to see what's being saved
    const recent = await db
      .select()
      .from(subTextActivity)
      .orderBy(desc(subTextActivity.createdAt))
      .limit(5);

    console.log("Recent activities:", recent.map(r => ({
      id: r.id,
      type: r.type,
      cost: r.cost,
      tokens: r.tokens,
      createdAt: r.createdAt
    })));

    // 3. Check column type definition in DB (indirectly via behavior)
    // If cost is null, it means it wasn't set.
    const nullCost = await db
      .select({ count: sql`count(*)` })
      .from(subTextActivity)
      .where(sql`${subTextActivity.cost} IS NULL`);
    
    console.log("Rows with NULL cost:", nullCost[0]);

    process.exit(0);
  } catch (err) {
    console.error("Debug failed:", err);
    process.exit(1);
  }
}

main();
