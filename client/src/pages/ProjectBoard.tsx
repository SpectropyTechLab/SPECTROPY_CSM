import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Clock,
  Calendar,
  User as UserIcon,
  GripVertical,
  CheckCircle2,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Bucket, Task, User } from "@shared/schema";
import { motion, Reorder } from "framer-motion";

interface BucketWithTasks extends Bucket {
  tasks: Task[];
}

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = Number(id);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewBucketOpen, setIsNewBucketOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskEndDate, setNewTaskEndDate] = useState("");
  const [newTaskEstimateHours, setNewTaskEstimateHours] = useState(0);
  const [newTaskEstimateMinutes, setNewTaskEstimateMinutes] = useState(0);
  const [newBucketTitle, setNewBucketTitle] = useState("");
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("medium");
  const [editTaskAssignee, setEditTaskAssignee] = useState<string>("");
  const [editTaskCompleted, setEditTaskCompleted] = useState(false);
  const [editTaskStartDate, setEditTaskStartDate] = useState("");
  const [editTaskEndDate, setEditTaskEndDate] = useState("");
  const [editTaskEstimateHours, setEditTaskEstimateHours] = useState(0);
  const [editTaskEstimateMinutes, setEditTaskEstimateMinutes] = useState(0);

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/buckets?projectId=${projectId}`);
      return res.json();
    },
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      return apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", projectId] });
      setIsNewTaskOpen(false);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskPriority("medium");
      setNewTaskAssignee("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: number }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", projectId] });
    },
  });

  const createBucketMutation = useMutation({
    mutationFn: async (data: Partial<Bucket>) => {
      return apiRequest("POST", "/api/buckets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buckets", projectId] });
      setIsNewBucketOpen(false);
      setNewBucketTitle("");
    },
  });

  const bucketsWithTasks: BucketWithTasks[] = buckets.map((bucket) => ({
    ...bucket,
    tasks: tasks
      .filter((task) => task.bucketId === bucket.id)
      .sort((a, b) => a.position - b.position),
  }));

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDrop = (bucketId: number, targetPosition: number) => {
    if (!draggedTask) return;

    updateTaskMutation.mutate({
      id: draggedTask.id,
      bucketId,
      position: targetPosition,
      history: [
        ...(draggedTask.history || []),
        `Moved to ${buckets.find((b) => b.id === bucketId)?.title} on ${new Date().toLocaleDateString()}`,
      ],
    });
    setDraggedTask(null);
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim() || !selectedBucketId) return;

    const bucketTasks = tasks.filter((t) => t.bucketId === selectedBucketId);
    const maxPosition = Math.max(...bucketTasks.map((t) => t.position), -1);

    createTaskMutation.mutate({
      title: newTaskTitle,
      description: newTaskDescription,
      priority: newTaskPriority,
      projectId,
      bucketId: selectedBucketId,
      assigneeId: newTaskAssignee ? Number(newTaskAssignee) : undefined,
      position: maxPosition + 1,
      status: "todo",
      startDate: newTaskStartDate ? new Date(newTaskStartDate) : undefined,
      dueDate: newTaskEndDate ? new Date(newTaskEndDate) : undefined,
      estimateHours: newTaskEstimateHours,
      estimateMinutes: newTaskEstimateMinutes,
      history: [`Created on ${new Date().toLocaleDateString()}`],
    });
  };

  const handleAddBucket = () => {
    if (!newBucketTitle.trim()) return;

    const maxPosition = Math.max(...buckets.map((b) => b.position), -1);
    createBucketMutation.mutate({
      title: newBucketTitle,
      projectId,
      position: maxPosition + 1,
    });
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskPriority(task.priority);
    setEditTaskAssignee(
      task.assigneeId ? String(task.assigneeId) : "unassigned",
    );
    setEditTaskCompleted(task.status === "completed");
    setEditTaskStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "");
    setEditTaskEndDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "");
    setEditTaskEstimateHours(task.estimateHours || 0);
    setEditTaskEstimateMinutes(task.estimateMinutes || 0);
    setIsEditTaskOpen(true);
  };

  const handleSaveEditTask = () => {
    if (!editingTask || !editTaskTitle.trim()) return;

    updateTaskMutation.mutate({
      id: editingTask.id,
      title: editTaskTitle,
      description: editTaskDescription,
      priority: editTaskPriority,
      assigneeId:
        editTaskAssignee && editTaskAssignee !== "unassigned"
          ? Number(editTaskAssignee)
          : null,
      status: editTaskCompleted
        ? "completed"
        : editingTask.status === "completed"
          ? "todo"
          : editingTask.status,
      startDate: editTaskStartDate ? new Date(editTaskStartDate) : null,
      dueDate: editTaskEndDate ? new Date(editTaskEndDate) : null,
      estimateHours: editTaskEstimateHours,
      estimateMinutes: editTaskEstimateMinutes,
      history: [
        ...(editingTask.history || []),
        `Updated on ${new Date().toLocaleDateString()}`,
      ],
    });
    setIsEditTaskOpen(false);
    setEditingTask(null);
  };

  const handleToggleTaskComplete = (
    task: Task,
    completed: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    updateTaskMutation.mutate({
      id: task.id,
      status: completed ? "completed" : "todo",
      history: [
        ...(task.history || []),
        `${completed ? "Marked as completed" : "Marked as incomplete"} on ${new Date().toLocaleDateString()}`,
      ],
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "medium":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "low":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const getAssignee = (assigneeId: number | null) => {
    if (!assigneeId) return null;
    return users.find((u) => u.id === assigneeId);
  };

  if (projectLoading || bucketsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Project not found</p>
        <Button
          variant="outline"
          onClick={() => navigate("/projects")}
          className="mt-4"
        >
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-white dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
            data-testid="button-back-to-projects"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1
              className="text-xl font-semibold"
              data-testid="text-project-name"
            >
              {project.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {project.description || "No description"}
            </p>
          </div>
        </div>

        <Dialog open={isNewBucketOpen} onOpenChange={setIsNewBucketOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" data-testid="button-add-bucket">
              <Plus className="h-4 w-4 mr-2" />
              Add Bucket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Bucket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Bucket title..."
                value={newBucketTitle}
                onChange={(e) => setNewBucketTitle(e.target.value)}
                data-testid="input-bucket-title"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleAddBucket}
                disabled={createBucketMutation.isPending}
                data-testid="button-submit-bucket"
              >
                Add Bucket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
          {bucketsWithTasks.map((bucket) => (
            <motion.div
              key={bucket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col w-80 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
              data-testid={`bucket-column-${bucket.id}`}
            >
              <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <h3
                    className="font-medium"
                    data-testid={`text-bucket-title-${bucket.id}`}
                  >
                    {bucket.title}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {bucket.tasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setSelectedBucketId(bucket.id);
                    setIsNewTaskOpen(true);
                  }}
                  data-testid={`button-add-task-${bucket.id}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div
                className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add(
                    "bg-slate-100",
                    "dark:bg-slate-700/50",
                  );
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove(
                    "bg-slate-100",
                    "dark:bg-slate-700/50",
                  );
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove(
                    "bg-slate-100",
                    "dark:bg-slate-700/50",
                  );
                  handleDrop(bucket.id, bucket.tasks.length);
                }}
              >
                {bucket.tasks.map((task, index) => {
                  const assignee = getAssignee(task.assigneeId);
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onDragEnd={handleDragEnd}
                      className={`cursor-grab active:cursor-grabbing ${
                        draggedTask?.id === task.id ? "opacity-50" : ""
                      }`}
                      data-testid={`task-card-${task.id}`}
                    >
                      <Card
                        className={`p-3 bg-white dark:bg-slate-800 shadow-sm hover-elevate cursor-pointer ${
                          task.status === "completed" ? "opacity-60" : ""
                        }`}
                        onClick={() => handleOpenEditTask(task)}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="flex-shrink-0 mt-0.5"
                            onClick={(e) =>
                              handleToggleTaskComplete(
                                task,
                                task.status !== "completed",
                                e,
                              )
                            }
                          >
                            <Checkbox
                              checked={task.status === "completed"}
                              className="h-4 w-4"
                              data-testid={`checkbox-task-${task.id}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p
                              className={`font-medium text-sm truncate ${
                                task.status === "completed"
                                  ? "line-through text-muted-foreground"
                                  : ""
                              }`}
                              data-testid={`text-task-title-${task.id}`}
                            >
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getPriorityColor(task.priority)}`}
                              >
                                {task.priority}
                              </Badge>
                              {task.status === "completed" && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Done
                                </Badge>
                              )}
                              {task.estimateHours || task.estimateMinutes ? (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {task.estimateHours}h {task.estimateMinutes}m
                                </span>
                              ) : null}
                              {(task.startDate || task.dueDate) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {task.startDate && new Date(task.startDate).toLocaleDateString()}
                                  {task.startDate && task.dueDate && " - "}
                                  {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {assignee && (
                              <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage
                                    src={assignee.avatar || undefined}
                                  />
                                  <AvatarFallback className="text-xs">
                                    {assignee.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground">
                                  {assignee.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ))}

          <div
            className="flex items-center justify-center w-80 min-h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover-elevate cursor-pointer"
            onClick={() => setIsNewBucketOpen(true)}
            data-testid="button-add-new-bucket"
          >
            <div className="text-center text-muted-foreground">
              <Plus className="h-8 w-8 mx-auto mb-2" />
              <p>Add Bucket</p>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Task title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              data-testid="input-task-title"
            />
            <Textarea
              placeholder="Description (optional)..."
              value={newTaskDescription}
              onChange={(e) => setNewTaskDescription(e.target.value)}
              data-testid="input-task-description"
            />
            <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
              <SelectTrigger data-testid="select-task-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
              <SelectTrigger data-testid="select-task-assignee">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={newTaskStartDate}
                  onChange={(e) => setNewTaskStartDate(e.target.value)}
                  data-testid="input-task-start-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={newTaskEndDate}
                  onChange={(e) => setNewTaskEndDate(e.target.value)}
                  data-testid="input-task-end-date"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Time Estimate</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Hours"
                  value={newTaskEstimateHours || ""}
                  onChange={(e) => setNewTaskEstimateHours(Number(e.target.value) || 0)}
                  className="w-24"
                  data-testid="input-task-estimate-hours"
                />
                <span className="text-sm text-muted-foreground">h</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Minutes"
                  value={newTaskEstimateMinutes || ""}
                  onChange={(e) => setNewTaskEstimateMinutes(Number(e.target.value) || 0)}
                  className="w-24"
                  data-testid="input-task-estimate-minutes"
                />
                <span className="text-sm text-muted-foreground">m</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleAddTask}
              disabled={createTaskMutation.isPending}
              data-testid="button-submit-task"
            >
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="edit-task-completed"
                checked={editTaskCompleted}
                onCheckedChange={(checked) =>
                  setEditTaskCompleted(checked === true)
                }
                data-testid="checkbox-edit-task-completed"
              />
              <label
                htmlFor="edit-task-completed"
                className="text-sm font-medium cursor-pointer"
              >
                Mark as completed
              </label>
            </div>
            <Input
              placeholder="Task title..."
              value={editTaskTitle}
              onChange={(e) => setEditTaskTitle(e.target.value)}
              data-testid="input-edit-task-title"
            />
            <Textarea
              placeholder="Description (optional)..."
              value={editTaskDescription}
              onChange={(e) => setEditTaskDescription(e.target.value)}
              data-testid="input-edit-task-description"
            />
            <Select
              value={editTaskPriority}
              onValueChange={setEditTaskPriority}
            >
              <SelectTrigger data-testid="select-edit-task-priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={editTaskAssignee}
              onValueChange={setEditTaskAssignee}
            >
              <SelectTrigger data-testid="select-edit-task-assignee">
                <SelectValue placeholder="Assign to..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={editTaskStartDate}
                  onChange={(e) => setEditTaskStartDate(e.target.value)}
                  data-testid="input-edit-task-start-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">End Date</label>
                <Input
                  type="date"
                  value={editTaskEndDate}
                  onChange={(e) => setEditTaskEndDate(e.target.value)}
                  data-testid="input-edit-task-end-date"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Time Estimate</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  placeholder="Hours"
                  value={editTaskEstimateHours || ""}
                  onChange={(e) => setEditTaskEstimateHours(Number(e.target.value) || 0)}
                  className="w-24"
                  data-testid="input-edit-task-estimate-hours"
                />
                <span className="text-sm text-muted-foreground">h</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="Minutes"
                  value={editTaskEstimateMinutes || ""}
                  onChange={(e) => setEditTaskEstimateMinutes(Number(e.target.value) || 0)}
                  className="w-24"
                  data-testid="input-edit-task-estimate-minutes"
                />
                <span className="text-sm text-muted-foreground">m</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSaveEditTask}
              disabled={updateTaskMutation.isPending}
              data-testid="button-save-edit-task"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
