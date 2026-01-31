import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  FolderKanban,
  Loader2,
  Search,
  ListFilter,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Bucket, Project } from "@shared/schema";
import { cn } from "@/lib/utils";

type SortKey = "dueDate" | "priority" | "title";
type SortDirection = "asc" | "desc";

export default function UserTasks() {
  const userId = Number(localStorage.getItem("userId"));
  const { toast } = useToast();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Sort States
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data: myTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { assigneeId: userId }],
    queryFn: async () => {
      const res = await fetch(`/api/tasks?assigneeId=${userId}`);
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: buckets = [] } = useQuery<Bucket[]>({
    queryKey: ["/api/buckets/all"],
    queryFn: async () => {
      const res = await fetch("/api/buckets");
      return res.json();
    },
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: number }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", { assigneeId: userId }] });
      toast({
        title: "Customer updated",
        description: "Customer status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update customer status.",
        variant: "destructive",
      });
    },
  });

  // Helper Functions
  const getBucketName = (bucketId: number | null) => {
    if (!bucketId) return "-";
    const bucket = buckets.find((b) => b.id === bucketId);
    return bucket?.title || "-";
  };

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "-";
    const project = projects.find((p) => p.id === projectId);
    return project?.name || "-";
  };

  const handleStatusChange = (task: Task, newStatus: string) => {
    if (task.status === "completed") {
      toast({
        title: "Cannot modify",
        description: "Completed customers cannot be modified.",
        variant: "destructive",
      });
      return;
    }

    const historyEntry = newStatus === "completed"
      ? `Marked as completed on ${new Date().toLocaleDateString()}`
      : newStatus === "in_progress"
        ? `Started on ${new Date().toLocaleDateString()}`
        : `Moved to ${newStatus} on ${new Date().toLocaleDateString()}`;

    updateTaskMutation.mutate({
      id: task.id,
      status: newStatus,
      history: [...(task.history || []), historyEntry],
    });
  };

  // 1. FILTER Logic
  const filteredTasks = myTasks.filter((task) => {
    const query = searchQuery.toLowerCase();

    // Search Match
    const title = task.title.toLowerCase();
    const description = (task.description || "").toLowerCase();
    const projectName = getProjectName(task.projectId).toLowerCase();
    const bucketName = getBucketName(task.bucketId).toLowerCase();
    const statusLabel = task.status.replace("_", " ").toLowerCase();
    const priority = task.priority.toLowerCase();

    const searchMatch =
      !query ||
      title.includes(query) ||
      description.includes(query) ||
      projectName.includes(query) ||
      bucketName.includes(query) ||
      statusLabel.includes(query) ||
      priority.includes(query);

    // Filter Matches
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
    const projectMatch = projectFilter === "all" || task.projectId === Number(projectFilter);

    return searchMatch && statusMatch && priorityMatch && projectMatch;
  });

  // 2. SORT Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    // A. Always move Completed tasks to the bottom
    const isCompletedA = a.status === "completed";
    const isCompletedB = b.status === "completed";

    if (isCompletedA && !isCompletedB) return 1; // A is completed, push down
    if (!isCompletedA && isCompletedB) return -1; // B is completed, push down

    // B. Apply User Selected Sort
    let comparison = 0;

    switch (sortKey) {
      case "dueDate":
        // Handle null dates (push to end if active, start if completed? let's just push null to end)
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        comparison = dateA - dateB;
        break;

      case "priority":
        // High (3) > Medium (2) > Low (1)
        const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
        comparison = (priorityMap[a.priority] || 0) - (priorityMap[b.priority] || 0);
        break;

      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Visual Helpers
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-rose-100 text-rose-700 border-rose-200";
      case "medium": return "bg-amber-100 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-emerald-700 bg-emerald-100 border-emerald-200";
      case "in_progress": return "text-blue-700 bg-blue-100 border-blue-200";
      default: return "text-slate-700 bg-slate-100 border-slate-200";
    }
  };

  const getRowClass = (status: string) => {
    switch (status) {
      case "in_progress":
        return "bg-blue-50/40 hover:bg-blue-50/70 border-l-2 border-l-blue-400";
      case "completed":
        return "bg-emerald-50/30 hover:bg-emerald-50/60 border-l-2 border-l-emerald-400 opacity-60 grayscale-[0.3]"; // Added visual dimming
      default:
        return "hover:bg-slate-50 border-l-2 border-l-transparent";
    }
  };

  const activeFiltersCount = [statusFilter, priorityFilter, projectFilter].filter(f => f !== "all").length;

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
  };

  // Counts
  const completedCount = myTasks.filter((t) => t.status === "completed").length;
  const inProgressCount = myTasks.filter((t) => t.status === "in_progress").length;
  const todoCount = myTasks.filter((t) => t.status === "todo").length;

  if (tasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-slate-500 font-medium">Loading your customers...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-page-title">
          My Customers
        </h1>
        <p className="text-slate-500 text-lg">
          View and manage the customers assigned to you.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">To Do</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{todoCount}</span>
                  <span className="text-xs text-slate-400">pending</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-slate-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">In Progress</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{inProgressCount}</span>
                  <span className="text-xs text-blue-500">active</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Completed</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{completedCount}</span>
                  <span className="text-xs text-emerald-500">finished</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckSquare className="h-6 w-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">

          {/* Search Bar */}
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by name, project, or stage..."
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">

            {/* Sorting Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 gap-2">
                  <ArrowUpDown className="w-4 h-4 text-slate-500" />
                  Sort
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                  <DropdownMenuRadioItem value="dueDate">Due Date</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="title">Name (A-Z)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Order</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sortDirection} onValueChange={(v) => setSortDirection(v as SortDirection)}>
                  <DropdownMenuRadioItem value="asc">
                    <div className="flex items-center gap-2">
                      <ArrowUp className="w-3.5 h-3.5" /> Ascending
                    </div>
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">
                    <div className="flex items-center gap-2">
                      <ArrowDown className="w-3.5 h-3.5" /> Descending
                    </div>
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Cascading Filter Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                    activeFiltersCount > 0 && "border-primary/50 bg-primary/5 text-primary"
                  )}
                >
                  <ListFilter className="w-4 h-4 mr-2" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-5 min-w-[1.25rem] px-1 bg-primary text-white hover:bg-primary rounded-full">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter Customers</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {/* Status Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <Filter className="w-4 h-4 text-slate-500" />
                    <span>By Status</span>
                    {statusFilter !== "all" && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                        <DropdownMenuRadioItem value="all">All Status</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="todo">Todo</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="in_progress">In Progress</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Priority Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <AlertCircle className="w-4 h-4 text-slate-500" />
                    <span>By Priority</span>
                    {priorityFilter !== "all" && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuRadioGroup value={priorityFilter} onValueChange={setPriorityFilter}>
                        <DropdownMenuRadioItem value="all">All Priorities</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="high">High</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="medium">Medium</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="low">Low</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {/* Project Submenu */}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2">
                    <FolderKanban className="w-4 h-4 text-slate-500" />
                    <span>By Project</span>
                    {projectFilter !== "all" && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-48 max-h-[250px] overflow-y-auto">
                      <DropdownMenuRadioGroup value={projectFilter} onValueChange={setProjectFilter}>
                        <DropdownMenuRadioItem value="all">All Projects</DropdownMenuRadioItem>
                        {projects.map((p) => (
                          <DropdownMenuRadioItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </DropdownMenuRadioItem>
                        ))}
                      </DropdownMenuRadioGroup>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>

                {activeFiltersCount > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={resetFilters} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reset All Filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Content */}
        <CardContent className="p-0">
          {sortedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No customers found</h3>
              <p className="text-slate-500 max-w-sm mt-1">
                We couldn't find any assigned customers matching your filters.
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery("");
                  resetFilters();
                }}
                className="mt-2 text-primary gap-1 hover:underline hover:bg-transparent p-0 h-auto"
              >
                <XCircle className="w-4 h-4" />
                Clear search & filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[300px] pl-6">Customer Details</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Pipeline Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Estimate</TableHead>
                    <TableHead>Due Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className={cn(
                        "group transition-all duration-200",
                        getRowClass(task.status)
                      )}
                      data-testid={`row-task-${task.id}`}
                    >
                      <TableCell className="pl-6">
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-semibold transition-colors",
                            task.status === "completed" ? "text-slate-500 line-through" : "text-slate-900 group-hover:text-primary"
                          )}>
                            {task.title}
                          </span>
                          {task.description && (
                            <span className="text-xs text-slate-500 truncate max-w-[280px]">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal text-slate-600 bg-white/50">
                          {getProjectName(task.projectId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 flex items-center gap-2">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            task.status === "completed" ? "bg-slate-300" : "bg-primary"
                          )} />
                          {getBucketName(task.bucketId)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {task.status === "completed" ? (
                          <Badge variant="secondary" className={getStatusColor(task.status)}>
                            <CheckSquare className="w-3 h-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task, value)}
                            disabled={updateTaskMutation.isPending}
                          >
                            <SelectTrigger
                              className={cn(
                                "w-[130px] h-8 text-xs font-medium border rounded-full transition-all bg-white shadow-sm",
                                getStatusColor(task.status)
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">Todo</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn("text-[10px] px-2 py-0.5 border bg-white", getPriorityBadge(task.priority))}
                        >
                          {task.priority.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {task.estimateHours || 0}h {task.estimateMinutes || 0}m
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.dueDate ? (
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}