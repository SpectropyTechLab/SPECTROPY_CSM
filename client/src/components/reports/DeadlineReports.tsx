import { useState, useMemo } from "react";
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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Download,
} from "lucide-react";
import type { Task, Project, Bucket, User } from "@shared/schema";
import { format, isWithinInterval, parseISO, differenceInDays } from "date-fns";
import { downloadCsv, formatDateForExport } from "@/components/reports/exportUtils";

const COLORS = ["#4f46e5", "#22d3ee", "#10b981", "#f59e0b", "#ef4444"];

interface DeadlineReportsProps {
  isAdmin: boolean;
  currentUserId: number;
}

export default function DeadlineReports({
  isAdmin,
  currentUserId,
}: DeadlineReportsProps) {
  // ----------------------------------------------------------------------
  // 1. INITIALIZATION & DATA HOOKS
  // ----------------------------------------------------------------------
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(format(thirtyDaysAgo, "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(today, "yyyy-MM-dd"));

  // Table State
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'dueDate', // Default sort by deadline
    direction: 'asc'
  });

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // ----------------------------------------------------------------------
  // 2. MEMOIZED LOOKUPS
  // ----------------------------------------------------------------------
  const projectById = useMemo(() => {
    const map = new Map<number, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const bucketById = useMemo(() => {
    const map = new Map<number, Bucket>();
    buckets.forEach((b) => map.set(b.id, b));
    return map;
  }, [buckets]);

  const userById = useMemo(() => {
    const map = new Map<number, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // ----------------------------------------------------------------------
  // 3. HELPER FUNCTIONS
  // ----------------------------------------------------------------------
  const getAssigneeNamesForExport = (task: Task): string => {
    const ids = new Set<number>();
    if (task.assigneeId) ids.add(task.assigneeId);
    for (const id of task.assignedUsers || []) {
      ids.add(id);
    }
    if (ids.size === 0) return "";
    return Array.from(ids)
      .map((id) => userById.get(id)?.name || `User ${id}`)
      .join(", ");
  };

  const getProjectNameForExport = (task: Task): string => {
    if (!task.projectId) return "";
    return projectById.get(task.projectId)?.name || "";
  };

  const getBucketTitleForExport = (task: Task): string => {
    if (!task.bucketId) return "";
    return bucketById.get(task.bucketId)?.title || "";
  };

  // ----------------------------------------------------------------------
  // 4. DATA PROCESSING (Filtering & Sorting)
  // ----------------------------------------------------------------------

  // A. Filter by Date Range & Permissions
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Permission Check
      if (!isAdmin) {
        const assignedUsers = t.assignedUsers || [];
        if (!assignedUsers.includes(currentUserId) && t.assigneeId !== currentUserId) {
          return false;
        }
      }

      // Date Check
      if (!t.dueDate) return false;
      const dueDate = new Date(t.dueDate);
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      // Set end date to end of day to include tasks due on that day
      end.setHours(23, 59, 59, 999);

      return isWithinInterval(dueDate, { start, end });
    });
  }, [tasks, isAdmin, currentUserId, startDate, endDate]);

  // B. Filter by Search Term
  const tableTasks = useMemo(() => {
    return filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProjectNameForExport(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBucketTitleForExport(task).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [filteredTasks, searchTerm, projectById, bucketById]);

  // C. Sort Logic
  const sortedTasks = useMemo(() => {
    if (!sortConfig.direction) return tableTasks;

    return [...tableTasks].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Task] ?? '';
      let bVal: any = b[sortConfig.key as keyof Task] ?? '';

      // Special Sorts
      if (sortConfig.key === 'project') {
        aVal = getProjectNameForExport(a);
        bVal = getProjectNameForExport(b);
      } else if (sortConfig.key === 'stage') {
        aVal = getBucketTitleForExport(a);
        bVal = getBucketTitleForExport(b);
      } else if (sortConfig.key === 'dueDate') {
        aVal = new Date(a.dueDate || 0).getTime();
        bVal = new Date(b.dueDate || 0).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableTasks, sortConfig, projectById, bucketById]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  // ----------------------------------------------------------------------
  // 5. STATISTICS & CHARTS
  // ----------------------------------------------------------------------
  const totalTasksInRange = filteredTasks.length;
  const completedTasks = filteredTasks.filter((t) => t.status === "completed").length;

  const overdueTasks = filteredTasks.filter((t) => {
    if (t.status === "completed") return false;
    return new Date(t.dueDate!) < new Date();
  }).length;

  const onTimeCompletions = filteredTasks.filter((t) => {
    if (t.status !== "completed" || !t.dueDate) return false;
    return true; // Simplistic "on time" check based on status presence within range
  }).length;

  const onTimeRate = totalTasksInRange > 0 ? Math.round((onTimeCompletions / totalTasksInRange) * 100) : 0;

  const delays = filteredTasks
    .filter((t) => t.status !== "completed" && t.dueDate && new Date(t.dueDate) < new Date())
    .map((t) => differenceInDays(new Date(), new Date(t.dueDate!)));

  const avgDelay = delays.length > 0 ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length) : 0;

  // Chart Data Generation
  const trendData = useMemo(() => {
    const data: { date: string; due: number; completed: number }[] = [];
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const daysDiff = differenceInDays(end, start);

    // Determine interval to prevent overcrowded charts
    const interval = Math.max(1, Math.floor(daysDiff / 10));

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

      data.push({ date: dateStr, due: dueOnDate, completed: completedOnDate });
    }
    return data;
  }, [startDate, endDate, filteredTasks]);

  const statusBreakdown = [
    { status: "Completed On-Time", count: onTimeCompletions },
    { status: "Overdue", count: overdueTasks },
    { status: "Pending", count: filteredTasks.filter((t) => t.status !== "completed" && (!t.dueDate || new Date(t.dueDate) >= new Date())).length },
  ];

  const handleDownloadCsv = () => {
    const headers = [
      "Customer", "Project", "Stage", "Assignees",
      "Status", "Priority", "Start Date", "Due Date"
    ];

    const rows = filteredTasks.map((task) => [
      task.title,
      getProjectNameForExport(task),
      getBucketTitleForExport(task),
      getAssigneeNamesForExport(task),
      task.status || "",
      task.priority || "",
      formatDateForExport(task.startDate),
      formatDateForExport(task.dueDate),
    ]);

    const safeStart = startDate || "start";
    const safeEnd = endDate || "end";
    downloadCsv(`deadline-report-${safeStart}-to-${safeEnd}.csv`, headers, rows);
  };

  const isExportLoading = isLoading || projectsLoading || bucketsLoading || usersLoading;

  // ----------------------------------------------------------------------
  // 6. EARLY RETURNS
  // ----------------------------------------------------------------------
  if (!startDate || !endDate) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end justify-between">
              {/* Date Inputs */}
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
              <Button onClick={handleDownloadCsv} disabled={isExportLoading || filteredTasks.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Excel Download
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Please select a date range to view deadline reports
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 7. FINAL RENDER
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end justify-between">
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
            <Button
              onClick={handleDownloadCsv}
              disabled={isExportLoading || filteredTasks.length === 0}
              data-testid="button-download-deadline-report"
            >
              <Download className="h-4 w-4 mr-2" />
              Excel Download
            </Button>
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
                  Customers in Range
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
                  Overdue Customers
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
                  For overdue Customers
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
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium">Detailed Report</CardTitle>
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search customers or projects..."
                    className="w-full px-3 py-1 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                        <tr className="text-left font-medium text-muted-foreground">
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('title')}>
                            Customer {sortConfig.key === 'title' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('project')}>
                            Project {sortConfig.key === 'project' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('dueDate')}>
                            Due Date {sortConfig.key === 'dueDate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('stage')}>
                            Stage {sortConfig.key === 'stage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sortedTasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-muted-foreground">
                              No matching results found.
                            </td>
                          </tr>
                        ) : (
                          sortedTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-medium">{task.title}</td>
                              <td className="p-3 text-xs">{getProjectNameForExport(task)}</td>
                              <td className="p-3 text-xs font-mono">
                                {task.dueDate ? format(new Date(task.dueDate), "MMM dd, yyyy") : "-"}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">{getBucketTitleForExport(task)}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                      'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}>
                                  {task.status?.replace("_", " ")}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    task.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
                                      'bg-green-100 text-green-700'
                                  }`}>
                                  {task.priority}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}