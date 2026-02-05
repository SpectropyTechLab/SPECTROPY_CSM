import { useState, useEffect, useRef } from "react";
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
import { downloadAttachment } from "../hooks/use-download";
import BucketSettingsDialog from "@/components/BucketSettingsDialog";
import DynamicCustomFields from "@/components/DynamicCustomFields";
import { parseCustomFields, serializeCustomFields } from "@shared/customFieldsUtils";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";

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
  Copy,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  Project,
  Bucket,
  Task,
  User,
  ChecklistItem,
  Attachment,
  HistoryEntry,
} from "@shared/schema";
import { motion } from "framer-motion";
import { useUpload } from "@/hooks/use-upload";
import { usePermissions } from "@/hooks/use-permissions";
import { useToast } from "@/hooks/use-toast";

interface BucketWithTasks extends Bucket {
  tasks: Task[];
}

type BoardView = "stage" | "assignee" | "due_date" | "title";

interface BoardColumn {
  id: string;
  title: string;
  tasks: Task[];
  bucket?: BucketWithTasks;
}

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const projectId = Number(id);
  const { toast } = useToast();
  const {
    canCreateTask,
    canUpdateTask,
    canCompleteTask,
    canDeleteTask,
    isAdmin,
  } = usePermissions();

  const currentUserId = Number(localStorage.getItem("userId")) || null;
  const currentUserName = localStorage.getItem("userName") || "Unknown";
  const createHistoryEntry = (action: string): HistoryEntry => ({
    action,
    userId: currentUserId,
    userName: currentUserName,
    timestamp: new Date().toISOString(),
  });
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<BoardView>("stage");
  const boardScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRafRef = useRef<number | null>(null);
  const scrollDirectionRef = useRef<"left" | "right" | null>(null);
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
  const [newTaskStatus, setNewTaskStatus] = useState("todo");
  const [newTaskAssignees, setNewTaskAssignees] = useState<number[]>([]);
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskEndDate, setNewTaskEndDate] = useState("");
  const [newTaskEstimateHours, setNewTaskEstimateHours] = useState(0);
  const [newTaskEstimateMinutes, setNewTaskEstimateMinutes] = useState(0);
  const [newTaskChecklist, setNewTaskChecklist] = useState<ChecklistItem[]>([]);
  const [newTaskAttachments, setNewTaskAttachments] = useState<Attachment[]>([]);
  const [newTaskCustomFields, setNewTaskCustomFields] = useState<Record<string, any>>({});
  const [newTaskChecklistItem, setNewTaskChecklistItem] = useState("");
  const [newBucketTitle, setNewBucketTitle] = useState("");
  const [editingBucketId, setEditingBucketId] = useState<number | null>(null);
  const [editingBucketTitle, setEditingBucketTitle] = useState("");
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("medium");
  const [editTaskAssignees, setEditTaskAssignees] = useState<number[]>([]);
  const [editTaskStatus, setEditTaskStatus] = useState("todo");
  const [editTaskStartDate, setEditTaskStartDate] = useState("");
  const [editTaskEndDate, setEditTaskEndDate] = useState("");
  const [editTaskEstimateHours, setEditTaskEstimateHours] = useState(0);
  const [editTaskEstimateMinutes, setEditTaskEstimateMinutes] = useState(0);
  const [editTaskChecklist, setEditTaskChecklist] = useState<ChecklistItem[]>(
    [],
  );
  const [editTaskAttachments, setEditTaskAttachments] = useState<Attachment[]>(
    [],
  );
  const [editTaskCustomFields, setEditTaskCustomFields] = useState<Record<string, any>>({});
  const [newChecklistItem, setNewChecklistItem] = useState("");

  const [expandedColumns, setExpandedColumns] = useState<Record<string, boolean>>({});
  const { uploadFile: uploadNewFile, isUploading: isUploadingNew } = useUpload({
    onSuccess: (response) => {
      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        name: response.metadata.name,
        url: response.objectPath,
        type: response.metadata.contentType,
        size: response.metadata.size,
        uploadedAt: new Date().toISOString(),
      };
      setNewTaskAttachments((prev) => [...prev, newAttachment]);
    },
  });


  const toggleColumnCompleted = (columnId: string) => {
    setExpandedColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const stopAutoScroll = () => {
    scrollDirectionRef.current = null;
    if (scrollRafRef.current !== null) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = null;
    }
  };

  const startAutoScroll = (direction: "left" | "right") => {
    if (scrollDirectionRef.current === direction && scrollRafRef.current) {
      return;
    }
    scrollDirectionRef.current = direction;
    if (scrollRafRef.current !== null) {
      return;
    }

    const step = () => {
      const container = boardScrollRef.current;
      if (!container || !scrollDirectionRef.current) {
        stopAutoScroll();
        return;
      }
      const speed = 14;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (scrollDirectionRef.current === "left") {
        container.scrollLeft = Math.max(0, container.scrollLeft - speed);
      } else {
        container.scrollLeft = Math.min(maxScrollLeft, container.scrollLeft + speed);
      }
      scrollRafRef.current = requestAnimationFrame(step);
    };

    scrollRafRef.current = requestAnimationFrame(step);
  };

  const handleBoardDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!draggedTask) return;
    const container = boardScrollRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const edgeThreshold = 60;
    if (event.clientX - rect.left < edgeThreshold) {
      startAutoScroll("left");
    } else if (rect.right - event.clientX < edgeThreshold) {
      startAutoScroll("right");
    } else {
      stopAutoScroll();
    }
  };

  useEffect(() => () => stopAutoScroll(), []);

  const { uploadFile: uploadEditFile, isUploading: isUploadingEdit } = useUpload({
    onSuccess: (response) => {
      if (!editingTask) return;
      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        name: response.metadata.name,
        url: response.objectPath,
        type: response.metadata.contentType,
        size: response.metadata.size,
        uploadedAt: new Date().toISOString(),
      };
      setEditTaskAttachments((prev) => [...prev, newAttachment]);
    },
  });

  const { data: project, isLoading: projectLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets", projectId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/buckets?projectId=${projectId}`);
      return res.json();
    },
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks", projectId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/tasks?projectId=${projectId}`);
      return res.json();
    },
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", projectId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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

  const deleteBucketMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/buckets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/buckets", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", projectId] });
      toast({
        title: "Stage deleted",
        description: "The stage and all its customers have been removed",
      });
    },
  });

  const resetNewTaskForm = () => {
    setNewTaskTitle("");
    setNewTaskDescription("");
    setNewTaskPriority("medium");
    setNewTaskStatus("todo");
    setNewTaskAssignees([]);
    setNewTaskStartDate("");
    setNewTaskEndDate("");
    setNewTaskEstimateHours(0);
    setNewTaskEstimateMinutes(0);
    setNewTaskChecklist([]);
    setNewTaskAttachments([]);
    setNewTaskCustomFields({});
    setNewTaskChecklistItem("");
  };

  const handleSaveBucketTitle = (bucketId: number) => {
    if (!editingBucketTitle.trim()) {
      setEditingBucketId(null);
      return;
    }
    updateBucketMutation.mutate({ id: bucketId, title: editingBucketTitle });
  };

  const handleDeleteBucket = (bucket: BucketWithTasks) => {
    if (!canDeleteTask) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to delete stages",
        variant: "destructive",
      });
      return;
    }
    const taskCount = bucket.tasks.length;
    const message = taskCount > 0
      ? `Are you sure you want to delete "${bucket.title}" and its ${taskCount} customer${taskCount > 1 ? 's' : ''}?`
      : `Are you sure you want to delete "${bucket.title}"?`;

    if (confirm(message)) {
      deleteBucketMutation.mutate(bucket.id);
    }
  };

  {/*function to filter and sort buckted and task*/ }
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
    stopAutoScroll();
  };

  const handleDrop = (bucketId: number, targetPosition: number) => {
    if (!draggedTask) return;

    updateTaskMutation.mutate({
      id: draggedTask.id,
      bucketId,
      position: targetPosition,
      history: [
        ...(draggedTask.history || []),
        createHistoryEntry(
          `Moved to ${buckets.find((b) => b.id === bucketId)?.title}`,
        ),
      ],
    });
    setDraggedTask(null);
    stopAutoScroll();
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
      status: newTaskStatus,
      startDate: newTaskStartDate
        ? new Date(newTaskStartDate + "T12:00:00")
        : null,
      dueDate: newTaskEndDate ? new Date(newTaskEndDate + "T12:00:00") : null,
      estimateHours: newTaskEstimateHours,
      estimateMinutes: newTaskEstimateMinutes,
      checklist: newTaskChecklist,
      attachments: newTaskAttachments,
      customFields: Object.keys(newTaskCustomFields).length > 0
        ? serializeCustomFields(newTaskCustomFields)
        : undefined,
      history: [createHistoryEntry("Created")],
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

  const getCustomFieldValuesForBucket = (
    customFieldsString: string | null,
    bucketId?: number | null,
  ): Record<string, any> => {
    const parsed = parseCustomFields(customFieldsString);
    const bucket = buckets.find((b) => b.id === bucketId);
    const configs = bucket?.customFieldsConfig || [];
    if (configs.length === 0) return parsed;

    const result: Record<string, any> = { ...parsed };
    for (const field of configs) {
      const value = parsed[field.key];
      if (value === undefined) continue;
      if (field.type === "checkbox") {
        result[field.key] = value === "true";
      } else if (field.type === "number") {
        const numericValue = Number(value);
        result[field.key] = Number.isNaN(numericValue) ? value : numericValue;
      }
    }

    return result;
  };

  const getCustomFieldsForConfig = (
    customFieldsString: string | null,
    config: Bucket["customFieldsConfig"],
  ): Record<string, string> => {
    const parsed = parseCustomFields(customFieldsString);
    if (!config || config.length === 0) {
      return parsed;
    }

    const allowedKeys = new Set(config.map((field) => field.key));
    return Object.fromEntries(
      Object.entries(parsed).filter(([key]) => allowedKeys.has(key)),
    );
  };

  const handleOpenEditTask = (task: Task) => {
    if (!canUpdateTask && !canCompleteTask) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to edit customers",
        variant: "destructive",
      });
      return;
    }
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskPriority(task.priority);
    setEditTaskAssignees(
      task.assignedUsers || (task.assigneeId ? [task.assigneeId] : []),
    );
    setEditTaskStatus(task.status || "todo");
    setEditTaskStartDate(
      task.startDate
        ? new Date(task.startDate).toISOString().split("T")[0]
        : "",
    );
    setEditTaskEndDate(
      task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    );
    setEditTaskEstimateHours(task.estimateHours || 0);
    setEditTaskEstimateMinutes(task.estimateMinutes || 0);
    setEditTaskChecklist(task.checklist || []);
    setEditTaskAttachments(task.attachments || []);
    setEditTaskCustomFields(
      getCustomFieldValuesForBucket(task.customFields ?? null, task.bucketId),
    );
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
      status: editTaskStatus,
      startDate: editTaskStartDate
        ? new Date(editTaskStartDate + "T12:00:00")
        : null,
      dueDate: editTaskEndDate ? new Date(editTaskEndDate + "T12:00:00") : null,
      estimateHours: editTaskEstimateHours,
      estimateMinutes: editTaskEstimateMinutes,
      checklist: editTaskChecklist,
      attachments: editTaskAttachments,
      customFields: Object.keys(editTaskCustomFields).length > 0
        ? serializeCustomFields(editTaskCustomFields)
        : undefined,
      history: [...(editingTask.history || []), createHistoryEntry("Updated")],
    });
    setIsEditTaskOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canDeleteTask) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to delete customers",
        variant: "destructive",
      });
      return;
    }
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteTaskMutation.mutate(task.id);
    }
  };

  const handleViewHistory = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistoryTask(task);
    setIsHistoryOpen(true);
  };

  const handleCloneTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canCreateTask) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to create customers",
        variant: "destructive",
      });
      return;
    }

    const bucketTasks = tasks.filter((t) => t.bucketId === task.bucketId);
    const maxPosition = Math.max(...bucketTasks.map((t) => t.position), -1);

    try {
      const newTask = await createTaskMutation.mutateAsync({
        title: `${task.title} (Copy)`,
        description: task.description,
        priority: task.priority,
        projectId: task.projectId,
        bucketId: task.bucketId,
        assigneeId: task.assigneeId,
        assignedUsers: task.assignedUsers || [],
        position: maxPosition + 1,
        status: "todo",
        startDate: task.startDate,
        dueDate: task.dueDate,
        estimateHours: task.estimateHours || 0,
        estimateMinutes: task.estimateMinutes || 0,
        history: [createHistoryEntry(`Cloned from "${task.title}"`)],
        checklist: task.checklist?.map((item) => ({
          ...item,
          id: crypto.randomUUID(),
          completed: false,
        })) || [],
        attachments: [],
      });

      toast({
        title: "Customer cloned",
        description: `"${task.title}" has been duplicated - edit panel opened`,
      });

      handleOpenEditTask(newTask);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clone customer",
        variant: "destructive",
      });
    }
  };

  const handleToggleChecklistItemOnCard = (task: Task, itemId: string) => {
    if (!canUpdateTask && !canCompleteTask) {
      return;
    }

    const updatedChecklist = task.checklist?.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ) || [];

    updateTaskMutation.mutate({
      id: task.id,
      checklist: updatedChecklist,
    });
  };

  const isAssignedToTask = (task: Task): boolean => {
    if (!currentUserId) return false;
    return (
      task.assigneeId === currentUserId ||
      Boolean(task.assignedUsers && task.assignedUsers.includes(currentUserId))
    );
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    const isCompletion = newStatus === "completed";
    const canComplete = canCompleteTask || isAssignedToTask(task);

    if (isCompletion && !canComplete) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to mark customers as complete",
        variant: "destructive",
      });
      return;
    }

    if (!canUpdateTask && !canComplete) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to update customer status",
        variant: "destructive",
      });
      return;
    }

    const statusLabel =
      newStatus === "todo"
        ? "Not Started"
        : newStatus === "in_progress"
          ? "In Progress"
          : "Completed";

    updateTaskMutation.mutate({
      id: task.id,
      status: newStatus,
      history: [
        ...(task.history || []),
        createHistoryEntry(`Status changed to ${statusLabel}`),
      ],
    });

  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "todo":
        return "Not Started";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Not Started";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
      case "in_progress":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
    }
  };

  const handleToggleTaskComplete = async (
    task: Task,
    completed: boolean,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    const canComplete = canCompleteTask || isAssignedToTask(task);
    if (!canComplete) {
      toast({
        title: "Permission denied",
        description:
          "You do not have permission to mark customers as complete/incomplete",
        variant: "destructive",
      });
      return;
    }

    updateTaskMutation.mutate({
      id: task.id,
      status: completed ? "completed" : "todo",
      history: [
        ...(task.history || []),
        createHistoryEntry(
          completed ? "Marked as completed" : "Marked as incomplete",
        ),
      ],
    });

  };

  const handleAddNewChecklistItem = () => {
    if (!newTaskChecklistItem.trim()) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      title: newTaskChecklistItem,
      completed: false,
    };
    setNewTaskChecklist((prev) => [...prev, item]);
    setNewTaskChecklistItem("");
  };

  const handleToggleNewChecklistItem = (itemId: string) => {
    setNewTaskChecklist(
      newTaskChecklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleRemoveNewChecklistItem = (itemId: string) => {
    setNewTaskChecklist(
      newTaskChecklist.filter((item) => item.id !== itemId),
    );
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
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    setEditTaskChecklist(
      editTaskChecklist.filter((item) => item.id !== itemId),
    );
  };

  const handleRemoveNewAttachment = (attachmentId: string) => {
    setNewTaskAttachments(
      newTaskAttachments.filter((att) => att.id !== attachmentId),
    );
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setEditTaskAttachments(
      editTaskAttachments.filter((att) => att.id !== attachmentId),
    );
  };

  const handleNewFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }

    await uploadNewFile(file);
    e.target.value = "";
  };

  const handleEditFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit");
      return;
    }

    await uploadEditFile(file);
    e.target.value = "";
  };

  const toggleAssignee = (
    userId: number,
    assignees: number[],
    setAssignees: (a: number[]) => void,
  ) => {
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

  const getAssigneeIds = (task: Task) => {
    if (task.assignedUsers && task.assignedUsers.length > 0) {
      return task.assignedUsers;
    }
    if (task.assigneeId) {
      return [task.assigneeId];
    }
    return [];
  };

  const getAssignees = (task: Task) => {
    const assigneeIds = getAssigneeIds(task);
    return users.filter((u) => assigneeIds.includes(u.id));
  };

  const getChecklistProgress = (checklist: ChecklistItem[] | null) => {
    if (!checklist || checklist.length === 0) return null;
    const completed = checklist.filter((item) => item.completed).length;
    return {
      completed,
      total: checklist.length,
      percentage: Math.round((completed / checklist.length) * 100),
    };
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const viewLabels: Record<BoardView, string> = {
    stage: "Stage",
    assignee: "Assignee",
    due_date: "Due Date",
    title: "Customers",
  };

  const getDueDateBucket = (dueDate: Task["dueDate"]) => {
    if (!dueDate) return "next";
    const parsed = new Date(dueDate);
    if (Number.isNaN(parsed.getTime())) return "next";

    const today = new Date();
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
    const startOfDayAfterTomorrow = new Date(startOfToday);
    startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 2);

    const dueStart = new Date(
      parsed.getFullYear(),
      parsed.getMonth(),
      parsed.getDate(),
    );

    if (dueStart < startOfToday) return "overdue";
    if (dueStart.getTime() === startOfToday.getTime()) return "today";
    if (dueStart.getTime() === startOfTomorrow.getTime()) return "tomorrow";
    if (dueStart >= startOfDayAfterTomorrow) return "next";
    return "next";
  };

  const boardColumns: BoardColumn[] = (() => {
    if (viewMode === "stage") {
      return bucketsWithTasks.map((bucket) => ({
        id: `stage-${bucket.id}`,
        title: bucket.title,
        tasks: bucket.tasks,
        bucket,
      }));
    }

    if (viewMode === "assignee") {
      const sortedUsers = [...users].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
      const unassignedTasks = tasks.filter(
        (task) => getAssigneeIds(task).length === 0,
      );

      return [
        {
          id: "assignee-unassigned",
          title: "Unassigned",
          tasks: unassignedTasks,
        },
        ...sortedUsers.map((user) => ({
          id: `assignee-${user.id}`,
          title: user.name,
          tasks: tasks.filter((task) =>
            getAssigneeIds(task).includes(user.id),
          ),
        })),
      ];
    }

    if (viewMode === "due_date") {
      const groups: Record<"overdue" | "today" | "tomorrow" | "next", Task[]> =
      {
        overdue: [],
        today: [],
        tomorrow: [],
        next: [],
      };

      tasks.forEach((task) => {
        const key = getDueDateBucket(task.dueDate);
        if (key === "overdue" || key === "today" || key === "tomorrow") {
          groups[key].push(task);
          return;
        }
        groups.next.push(task);
      });

      return [
        { id: "due-overdue", title: "Overdue", tasks: groups.overdue },
        { id: "due-today", title: "Today", tasks: groups.today },
        { id: "due-tomorrow", title: "Tomorrow", tasks: groups.tomorrow },
        { id: "due-next", title: "Next Dates", tasks: groups.next },
      ];
    }

    const titleGroups = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const title = task.title?.trim() || "Untitled";
      const existing = titleGroups.get(title);
      if (existing) {
        existing.push(task);
      } else {
        titleGroups.set(title, [task]);
      }
    });

    return Array.from(titleGroups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([title, groupedTasks]) => ({
        id: `title-${title}`,
        title,
        tasks: groupedTasks,
      }));
  })();

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
      {/*Header*/}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 border-b bg-white dark:bg-slate-900">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
            data-testid="button-back-to-projects"
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1
              className="text-lg md:text-xl font-semibold truncate"
              data-testid="text-project-name"
            >
              {project.name}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground truncate">
              {project.description || "No description"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-between"
                data-testid="button-view-mode"
              >
                <span className="truncate">View: {viewLabels[viewMode]}</span>
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className={viewMode === "stage" ? "bg-accent" : ""}
                onClick={() => setViewMode("stage")}
              >
                Stage
              </DropdownMenuItem>
              <DropdownMenuItem
                className={viewMode === "assignee" ? "bg-accent" : ""}
                onClick={() => setViewMode("assignee")}
              >
                Assignee
              </DropdownMenuItem>
              <DropdownMenuItem
                className={viewMode === "due_date" ? "bg-accent" : ""}
                onClick={() => setViewMode("due_date")}
              >
                Due Date
              </DropdownMenuItem>
              <DropdownMenuItem
                className={viewMode === "title" ? "bg-accent" : ""}
                onClick={() => setViewMode("title")}
              >
                Customers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {viewMode === "stage" && (
            <Dialog open={isNewBucketOpen} onOpenChange={setIsNewBucketOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-add-bucket"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stage
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Stage</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="Stage title..."
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
                    Add Stage
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      {/*Body*/}
      <div
        ref={boardScrollRef}
        className="flex-1 overflow-x-auto p-2 md:p-4 h-full"
        onDragOver={handleBoardDragOver}
        onDragLeave={stopAutoScroll}
        onDrop={stopAutoScroll}
      >
        <div
          className="flex gap-3 md:gap-4 h-full  pb-4 "
          style={{ minWidth: "max-content" }}
        >
          {/*bucket componenet */}
          {boardColumns.map((column) => {
            const isStageView = viewMode === "stage";
            const bucket = column.bucket;
            return (

              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col w-72 md:w-80 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex-shrink-0"
                data-testid={
                  isStageView && bucket
                    ? `bucket-column-${bucket.id}`
                    : `bucket-column-${column.id}`
                }
              >
                {/*bucket component header*/}
                <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-200 dark:border-slate-700">
                  {isStageView && bucket ? (
                    <>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            if (!canCreateTask) {
                              toast({
                                title: "Permission denied",
                                description:
                                  "You do not have permission to create customers",
                                variant: "destructive",
                              });
                              return;
                            }
                            setSelectedBucketId(bucket.id);
                            setIsNewTaskOpen(true);
                          }}
                          disabled={!canCreateTask}
                          data-testid={`button-add-task-${bucket.id}`}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              data-testid={`button-bucket-menu-${bucket.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingBucketId(bucket.id);
                                setEditingBucketTitle(bucket.title);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Rename Stage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* ADD THIS - Custom Fields Settings */}
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="p-0"
                            >
                              <BucketSettingsDialog
                                bucketId={bucket.id}
                                currentConfig={bucket.customFieldsConfig || []}
                              />
                            </DropdownMenuItem>

                            {/* END ADD */}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteBucket(bucket)}
                              data-testid={`button-delete-bucket-${bucket.id}`}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Stage
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-medium truncate" title={column.title}>
                        {column.title}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {column.tasks.length}
                      </Badge>
                    </div>
                  )}
                </div>
                {/*bucket component body*/}
                <div
                  className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]"
                  onDragOver={(e) => {
                    if (!isStageView) return;
                    e.preventDefault();
                    e.currentTarget.classList.add(
                      "bg-slate-100",
                      "dark:bg-slate-700/50",
                    );
                  }}
                  onDragLeave={(e) => {
                    if (!isStageView) return;
                    e.currentTarget.classList.remove(
                      "bg-slate-100",
                      "dark:bg-slate-700/50",
                    );
                  }}
                  onDrop={(e) => {
                    if (!isStageView || !bucket) return;
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "bg-slate-100",
                      "dark:bg-slate-700/50",
                    );
                    handleDrop(bucket.id, column.tasks.length);
                  }}
                >

                  {/* Task List Area */}
                  <div
                    className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]"
                    onDragOver={(e) => {
                      if (!isStageView) return;
                      e.preventDefault();
                      e.currentTarget.classList.add("bg-slate-100", "dark:bg-slate-700/50");
                    }}
                    onDragLeave={(e) => {
                      if (!isStageView) return;
                      e.currentTarget.classList.remove("bg-slate-100", "dark:bg-slate-700/50");
                    }}
                    onDrop={(e) => {
                      if (!isStageView || !bucket) return;
                      e.preventDefault();
                      e.currentTarget.classList.remove("bg-slate-100", "dark:bg-slate-700/50");
                      handleDrop(bucket.id, column.tasks.length);
                    }}
                  >
                    {(() => {
                      // 1. Logic to Sort and Split Tasks
                      const activeTasks = column.tasks
                        .filter((t) => t.status !== "completed")
                        .sort((a, b) => b.id - a.id); // Sorted by creation (ID proxy)

                      const completedTasks = column.tasks
                        .filter((t) => t.status === "completed")
                        .sort((a, b) => b.id - a.id);

                      const isExpanded = expandedColumns[column.id] ?? false;

                      // Helper to render the actual Card UI to avoid duplication
                      const renderTaskCard = (task: Task) => {
                        const assignees = getAssignees(task);
                        const checklistProgress = getChecklistProgress(task.checklist);
                        const attachmentCount = task.attachments?.length || 0;

                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            draggable={isStageView}
                            onDragStart={
                              isStageView ? () => handleDragStart(task) : undefined
                            }
                            onDragEnd={isStageView ? handleDragEnd : undefined}
                            className={`  active:cursor-grabbing ${draggedTask?.id === task.id ? "opacity-50" : ""}`}
                            data-testid={`task-card-${task.id}`}
                          >
                            <Card
                              className={`p-3 bg-white dark:bg-slate-800 shadow-sm hover-elevate ${task.status === "completed" ? "opacity-60" : ""
                                }`}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={task.status === "completed"}
                                  onCheckedChange={(checked) => {
                                    handleStatusChange(
                                      task,
                                      checked ? "completed" : "todo",
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-1 flex-shrink-0"
                                  data-testid={`checkbox-task-${task.id}`}
                                />
                                <div
                                  className="flex-1 min-w-0"
                                  onClick={() => handleOpenEditTask(task)}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={`font-medium text-sm truncate ${task.status === "completed"
                                        ? "line-through text-muted-foreground"
                                        : ""
                                        }`}
                                      data-testid={`text-task-title-${task.id}`}
                                    >
                                      {task.title}
                                    </p>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger
                                        asChild
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 flex-shrink-0"
                                        >
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditTask(task);
                                          }}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Edit Customer
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => handleViewHistory(task, e)}
                                        >
                                          <History className="h-4 w-4 mr-2" />
                                          View History
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => handleCloneTask(task, e)}
                                          data-testid={`button-clone-task-${task.id}`}
                                        >
                                          <Copy className="h-4 w-4 mr-2" />
                                          Clone Customer
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={(e) => handleDeleteTask(task, e)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Customer
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
                                    <DropdownMenu>
                                      <DropdownMenuTrigger
                                        asChild
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Button
                                          variant="secondary"
                                          className={`text-xs h-6 px-2 rounded-md border-0 ${getStatusColor(task.status)} no-default-hover-elevate no-default-active-elevate hover:brightness-95 transition-all`}
                                          data-testid={`badge-status-${task.id}`}
                                        >
                                          {task.status === "completed" && (
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                          )}
                                          {task.status === "in_progress" && (
                                            <Clock className="h-3 w-3 mr-1" />
                                          )}
                                          {getStatusLabel(task.status)}
                                          <ChevronDown className="h-3 w-3 ml-1" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start">
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(task, "todo");
                                          }}
                                          className={
                                            task.status === "todo" ? "bg-accent" : ""
                                          }
                                        >
                                          Not Started
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(task, "in_progress");
                                          }}
                                          className={
                                            task.status === "in_progress"
                                              ? "bg-accent"
                                              : ""
                                          }
                                        >
                                          In Progress
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleStatusChange(task, "completed");
                                          }}
                                          className={
                                            task.status === "completed"
                                              ? "bg-accent"
                                              : ""
                                          }
                                        >
                                          Completed
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${getPriorityColor(task.priority)}`}
                                    >
                                      {task.priority}
                                    </Badge>
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
                                        {checklistProgress.completed}/
                                        {checklistProgress.total}
                                      </span>
                                    )}
                                  </div>

                                  {checklistProgress && (
                                    <Progress
                                      value={checklistProgress.percentage}
                                      className="h-1 mt-2"
                                    />
                                  )}

                                  {task.checklist && task.checklist.length > 0 && (
                                    <div
                                      className="mt-2 space-y-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {task.checklist.slice(0, 3).map((item) => (
                                        <div
                                          key={item.id}
                                          className="flex items-center gap-2"
                                          data-testid={`checklist-item-card-${item.id}`}
                                        >
                                          <Checkbox
                                            checked={item.completed}
                                            onCheckedChange={() =>
                                              handleToggleChecklistItemOnCard(task, item.id)
                                            }
                                            className="h-3.5 w-3.5"
                                            data-testid={`checkbox-checklist-${item.id}`}
                                          />
                                          <span
                                            className={`text-xs truncate ${item.completed
                                              ? "line-through text-muted-foreground"
                                              : ""
                                              }`}
                                          >
                                            {item.title}
                                          </span>
                                        </div>
                                      ))}
                                      {task.checklist.length > 3 && (
                                        <span className="text-xs text-muted-foreground">
                                          +{task.checklist.length - 3} more items
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {(task.startDate || task.dueDate) && (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                                      <Calendar className="h-3 w-3" />
                                      {task.startDate &&
                                        new Date(task.startDate).toLocaleDateString()}
                                      {task.startDate && task.dueDate && " - "}
                                      {task.dueDate &&
                                        new Date(task.dueDate).toLocaleDateString()}
                                    </div>
                                  )}

                                  {assignees.length > 0 && (
                                    <div className="flex items-center gap-1 mt-2">
                                      <div className="flex -space-x-2">
                                        {assignees.slice(0, 3).map((assignee) => (
                                          <Avatar
                                            key={assignee.id}
                                            className="h-5 w-5 border-2 border-white dark:border-slate-800"
                                          >
                                            <AvatarImage
                                              src={assignee.avatar || undefined}
                                            />
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
                                        {assignees.length === 1
                                          ? assignees[0].name
                                          : `${assignees.length} assignees`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        );
                      };

                      return (
                        <>
                          {/* Render Active Tasks */}
                          {activeTasks.map(renderTaskCard)}

                          {/* Divider for Completed Tasks */}
                          {completedTasks.length > 0 && (
                            <div className="pt-4 pb-2">
                              <div
                                className="flex items-center gap-2 cursor-pointer group"
                                onClick={() => toggleColumnCompleted(column.id)}
                              >
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700 group-hover:bg-primary/40 transition-colors" />
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                  Completed ({completedTasks.length})
                                </div>
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700 group-hover:bg-primary/40 transition-colors" />
                              </div>
                            </div>
                          )}

                          {/* Render Completed Tasks (Foldable) */}
                          {isExpanded && completedTasks.map(renderTaskCard)}
                        </>
                      );
                    })()}
                  </div>

                </div>
              </motion.div>
            )
          })}

          {viewMode === "stage" && (
            <div
              className="flex items-center justify-center w-80 min-h-[200px] border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover-elevate cursor-pointer"
              onClick={() => setIsNewBucketOpen(true)}
              data-testid="button-add-new-bucket"
            >
              <div className="text-center text-muted-foreground">
                <Plus className="h-8 w-8 mx-auto mb-2" />
                <p>Add Stage</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Task Dialog */}
      <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 flex flex-col h-[90vh] md:h-[85vh] overflow-hidden rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950">

          {/* 1. FIXED HEADER */}
          <DialogHeader className="p-4 md:p-6 border-b shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Create New Customer</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setIsNewTaskOpen(false)}
              >

              </Button>
            </div>
            <Input
              className="text-xl md:text-2xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none h-auto placeholder:opacity-20"
              placeholder="Customer title..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
            />
          </DialogHeader>

          {/* 2. SCROLLABLE BODY */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6 md:space-y-8">

              {/* ROW 1: STATUS, ASSIGNEES, & PRIORITY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                  <Select value={newTaskStatus} onValueChange={setNewTaskStatus}>
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-none h-10 rounded-lg">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assign Members</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg font-normal">
                        <span className="truncate">{newTaskAssignees.length === 0 ? "Search members..." : `${newTaskAssignees.length} Selected`}</span>
                        <Users className="h-4 w-4 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 shadow-xl border-slate-200 dark:border-slate-800" align="start">
                      <div className="p-2 border-b bg-slate-50 dark:bg-slate-900">
                        <Input
                          placeholder="Search by name..."
                          className="h-8 text-xs border-none bg-white dark:bg-slate-800"
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase();
                            document.querySelectorAll('.user-search-item-new').forEach((item: any) => {
                              item.style.display = item.innerText.toLowerCase().includes(val) ? 'flex' : 'none';
                            });
                          }}
                        />
                      </div>
                      <ScrollArea className="h-48 p-2 bg-white dark:bg-slate-950">
                        {users.map((user) => (
                          <div key={user.id} className="user-search-item-new flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-pointer transition-colors"
                            onClick={() => toggleAssignee(user.id, newTaskAssignees, setNewTaskAssignees)}>
                            <Checkbox checked={newTaskAssignees.includes(user.id)} />
                            <span className="text-sm">{user.name}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                  <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
                    <SelectTrigger className={`w-full border-none h-10 rounded-lg text-white font-medium ${getPriorityColor(newTaskPriority)}`}>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ROW 2: DATES & ESTIMATES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Start Date
                    </label>
                    <Input type="date" value={newTaskStartDate} onChange={(e) => setNewTaskStartDate(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" /> End Date
                    </label>
                    <Input type="date" value={newTaskEndDate} onChange={(e) => setNewTaskEndDate(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Allocation (Hrs/Min)</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Hr" value={newTaskEstimateHours || ""} onChange={(e) => setNewTaskEstimateHours(Number(e.target.value) || 0)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-center" />
                    <span className="text-xs font-bold opacity-30">H</span>
                    <Input type="number" placeholder="Min" value={newTaskEstimateMinutes || ""} onChange={(e) => setNewTaskEstimateMinutes(Number(e.target.value) || 0)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-center" />
                    <span className="text-xs font-bold opacity-30">M</span>
                  </div>
                </div>
              </div>

              {/* OPERATIONAL DATA SECTION */}
              <div className="relative p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-r-full" />
                <div className="mb-4">
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Operational Data</h4>
                  <p className="text-[10px] text-muted-foreground">Technical parameters and specific Stage fields.</p>
                </div>
                <div className="grid grid-cols-1 gap-y-4">
                  {selectedBucketId && (
                    <DynamicCustomFields
                      bucketId={selectedBucketId}
                      existingValues={newTaskCustomFields}
                      onChange={setNewTaskCustomFields}
                    />
                  )}
                </div>
              </div>

              {/* DESCRIPTION & CHECKLIST */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 opacity-50" /> Customer Description
                  </label>
                  <Textarea
                    placeholder="Enter detailed notes..."
                    className="min-h-[120px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 resize-none rounded-xl text-sm focus-visible:ring-primary"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ListChecks className="h-4 w-4 opacity-50" /> Checklist
                  </label>
                  <div className="space-y-2">
                    {newTaskChecklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group transition-all hover:bg-slate-100">
                        <Checkbox checked={item.completed} onCheckedChange={() => handleToggleNewChecklistItem(item.id)} />
                        <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : "text-slate-700 dark:text-slate-200"}`}>{item.title}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveNewChecklistItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2 bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 focus-within:ring-1 focus-within:ring-primary">
                      <Plus className="h-4 w-4 text-primary" />
                      <Input
                        placeholder="Add item to checklist..."
                        className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm p-0 w-full"
                        value={newTaskChecklistItem}
                        onChange={(e) => setNewTaskChecklistItem(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddNewChecklistItem()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ATTACHMENTS */}
              <div className="space-y-4 pb-6">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4 opacity-50" /> Resources & Files
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {newTaskAttachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm group">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                        {getFileIcon(att.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-bold truncate block w-full text-slate-700 dark:text-slate-200">
                          {att.name}
                        </span>
                        <p className="text-[9px] text-muted-foreground uppercase">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleRemoveNewAttachment(att.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/50 cursor-pointer transition-all group min-h-[80px]">
                    <input type="file" className="hidden" onChange={handleNewFileUpload} disabled={isUploadingNew} />
                    <div className="flex items-center gap-2">
                      <Upload className={`h-4 w-4 ${isUploadingNew ? "animate-bounce" : "text-slate-400 group-hover:text-primary"}`} />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">
                        {isUploadingNew ? "Uploading..." : "Add File"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* 3. FIXED FOOTER */}
          <DialogFooter className="p-4 md:p-6 border-t bg-white dark:bg-slate-900 shrink-0">
            <div className="flex w-full gap-3">
              <DialogClose asChild>
                <Button variant="ghost" className="flex-1 rounded-xl">Cancel</Button>
              </DialogClose>
              <Button
                className="flex-[2] rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:brightness-110 transition-all"
                onClick={handleAddTask}
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? "Creating..." : "Add Customer"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
        <DialogContent className="max-w-3xl w-[95vw] p-0 flex flex-col h-[90vh] md:h-[85vh] overflow-hidden rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950">

          {/* 1. FIXED HEADER */}
          <DialogHeader className="p-4 md:p-6 border-b shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Customer Details</span>
              </div>
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setIsEditTaskOpen(false)}
              >

              </Button>
            </div>
            <Input
              className="text-xl md:text-2xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none h-auto placeholder:opacity-20"
              placeholder="Customer title..."
              value={editTaskTitle}
              onChange={(e) => setEditTaskTitle(e.target.value)}
            />
          </DialogHeader>

          {/* 2. SCROLLABLE BODY */}
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 space-y-6 md:space-y-8">

              {/* ROW 1: STATUS, ASSIGNEES, & PRIORITY (Responsive Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                  <Select value={editTaskStatus} onValueChange={setEditTaskStatus}>
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 border-none h-10 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">Not Started</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assign Members</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-between h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg font-normal">
                        <span className="truncate">{editTaskAssignees.length === 0 ? "Search members..." : `${editTaskAssignees.length} Assigned`}</span>
                        <Users className="h-4 w-4 opacity-40" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 shadow-xl border-slate-200 dark:border-slate-800" align="start">
                      <div className="p-2 border-b bg-slate-50 dark:bg-slate-900">
                        <Input
                          placeholder="Search by name..."
                          className="h-8 text-xs border-none bg-white dark:bg-slate-800"
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase();
                            document.querySelectorAll('.user-search-item').forEach((item: any) => {
                              item.style.display = item.innerText.toLowerCase().includes(val) ? 'flex' : 'none';
                            });
                          }}
                        />
                      </div>
                      <ScrollArea className="h-48 p-2 bg-white dark:bg-slate-950">
                        {users.map((user) => (
                          <div key={user.id} className="user-search-item flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-pointer transition-colors"
                            onClick={() => toggleAssignee(user.id, editTaskAssignees, setEditTaskAssignees)}>
                            <Checkbox checked={editTaskAssignees.includes(user.id)} />
                            <span className="text-sm">{user.name}</span>
                          </div>
                        ))}
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                  <Select value={editTaskPriority} onValueChange={setEditTaskPriority}>
                    <SelectTrigger className={`w-full border-none h-10 rounded-lg text-white font-medium ${getPriorityColor(editTaskPriority)}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ROW 2: DATES & ESTIMATES (Responsive Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> Start Date
                    </label>
                    <Input type="date" value={editTaskStartDate} onChange={(e) => setEditTaskStartDate(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3 w-3" /> End Date
                    </label>
                    <Input type="date" value={editTaskEndDate} onChange={(e) => setEditTaskEndDate(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Allocation (Hrs/Min)</label>
                  <div className="flex items-center gap-2">
                    <Input type="number" placeholder="Hr" value={editTaskEstimateHours || ""} onChange={(e) => setEditTaskEstimateHours(Number(e.target.value) || 0)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-center" />
                    <span className="text-xs font-bold opacity-30">H</span>
                    <Input type="number" placeholder="Min" value={editTaskEstimateMinutes || ""} onChange={(e) => setEditTaskEstimateMinutes(Number(e.target.value) || 0)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-center" />
                    <span className="text-xs font-bold opacity-30">M</span>
                  </div>
                </div>
              </div>

              {/* OPERATIONAL DATA */}
              <div className="relative p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-r-full" />
                <div className="mb-4">
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Operational Data</h4>
                  <p className="text-[10px] text-muted-foreground">Technical parameters and specific Stage fields.</p>
                </div>
                <div className="grid grid-cols-1 gap-y-4">
                  {editingTask?.bucketId && (
                    <DynamicCustomFields
                      bucketId={editingTask.bucketId}
                      existingValues={editTaskCustomFields}
                      onChange={setEditTaskCustomFields}
                    />
                  )}
                </div>
              </div>

              {/* DESCRIPTION & CHECKLIST */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4 opacity-50" /> Customer Description
                  </label>
                  <Textarea
                    placeholder="Enter detailed notes..."
                    className="min-h-[120px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 resize-none rounded-xl text-sm focus-visible:ring-primary"
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <ListChecks className="h-4 w-4 opacity-50" /> Checklist
                  </label>
                  <div className="space-y-2">
                    {editTaskChecklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl group transition-all hover:bg-slate-100">
                        <Checkbox checked={item.completed} onCheckedChange={() => handleToggleChecklistItem(item.id)} />
                        <span className={`text-sm flex-1 ${item.completed ? "line-through text-muted-foreground" : "text-slate-700 dark:text-slate-200"}`}>{item.title}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveChecklistItem(item.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2 bg-white dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 focus-within:ring-1 focus-within:ring-primary">
                      <Plus className="h-4 w-4 text-primary" />
                      <Input
                        placeholder="Add item to checklist..."
                        className="h-8 border-none bg-transparent shadow-none focus-visible:ring-0 text-sm p-0 w-full"
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ATTACHMENTS */}
              <div className="space-y-4 pb-6">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Paperclip className="h-4 w-4 opacity-50" /> Resources & Files
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {editTaskAttachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm group">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                        {getFileIcon(att.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button className="text-[11px] font-bold truncate text-left w-full hover:text-primary hover:underline" onClick={() => downloadAttachment(att.url, att.name)}>
                          {att.name}
                        </button>
                        <p className="text-[9px] text-muted-foreground uppercase">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleRemoveAttachment(att.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-primary/50 cursor-pointer transition-all group min-h-[80px]">
                    <input type="file" className="hidden" onChange={handleEditFileUpload} disabled={isUploadingEdit} />
                    <div className="flex items-center gap-2">
                      <Upload className={`h-4 w-4 ${isUploadingEdit ? "animate-bounce" : "text-slate-400 group-hover:text-primary"}`} />
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">
                        {isUploadingEdit ? "Uploading..." : "Add File"}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* 3. FIXED FOOTER */}
          <DialogFooter className="p-4 md:p-6 border-t bg-white dark:bg-slate-900 shrink-0">
            <div className="flex w-full gap-3">
              <DialogClose asChild>
                <Button variant="ghost" className="flex-1 rounded-xl">Cancel</Button>
              </DialogClose>
              <Button
                className="flex-[2] rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:brightness-110 transition-all"
                onClick={handleSaveEditTask}
                disabled={updateTaskMutation.isPending}
              >
                {updateTaskMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Customer History
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 py-4">
              {historyTask?.history && historyTask.history.length > 0 ? (
                [...historyTask.history].reverse().map((entry, index) => {
                  const isStructured =
                    typeof entry === "object" &&
                    entry !== null &&
                    "action" in entry;
                  const historyEntry = isStructured
                    ? (entry as HistoryEntry)
                    : null;
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
                            <p className="text-sm font-medium">
                              {historyEntry.action}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <UserIcon className="h-3 w-3" />
                                {historyEntry.userName || "Unknown"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  historyEntry.timestamp,
                                ).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(
                                  historyEntry.timestamp,
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
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
                <p className="text-sm text-muted-foreground text-center">
                  No history available
                </p>
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


