"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  getOverallStats,
  getActivityOverTime,
  getRecentActivity,
  type AnalyticsStats,
  type ActivityOverTime,
  type RecentActivityItem,
} from "./analytics-service";
import { Loader2, Phone, Mail, CheckCircle2, XCircle, Clock } from "lucide-react";

const COLORS = ["#10b981", "#ef4444", "#f59e0b"]; // Success (Green), Failed (Red), Pending (Amber)

export default function AnalyticsPage() {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [activity, setActivity] = useState<ActivityOverTime[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, activityData, recentData] = await Promise.all([
          getOverallStats(),
          getActivityOverTime(),
          getRecentActivity(),
        ]);
        setStats(statsData);
        setActivity(activityData);
        setRecentActivity(recentData);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Process activity data for BarChart (group by date)
  const processChartData = (data: ActivityOverTime[]) => {
    return data.reduce((acc: any[], curr) => {
      const existing = acc.find((item) => item.date === curr.date);
      if (existing) {
        existing[curr.status] = (existing[curr.status] || 0) + curr.count;
      } else {
        acc.push({
          date: curr.date,
          SUCCESS: curr.status === "SUCCESS" ? curr.count : 0,
          FAILED: curr.status === "FAILED" ? curr.count : 0,
          PENDING: curr.status === "PENDING" ? curr.count : 0,
        });
      }
      return acc;
    }, []);
  };

  const phoneActivity = activity.filter((a) => a.type === "PHONE");
  const emailActivity = activity.filter((a) => a.type === "EMAIL");

  const phoneChartData = processChartData(phoneActivity);
  const emailChartData = processChartData(emailActivity);

  const pieData = [
    { name: "Success", value: stats?.successRate || 0 },
    { name: "Failed", value: stats?.failureRate || 0 },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRuns}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time test executions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {stats?.successRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Percentage of successful tests
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats?.totalFailures}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tests that failed validation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Voice Agent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Agent Activity</CardTitle>
            <CardDescription>
              Daily breakdown of phone calls
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phoneChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="SUCCESS" fill="#10b981" name="Success" radius={[4, 4, 0, 0]} />
                <Bar dataKey="FAILED" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PENDING" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Email Agent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Email Agent Activity</CardTitle>
            <CardDescription>
              Daily breakdown of email interactions
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emailChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="SUCCESS" fill="#10b981" name="Success" radius={[4, 4, 0, 0]} />
                <Bar dataKey="FAILED" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PENDING" fill="#f59e0b" name="Pending" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest test executions with details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Test Case</TableHead>
                <TableHead>Sub-Test</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {item.date ? new Date(item.date).toLocaleString() : "N/A"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.testCaseName || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {item.testCaseId ? (
                      <Link
                        href={`/generate/test-case/${item.testCaseId}/sub-tests#subtest-${item.subTestId}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {item.subTestName || "Unnamed Sub-Test"}
                      </Link>
                    ) : (
                      item.subTestName || "Unnamed Sub-Test"
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.type === "PHONE" ? (
                        <Phone className="h-4 w-4 text-blue-500" />
                      ) : item.type === "EMAIL" ? (
                        <Mail className="h-4 w-4 text-purple-500" />
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      <span className="text-xs">{item.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.status === "SUCCESS" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : item.status === "FAILED" ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="text-xs font-medium">{item.status}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {recentActivity.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No recent activity found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
