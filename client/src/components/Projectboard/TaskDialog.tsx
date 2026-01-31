import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import DynamicCustomFields from "@/components/DynamicCustomFields";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  File,
  FileText,
  Image,
  ListChecks,
  Paperclip,
  Plus,
  Upload,
  Users,
  X,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { downloadAttachment } from "@/hooks/use-download";
import { parseCustomFields, serializeCustomFields } from "@shared/customFieldsUtils";
import type {
  Attachment,
  Bucket,
  ChecklistItem,
  HistoryEntry,
  Task,
  User,
} from "@shared/schema";

export type TaskDialogMode = "create" | "edit";

interface TaskDialogProps {
  mode: TaskDialogMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  selectedBucketId?: number | null;
  task?: Task | null;
  buckets: Bucket[];
  users: User[];
  tasks: Task[];
  canCreateTask: boolean;
  canUpdateTask: boolean;
  canCompleteTask: boolean;
  onAfterClose?: () => void;
}

const buildHistoryEntry = (action: string): HistoryEntry => {
  const userId = Number(localStorage.getItem("userId")) || null;
  const userName = localStorage.getItem("userName") || "Unknown";
  return {
    action,
    userId,
    userName,
    timestamp: new Date().toISOString(),
  };
};

const getCustomFieldValuesForBucket = (
  customFieldsString: string | null,
  bucketId: number | null | undefined,
  buckets: Bucket[],
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

const getFileIcon = (type: string) => {
  if (type.includes("image")) return <Image className="h-4 w-4" />;
  if (type.includes("pdf")) return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
};

export default function TaskDialog({
  mode,
  open,
  onOpenChange,
  projectId,
  selectedBucketId,
  task,
  buckets,
  users,
  tasks,
  canCreateTask,
  canUpdateTask,
  canCompleteTask,
  onAfterClose,
}: TaskDialogProps) {
  const { toast } = useToast();
  const isEdit = mode === "edit";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [assignees, setAssignees] = useState<number[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [estimateHours, setEstimateHours] = useState(0);
  const [estimateMinutes, setEstimateMinutes] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [checklistItemInput, setChecklistItemInput] = useState("");

  const bucketIdForFields = isEdit ? task?.bucketId ?? null : selectedBucketId ?? null;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    setAssignees([]);
    setStartDate("");
    setEndDate("");
    setEstimateHours(0);
    setEstimateMinutes(0);
    setChecklist([]);
    setAttachments([]);
    setCustomFields({});
    setChecklistItemInput("");
  };

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      if (!task) return;
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority || "medium");
      setStatus(task.status || "todo");
      setAssignees(task.assignedUsers || (task.assigneeId ? [task.assigneeId] : []));
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : "");
      setEndDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
      setEstimateHours(task.estimateHours || 0);
      setEstimateMinutes(task.estimateMinutes || 0);
      setChecklist(task.checklist || []);
      setAttachments(task.attachments || []);
      setCustomFields(getCustomFieldValuesForBucket(task.customFields ?? null, task.bucketId, buckets));
      setChecklistItemInput("");
    } else {
      resetForm();
    }
  }, [open, isEdit, task, buckets]);

  const createTaskMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-todo"] });
      handleOpenChange(false);
      resetForm();
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: number }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my-todo"] });
      handleOpenChange(false);
    },
  });

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      const newAttachment: Attachment = {
        id: crypto.randomUUID(),
        name: response.metadata.name,
        url: response.objectPath,
        type: response.metadata.contentType,
        size: response.metadata.size,
        uploadedAt: new Date().toISOString(),
      };
      setAttachments((prev) => [...prev, newAttachment]);
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      onAfterClose?.();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const handleAddChecklistItem = () => {
    if (!checklistItemInput.trim()) return;
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      title: checklistItemInput,
      completed: false,
    };
    setChecklist((prev) => [...prev, item]);
    setChecklistItemInput("");
  };

  const handleToggleChecklistItem = (itemId: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const handleRemoveChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter((item) => item.id !== itemId));
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter((att) => att.id !== attachmentId));
  };

  const toggleAssignee = (
    userId: number,
    selectedAssignees: number[],
    setSelectedAssignees: (value: number[]) => void,
  ) => {
    if (selectedAssignees.includes(userId)) {
      setSelectedAssignees(selectedAssignees.filter((id) => id !== userId));
    } else {
      setSelectedAssignees([...selectedAssignees, userId]);
    }
  };

  const submitDisabled =
    !title.trim() ||
    (mode === "create" && (!selectedBucketId || selectedBucketId === null));

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (!isEdit && (!selectedBucketId || selectedBucketId === null)) {
      toast({
        title: "Select a stage",
        description: "Please choose a stage before creating a customer.",
        variant: "destructive",
      });
      return;
    }

    if (!isEdit && !canCreateTask) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to create customers",
        variant: "destructive",
      });
      return;
    }

    if (isEdit && !canUpdateTask && !canCompleteTask) {
      toast({
        title: "Permission denied",
        description: "You do not have permission to edit customers",
        variant: "destructive",
      });
      return;
    }

    if (isEdit) {
      if (!task) return;
      updateTaskMutation.mutate({
        id: task.id,
        title,
        description,
        priority,
        assigneeId: assignees[0] || null,
        assignedUsers: assignees,
        status,
        startDate: startDate ? new Date(startDate + "T12:00:00") : null,
        dueDate: endDate ? new Date(endDate + "T12:00:00") : null,
        estimateHours,
        estimateMinutes,
        checklist,
        attachments,
        customFields:
          Object.keys(customFields).length > 0
            ? serializeCustomFields(customFields)
            : undefined,
        history: [...(task.history || []), buildHistoryEntry("Updated")],
      });
      return;
    }

    const bucketTasks = tasks.filter((t) => t.bucketId === selectedBucketId);
    const maxPosition = Math.max(...bucketTasks.map((t) => t.position), -1);

    createTaskMutation.mutate({
      title,
      description,
      priority,
      projectId,
      bucketId: selectedBucketId ?? undefined,
      assigneeId: assignees[0] || undefined,
      assignedUsers: assignees,
      position: maxPosition + 1,
      status,
      startDate: startDate ? new Date(startDate + "T12:00:00") : null,
      dueDate: endDate ? new Date(endDate + "T12:00:00") : null,
      estimateHours,
      estimateMinutes,
      checklist,
      attachments,
      customFields:
        Object.keys(customFields).length > 0
          ? serializeCustomFields(customFields)
          : undefined,
      history: [buildHistoryEntry("Created")],
    });
  };

  const titleLabel = isEdit ? "Customer Details" : "Create New Customer";
  const submitLabel = isEdit
    ? updateTaskMutation.isPending
      ? "Saving..."
      : "Save Changes"
    : createTaskMutation.isPending
      ? "Creating..."
      : "Add Customer";

  const statusValue = status || "todo";
  const assigneeLabel =
    assignees.length === 0
      ? "Search members..."
      : `${assignees.length} ${isEdit ? "Assigned" : "Selected"}`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] p-0 flex flex-col h-[90vh] md:h-[85vh] overflow-hidden rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950">
        <DialogHeader className="p-4 md:p-6 border-b shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isEdit ? "bg-primary" : "bg-emerald-500"} animate-pulse`} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {titleLabel}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => handleOpenChange(false)}
            />
          </div>
          <Input
            className="text-xl md:text-2xl font-bold bg-transparent border-none p-0 focus-visible:ring-0 shadow-none h-auto placeholder:opacity-20"
            placeholder="Customer title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Status</label>
                <Select value={statusValue} onValueChange={setStatus}>
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
                      <span className="truncate">{assigneeLabel}</span>
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
                        <div
                          key={user.id}
                          className="user-search-item flex items-center gap-2 p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-md cursor-pointer transition-colors"
                          onClick={() => toggleAssignee(user.id, assignees, setAssignees)}
                        >
                          <Checkbox checked={assignees.includes(user.id)} />
                          <span className="text-sm">{user.name}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className={`w-full border-none h-10 rounded-lg text-white font-medium bg-slate-900`}> 
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> Start Date
                  </label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" /> End Date
                  </label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Allocation (Hrs/Min)</label>
                <div className="flex items-center gap-2">
                  <Input type="number" placeholder="Hr" value={estimateHours || ""} onChange={(e) => setEstimateHours(Number(e.target.value) || 0)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-center" />
                  <span className="text-xs font-bold opacity-30">H</span>
                  <Input type="number" placeholder="Min" value={estimateMinutes || ""} onChange={(e) => setEstimateMinutes(Number(e.target.value) || 0)} className="h-10 bg-slate-50 dark:bg-slate-900 border-none rounded-lg text-center" />
                  <span className="text-xs font-bold opacity-30">M</span>
                </div>
              </div>
            </div>

            <div className="relative p-4 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <div className="absolute left-0 top-6 bottom-6 w-1 bg-primary rounded-r-full" />
              <div className="mb-4">
                <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">Operational Data</h4>
                <p className="text-[10px] text-muted-foreground">Technical parameters and specific Stage fields.</p>
              </div>
              <div className="grid grid-cols-1 gap-y-4">
                {bucketIdForFields && (
                  <DynamicCustomFields
                    bucketId={bucketIdForFields}
                    existingValues={customFields}
                    onChange={setCustomFields}
                  />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4 opacity-50" /> Customer Description
                </label>
                <Textarea
                  placeholder="Enter detailed notes..."
                  className="min-h-[120px] bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 resize-none rounded-xl text-sm focus-visible:ring-primary"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ListChecks className="h-4 w-4 opacity-50" /> Checklist
                </label>
                <div className="space-y-2">
                  {checklist.map((item) => (
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
                      value={checklistItemInput}
                      onChange={(e) => setChecklistItemInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddChecklistItem()}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 pb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Paperclip className="h-4 w-4 opacity-50" /> Resources & Files
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm group">
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-500">
                      {getFileIcon(att.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <button
                        className="text-[11px] font-bold truncate text-left w-full hover:text-primary hover:underline"
                        onClick={() => downloadAttachment(att.url, att.name)}
                      >
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
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                  <div className="flex items-center gap-2">
                    <Upload className={`h-4 w-4 ${isUploading ? "animate-bounce" : "text-slate-400 group-hover:text-primary"}`} />
                    <span className="text-xs font-bold text-slate-500 group-hover:text-slate-700">
                      {isUploading ? "Uploading..." : "Add File"}
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 md:p-6 border-t bg-white dark:bg-slate-900 shrink-0">
          <div className="flex w-full gap-3">
            <DialogClose asChild>
              <Button variant="ghost" className="flex-1 rounded-xl">Cancel</Button>
            </DialogClose>
            <Button
              className="flex-[2] rounded-xl font-bold shadow-lg shadow-primary/20 bg-primary hover:brightness-110 transition-all"
              onClick={handleSubmit}
              disabled={submitDisabled || createTaskMutation.isPending || updateTaskMutation.isPending}
            >
              {submitLabel}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
