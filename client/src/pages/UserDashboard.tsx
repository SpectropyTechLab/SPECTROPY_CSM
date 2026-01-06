import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import type { Project, Task } from "@shared/schema";

export default function UserDashboard() {
  const userId = Number(localStorage.getItem("userId"));
  const userName = localStorage.getItem("userName") || "User";

  const { data: myTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { assigneeId: userId }],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?assigneeId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery<
    Project[]
  >({
    queryKey: ["/api/projects"],
  });
  const completedTasks = myTasks.filter((task) => task.status === "completed");
  const pendingTasks = myTasks.filter((task) => task.status === "todo");
  const inProgressTasks = myTasks.filter(
    (task) => task.status === "in_progress",
  );

  const myProjectIds = Array.from(
    new Set(myTasks.map((task) => task.projectId)),
  );
  const myProjects = projects.filter((project) =>
    myProjectIds.includes(project.id),
  );

  const taskStatusData = [
    { name: "Completed", value: completedTasks.length, color: "#10b981" },
    { name: "In Progress", value: inProgressTasks.length, color: "#f59e0b" },
    { name: "Pending", value: pendingTasks.length, color: "#6366f1" },
  ];

  const projectProgressData = myProjects.map((project) => {
    const projectTasks = myTasks.filter((t) => t.projectId === project.id);
    const completed = projectTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const total = projectTasks.length;
    return {
      name:
        project.name.length > 15
          ? project.name.substring(0, 15) + "..."
          : project.name,
      completed,
      pending: total - completed,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const totalEstimatedHours = myTasks.reduce((acc, task) => {
    return acc + (task.estimateHours || 0) + (task.estimateMinutes || 0) / 60;
  }, 0);

  if (tasksLoading || projectsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1
            className="text-3xl font-display font-bold text-slate-900"
            data-testid="text-welcome"
          >
            Welcome back, {userName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your tasks and projects
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assigned Projects
              </CardTitle>
              <FolderKanban className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="stat-projects">
                {myProjects.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active projects
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </CardTitle>
              <CheckSquare className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                data-testid="stat-total-tasks"
              >
                {myTasks.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Assigned to you
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold text-emerald-600"
                data-testid="stat-completed"
              >
                {completedTasks.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {myTasks.length > 0
                  ? Math.round((completedTasks.length / myTasks.length) * 100)
                  : 0}
                % completion rate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estimated Time
              </CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div
                className="text-2xl font-bold"
                data-testid="stat-estimated-time"
              >
                {totalEstimatedHours.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total workload
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Task Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myTasks.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      className="text-xs"
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No tasks assigned yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {projectProgressData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={projectProgressData} layout="vertical">
                    <XAxis type="number" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="completed"
                      stackId="a"
                      fill="#10b981"
                      name="Completed"
                    />
                    <Bar
                      dataKey="pending"
                      stackId="a"
                      fill="#e2e8f0"
                      name="Pending"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                  No projects assigned yet
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">My Projects</CardTitle>
              <Link href="/user/projects">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {myProjects.slice(0, 3).map((project) => {
                const projectTasks = myTasks.filter(
                  (t) => t.projectId === project.id,
                );
                const completed = projectTasks.filter(
                  (t) => t.status === "completed",
                ).length;
                const percentage =
                  projectTasks.length > 0
                    ? Math.round((completed / projectTasks.length) * 100)
                    : 0;

                return (
                  <Link key={project.id} href={`/user/projects/${project.id}`}>
                    <div className="p-3 rounded-lg border border-slate-200 hover-elevate cursor-pointer">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-medium text-sm truncate">
                          {project.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {completed}/{projectTasks.length} tasks completed
                      </p>
                    </div>
                  </Link>
                );
              })}
              {myProjects.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No projects assigned yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
              <Link href="/user/tasks">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {myTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 p-3 rounded-lg border border-slate-200"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.estimateHours || 0}h {task.estimateMinutes || 0}m
                      estimated
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      task.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : task.status === "in_progress"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                    }
                  >
                    {task.status === "in_progress"
                      ? "In Progress"
                      : task.status === "completed"
                        ? "Done"
                        : "Todo"}
                  </Badge>
                </div>
              ))}
              {myTasks.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No tasks assigned yet
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
