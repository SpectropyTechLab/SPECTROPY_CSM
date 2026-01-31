import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckSquare,
  Clock,
  Calendar,
  AlertCircle,
  FolderKanban,
  Users,
  Loader2,
  Search,
  ArrowUpRight,
  Briefcase,
  XCircle,
  ListFilter,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Bucket, Project, User as UserType } from "@shared/schema";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminTasks() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [assigneeSearch, setAssigneeSearch] = useState("");

  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
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

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Task> & { id: number }) => {
      return apiRequest("PATCH", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
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

  const getAssignees = (task: Task) => {
    const assigneeIds = task.assignedUsers?.length
      ? task.assignedUsers
      : task.assigneeId
        ? [task.assigneeId]
        : [];
    return users.filter((u) => assigneeIds.includes(u.id));
  };

  // Main Search Logic
  const filteredTasks = tasks.filter((task) => {
    const query = searchQuery.toLowerCase();

    const title = task.title.toLowerCase();
    const description = (task.description || "").toLowerCase();
    const projectName = getProjectName(task.projectId).toLowerCase();
    const bucketName = getBucketName(task.bucketId).toLowerCase();
    const assigneeNames = getAssignees(task).map(u => u.name.toLowerCase()).join(" ");
    const statusLabel = task.status.replace("_", " ").toLowerCase();
    const priority = task.priority.toLowerCase();
    const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString().toLowerCase() : "";

    const searchMatch =
      !query ||
      title.includes(query) ||
      description.includes(query) ||
      projectName.includes(query) ||
      bucketName.includes(query) ||
      assigneeNames.includes(query) ||
      statusLabel.includes(query) ||
      priority.includes(query) ||
      dateStr.includes(query);

    const projectMatch = projectFilter === "all" || task.projectId === Number(projectFilter);
    const statusMatch = statusFilter === "all" || task.status === statusFilter;
    const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
    const assigneeMatch = assigneeFilter === "all" ||
      task.assigneeId === Number(assigneeFilter) ||
      task.assignedUsers?.includes(Number(assigneeFilter));

    return searchMatch && projectMatch && statusMatch && priorityMatch && assigneeMatch;
  });

  const filteredUsersForDropdown = users.filter((u) =>
    u.name.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  const handleStatusChange = (task: Task, newStatus: string) => {
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
      case "completed": return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "in_progress": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-slate-600 bg-slate-100 border-slate-200";
    }
  };

  const activeFiltersCount = [projectFilter, statusFilter, priorityFilter, assigneeFilter]
    .filter(f => f !== "all").length;

  const resetFilters = () => {
    setProjectFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
    setAssigneeSearch("");
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const todoCount = tasks.filter((t) => t.status === "todo").length;

  if (tasksLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-slate-500 font-medium">Loading customers...</p>
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-900" data-testid="text-admin-tasks-title">
          Customer Management
        </h1>
        <p className="text-slate-500 text-lg">
          Track progress, assign teams, and manage delivery pipelines.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Not Started</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{todoCount}</span>
                  <span className="text-xs text-slate-400">pending</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-slate-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">In Pipeline</p>
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
                <p className="text-sm font-medium text-emerald-600 mb-1">Delivered</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900">{completedCount}</span>
                  <span className="text-xs text-emerald-500">success</span>
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
              placeholder="Search customers, projects, teams..."
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
                      <DropdownMenuRadioItem value="todo">Not Started</DropdownMenuRadioItem>
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

              {/* Assignee Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>By Assignee</span>
                  {assigneeFilter !== "all" && <div className="ml-auto w-2 h-2 rounded-full bg-primary" />}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-64 p-0" sideOffset={8}>

                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          placeholder="Search team..."
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          className="pl-8 h-8 text-xs border-slate-200 focus-visible:ring-1 bg-slate-50/50"
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    <DropdownMenuRadioGroup value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <div className="max-h-[200px] overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <DropdownMenuRadioItem value="all" className="cursor-pointer">
                          <span className="flex-1">All Assignees</span>
                        </DropdownMenuRadioItem>

                        {filteredUsersForDropdown.length > 0 ? (
                          filteredUsersForDropdown.map((u) => (
                            <DropdownMenuRadioItem key={u.id} value={String(u.id)} className="cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={u.avatar || undefined} />
                                  <AvatarFallback className="text-[9px]">{u.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="truncate">{u.name}</span>
                              </div>
                            </DropdownMenuRadioItem>
                          ))
                        ) : (
                          <div className="px-2 py-4 text-center text-xs text-slate-400">
                            No team members found
                          </div>
                        )}
                      </div>
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

        {/* Table Content */}
        <CardContent className="p-0">
          {filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No customers found</h3>
              <p className="text-slate-500 max-w-sm mt-1">
                We couldn't find any customers matching "{searchQuery}" or the active filters.
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
                    <TableHead className="w-[300px]">Customer Details</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Pipeline Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => {
                    const assignees = getAssignees(task);
                    return (
                      <TableRow
                        key={task.id}
                        className="group hover:bg-slate-50/80 transition-colors"
                        data-testid={`row-task-${task.id}`}
                      >
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
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
                          <Badge variant="outline" className="font-normal text-slate-600 bg-white">
                            {getProjectName(task.projectId)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            {getBucketName(task.bucketId)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task, value)}
                          >
                            <SelectTrigger
                              className={`w-[130px] h-8 text-xs font-medium border rounded-full transition-all ${getStatusColor(task.status)}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todo">Not Started</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`text-[10px] px-2 py-0.5 border ${getPriorityBadge(task.priority)}`}
                          >
                            {task.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center -space-x-2 hover:space-x-1 transition-all">
                            {assignees.length > 0 ? (
                              <>
                                {assignees.slice(0, 3).map((user) => (
                                  <Avatar
                                    key={user.id}
                                    className="h-7 w-7 border-2 border-white ring-1 ring-slate-100"
                                  >
                                    <AvatarImage src={user.avatar || undefined} />
                                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                                      {user.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                ))}
                                {assignees.length > 3 && (
                                  <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-medium border-2 border-white text-slate-600">
                                    +{assignees.length - 3}
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Unassigned</span>
                            )}
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5"
                            onClick={() => navigate(`/projects/${task.projectId}`)}
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}