import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Calendar,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Bucket, Project, Task, User, Notification } from "@shared/schema";
import { toDateKey, isAfterDateKey, isBeforeDateKey, isSameDateKey } from "@shared/dateUtils";
import TodoOverviewCard from "@/components/dashboard/TodoOverviewCard";
import TaskDialog from "@/components/Projectboard/TaskDialog";

type OverdueNotificationsResponse = {
  count: number;
  notifications: Notification[];
};

const Dashboard = () => {
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  // --- Data Fetching ---
  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks"] });
  const { data: myTodoTasks = [], isLoading: myTodoLoading } = useQuery<Task[]>({ queryKey: ["/api/tasks/my-todo"] });
  const { data: overdueNotifications, isLoading: overdueNotificationsLoading } = useQuery<OverdueNotificationsResponse>({
    queryKey: ["/api/notifications/overdue?unread=true"],
  });
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({ queryKey: ["/api/buckets"] });

  const isLoading = projectsLoading || tasksLoading || usersLoading || bucketsLoading || myTodoLoading || overdueNotificationsLoading;

  // --- Logic & Derived State ---
  const lastBucketByProject = new Map<number, Bucket>();
  buckets.forEach((bucket) => {
    const current = lastBucketByProject.get(bucket.projectId);
    if (!current || bucket.position > current.position) lastBucketByProject.set(bucket.projectId, bucket);
  });

  const isCompletedCustomer = (task: Task) =>
    task.status === "completed" && !!task.bucketId && lastBucketByProject.get(task.projectId)?.id === task.bucketId;

  const uniqueTaskCount = new Set(tasks.map(t => `${t.title}-${t.projectId}`)).size;
  const completedCustomers = tasks.filter((task) => task.status === "completed");
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "in_progress");
  const efficiency = tasks.length > 0 ? Math.round((completedCustomers.length / tasks.length) * 100) : 0;
  console.log("efficiency :", efficiency);

  const todayKey = toDateKey(new Date());
  const todaysTasks = tasks.filter((task) => toDateKey(task.startDate) === todayKey);
  const pendingTasks = tasks.filter((task) => (task.status === "todo" || task.status === "in_progress"));
  const dueTasks = tasks.filter((task) => task.status !== "completed" && toDateKey(task.dueDate) < todayKey);
  const compTasks = tasks.filter((task) => task.status === "completed");
  console.log("Total task count: ", tasks.length, compTasks.length);
  const myOverdueTasks = myTodoTasks.filter((task) => isBeforeDateKey(task.dueDate, todayKey));
  const myTodayTasks = myTodoTasks.filter((task) => isSameDateKey(task.dueDate, todayKey));
  const myUpcomingTasks = myTodoTasks.filter((task) => isAfterDateKey(task.dueDate, todayKey));
  const selectedTask = myTodoTasks.find((task) => task.id === selectedTaskId) ?? null;

  const handleMarkOverdueSeen = async () => {
    try {
      await apiRequest("PATCH", "/api/notifications/overdue/seen");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/overdue?unread=true"] });
    } catch (e) { console.warn(e); }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsTaskDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary/60" />
        <p className="text-slate-400 text-sm animate-pulse">Assembling your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 lg:p-8">

      {/* 1. Refined Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Workspace Overview</h1>
          </div>
          <p className="text-slate-500 text-sm">Real-time performance metrics and task distribution.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white px-3 py-1 shadow-sm">
            Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </Badge>
        </div>
      </header>

      {/* 2. KPI Cards - Clean & Consistent */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: projects.length, icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Customers", value: uniqueTaskCount, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Success Rate", value: `${efficiency}%`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Issues", value: dueTasks.length, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3. Main Operational Column */}
        <div className="lg:col-span-8 space-y-6">
          <TodoOverviewCard
            title="Operational Pipeline"
            subtitle="Centralized view of today's workload and customer progress."
            pendingCount={pendingTasks.length}
            todaysTasks={todaysTasks}
            pendingTasks={pendingTasks}
            dueTasks={dueTasks}
            statusLabel={(s) => s.replace("_", " ")}
            tone="admin"
          />

          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Project Progression</CardTitle>
                  <CardDescription>Aggregate completion rate across active project buckets.</CardDescription>
                </div>
                <span className="text-2xl font-black text-primary">{efficiency}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={efficiency} className="h-2 mb-6" />
              <div className="grid grid-cols-3 gap-8 py-2">
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">In Progress</p>
                  <p className="text-xl font-bold">{inProgressTasks.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Upcoming</p>
                  <p className="text-xl font-bold">{todoTasks.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Users</p>
                  <p className="text-xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Side Column: Focus & Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          {/* Personal Focus Card */}
          <Card className="border-none shadow-md ring-1 ring-primary/10 bg-gradient-to-b from-white to-slate-50/50">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-md font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  My Focus
                </CardTitle>
                {myOverdueTasks.length > 0 && (
                  <Badge className="bg-rose-500 hover:bg-rose-600 animate-pulse">
                    {myOverdueTasks.length} Overdue
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {myTodayTasks.length > 0 ? (
                  myTodayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleOpenTask(task)}
                      className="p-3 rounded-lg border bg-white shadow-sm flex flex-col gap-1 text-left hover:shadow-md hover:-translate-y-[1px] transition-transform"
                      type="button"
                    >
                      <span className="text-sm font-semibold truncate text-slate-800">{task.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Due Today</span>
                    </button>
                  ))
                ) : (
                  <div className="py-4 text-center border-dashed border-2 rounded-lg">
                    <p className="text-xs text-slate-400 italic">No tasks for today</p>
                  </div>
                )}
              </div>
              <Link href="/my-todo" onClick={handleMarkOverdueSeen} className="block text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors pt-2">
                VIEW ALL TASKS →
              </Link>
            </CardContent>
          </Card>

          {/* Breakdown Card */}
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="text-md">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "To Do", count: todoTasks.length, color: "bg-amber-400" },
                { label: "In Progress", count: inProgressTasks.length, color: "bg-blue-500" },
                { label: "Completed", count: completedCustomers.length, color: "bg-emerald-500" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="flex-1 text-sm font-medium text-slate-600">{item.label}</span>
                  <span className="text-sm font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <TaskDialog
        mode="edit"
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) {
            setSelectedTaskId(null);
          }
        }}
        projectId={selectedTask?.projectId ?? 0}
        selectedBucketId={selectedTask?.bucketId ?? null}
        task={selectedTask}
        buckets={buckets}
        users={users}
        tasks={tasks}
        canCreateTask
        canUpdateTask
        canCompleteTask
        onAfterClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
};

export default Dashboard;
