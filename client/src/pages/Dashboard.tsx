import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  Clock,
  Target,
  BarChart2,
  PieChart as PieChartIcon,
  Users,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Project, Task, User } from "@shared/schema";

const Dashboard = () => {
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = projectsLoading || tasksLoading || usersLoading;

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const efficiency = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const stats = [
    {
      label: "Total Projects",
      value: projects.length.toString(),
      icon: FolderKanban,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      label: "Total Customers",
      value: tasks.length.toString(),
      icon: CheckSquare,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Completed Customers",
      value: completedTasks.length.toString(),
      icon: Target,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Efficiency",
      value: `${efficiency}%`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
          <LayoutDashboard className="w-8 h-8 text-primary" />
          Admin Dashboard
        </h2>
        <p className="text-slate-500">
          Welcome back. Here's a snapshot of your workspace metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <motion.div key={index} variants={item}>
            <Card className="hover-elevate bg-white border-slate-200 overflow-hidden group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-medium text-slate-400 px-2 py-1 rounded-full bg-slate-50">
                    +12% this month
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Overview */}
        <Card className="lg:col-span-2 bg-white border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <BarChart2 className="w-5 h-5 text-primary" />
                Project Progression
              </CardTitle>
              <p className="text-sm text-slate-500">
                Overall completion rate across all active projects.
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-accent">{efficiency}%</span>
              <p className="text-xs text-slate-500">Aggregate Score</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-700 font-medium">
                  Customer Completion
                </span>
                <span className="text-accent font-bold">{completedTasks.length}/{tasks.length} Customers</span>
              </div>
              <Progress value={efficiency} className="h-3 bg-slate-100" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  In Progress
                </div>
                <p className="text-lg font-bold text-slate-900">{inProgressTasks.length}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Target className="w-3 h-3" />
                  To Do
                </div>
                <p className="text-lg font-bold text-slate-900">{todoTasks.length}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Users className="w-3 h-3" />
                  Team Members
                </div>
                <p className="text-lg font-bold text-slate-900">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="bg-white border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <PieChartIcon className="w-5 h-5 text-accent" />
              Customer Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    To Do
                  </p>
                  <p className="text-xs text-slate-500">{todoTasks.length} customers ({tasks.length > 0 ? Math.round((todoTasks.length / tasks.length) * 100) : 0}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-3 h-3 rounded-full bg-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    In Progress
                  </p>
                  <p className="text-xs text-slate-500">{inProgressTasks.length} customers ({tasks.length > 0 ? Math.round((inProgressTasks.length / tasks.length) * 100) : 0}%)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-700">
                    Completed
                  </p>
                  <p className="text-xs text-slate-500">{completedTasks.length} customers ({efficiency}%)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;


