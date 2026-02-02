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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  ListTodo,
  Download,
} from "lucide-react";
import type { User as UserType, Task, Project, Bucket } from "@shared/schema";
import { downloadCsv, formatDateForExport } from "@/components/reports/exportUtils";

const COLORS = ["#4f46e5", "#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface UserReportsProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  users: UserType[];
  isAdmin: boolean;
  currentUserId: number;
}

export default function UserReports({
  selectedUserId,
  onUserChange,
  users,
  isAdmin,
  currentUserId,
}: UserReportsProps) {
  // ----------------------------------------------------------------------
  // 1. DATA HOOKS
  // ----------------------------------------------------------------------
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets"],
  });

  // ----------------------------------------------------------------------
  // 2. UI STATE
  // ----------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'title',
    direction: null
  });

  // ----------------------------------------------------------------------
  // 3. MEMOIZED LOOKUPS
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
    const map = new Map<number, UserType>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // ----------------------------------------------------------------------
  // 4. HELPER FUNCTIONS
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

  const getBucketTitleForExport = (task: Task): string => {
    if (!task.bucketId) return "";
    return bucketById.get(task.bucketId)?.title || "";
  };

  const getProjectNameForExport = (task: Task): string => {
    if (!task.projectId) return "";
    return projectById.get(task.projectId)?.name || "";
  };

  // ----------------------------------------------------------------------
  // 5. DATA PROCESSING (Filtering & Sorting)
  // ----------------------------------------------------------------------
  const availableUsers = isAdmin ? users : users.filter((u) => u.id === currentUserId);
  const selectedUser = users.find((u) => String(u.id) === selectedUserId);

  const userTasks = useMemo(() => {
    return tasks.filter((t) => {
      const assignedUsers = t.assignedUsers || [];
      return assignedUsers.includes(Number(selectedUserId)) || t.assigneeId === Number(selectedUserId);
    });
  }, [tasks, selectedUserId]);

  const filteredTasks = useMemo(() => {
    return userTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProjectNameForExport(task).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBucketTitleForExport(task).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [userTasks, searchTerm, projectById, bucketById]);

  const sortedTasks = useMemo(() => {
    if (!sortConfig.direction) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Task] ?? '';
      let bVal: any = b[sortConfig.key as keyof Task] ?? '';

      // Handle derived string sorting
      if (sortConfig.key === 'project') {
        aVal = getProjectNameForExport(a);
        bVal = getProjectNameForExport(b);
      } else if (sortConfig.key === 'stage') {
        aVal = getBucketTitleForExport(a);
        bVal = getBucketTitleForExport(b);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortConfig, projectById, bucketById]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  // ----------------------------------------------------------------------
  // 6. STATISTICS
  // ----------------------------------------------------------------------
  const totalAssigned = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = userTasks.filter((t) => t.status !== "completed").length;
  const inProgressTasks = userTasks.filter((t) => t.status === "in_progress").length;

  const overdueTasks = userTasks.filter((t) => {
    if (!t.dueDate || t.status === "completed") return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const onTimeTasks = userTasks.filter((t) => {
    if (t.status !== "completed" || !t.dueDate) return false;
    return true;
  }).length;

  const completionRate = totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0;

  const estimatedMinutes = userTasks.reduce((sum, t) => {
    return sum + (t.estimateHours || 0) * 60 + (t.estimateMinutes || 0);
  }, 0);
  const estimatedHours = Math.round(estimatedMinutes / 60);

  const statusData = [
    { status: "Not Started", count: userTasks.filter((t) => t.status === "todo").length },
    { status: "In Progress", count: inProgressTasks },
    { status: "Completed", count: completedTasks },
  ];

  const priorityData = [
    { priority: "High", count: userTasks.filter((t) => t.priority === "high").length },
    { priority: "Medium", count: userTasks.filter((t) => t.priority === "medium").length },
    { priority: "Low", count: userTasks.filter((t) => t.priority === "low").length },
  ];

  const handleDownloadCsv = () => {
    if (!selectedUserId) return;

    const headers = [
      "User", "Customer", "Project", "Stage", "Assignees",
      "Status", "Priority", "Start Date", "Due Date", "Estimate (hours)"
    ];

    const rows = userTasks.map((task) => {
      const estimateHours = (task.estimateHours || 0) + (task.estimateMinutes || 0) / 60;
      return [
        selectedUser?.name || "",
        task.title,
        getProjectNameForExport(task),
        getBucketTitleForExport(task),
        getAssigneeNamesForExport(task),
        task.status || "",
        task.priority || "",
        formatDateForExport(task.startDate),
        formatDateForExport(task.dueDate),
        estimateHours ? estimateHours.toFixed(1) : "",
      ];
    });

    const safeUserName = (selectedUser?.name || "user").toLowerCase().replace(/\s+/g, "-");
    downloadCsv(`user-report-${safeUserName}.csv`, headers, rows);
  };

  const isLoading = tasksLoading || projectsLoading || bucketsLoading;

  // ----------------------------------------------------------------------
  // 7. EARLY RETURNS
  // ----------------------------------------------------------------------
  if (!selectedUserId || selectedUserId === "") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Select User</label>
              <Select value={selectedUserId} onValueChange={onUserChange}>
                <SelectTrigger className="w-full max-w-xs" data-testid="select-user-report">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {isAdmin ? "Please select a user to view reports" : "Loading your report..."}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 8. FINAL RENDER
  // ----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Select User</label>
              <Select value={selectedUserId} onValueChange={onUserChange}>
                <SelectTrigger className="w-full max-w-xs" data-testid="select-user-report">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDownloadCsv}
              disabled={isLoading || userTasks.length === 0}
              data-testid="button-download-user-report"
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
                  Customers Assigned
                </CardTitle>
                <ListTodo className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAssigned}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedTasks} completed, {pendingTasks} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate}%</div>
                <Progress value={completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {onTimeTasks} on-time completions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Estimated Hours
                </CardTitle>
                <Clock className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estimatedHours}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total workload
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
                    <CheckCircle2 className="h-5 w-5" />
                    Customer Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="45%"
                        outerRadius={80}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                        paddingAngle={2}
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [`${value} customers`, name]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ paddingTop: 10 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
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
                    <TrendingUp className="h-5 w-5" />
                    Priority Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        <Cell fill="#ef4444" />
                        <Cell fill="#f59e0b" />
                        <Cell fill="#10b981" />
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
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('stage')}>
                            Stage {sortConfig.key === 'stage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('status')}>
                            Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3">Priority</th>
                          <th className="p-3 text-right">Estimate (h)</th>
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
                              <td className="p-3 text-right">
                                {((task.estimateHours || 0) + (task.estimateMinutes || 0) / 60).toFixed(1)}
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