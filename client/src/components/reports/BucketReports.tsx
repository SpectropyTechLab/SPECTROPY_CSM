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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderKanban,
  ListTodo,
  Clock,
  AlertTriangle,
} from "lucide-react";
import type { Project, Task } from "@shared/schema";

const COLORS = ["#4f46e5", "#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface Bucket {
  id: number;
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
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets"],
  });

  const filteredBuckets = selectedProjectFilter === "all"
    ? buckets
    : buckets.filter((b) => String(b.projectId) === selectedProjectFilter);

  const selectedBucket = buckets.find((b) => String(b.id) === selectedBucketId);

  const bucketTasks = tasks.filter((t) => {
    if (String(t.bucketId) !== selectedBucketId) return false;
    if (!isAdmin) {
      const assignedUsers = t.assignedUsers || [];
      if (!assignedUsers.includes(currentUserId) && t.assigneeId !== currentUserId) {
        return false;
      }
    }
    return true;
  });

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

  const isLoading = tasksLoading || bucketsLoading;

  if (!selectedBucketId || selectedBucketId === "") {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Filter by Project</label>
                <Select value={selectedProjectFilter} onValueChange={onProjectFilterChange}>
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
                <label className="text-sm font-medium text-muted-foreground">Select Bucket</label>
                <Select value={selectedBucketId} onValueChange={onBucketChange}>
                  <SelectTrigger className="w-[200px]" data-testid="select-bucket-report">
                    <SelectValue placeholder="Choose a bucket..." />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredBuckets.map((bucket) => (
                      <SelectItem key={bucket.id} value={String(bucket.id)}>
                        {bucket.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Please select a bucket to view reports
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
              <label className="text-sm font-medium text-muted-foreground">Filter by Project</label>
              <Select value={selectedProjectFilter} onValueChange={onProjectFilterChange}>
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
              <label className="text-sm font-medium text-muted-foreground">Select Bucket</label>
              <Select value={selectedBucketId} onValueChange={onBucketChange}>
                <SelectTrigger className="w-[200px]" data-testid="select-bucket-report">
                  <SelectValue placeholder="Choose a bucket..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredBuckets.map((bucket) => (
                    <SelectItem key={bucket.id} value={String(bucket.id)}>
                      {bucket.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  Tasks in Bucket
                </CardTitle>
                <ListTodo className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInBucket}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently in {selectedBucket?.name || "bucket"}
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
                <div className="text-2xl font-bold text-destructive">{highPriority}</div>
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
                <div className="text-2xl font-bold text-amber-600">{overdueTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Past deadline
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg Time/Task
                </CardTitle>
                <Clock className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgHours}h {avgMins}m</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated average
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    Task Status in Bucket
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="status"
                        label={({ status, count, percent }) =>
                          count > 0 ? `${status}: ${count} (${(percent * 100).toFixed(0)}%)` : ""
                        }
                      >
                        {statusData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                      />
                      <Legend />
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
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="priority" />
                      <YAxis />
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
        </>
      )}
    </div>
  );
}
