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
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Download,
} from "lucide-react";
import type { Project, Task, User } from "@shared/schema";
import { downloadCsv, formatDateForExport } from "@/components/reports/exportUtils";

const COLORS = [
  "#4f46e5",
  "#22d3ee",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
];

interface ProjectReportsProps {
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
  isAdmin: boolean;
}

export default function ProjectReports({
  selectedProjectId,
  onProjectChange,
  projects,
  isAdmin,
}: ProjectReportsProps) {
  // ----------------------------------------------------------------------
  // 1. DATA FETCHING HOOKS
  // ----------------------------------------------------------------------
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<
    { id: number; title: string; name: string; projectId: number }[]
  >({
    queryKey: ["/api/buckets"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // ----------------------------------------------------------------------
  // 2. UI STATE HOOKS
  // ----------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: 'title',
    direction: null
  });

  // ----------------------------------------------------------------------
  // 3. MEMOIZED LOOKUP MAPS (Must be before Helper Functions)
  // ----------------------------------------------------------------------
  const bucketById = useMemo(() => {
    const map = new Map<number, { title: string }>();
    buckets.forEach((bucket) => {
      map.set(bucket.id, { title: bucket.title });
    });
    return map;
  }, [buckets]);

  const userById = useMemo(() => {
    const map = new Map<number, User>();
    users.forEach((user) => {
      map.set(user.id, user);
    });
    return map;
  }, [users]);

  // ----------------------------------------------------------------------
  // 4. HELPER FUNCTIONS (Must be before Data Processing)
  // ----------------------------------------------------------------------
  const getBucketTitleForExport = (task: Task): string => {
    if (!task.bucketId) return "";
    return bucketById.get(task.bucketId)?.title || "";
  };

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

  // ----------------------------------------------------------------------
  // 5. DATA PROCESSING (Filtering & Sorting)
  // ----------------------------------------------------------------------
  const selectedProject = projects.find(
    (p) => String(p.id) === selectedProjectId,
  );

  const projectTasks = useMemo(() => {
    return tasks.filter((t) => String(t.projectId) === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const projectBuckets = useMemo(() => {
    return buckets.filter((b) => Number(b.projectId) === Number(selectedProjectId));
  }, [buckets, selectedProjectId]);

  // Now safe to use helper functions here because they are defined above
  const filteredTasks = useMemo(() => {
    return projectTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getBucketTitleForExport(task).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [projectTasks, searchTerm, bucketById]); // Added bucketById dependency

  const sortedTasks = useMemo(() => {
    if (!sortConfig.direction) return filteredTasks;

    return [...filteredTasks].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Task] ?? '';
      let bVal: any = b[sortConfig.key as keyof Task] ?? '';

      if (sortConfig.key === 'stage') {
        aVal = getBucketTitleForExport(a);
        bVal = getBucketTitleForExport(b);
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTasks, sortConfig, bucketById]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  // ----------------------------------------------------------------------
  // 6. STATISTICS CALCULATIONS
  // ----------------------------------------------------------------------
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = projectTasks.filter((t) => t.status !== "completed").length;

  const overdueTasks = projectTasks.filter((t) => {
    if (!t.dueDate || t.status === "completed") return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const estimatedMinutes = projectTasks.reduce((sum, t) => {
    return sum + (t.estimateHours || 0) * 60 + (t.estimateMinutes || 0);
  }, 0);
  const estimatedHours = Math.round(estimatedMinutes / 60);

  const bucketDistribution = projectBuckets
    .map((bucket) => ({
      name: bucket.title || "Unnamed",
      count: projectTasks.filter((t) => Number(t.bucketId) === Number(bucket.id)).length,
    }))
    .filter((b) => b.count > 0);

  const statusData = [
    { status: "Not Started", count: projectTasks.filter((t) => t.status === "todo").length },
    { status: "In Progress", count: projectTasks.filter((t) => t.status === "in_progress").length },
    { status: "Completed", count: completedTasks },
  ];

  const handleDownloadCsv = () => {
    if (!selectedProject) return;

    const headers = [
      "Project", "Customer", "Stage", "Assignees",
      "Status", "Priority", "Start Date", "Due Date", "Estimate (hours)"
    ];

    const rows = projectTasks.map((task) => {
      const estimateHours = (task.estimateHours || 0) + (task.estimateMinutes || 0) / 60;
      return [
        selectedProject.name,
        task.title,
        getBucketTitleForExport(task),
        getAssigneeNamesForExport(task),
        task.status || "",
        task.priority || "",
        formatDateForExport(task.startDate),
        formatDateForExport(task.dueDate),
        estimateHours ? estimateHours.toFixed(1) : "",
      ];
    });

    const safeProjectName = selectedProject.name.toLowerCase().replace(/\s+/g, "-");
    downloadCsv(`project-report-${safeProjectName}.csv`, headers, rows);
  };

  const isLoading = tasksLoading || bucketsLoading || usersLoading;

  // ----------------------------------------------------------------------
  // 7. EARLY RETURNS
  // ----------------------------------------------------------------------
  if (!selectedProjectId || selectedProjectId === "") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Select Project</label>
              <Select value={selectedProjectId} onValueChange={onProjectChange}>
                <SelectTrigger className="w-full max-w-xs" data-testid="select-project-report">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Please select a project to view reports
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
              <label className="text-sm font-medium text-muted-foreground">
                Select Project
              </label>
              <Select value={selectedProjectId} onValueChange={onProjectChange}>
                <SelectTrigger
                  className="w-full max-w-xs"
                  data-testid="select-project-report"
                >
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDownloadCsv}
              disabled={isLoading || projectTasks.length === 0}
              data-testid="button-download-project-report"
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
                  Completion
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {completionPercentage}%
                </div>
                <Progress value={completionPercentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </CardTitle>
                <ListTodo className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {completedTasks} completed, {pendingTasks} pending
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
                <div className="text-2xl font-bold text-destructive">
                  {overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Estimated Time
                </CardTitle>
                <Clock className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estimatedHours}h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total estimate
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
                    <FolderKanban className="h-5 w-5" />
                    Stage Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bucketDistribution.length === 0 ? (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      No Customers in Stages
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={bucketDistribution}
                          cx="50%"
                          cy="45%"
                          outerRadius={80}
                          innerRadius={45}
                          fill="#8884d8"
                          dataKey="count"
                          nameKey="name"
                          paddingAngle={2}
                        >
                          {bucketDistribution.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `${value} customers`,
                            name,
                          ]}
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
                    <ListTodo className="h-5 w-5" />
                    Customer Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={statusData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {statusData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
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
                    placeholder="Search customers or stages..."
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
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('stage')}>
                            Stage {sortConfig.key === 'stage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3">Assignees</th>
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('status')}>
                            Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3 text-right">Estimate (h)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sortedTasks.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                              No matching results found.
                            </td>
                          </tr>
                        ) : (
                          sortedTasks.map((task) => (
                            <tr key={task.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3 font-medium">{task.title}</td>
                              <td className="p-3">{getBucketTitleForExport(task)}</td>
                              <td className="p-3 text-xs text-muted-foreground">{getAssigneeNamesForExport(task)}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                                  }`}>
                                  {task.status?.replace("_", " ")}
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