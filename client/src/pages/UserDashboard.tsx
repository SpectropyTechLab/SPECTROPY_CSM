import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  TrendingUp,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Link } from "wouter";
import TodoOverviewCard from "@/components/dashboard/TodoOverviewCard";
import { toDateKey, isBeforeDateKey, isSameDateKey } from "@shared/dateUtils";
import type { Bucket, Project, Task } from "@shared/schema";

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
  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets"],
  });

  const lastBucketByProject = new Map<number, Bucket>();
  buckets.forEach((bucket) => {
    const current = lastBucketByProject.get(bucket.projectId);
    if (!current || bucket.position > current.position) {
      lastBucketByProject.set(bucket.projectId, bucket);
    }
  });

  const isCompletedCustomer = (task: Task) =>
    task.status === "completed" &&
    !!task.bucketId &&
    lastBucketByProject.get(task.projectId)?.id === task.bucketId;

  const completedCustomers = myTasks.filter(isCompletedCustomer);
  const pendingTasks = myTasks.filter((task) => task.status === "todo");
  const inProgressTasks = myTasks.filter(
    (task) =>
      task.status === "in_progress" ||
      (task.status === "completed" && !isCompletedCustomer(task)),
  );

  const todayKey = toDateKey(new Date());

  const todaysTasks = myTasks.filter((task) => toDateKey(task.startDate) === todayKey);
  const pendingWork = myTasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress",
  );
  const dueTasks = myTasks.filter(
    (task) =>
      task.status !== "completed" &&
      task.dueDate &&
      toDateKey(task.dueDate) <= todayKey,
  );
  const myStartTodayTasks = myTasks.filter((task) =>
    isSameDateKey(task.startDate, todayKey),
  );
  const myOverdueTasks = myTasks.filter((task) =>
    isBeforeDateKey(task.dueDate, todayKey),
  );
  const efficiency =
    myTasks.length > 0
      ? Math.round((completedCustomers.length / myTasks.length) * 100)
      : 0;

  const statusLabel = (status: string) =>
    status === "in_progress" ? "In Progress" : status === "completed" ? "Done" : "Todo";

  const myProjectIds = Array.from(
    new Set(myTasks.map((task) => task.projectId)),
  );
  const myProjects = projects.filter((project) =>
    myProjectIds.includes(project.id),
  );


  if (tasksLoading || projectsLoading || bucketsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-4 lg:p-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back, {userName}!
            </h1>
          </div>
          <p className="text-slate-500 text-sm">
            Your personal snapshot of customers and project progress.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-white px-3 py-1 shadow-sm">
            Today: {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Projects", value: myProjects.length, icon: FolderKanban, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "My Customers", value: myTasks.length, icon: CheckSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
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
        <div className="lg:col-span-8 space-y-6">
          <TodoOverviewCard
            title={
              <>
                <CheckSquare className="w-5 h-5 text-primary" />
                My Workload
              </>
            }
            subtitle="Today's starts, pending work, and due tasks assigned to you."
            pendingCount={pendingWork.length}
            todaysTasks={todaysTasks}
            pendingTasks={pendingWork}
            dueTasks={dueTasks}
            statusLabel={statusLabel}
            tone="admin"
          />

          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Customer Progress</CardTitle>
                  <CardDescription>Overall completion rate across your assigned customers.</CardDescription>
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
                  <p className="text-xs text-slate-400 font-medium mb-1">To Do</p>
                  <p className="text-xl font-bold">{pendingTasks.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-1">Completed</p>
                  <p className="text-xl font-bold">{completedCustomers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
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
                {myStartTodayTasks.length > 0 ? (
                  myStartTodayTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="p-3 rounded-lg border bg-white shadow-sm flex flex-col gap-1">
                      <span className="text-sm font-semibold truncate text-slate-800">{task.title}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Starts Today</span>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center border-dashed border-2 rounded-lg">
                    <p className="text-xs text-slate-400 italic">No tasks for today</p>
                  </div>
                )}
              </div>
              <Link href="/my-todo" className="block text-center text-xs font-bold text-primary hover:text-primary/80 transition-colors pt-2">
                VIEW ALL TASKS &rarr;
              </Link>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader>
              <CardTitle className="text-md">Task Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "To Do", count: pendingTasks.length, color: "bg-amber-400" },
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
    </div>
  );
}


