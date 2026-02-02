import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, Loader2, Menu } from "lucide-react"; // Added Menu icon
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Bucket, Project, Task, User } from "@shared/schema";
import { useMyTodoTasks, type MyTodoFilterKey } from "@/hooks/use-my-todo";
import MyTodoSidebar from "@/components/my-todo/MyTodoSidebar";
import TaskRow from "@/components/my-todo/TaskRow";
import TaskDialog from "@/components/Projectboard/TaskDialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Assuming you have a Sheet component
import { Button } from "@/components/ui/button";

type PermissionSummary = {
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canCompleteTask: boolean;
};

const emptyStateCopy: Record<MyTodoFilterKey, string> = {
  "my-day": "Nothing in My Day yet. Add a focus task and keep it light.",
  today: "No tasks due today 🎉",
  overdue: "You’re all caught up. No overdue tasks.",
  upcoming: "Nothing scheduled ahead. Enjoy the calm.",
  all: "No tasks assigned yet.",
};

export default function MyTodo() {
  const userId = Number(localStorage.getItem("userId"));
  const userRole = localStorage.getItem("userRole") || "User";
  const isAdmin = userRole === "Admin";
  const [activeFilter, setActiveFilter] = useState<MyTodoFilterKey>("my-day");
  const { tasks, filteredTasks, counts, isLoading } = useMyTodoTasks(activeFilter);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Queries (Kept as is)
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const { data: buckets = [] } = useQuery<Bucket[]>({ queryKey: ["/api/buckets"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/users"] });
  const { data: permissions } = useQuery<PermissionSummary>({
    queryKey: ["/api/users", userId, "permissions"],
    enabled: Number.isFinite(userId) && userId > 0,
  });

  useEffect(() => {
    const markSeen = async () => {
      try {
        await apiRequest("PATCH", "/api/notifications/overdue/seen");
        queryClient.invalidateQueries({ queryKey: ["/api/notifications/overdue?unread=true"] });
      } catch (error) {
        console.warn("Failed to mark overdue notifications as seen", error);
      }
    };
    markSeen();
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: number; updates: Partial<Task> }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, updates);
      return res.json();
    },
    onMutate: async ({ taskId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/tasks/my-todo"] });
      const previous = queryClient.getQueryData<Task[]>(["/api/tasks/my-todo"]);
      queryClient.setQueryData<Task[]>(["/api/tasks/my-todo"], (old = []) =>
        old.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
          .filter((task) => task.status !== "completed"),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["/api/tasks/my-todo"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-todo"] }),
  });

  const handleToggleComplete = (task: Task) => updateTaskMutation.mutate({ taskId: task.id, updates: { status: "completed" } });
  const handleUpdateTitle = (task: Task, title: string) => updateTaskMutation.mutate({ taskId: task.id, updates: { title } });

  const handleOpenDetails = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsTaskDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/80 via-white to-white px-3 py-4 md:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto space-y-4 md:space-y-6">

        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl md:rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-display font-bold text-slate-900 leading-tight">
                My Todo
              </h1>
              <p className="text-xs md:text-sm text-slate-500 hidden sm:block">
                A calm, focused view of your tasks.
              </p>
            </div>
          </div>

          {/* Mobile Sidebar Trigger */}
          <div className="lg:hidden">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <div className="py-6 px-4">
                  <MyTodoSidebar
                    activeFilter={activeFilter}
                    onFilterChange={(f) => {
                      setActiveFilter(f);
                      setIsSidebarOpen(false);
                    }}
                    counts={counts}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <MyTodoSidebar
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
            />
          </aside>

          {/* Main Task Area */}
          <section className="flex-1 min-w-0">
            <div className="rounded-2xl md:rounded-3xl bg-white/70 backdrop-blur-sm shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-4 md:px-6 md:pt-6 md:pb-3 border-b border-slate-100">
                <h2 className="text-base md:text-lg font-semibold text-slate-900 capitalize">
                  {activeFilter.replace("-", " ")}
                </h2>
                <p className="text-xs md:text-sm text-slate-500">
                  {counts[activeFilter]} tasks
                </p>
              </div>

              <motion.div
                key={activeFilter}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-x-hidden"
              >
                <ul className="divide-y divide-slate-100">
                  <AnimatePresence mode="popLayout">
                    {filteredTasks.map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggleComplete={handleToggleComplete}
                        onOpenDetails={handleOpenDetails}
                        onUpdateTitle={handleUpdateTitle}
                      />
                    ))}
                  </AnimatePresence>
                </ul>

                {filteredTasks.length === 0 && (
                  <div className="px-6 py-16 text-center">
                    <p className="text-sm text-slate-400 italic">
                      {emptyStateCopy[activeFilter]}
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </section>
        </div>
      </div>

      <TaskDialog
        mode="edit"
        open={isTaskDialogOpen}
        onOpenChange={(open) => {
          setIsTaskDialogOpen(open);
          if (!open) setSelectedTaskId(null);
        }}
        projectId={selectedTask?.projectId ?? 0}
        selectedBucketId={selectedTask?.bucketId ?? null}
        task={selectedTask}
        buckets={buckets}
        users={users}
        tasks={tasks}
        canCreateTask={permissions?.canCreateTask ?? isAdmin}
        canUpdateTask={permissions?.canUpdateTask ?? isAdmin}
        canCompleteTask={permissions?.canCompleteTask ?? isAdmin}
        onAfterClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}