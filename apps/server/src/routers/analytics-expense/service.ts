import { db } from "@workspace/drizzle";
import { subTextActivity } from "@workspace/drizzle/schema";
import { eq, sql, and, isNull } from "drizzle-orm";
import { getVapiClient } from "@/lib/vapi";

export async function getSubTestExpense(subTestId: number) {
  // 1. Identify records with missing cost
  const missingCostActivities = await db
    .select()
    .from(subTextActivity)
    .where(
      and(
        eq(subTextActivity.subTestId, subTestId),
        eq(subTextActivity.type, "PHONE"),
        isNull(subTextActivity.cost)
      )
    );

  // 2. Backfill from Vapi
  if (missingCostActivities.length > 0) {
    const vapi = getVapiClient();
    console.log(
      `[getSubTestExpense] Backfilling cost for ${missingCostActivities.length} calls...`
    );

    await Promise.all(
      missingCostActivities.map(async (activity) => {
        if (!activity.misc_id) return;
        try {
          const call = await vapi.calls.get(activity.misc_id);
          const callAny = call as any;
          
          // Calculate cost similar to webhook logic
          // If call.cost is available, use it. Otherwise estimate.
          // Note: Vapi returns cost in USD, we store in cents.
          let costInCents = 0;
          if (callAny.cost) {
             costInCents = Math.round(callAny.cost * 100);
          } else {
             // Fallback estimation if Vapi doesn't provide cost
             const callDuration =
                callAny.duration || (callAny.endedAt && callAny.startedAt)
                  ? (new Date(callAny.endedAt).getTime() -
                      new Date(callAny.startedAt).getTime()) /
                    1000
                  : 0;
             costInCents = Math.round(callDuration * (0.05 / 60) * 100);
          }

          await db
            .update(subTextActivity)
            .set({ cost: costInCents })
            .where(eq(subTextActivity.id, activity.id));
            
          console.log(`[getSubTestExpense] Backfilled cost for call ${activity.misc_id}: ${costInCents} cents`);
        } catch (err) {
          console.error(
            `[getSubTestExpense] Failed to fetch/update cost for call ${activity.misc_id}`,
            err
          );
        }
      })
    );
  }

  // 3. Backfill Email Cost (if missing)
  const missingEmailCost = await db
    .select()
    .from(subTextActivity)
    .where(
      and(
        eq(subTextActivity.subTestId, subTestId),
        eq(subTextActivity.type, "EMAIL"),
        isNull(subTextActivity.cost),
        sql`${subTextActivity.tokens} IS NOT NULL`
      )
    );

  if (missingEmailCost.length > 0) {
    console.log(`[getSubTestExpense] Backfilling cost for ${missingEmailCost.length} emails...`);
    await Promise.all(
      missingEmailCost.map(async (activity) => {
        const tokens = activity.tokens || 0;
        const cost = Math.round(tokens * 0.001);
        await db
          .update(subTextActivity)
          .set({ cost })
          .where(eq(subTextActivity.id, activity.id));
      })
    );
  }

  // 4. Calculate totals
  const result = await db
    .select({
      type: subTextActivity.type,
      totalCost: sql<number>`sum(${subTextActivity.cost})`,
    })
    .from(subTextActivity)
    .where(eq(subTextActivity.subTestId, subTestId))
    .groupBy(subTextActivity.type);

  let voiceCost = 0;
  let emailCost = 0;

  for (const row of result) {
    if (row.type === "PHONE") voiceCost += Number(row.totalCost || 0);
    if (row.type === "EMAIL") emailCost += Number(row.totalCost || 0);
  }

  return {
    voiceCost,
    emailCost,
    totalCost: voiceCost + emailCost,
  };
}
