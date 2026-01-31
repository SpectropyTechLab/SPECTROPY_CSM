import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReactNode } from "react";

type TodoItem = {
  id: number;
  title: string;
  status: string;
  dueDate?: string | Date | null;
};

type Tone = "admin" | "user";

type TodoOverviewCardProps = {
  title: ReactNode;
  subtitle: ReactNode;
  pendingCount: number;
  todaysTasks: TodoItem[];
  pendingTasks: TodoItem[];
  dueTasks: TodoItem[];
  statusLabel: (status: string) => string;
  tone?: Tone;
  maxItems?: {
    today?: number;
    pending?: number;
    due?: number;
  };
  emptyTodayText?: string;
  emptyPendingText?: string;
  emptyDueText?: string;
};

const toneClasses: Record<Tone, { card: string; item: string; empty: string }> =
{
  admin: {
    card: "bg-white border-slate-200",
    item: "border border-slate-100 bg-slate-50",
    empty: "text-slate-400",
  },
  user: {
    card: "",
    item: "border border-slate-200 bg-slate-50",
    empty: "text-muted-foreground",
  },
};

const formatDueDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString() : "—";

export default function TodoOverviewCard({
  title,
  subtitle,
  pendingCount,
  todaysTasks,
  pendingTasks,
  dueTasks,
  statusLabel,
  tone = "admin",
  maxItems,
  emptyTodayText = "No tasks starting today.",
  emptyPendingText = "Nothing pending right now.",
  emptyDueText = "No due tasks.",
}: TodoOverviewCardProps) {
  const classes = toneClasses[tone];
  const todayLimit = maxItems?.today ?? 5;
  const pendingLimit = maxItems?.pending ?? 5;
  const dueLimit = maxItems?.due ?? 5;

  return (
    <Card className={classes.card}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            {title}
          </CardTitle>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-900">{pendingCount}</span>
          <p className="text-xs text-slate-500">Pending Total</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Today&apos;s Tasks
              </p>
              <Badge variant="secondary">{todaysTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {todaysTasks.slice(0, todayLimit).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg ${classes.item}`}
                >
                  <span className="text-sm text-slate-700 truncate">
                    {task.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {statusLabel(task.status)}
                  </span>
                </div>
              ))}
              {todaysTasks.length === 0 && (
                <p className={`text-xs ${classes.empty}`}>{emptyTodayText}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Pending Tasks
              </p>
              <Badge variant="secondary">{pendingTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {pendingTasks.slice(0, pendingLimit).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg ${classes.item}`}
                >
                  <span className="text-sm text-slate-700 truncate">
                    {task.title}
                  </span>
                  <span className="text-xs text-slate-500">
                    {statusLabel(task.status)}
                  </span>
                </div>
              ))}
              {pendingTasks.length === 0 && (
                <p className={`text-xs ${classes.empty}`}>{emptyPendingText}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Due Tasks</p>
              <Badge variant="secondary">{dueTasks.length}</Badge>
            </div>
            <div className="space-y-2">
              {dueTasks.slice(0, dueLimit).map((task) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between gap-2 p-2 rounded-lg ${classes.item}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-400">
                      Due {formatDueDate(task.dueDate)}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {statusLabel(task.status)}
                  </span>
                </div>
              ))}
              {dueTasks.length === 0 && (
                <p className={`text-xs ${classes.empty}`}>{emptyDueText}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
