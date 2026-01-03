import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import type { Task } from "@shared/schema";
import { format, isWithinInterval, parseISO, differenceInDays } from "date-fns";

const COLORS = ["#4f46e5", "#22d3ee", "#10b981", "#f59e0b", "#ef4444"];

interface DeadlineReportsProps {
  isAdmin: boolean;
  currentUserId: number;
}

export default function DeadlineReports({
  isAdmin,
  currentUserId,
}: DeadlineReportsProps) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(format(thirtyDaysAgo, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(today, "yyyy-MM-dd"));

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const filteredTasks = tasks.filter((t) => {
    if (!isAdmin) {
      const assignedUsers = t.assignedUsers || [];
      if (!assignedUsers.includes(currentUserId) && t.assigneeId !== currentUserId) {
        return false;
      }
    }
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    return isWithinInterval(dueDate, { start, end });
  });

  const totalTasksInRange = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === "completed").length;
  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === "completed") return false;
    return new Date(t.dueDate!) < new Date();
  }).length;

  const onTimeCompletions = filteredTasks.filter((t) => {
    if (t.status !== "completed" || !t.dueDate) return false;
    return true;
  }).length;

  const onTimeRate = totalTasksInRange > 0 ? Math.round((onTimeCompletions / totalTasksInRange) * 100) : 0;

  const delays = filteredTasks
    .filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date())
    .map((t) => differenceInDays(new Date(), new Date(t.dueDate!)));

  const avgDelay = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0;

  const trendData: { date: string; due: number; completed: number }[] = [];
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const daysDiff = differenceInDays(end, start);
  const interval = Math.max(1, Math.floor(daysDiff / 7));

  for (let i = 0; i <= daysDiff; i += interval) {
    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + i);
    const dateStr = format(currentDate, "MMM dd");

    const dueOnDate = filteredTasks.filter((t) => {
      const dueDate = new Date(t.dueDate!);
      return format(dueDate, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    }).length;

    const completedOnDate = filteredTasks.filter((t) => {
      if (t.status !== "completed" || !t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      return format(dueDate, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");
    }).length;

    trendData.push({ date: dateStr, due: dueOnDate, completed: completedOnDate });
  }

  const statusBreakdown = [
    { status: "Completed On-Time", count: onTimeCompletions },
    { status: "Overdue", count: overdueTasks },
    { status: "Pending", count: filteredTasks.filter((t) => t.status !== "completed" && (!t.dueDate || new Date(t.dueDate) >= new Date())).length },
  ];

  if (!startDate || !endDate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[180px]"
                  data-testid="input-deadline-start"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[180px]"
                  data-testid="input-deadline-end"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Please select a date range to view deadline reports
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[180px]"
                data-testid="input-deadline-start"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[180px]"
                data-testid="input-deadline-end"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-4"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tasks in Range
                </CardTitle>
                <Calendar className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasksInRange}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  With deadlines in period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue Tasks
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Past deadline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  On-Time Rate
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onTimeRate}%</div>
                <Progress value={onTimeRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Delay
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgDelay} days</div>
                <p className="text-xs text-muted-foreground mt-1">
                  For overdue tasks
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Deadline Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trendData.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      No data in this range
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="due" stroke="#4f46e5" strokeWidth={2} name="Due" />
                        <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={statusBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
