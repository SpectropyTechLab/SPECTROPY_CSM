import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  FolderKanban,
} from "lucide-react";
import type {
  Bucket,
  CustomFieldConfig,
  Project,
  Task,
  User,
} from "@shared/schema";
import { parseCustomFields } from "@shared/customFieldsUtils";

type TaskReportProps = {
  selectedProjectId: string;
  onProjectChange: (projectId: string) => void;
  projects: Project[];
  isAdmin: boolean;
  currentUserId: number;
};

type TaskWithParsedFields = Task & {
  parsedCustomFields: Record<string, string>;
};

function getUserIdHeader(): Record<string, string> {
  if (typeof localStorage === "undefined") {
    return {};
  }
  const userId = localStorage.getItem("userId");
  return userId ? { "x-user-id": userId } : {};
}

function escapeCsvValue(value: unknown): string {
  const stringValue = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Not Started";
  }
}

function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }
}

function formatCustomFieldValue(
  value: string | undefined,
  config: CustomFieldConfig,
): string {
  if (!value || value.trim() === "") {
    return "—";
  }

  if (config.type === "checkbox") {
    return value === "true" ? "Yes" : "No";
  }

  return value;
}

export default function TaskReport({
  selectedProjectId,
  onProjectChange,
  projects,
  isAdmin,
  currentUserId,
}: TaskReportProps) {
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", selectedProjectId],
    enabled: Boolean(selectedProjectId),
    queryFn: async () => {
      const url = selectedProjectId
        ? `/api/tasks?projectId=${selectedProjectId}`
        : "/api/tasks";
      const res = await fetch(url, {
        headers: getUserIdHeader(),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to load customers");
      }
      return res.json();
    },
  });

  const { data: buckets = [], isLoading: bucketsLoading } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const selectedProject = projects.find((p) => String(p.id) === selectedProjectId);

  const projectBuckets = useMemo(
    () => buckets.filter((bucket) => String(bucket.projectId) === selectedProjectId),
    [buckets, selectedProjectId],
  );

  const bucketById = useMemo(() => {
    const map = new Map<number, Bucket>();
    for (const bucket of projectBuckets) {
      map.set(bucket.id, bucket);
    }
    return map;
  }, [projectBuckets]);

  const userById = useMemo(() => {
    const map = new Map<number, User>();
    for (const user of users) {
      map.set(user.id, user);
    }
    return map;
  }, [users]);

  const customFieldConfigs = useMemo(() => {
    const configByKey = new Map<string, CustomFieldConfig>();

    for (const bucket of projectBuckets) {
      const configs = bucket.customFieldsConfig || [];
      for (const config of configs) {
        if (!configByKey.has(config.key)) {
          configByKey.set(config.key, config);
        }
      }
    }

    return Array.from(configByKey.values()).sort((a, b) =>
      a.label.localeCompare(b.label),
    );
  }, [projectBuckets]);

  const visibleTasks = useMemo(() => {
    if (isAdmin) return tasks;

    return tasks.filter((task) => {
      const assignedUsers = task.assignedUsers || [];
      return assignedUsers.includes(currentUserId) || task.assigneeId === currentUserId;
    });
  }, [tasks, isAdmin, currentUserId]);

  const tasksWithParsedFields: TaskWithParsedFields[] = useMemo(
    () =>
      visibleTasks.map((task) => ({
        ...task,
        parsedCustomFields: parseCustomFields(task.customFields ?? null),
      })),
    [visibleTasks],
  );

  const summary = useMemo(() => {
    const totalTasks = tasksWithParsedFields.length;
    const completedTasks = tasksWithParsedFields.filter(
      (task) => task.status === "completed",
    ).length;
    const inProgressTasks = tasksWithParsedFields.filter(
      (task) => task.status === "in_progress",
    ).length;
    const overdueTasks = tasksWithParsedFields.filter((task) => {
      if (!task.dueDate || task.status === "completed") return false;
      return new Date(task.dueDate) < new Date();
    }).length;
    const totalEstimatedMinutes = tasksWithParsedFields.reduce((sum, task) => {
      return sum + (task.estimateHours || 0) * 60 + (task.estimateMinutes || 0);
    }, 0);
    const totalEstimatedHours = Math.round(totalEstimatedMinutes / 60);

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks,
      totalEstimatedHours,
    };
  }, [tasksWithParsedFields]);

  const getAssigneeNames = (task: Task): string => {
    const ids = new Set<number>();
    if (task.assigneeId) {
      ids.add(task.assigneeId);
    }
    for (const id of task.assignedUsers || []) {
      ids.add(id);
    }

    if (ids.size === 0) return "—";

    return Array.from(ids)
      .map((id) => userById.get(id)?.name || `User ${id}`)
      .join(", ");
  };

  const getBucketTitle = (task: Task): string => {
    if (!task.bucketId) return "—";
    return bucketById.get(task.bucketId)?.title || "—";
  };

  const handleDownloadCsv = () => {
    if (!selectedProject) return;

    const baseHeaders = [
      "Customer",
      "Project",
      "Stage",
      "Assignees",
      "Status",
      "Priority",
      "Start Date",
      "Due Date",
      "Estimate (hours)",
    ];
    const customHeaders = customFieldConfigs.map((config) => config.label);
    const headers = [...baseHeaders, ...customHeaders];

    const rows = tasksWithParsedFields.map((task) => {
      const estimateHours = ((task.estimateHours || 0) + (task.estimateMinutes || 0) / 60).toFixed(1);
      const baseRow = [
        task.title,
        selectedProject.name,
        getBucketTitle(task),
        getAssigneeNames(task),
        getStatusLabel(task.status),
        getPriorityLabel(task.priority),
        formatDate(task.startDate),
        formatDate(task.dueDate),
        estimateHours,
      ];

      const customFieldRow = customFieldConfigs.map((config) => {
        const value = task.parsedCustomFields[config.key];
        return formatCustomFieldValue(value, config);
      });

      return [...baseRow, ...customFieldRow];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeProjectName = selectedProject.name.toLowerCase().replace(/\s+/g, "-");

    link.href = url;
    link.download = `customer-report-${safeProjectName}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const isLoading = tasksLoading || bucketsLoading || usersLoading;

  if (!selectedProjectId) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Select Project
              </label>
              <Select value={selectedProjectId} onValueChange={onProjectChange}>
                <SelectTrigger className="w-full max-w-xs" data-testid="select-task-project">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          Please select a project to view Customer reports
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Filter by Project
              </label>
              <Select value={selectedProjectId} onValueChange={onProjectChange}>
                <SelectTrigger className="w-full max-w-xs" data-testid="select-task-project">
                  <SelectValue placeholder="Choose a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={String(project.id)}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleDownloadCsv}
                disabled={isLoading || tasksWithParsedFields.length === 0}
                data-testid="button-download-task-report"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid gap-4 md:grid-cols-4"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </CardTitle>
                <ListTodo className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalTasks}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedProject?.name || "Selected project"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {summary.completedTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Finished Customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
                <Clock className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {summary.inProgressTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Active work</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overdue
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {summary.overdueTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {summary.totalEstimatedHours}h estimated
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Customer Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasksWithParsedFields.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground">
                  No Customers found for this project
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Assignees</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Due Date</TableHead>
                      {customFieldConfigs.map((config) => (
                        <TableHead key={config.key}>{config.label}</TableHead>
                      ))}
                      <TableHead className="text-right">Estimate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasksWithParsedFields.map((task) => {
                      const estimateHours = (task.estimateHours || 0) + (task.estimateMinutes || 0) / 60;
                      return (
                        <TableRow key={task.id} data-testid={`row-task-report-${task.id}`}>
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{getBucketTitle(task)}</TableCell>
                          <TableCell>{getAssigneeNames(task)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusColor(task.status)}>
                              {getStatusLabel(task.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                              {getPriorityLabel(task.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(task.dueDate)}</TableCell>
                          {customFieldConfigs.map((config) => (
                            <TableCell key={`${task.id}-${config.key}`}>
                              {formatCustomFieldValue(task.parsedCustomFields[config.key], config)}
                            </TableCell>
                          ))}
                          <TableCell className="text-right">{estimateHours.toFixed(1)}h</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


