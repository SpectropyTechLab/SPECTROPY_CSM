import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Paperclip,
  ListChecks,
  History,
  Trash2,
  Edit,
  Upload,
  X,
  FileText,
  Image,
  File,
  Users,
  ChevronDown,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Bucket, Task, User, ChecklistItem, Attachment, HistoryEntry } from "@shared/schema";
import { motion } from "framer-motion";
import { useUpload } from "@/hooks/use-upload";

interface BucketWithTasks extends Bucket {
  tasks: Task[];
}

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = Number(id);

  const currentUserId = Number(localStorage.getItem("userId")) || null;
  const currentUserName = localStorage.getItem("userName") || "Unknown";

  const createHistoryEntry = (action: string): HistoryEntry => ({
    action,
    userId: currentUserId,
    userName: currentUserName,
    timestamp: new Date().toISOString(),
  });

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewBucketOpen, setIsNewBucketOpen] = useState(false);
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [historyTask, setHistoryTask] = useState<Task | null>(null);
  const [selectedBucketId, setSelectedBucketId] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [newTaskAssignees, setNewTaskAssignees] = useState<number[]>([]);
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskEndDate, setNewTaskEndDate] = useState("");
  const [newTaskEstimateHours, setNewTaskEstimateHours] = useState(0);
  const [newTaskEstimateMinutes, setNewTaskEstimateMinutes] = useState(0);
  const [newBucketTitle, setNewBucketTitle] = useState("");
  const [editingBucketId, setEditingBucketId] = useState<number | null>(null);
  const [editingBucketTitle, setEditingBucketTitle] = useState("");
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("medium");
  const [editTaskAssignees, setEditTaskAssignees] = useState<number[]>([]);
  const [editTaskCompleted, setEditTaskCompleted] = useState(false);
  const [editTaskStartDate, setEditTaskStartDate] = useState("");
  const [editTaskEndDate, setEditTaskEndDate] = useState("");
  const [editTaskEstimateHours, setEditTaskEstimateHours] = useState(0);
  const [editTaskEstimateMinutes, setEditTaskEstimateMinutes] = useState(0);
  const [editTaskChecklist, setEditTaskChecklist] = useState<ChecklistItem[]>([]);
  const [editTaskAttachments, setEditTaskAttachments] = useState<Attachment[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      if (editingTask) {
        const newAttachment: Attachment = {
          id: crypto.randomUUID(),
          name: response.metadata.name,
          url: response.objectPath,
          type: response.metadata.contentType,
          size: response.metadata.size,
          uploadedAt: new Date().toISOString(),
        };
        setEditTaskAttachments([...editTaskAttachments, newAttachment]);
      }
    },
  });

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
      resetNewTaskForm();
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

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
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

  const updateBucketMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Bucket> & { id: number }) => {
      return apiRequest("PATCH", `/api/buckets/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buckets", projectId] });
      setEditingBucketId(null);
      setEditingBucketTitle("");
    },
  });

  const resetNewTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskAssignees([]);
    setNewTaskStartDate("");
    setNewTaskEndDate("");
    setNewTaskEstimateHours(0);
    setNewTaskEstimateMinutes(0);
  };

  const handleSaveBucketTitle = (bucketId: number) => {
    if (!editingBucketTitle.trim()) {
      setEditingBucketId(null);
      return;
    }
    updateBucketMutation.mutate({ id: bucketId, title: editingBucketTitle });
  };

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
        createHistoryEntry(`Moved to ${buckets.find((b) => b.id === bucketId)?.title}`),
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
      assigneeId: newTaskAssignees[0] || undefined,
      assignedUsers: newTaskAssignees,
      position: maxPosition + 1,
      status: "todo",
      startDate: newTaskStartDate ? new Date(newTaskStartDate + "T12:00:00") : null,
      dueDate: newTaskEndDate ? new Date(newTaskEndDate + "T12:00:00") : null,
      estimateHours: newTaskEstimateHours,
      estimateMinutes: newTaskEstimateMinutes,
      history: [createHistoryEntry("Created")],
      checklist: [],
      attachments: [],
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
    setEditTaskAssignees(task.assignedUsers || (task.assigneeId ? [task.assigneeId] : []));
    setEditTaskCompleted(task.status === "completed");
    setEditTaskStartDate(
      task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : ""
    );
    setEditTaskEndDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
    );
    setEditTaskEstimateHours(task.estimateHours || 0);
    setEditTaskEstimateMinutes(task.estimateMinutes || 0);
    setEditTaskChecklist(task.checklist || []);
    setEditTaskAttachments(task.attachments || []);
    setIsEditTaskOpen(true);
  };

  const handleSaveEditTask = () => {
    if (!editingTask || !editTaskTitle.trim()) return;

    updateTaskMutation.mutate({
      id: editingTask.id,
      title: editTaskTitle,
      description: editTaskDescription,
      priority: editTaskPriority,
      assigneeId: editTaskAssignees[0] || null,
      assignedUsers: editTaskAssignees,
      status: editTaskCompleted
        ? "completed"
        : editingTask.status === "completed"
          ? "todo"
          : editingTask.status,
      startDate: editTaskStartDate ? new Date(editTaskStartDate + "T12:00:00") : null,
      dueDate: editTaskEndDate ? new Date(editTaskEndDate + "T12:00:00") : null,
      estimateHours: editTaskEstimateHours,
      estimateMinutes: editTaskEstimateMinutes,
      checklist: editTaskChecklist,
      attachments: editTaskAttachments,
      history: [
        ...(editingTask.history || []),
        createHistoryEntry("Updated"),
      ],
    });
    setIsEditTaskOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  const handleViewHistory = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryTask(task);
    setIsHistoryOpen(true);
  };

  const handleToggleTaskComplete = async (task: Task, completed: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    updateTaskMutation.mutate({
      id: task.id,
      status: completed ? "completed" : "todo",
      history: [
        ...(task.history || []),
        createHistoryEntry(completed ? "Marked as completed" : "Marked as incomplete"),
      ],
    });

    if (completed && buckets) {
      const currentBucketIndex = buckets.findIndex((b) => b.id === task.bucketId);
      const nextBucket = buckets[currentBucketIndex + 1];
      
      if (nextBucket) {
        const newTaskData = {
          title: task.title,
          description: task.description || "",
          priority: task.priority,
          projectId: task.projectId,
          bucketId: nextBucket.id,
          assigneeId: task.assigneeId,
          assignedUsers: task.assignedUsers || [],
          startDate: task.startDate,
          dueDate: task.dueDate,
          estimateHours: task.estimateHours || 0,
          estimateMinutes: task.estimateMinutes || 0,
          checklist: [],
          attachments: [],
          history: [createHistoryEntry(`Auto-created from completed task in ${buckets[currentBucketIndex]?.title || "previous bucket"}`)],
        };
        
        createTaskMutation.mutate(newTaskData);
      }
    }
  };

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      title: newChecklistItem,
      completed: false,
    };
    setEditTaskChecklist([...editTaskChecklist, item]);
    setNewChecklistItem("");
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setEditTaskChecklist(
      editTaskChecklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    setEditTaskChecklist(editTaskChecklist.filter((item) => item.id !== itemId));
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setEditTaskAttachments(editTaskAttachments.filter((att) => att.id !== attachmentId));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }
    
    await uploadFile(file);
    e.target.value = "";
  };

  const toggleAssignee = (userId: number, assignees: number[], setAssignees: (a: number[]) => void) => {
    if (assignees.includes(userId)) {
      setAssignees(assignees.filter((id) => id !== userId));
    } else {
      setAssignees([...assignees, userId]);
    }
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

  const getAssignees = (task: Task) => {
    const assigneeIds = task.assignedUsers?.length ? task.assignedUsers : (task.assigneeId ? [task.assigneeId] : []);
    return users.filter((u) => assigneeIds.includes(u.id));
  };

  const getChecklistProgress = (checklist: ChecklistItem[] | null) => {
    if (!checklist || checklist.length === 0) return null;
    const completed = checklist.filter((item) => item.completed).length;
    return { completed, total: checklist.length, percentage: Math.round((completed / checklist.length) * 100) };
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type.includes("pdf") || type.includes("document")) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
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
        <Button variant="outline" onClick={() => navigate("/projects")} className="mt-4">
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
            <h1 className="text-xl font-semibold" data-testid="text-project-name">
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
                  {editingBucketId === bucket.id ? (
                    <Input
                      value={editingBucketTitle}
                      onChange={(e) => setEditingBucketTitle(e.target.value)}
                      onBlur={() => handleSaveBucketTitle(bucket.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveBucketTitle(bucket.id);
                        else if (e.key === "Escape") {
                          setEditingBucketId(null);
                          setEditingBucketTitle("");
                        }
                      }}
                      autoFocus
                      className="h-7 w-40 text-sm font-medium"
                      data-testid={`input-edit-bucket-title-${bucket.id}`}
                    />
                  ) : (
                    <h3
                      className="font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => {
                        setEditingBucketId(bucket.id);
                        setEditingBucketTitle(bucket.title);
                      }}
                      data-testid={`text-bucket-title-${bucket.id}`}
                    >
                      {bucket.title}
                    </h3>
                  )}
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
                  e.currentTarget.classList.add("bg-slate-100", "dark:bg-slate-700/50");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("bg-slate-100", "dark:bg-slate-700/50");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("bg-slate-100", "dark:bg-slate-700/50");
                  handleDrop(bucket.id, bucket.tasks.length);
                }}
              >
                {bucket.tasks.map((task) => {
                  const assignees = getAssignees(task);
                  const checklistProgress = getChecklistProgress(task.checklist);
                  const attachmentCount = task.attachments?.length || 0;

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
                        className={`p-3 bg-white dark:bg-slate-800 shadow-sm hover-elevate ${
                          task.status === "completed" ? "opacity-60" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="flex-shrink-0 mt-0.5"
                            onClick={(e) =>
                              handleToggleTaskComplete(task, task.status !== "completed", e)
                            }
                          >
                            <Checkbox
                              checked={task.status === "completed"}
                              className="h-4 w-4"
                              data-testid={`checkbox-task-${task.id}`}
                            />
                          </div>

                          <div className="flex-1 min-w-0" onClick={() => handleOpenEditTask(task)}>
                            <div className="flex items-start justify-between gap-2">
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEditTask(task); }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Task
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => handleViewHistory(task, e)}>
                                    <History className="h-4 w-4 mr-2" />
                                    View History
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => handleDeleteTask(task, e)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Task
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

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
                              {(task.estimateHours || task.estimateMinutes) && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {task.estimateHours}h {task.estimateMinutes}m
                                </span>
                              )}
                              {attachmentCount > 0 && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Paperclip className="h-3 w-3" />
                                  {attachmentCount}
                                </span>
                              )}
                              {checklistProgress && (
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <ListChecks className="h-3 w-3" />
                                  {checklistProgress.completed}/{checklistProgress.total}
                                </span>
                              )}
                            </div>

                            {checklistProgress && (
                              <Progress
                                value={checklistProgress.percentage}
                                className="h-1 mt-2"
                              />
                            )}

                            {(task.startDate || task.dueDate) && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                <Calendar className="h-3 w-3" />
                                {task.startDate && new Date(task.startDate).toLocaleDateString()}
                                {task.startDate && task.dueDate && " - "}
                                {task.dueDate && new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}

                            {assignees.length > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                <div className="flex -space-x-2">
                                  {assignees.slice(0, 3).map((assignee) => (
                                    <Avatar key={assignee.id} className="h-5 w-5 border-2 border-white dark:border-slate-800">
                                      <AvatarImage src={assignee.avatar || undefined} />
                                      <AvatarFallback className="text-xs">
                                        {assignee.name.charAt(0)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ))}
                                  {assignees.length > 3 && (
                                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-white dark:border-slate-800">
                                      +{assignees.length - 3}
                                    </div>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground ml-1">
                                  {assignees.length === 1 ? assignees[0].name : `${assignees.length} assignees`}
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

      {/* New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
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

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                <Users className="h-4 w-4 inline mr-2" />
                Assign Users
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" data-testid="button-assign-users-new">
                    <span className="truncate">
                      {newTaskAssignees.length === 0
                        ? "Select users..."
                        : `${newTaskAssignees.length} user${newTaskAssignees.length > 1 ? "s" : ""} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="space-y-1">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer"
                        onClick={() => toggleAssignee(user.id, newTaskAssignees, setNewTaskAssignees)}
                      >
                        <Checkbox
                          checked={newTaskAssignees.includes(user.id)}
                          onCheckedChange={() => toggleAssignee(user.id, newTaskAssignees, setNewTaskAssignees)}
                        />
                        <span className="text-sm">{user.name}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={newTaskStartDate}
                  onChange={(e) => setNewTaskStartDate(e.target.value)}
                  data-testid="input-task-start-date"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  End Date
                </label>
                <Input
                  type="date"
                  value={newTaskEndDate}
                  onChange={(e) => setNewTaskEndDate(e.target.value)}
                  data-testid="input-task-end-date"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">
                Time Estimate
              </label>
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 py-4 pr-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="edit-task-completed"
                  checked={editTaskCompleted}
                  onCheckedChange={(checked) => setEditTaskCompleted(checked === true)}
                  data-testid="checkbox-edit-task-completed"
                />
                <label htmlFor="edit-task-completed" className="text-sm font-medium cursor-pointer">
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

              <Select value={editTaskPriority} onValueChange={setEditTaskPriority}>
                <SelectTrigger data-testid="select-edit-task-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  <Users className="h-4 w-4 inline mr-2" />
                  Assign Users
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between" data-testid="button-assign-users-edit">
                      <span className="truncate">
                        {editTaskAssignees.length === 0
                          ? "Select users..."
                          : `${editTaskAssignees.length} user${editTaskAssignees.length > 1 ? "s" : ""} selected`}
                      </span>
                      <ChevronDown className="h-4 w-4 ml-2 flex-shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2" align="start">
                    <div className="space-y-1">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 rounded hover-elevate cursor-pointer"
                          onClick={() => toggleAssignee(user.id, editTaskAssignees, setEditTaskAssignees)}
                        >
                          <Checkbox
                            checked={editTaskAssignees.includes(user.id)}
                            onCheckedChange={() => toggleAssignee(user.id, editTaskAssignees, setEditTaskAssignees)}
                          />
                          <span className="text-sm">{user.name}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={editTaskStartDate}
                    onChange={(e) => setEditTaskStartDate(e.target.value)}
                    data-testid="input-edit-task-start-date"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={editTaskEndDate}
                    onChange={(e) => setEditTaskEndDate(e.target.value)}
                    data-testid="input-edit-task-end-date"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">
                  Time Estimate
                </label>
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

              {/* Checklist Section */}
              <div className="border rounded-lg p-4">
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ListChecks className="h-4 w-4" />
                  Checklist
                </label>
                <div className="space-y-2 mt-2">
                  {editTaskChecklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => handleToggleChecklistItem(item.id)}
                      />
                      <span className={`flex-1 text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveChecklistItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="Add checklist item..."
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={handleAddChecklistItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="border rounded-lg p-4">
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </label>
                <div className="space-y-2 mt-2">
                  {editTaskAttachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                      {getFileIcon(att.type)}
                      <span className="flex-1 text-sm truncate">{att.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {(att.size / 1024).toFixed(1)}KB
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveAttachment(att.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="mt-2">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                      <Button variant="outline" size="sm" disabled={isUploading} asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? "Uploading..." : "Upload File"}
                        </span>
                      </Button>
                    </label>
                    <span className="text-xs text-muted-foreground ml-2">Max 10MB</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
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

      {/* Task History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Task History
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 py-4">
              {historyTask?.history && historyTask.history.length > 0 ? (
                [...historyTask.history].reverse().map((entry, index) => {
                  const isStructured = typeof entry === "object" && entry !== null && "action" in entry;
                  const historyEntry = isStructured ? entry as HistoryEntry : null;
                  const legacyEntry = !isStructured ? String(entry) : null;

                  return (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="h-2 w-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {historyEntry ? (
                          <>
                            <p className="text-sm font-medium">{historyEntry.action}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                {historyEntry.userName || "Unknown"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(historyEntry.timestamp).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(historyEntry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm">{legacyEntry}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center">No history available</p>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
