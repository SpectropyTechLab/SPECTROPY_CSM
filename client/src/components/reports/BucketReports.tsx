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
import { FolderKanban, ListTodo, Clock, AlertTriangle, Download } from "lucide-react";
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

interface Bucket {
  id: number;
  title: string;
  name: string;
  projectId: number;
  position: number;
}

interface BucketReportsProps {
  selectedBucketId: string;
  onBucketChange: (bucketId: string) => void;
  selectedProjectFilter: string;
  onProjectFilterChange: (projectId: string) => void;
  projects: Project[];
  isAdmin: boolean;
  currentUserId: number;
}

export default function BucketReports({
  selectedBucketId,
  onBucketChange,
  selectedProjectFilter,
  onProjectFilterChange,
  projects,
  isAdmin,
  currentUserId,
}: BucketReportsProps) {
  // ----------------------------------------------------------------------
  // 1. DATA HOOKS
  // ----------------------------------------------------------------------
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
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
  const userById = useMemo(() => {
    const map = new Map<number, User>();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const projectById = useMemo(() => {
    const map = new Map<number, Project>();
    projects.forEach((project) => map.set(project.id, project));
    return map;
  }, [projects]);

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

  const getProjectNameForExport = (task: Task): string => {
    if (!task.projectId) return "";
    return projectById.get(task.projectId)?.name || "";
  };

  // ----------------------------------------------------------------------
  // 5. DATA PROCESSING
  // ----------------------------------------------------------------------

  // Filter Buckets based on Project dropdown
  const filteredBuckets = useMemo(() => {
    return selectedProjectFilter === "all"
      ? buckets
      : buckets.filter((b) => String(b.projectId) === selectedProjectFilter);
  }, [buckets, selectedProjectFilter]);

  const selectedBucket = buckets.find((b) => String(b.id) === selectedBucketId);

  // Filter Tasks belonging to the selected Bucket (+ Permissions)
  const bucketTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (String(t.bucketId) !== selectedBucketId) return false;
      if (!isAdmin) {
        const assignedUsers = t.assignedUsers || [];
        if (!assignedUsers.includes(currentUserId) && t.assigneeId !== currentUserId) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, selectedBucketId, isAdmin, currentUserId]);

  // Filter for Table (Search)
  const tableTasks = useMemo(() => {
    return bucketTasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProjectNameForExport(task).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [bucketTasks, searchTerm, projectById]);

  // Sort Logic
  const sortedTasks = useMemo(() => {
    if (!sortConfig.direction) return tableTasks;

    return [...tableTasks].sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Task] ?? '';
      let bVal: any = b[sortConfig.key as keyof Task] ?? '';

      // Special Sorts
      if (sortConfig.key === 'project') {
        aVal = getProjectNameForExport(a);
        bVal = getProjectNameForExport(b);
      } else if (sortConfig.key === 'dueDate') {
        aVal = new Date(a.dueDate || 0).getTime();
        bVal = new Date(b.dueDate || 0).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableTasks, sortConfig, projectById]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    else if (sortConfig.key === key && sortConfig.direction === 'desc') direction = null;
    setSortConfig({ key, direction });
  };

  // ----------------------------------------------------------------------
  // 6. STATISTICS
  // ----------------------------------------------------------------------
  const totalInBucket = bucketTasks.length;
  const highPriority = bucketTasks.filter((t) => t.priority === "high").length;

  const overdueTasks = bucketTasks.filter((t) => {
    if (!t.dueDate || t.status === "completed") return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  const estimatedMinutes = bucketTasks.reduce((sum, t) => {
    return sum + (t.estimateHours || 0) * 60 + (t.estimateMinutes || 0);
  }, 0);

  const avgTimePerTask = totalInBucket > 0 ? Math.round(estimatedMinutes / totalInBucket) : 0;
  const avgHours = Math.floor(avgTimePerTask / 60);
  const avgMins = avgTimePerTask % 60;

  const statusData = [
    { status: "Not Started", count: bucketTasks.filter((t) => t.status === "todo").length },
    { status: "In Progress", count: bucketTasks.filter((t) => t.status === "in_progress").length },
    { status: "Completed", count: bucketTasks.filter((t) => t.status === "completed").length },
  ];

  const priorityData = [
    { priority: "High", count: bucketTasks.filter((t) => t.priority === "high").length },
    { priority: "Medium", count: bucketTasks.filter((t) => t.priority === "medium").length },
    { priority: "Low", count: bucketTasks.filter((t) => t.priority === "low").length },
  ];

  const handleDownloadCsv = () => {
    if (!selectedBucket) return;

    const headers = [
      "Stage", "Project", "Customer", "Assignees",
      "Status", "Priority", "Start Date", "Due Date"
    ];

    const rows = bucketTasks.map((task) => [
      selectedBucket.title,
      getProjectNameForExport(task),
      task.title,
      getAssigneeNamesForExport(task),
      task.status || "",
      task.priority || "",
      formatDateForExport(task.startDate),
      formatDateForExport(task.dueDate),
    ]);

    const safeBucketName = selectedBucket.title.toLowerCase().replace(/\s+/g, "-");
    downloadCsv(`stage-report-${safeBucketName}.csv`, headers, rows);
  };

  const isLoading = tasksLoading || bucketsLoading || usersLoading;

  // ----------------------------------------------------------------------
  // 7. EARLY RETURNS
  // ----------------------------------------------------------------------
  if (!selectedBucketId || selectedBucketId === "") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end justify-between">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Filter by Project
                  </label>
                  <Select
                    value={selectedProjectFilter}
                    onValueChange={onProjectFilterChange}
                  >
                    <SelectTrigger className="w-[200px]" data-testid="select-bucket-project-filter">
                      <SelectValue placeholder="All Projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Select Stage
                  </label>
                  <Select value={selectedBucketId} onValueChange={onBucketChange}>
                    <SelectTrigger className="w-[200px]" data-testid="select-bucket-report">
                      <SelectValue placeholder="Choose a stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBuckets.map((bucket) => (
                        <SelectItem key={bucket.id} value={String(bucket.id)}>
                          {bucket.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleDownloadCsv}
                disabled={isLoading || bucketTasks.length === 0}
                data-testid="button-download-stage-report"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel Download
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Please select a Stage to view reports
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
          <div className="flex flex-wrap gap-4 items-end justify-between">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Filter by Project
                </label>
                <Select
                  value={selectedProjectFilter}
                  onValueChange={onProjectFilterChange}
                >
                  <SelectTrigger className="w-[200px]" data-testid="select-bucket-project-filter">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={String(project.id)}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Select Stage
                </label>
                <Select value={selectedBucketId} onValueChange={onBucketChange}>
                  <SelectTrigger className="w-[200px]" data-testid="select-bucket-report">
                    <SelectValue placeholder="Choose a stage..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBuckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={String(bucket.id)}>
                        {bucket.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handleDownloadCsv}
              disabled={isLoading || bucketTasks.length === 0}
              data-testid="button-download-stage-report"
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
                  Customers in Stage
                </CardTitle>
                <ListTodo className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInBucket}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently in {selectedBucket?.title || "stage"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  High Priority
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {highPriority}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Need attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Past deadline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Time/Customer
                </CardTitle>
                <Clock className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgHours}h {avgMins}m
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated average
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
                    Customer Status in Stage
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
                    Priority Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={priorityData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
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
                          <th className="p-3 cursor-pointer hover:text-primary" onClick={() => requestSort('dueDate')}>
                            Due Date {sortConfig.key === 'dueDate' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                          </th>
                          <th className="p-3">Assignees</th>
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
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                              </td>
                              <td className="p-3 text-xs text-muted-foreground">{getAssigneeNamesForExport(task)}</td>
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