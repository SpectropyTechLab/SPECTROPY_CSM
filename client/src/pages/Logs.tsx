import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import type { ActivityLog } from "@shared/schema";

export default function Logs() {
  const { data: logs = [], isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/logs"],
    refetchInterval: 5000,
  });
  const { toast } = useToast();
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const isAdmin = localStorage.getItem("userRole") === "Admin";

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
        description: err instanceof Error ? err.message : "Unable to restore item",
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
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/logs"] })}
                className="h-8"
              >
                Refresh
              </Button>
              <Badge variant="outline" className="font-normal">
                {logs.length} entries
              </Badge>
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
                      <TableHead className="w-[180px]">Date & Time</TableHead>
                      <TableHead className="w-[120px]">Action</TableHead>
                      <TableHead className="w-[120px]">Entity Type</TableHead>
                      <TableHead>Entity Name</TableHead>
                      <TableHead className="w-[150px]">Performed By</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                        <TableCell className="text-slate-500 text-sm">
                          {log.createdAt
                            ? format(new Date(log.createdAt), "MMM d, yyyy h:mm:ss a")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <Badge variant={getActionBadgeVariant(log.action)} className="capitalize">
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
                          {isAdmin && log.action === "deleted" && log.entityId && (log.entityType === "project" || log.entityType === "task") ? (
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
                    ))}
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



