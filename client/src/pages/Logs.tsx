import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ScrollText,
  Plus,
  Trash2,
  FolderKanban,
  CheckSquare,
  User,
  Loader2,
  Clock,
  RotateCcw,
  Search,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ActivityLog } from "@shared/schema";

type SortConfig = {
  key: keyof ActivityLog | "date";
  direction: "asc" | "desc";
};

export default function Logs() {
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 5000,
  });
  const { toast } = useToast();
  const [restoringId, setRestoringId] = useState<number | null>(null);

  // -- Filter & Sort States --
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "desc",
  });

  const isAdmin = localStorage.getItem("userRole") === "Admin";

  // -- Helpers --
  const getActionIcon = (action: string) => {
    switch (action) {
      case "created":
        return <Plus className="h-4 w-4 text-emerald-500" />;
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "restored":
        return <RotateCcw className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case "project":
        return <FolderKanban className="h-4 w-4 text-primary" />;
      case "task":
      case "Customer":
        return <CheckSquare className="h-4 w-4 text-accent" />;
      case "user":
        return <User className="h-4 w-4 text-slate-500" />;
      default:
        return <ScrollText className="h-4 w-4 text-slate-400" />;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "created":
        return "default";
      case "deleted":
        return "destructive";
      case "restored":
        return "secondary";
      default:
        return "secondary";
    }
  };

  // -- Sort Handler --
  const handleSort = (key: keyof ActivityLog | "date") => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  // -- Data Processing (Filter & Sort) --
  const filteredAndSortedLogs = useMemo(() => {
    let processed = [...logs];

    // 1. Filtering
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      processed = processed.filter(
        (log) =>
          log.entityName?.toLowerCase().includes(lowerTerm) ||
          log.performedByName?.toLowerCase().includes(lowerTerm)
      );
    }

    if (entityFilter !== "all") {
      processed = processed.filter(
        (log) => log.entityType?.toLowerCase() === entityFilter.toLowerCase()
      );
    }

    if (actionFilter !== "all") {
      processed = processed.filter(
        (log) => log.action?.toLowerCase() === actionFilter.toLowerCase()
      );
    }

    // 2. Sorting
    processed.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: any;
      let valB: any;

      if (key === "date") {
        valA = new Date(a.createdAt || 0).getTime();
        valB = new Date(b.createdAt || 0).getTime();
      } else {
        valA = a[key] || "";
        valB = b[key] || "";
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return processed;
  }, [logs, searchTerm, entityFilter, actionFilter, sortConfig]);

  const handleUndo = async (log: ActivityLog) => {
    if (!log.entityId) return;
    if (log.entityType !== "project" && log.entityType !== "task") return;

    setRestoringId(log.id);
    try {
      const path =
        log.entityType === "project"
          ? `/api/projects/${log.entityId}/restore`
          : `/api/tasks/${log.entityId}/restore`;

      await apiRequest("POST", path);
      toast({
        title: "Restored",
        description: `${log.entityType} restored successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (err) {
      toast({
        title: "Restore failed",
        description:
          err instanceof Error ? err.message : "Unable to restore item",
        variant: "destructive",
      });
    } finally {
      setRestoringId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="space-y-1">
        <h2
          className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3"
          data-testid="text-logs-title"
        >
          <ScrollText className="w-8 h-8 text-primary" />
          Activity Logs
        </h2>
        <p className="text-slate-500">
          Track all project and Customer creation/deletion activities
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                Recent Activity
                <Badge variant="outline" className="font-normal ml-2">
                  {filteredAndSortedLogs.length} entries
                </Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    queryClient.invalidateQueries({ queryKey: ["/api/logs"] })
                  }
                  className="h-9"
                >
                  <RotateCcw className="h-3 w-3 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* --- Filters Toolbar --- */}
            <div className="flex flex-col md:flex-row gap-3 mt-4 pt-4 border-t">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search by name or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-slate-500" />
                      <SelectValue placeholder="Entity" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="deleted">Deleted</SelectItem>
                    <SelectItem value="restored">Restored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ScrollText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>No activity logs yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="w-[200px] cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("date")}
                      >
                        <div className="flex items-center gap-1">
                          Date & Time
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                      <TableHead className="w-[120px]">Entity Type</TableHead>
                      <TableHead
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("entityName")}
                      >
                        <div className="flex items-center gap-1">
                          Entity Name
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead
                        className="w-[150px] cursor-pointer hover:text-primary transition-colors"
                        onClick={() => handleSort("performedByName")}
                      >
                        <div className="flex items-center gap-1">
                          Performed By
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedLogs.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-slate-500"
                        >
                          No results found matching your filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedLogs.map((log) => (
                        <TableRow
                          key={log.id}
                          data-testid={`row-log-${log.id}`}
                        >
                          <TableCell className="text-slate-500 text-sm">
                            {log.createdAt
                              ? format(
                                new Date(log.createdAt),
                                "MMM d, yyyy h:mm:ss a"
                              )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <Badge
                                variant={getActionBadgeVariant(log.action)}
                                className="capitalize"
                              >
                                {log.action}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getEntityIcon(log.entityType)}
                              <span className="capitalize text-slate-700">
                                {log.entityType}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900">
                            {log.entityName || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-slate-400" />
                              <span className="text-slate-600">
                                {log.performedByName || "System"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {isAdmin &&
                              log.action === "deleted" &&
                              log.entityId &&
                              (log.entityType === "project" ||
                                log.entityType === "task") ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2"
                                onClick={() => handleUndo(log)}
                                disabled={restoringId === log.id}
                              >
                                {restoringId === log.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-4 w-4" />
                                )}
                                Undo
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}