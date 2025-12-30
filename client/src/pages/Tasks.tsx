import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  User,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useUsers } from "@/hooks/use-users";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  insertTaskSchema,
  type CreateTaskRequest,
  type Task,
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function Tasks() {
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: tasks, isLoading } = useTasks();

  const filteredTasks = tasks?.filter(
    (t) => filterStatus === "all" || t.status === filterStatus,
  );

  const columns = [
    { id: "todo", title: "To Do", color: "bg-slate-500" },
    { id: "in_progress", title: "In Progress", color: "bg-primary" },
    { id: "review", title: "Review", color: "bg-orange-500" },
    { id: "done", title: "Done", color: "bg-green-500" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1  p-8 overflow-y-auto h-screen">
        <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-1">
              Tasks Board
            </h1>
            <p className="text-muted-foreground">
              Track progress across all projects.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
              <button
                onClick={() => setFilterStatus("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filterStatus === "all"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus("done")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  filterStatus === "done"
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-white",
                )}
              >
                Completed
              </button>
            </div>
            <CreateTaskDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
            />
          </div>
        </header>

        <div className="flex overflow-x-auto pb-8 gap-6 h-[calc(100vh-12rem)]">
          {columns.map((col) => (
            <div key={col.id} className="min-w-[320px] w-[320px] flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <h3 className="font-semibold text-white">{col.title}</h3>
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">
                    {tasks?.filter((t) => t.status === col.id).length || 0}
                  </span>
                </div>
              </div>

              <div className="flex-1 rounded-2xl bg-card/30 border border-white/5 p-3 overflow-y-auto space-y-3">
                <AnimatePresence>
                  {tasks
                    ?.filter((t) => t.status === col.id)
                    .map((task) => <TaskCard key={task.id} task={task} />)}
                </AnimatePresence>

                {tasks?.filter((t) => t.status === col.id).length === 0 && (
                  <div className="h-24 flex items-center justify-center text-sm text-muted-foreground/50 border-2 border-dashed border-white/5 rounded-xl">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const { mutate: updateTask } = useUpdateTask();
  const { data: users } = useUsers();

  const assignee = users?.find((u) => u.id === task.assigneeId);

  const nextStatus = {
    todo: "in_progress",
    in_progress: "review",
    review: "done",
    done: "todo",
  };

  const priorityColors = {
    low: "text-slate-400 bg-slate-500/10",
    medium: "text-orange-400 bg-orange-500/10",
    high: "text-red-400 bg-red-500/10",
  };

  return (
    <motion.div
      layoutId={task.id.toString()}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all group cursor-pointer relative"
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={cn(
            "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded",
            priorityColors[task.priority as keyof typeof priorityColors],
          )}
        >
          {task.priority}
        </span>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      <h4 className="font-medium text-white mb-1">{task.title}</h4>
      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
        {task.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex -space-x-2">
          {assignee ? (
            <div
              className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white border-2 border-card"
              title={assignee.name}
            >
              {assignee.name.charAt(0)}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center border-2 border-card">
              <User className="w-3 h-3 text-muted-foreground" />
            </div>
          )}
        </div>

        {task.status !== "done" ? (
          <button
            onClick={() =>
              updateTask({
                id: task.id,
                status: nextStatus[task.status as keyof typeof nextStatus],
              })
            }
            className="w-6 h-6 rounded-full border border-border hover:border-primary hover:text-primary flex items-center justify-center transition-colors"
          >
            <Circle className="w-3 h-3" />
          </button>
        ) : (
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate, isPending } = useCreateTask();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();

  const form = useForm<CreateTaskRequest>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
    },
  });

  const onSubmit = (data: CreateTaskRequest) => {
    mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl px-4 h-10 shadow-lg shadow-primary/20">
          <Plus className="w-4 h-4" /> Add Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">
            New Task
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-border">
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border-border">
                      {projects?.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What needs to be done?"
                      className="bg-background border-border"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignee</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        {users?.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add details..."
                      className="bg-background border-border min-h-[80px]"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-border hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isPending ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
