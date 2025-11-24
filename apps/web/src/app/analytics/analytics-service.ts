"use server";

import { db, subTextActivity, subTests, testCases, eq, sql } from "@workspace/drizzle";

export type AnalyticsStats = {
  totalRuns: number;
  successRate: number;
  failureRate: number;
  totalFailures: number;
};

export type ActivityOverTime = {
  date: string;
  count: number;
  status: "SUCCESS" | "FAILED" | "PENDING";
  type: "EMAIL" | "PHONE";
};

export async function getOverallStats(): Promise<AnalyticsStats> {
  const result = await db
    .select({
      count: sql<number>`count(*)`,
      status: subTextActivity.status,
    })
    .from(subTextActivity)
    .groupBy(subTextActivity.status);

  let total = 0;
  let success = 0;
  let failed = 0;

  for (const row of result) {
    const count = Number(row.count);
    total += count;
    if (row.status === "SUCCESS") success += count;
    if (row.status === "FAILED") failed += count;
  }

  return {
    totalRuns: total,
    successRate: total > 0 ? Math.round((success / total) * 100) : 0,
    failureRate: total > 0 ? Math.round((failed / total) * 100) : 0,
    totalFailures: failed,
  };
}

export async function getActivityOverTime(): Promise<ActivityOverTime[]> {
  // Group by date (YYYY-MM-DD), status, and type
  const result = await db.execute(sql`
    SELECT 
      TO_CHAR(${subTextActivity.createdAt}, 'YYYY-MM-DD') as date,
      ${subTextActivity.status} as status,
      ${subTextActivity.type} as type,
      COUNT(*) as count
    FROM ${subTextActivity}
    WHERE ${subTextActivity.createdAt} > NOW() - INTERVAL '30 days'
    GROUP BY date, ${subTextActivity.status}, ${subTextActivity.type}
    ORDER BY date ASC
  `);

  return result.map((row: any) => ({
    date: row.date,
    count: Number(row.count),
    status: row.status,
    type: row.type,
  }));
}

export type RecentActivityItem = {
  id: number;
  date: Date | null;
  type: "EMAIL" | "PHONE" | null;
  status: "PENDING" | "SUCCESS" | "FAILED" | null;
  testCaseName: string | null;
  testCaseId: number | null;
  subTestName: string | null;
  subTestId: number | null;
};

export async function getRecentActivity(): Promise<RecentActivityItem[]> {
  const result = await db
    .select({
      id: subTextActivity.id,
      date: subTextActivity.createdAt,
      type: subTextActivity.type,
      status: subTextActivity.status,
      testCaseName: testCases.name,
      testCaseId: testCases.id,
      subTestName: subTests.name,
      subTestId: subTests.id,
    })
    .from(subTextActivity)
    .leftJoin(subTests, eq(subTextActivity.subTestId, subTests.id))
    .leftJoin(testCases, eq(subTests.testCaseId, testCases.id))
    .orderBy(sql`${subTextActivity.createdAt} DESC`)
    .limit(20);

  return result;
}
