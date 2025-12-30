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
import {
  BarChart3,
  Users,
  FolderKanban,
  ListTodo,
  RefreshCw,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { Project, User } from "@shared/schema";

interface SummaryData {
  totalProjects: number;
  totalTasks: number;
  activeUsers: number;
}

interface ProjectProgress {
  name: string;
  completed: number;
  total: number;
  percentage: number;
}

interface UserPerformance {
  user: string;
  userId: number;
  completed: number;
  total: number;
  avgTime: number;
}

interface BucketStats {
  bucket: string;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

const COLORS = ["#4f46e5", "#22d3ee", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function SummaryCard({
  title,
  value,
  icon: Icon,
  delay,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono" data-testid={`text-${title.toLowerCase().replace(/\s/g, "-")}`}>
            {value}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ProjectProgressChart({ data }: { data: ProjectProgress[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Project Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No project data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value}%`,
                  name === "percentage" ? "Completion" : name,
                ]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Bar dataKey="percentage" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function UserPerformanceChart({ data }: { data: UserPerformance[] }) {
  const [showAvgTime, setShowAvgTime] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Performance
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={!showAvgTime ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAvgTime(false)}
            data-testid="button-show-completed"
          >
            Tasks Completed
          </Button>
          <Button
            variant={showAvgTime ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAvgTime(true)}
            data-testid="button-show-avg-time"
          >
            <Clock className="h-4 w-4 mr-1" />
            Avg Time
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No user data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="user" type="category" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Bar
                dataKey={showAvgTime ? "avgTime" : "completed"}
                fill="#22d3ee"
                radius={[0, 4, 4, 0]}
                name={showAvgTime ? "Avg Hours" : "Completed"}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function BucketBottleneckChart({ data }: { data: BucketStats[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderKanban className="h-5 w-5" />
          Tasks by Bucket
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No bucket data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                innerRadius={60}
                fill="#8884d8"
                dataKey="count"
                nameKey="bucket"
                label={({ bucket, count, percent }) =>
                  `${bucket}: ${count} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
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
        )}
      </CardContent>
    </Card>
  );
}

function TaskStatusChart({ data }: { data: StatusBreakdown[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListTodo className="h-5 w-5" />
          Task Status Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No status data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const {
    data: summary,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery<SummaryData>({
    queryKey: ["/api/reports/summary"],
  });

  const {
    data: projectProgress = [],
    isLoading: progressLoading,
    refetch: refetchProgress,
  } = useQuery<ProjectProgress[]>({
    queryKey: ["/api/reports/project-progress"],
  });

  const {
    data: userPerformance = [],
    isLoading: performanceLoading,
    refetch: refetchPerformance,
  } = useQuery<UserPerformance[]>({
    queryKey: ["/api/reports/user-performance"],
  });

  const {
    data: bucketStats = [],
    isLoading: bucketLoading,
    refetch: refetchBucket,
  } = useQuery<BucketStats[]>({
    queryKey: ["/api/reports/bucket-stats"],
  });

  const {
    data: statusBreakdown = [],
    isLoading: statusLoading,
    refetch: refetchStatus,
  } = useQuery<StatusBreakdown[]>({
    queryKey: ["/api/reports/status-breakdown"],
  });

  const handleRefresh = () => {
    refetchSummary();
    refetchProgress();
    refetchPerformance();
    refetchBucket();
    refetchStatus();
  };

  const handleResetFilters = () => {
    setSelectedProject("all");
    setSelectedUser("all");
  };

  const filteredProjectProgress =
    selectedProject === "all"
      ? projectProgress
      : projectProgress.filter((p) => p.name === selectedProject);

  const filteredUserPerformance =
    selectedUser === "all"
      ? userPerformance
      : userPerformance.filter((u) => u.userId === Number(selectedUser));

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-reports-title">
            <BarChart3 className="inline-block h-8 w-8 mr-2 text-primary" />
            Reports & Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            Analytics dashboard for your projects and tasks
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-reports">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                Project
              </label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-project">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">
                User
              </label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-user">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" onClick={handleResetFilters} data-testid="button-reset-filters">
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {summaryLoading ? (
          <>
            <Skeleton className="h-[100px]" />
            <Skeleton className="h-[100px]" />
            <Skeleton className="h-[100px]" />
          </>
        ) : (
          <>
            <SummaryCard
              title="Total Projects"
              value={summary?.totalProjects || 0}
              icon={FolderKanban}
              delay={0}
            />
            <SummaryCard
              title="Total Tasks"
              value={summary?.totalTasks || 0}
              icon={ListTodo}
              delay={0.1}
            />
            <SummaryCard
              title="Active Users"
              value={summary?.activeUsers || 0}
              icon={Users}
              delay={0.2}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {progressLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <ProjectProgressChart data={filteredProjectProgress} />
          </motion.div>
        )}

        {performanceLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <UserPerformanceChart data={filteredUserPerformance} />
          </motion.div>
        )}

        {bucketLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <BucketBottleneckChart data={bucketStats} />
          </motion.div>
        )}

        {statusLoading ? (
          <Skeleton className="h-[400px]" />
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <TaskStatusChart data={statusBreakdown} />
          </motion.div>
        )}
      </div>
    </div>
  );
}
