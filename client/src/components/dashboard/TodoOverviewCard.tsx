import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react"; // Professional icons
import type { ReactNode } from "react";
import { cn } from "@/lib/utils"; // Shadcn utility for merging classes

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
  maxItems?: { today?: number; pending?: number; due?: number };
  emptyTodayText?: string;
  emptyPendingText?: string;
  emptyDueText?: string;
};

const toneClasses: Record<Tone, { card: string; item: string; empty: string }> = {
  admin: {
    card: "bg-white border-slate-200 shadow-sm",
    item: "border-slate-100 bg-slate-50/50 hover:bg-slate-100/80",
    empty: "text-slate-400 bg-slate-50/30",
  },
  user: {
    card: "shadow-none border-slate-200",
    item: "border-slate-200 bg-white hover:border-primary/20 hover:bg-slate-50",
    empty: "text-muted-foreground bg-muted/20",
  },
};

const formatDueDate = (value?: string | Date | null) =>
  value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

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

  const sections = [
    {
      label: "Today's Tasks",
      data: todaysTasks,
      limit: maxItems?.today ?? 5,
      empty: emptyTodayText,
      icon: <Calendar className="w-4 h-4 text-blue-500" />
    },
    {
      label: "Pending Tasks",
      data: pendingTasks,
      limit: maxItems?.pending ?? 5,
      empty: emptyPendingText,
      icon: <Clock className="w-4 h-4 text-amber-500" />
    },
    {
      label: "Due Tasks",
      data: dueTasks,
      limit: maxItems?.due ?? 5,
      empty: emptyDueText,
      icon: <AlertCircle className="w-4 h-4 text-rose-500" />
    },
  ];

  return (
    <Card className={cn("overflow-hidden transition-all", classes.card)}>
      {/* Header Section */}
      <CardHeader className="border-b border-slate-50 bg-slate-50/30 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              {title}
            </CardTitle>
            <p className="text-sm text-slate-500 font-medium">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm self-start sm:self-center">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 leading-none">Total Pending</p>
              <span className="text-2xl font-black text-slate-900">{pendingCount}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 sm:p-6">
        {/* Responsive Grid: 1 column on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {sections.map((section, idx) => (
            <div key={idx} className="p-4 sm:p-0 md:px-4 first:pl-0 last:pr-0 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <h3 className="text-sm font-bold text-slate-700 uppercase tracking-tight">
                    {section.label}
                  </h3>
                </div>
                <Badge variant="outline" className="font-mono font-bold bg-white">
                  {section.data.length}
                </Badge>
              </div>

              <div className="space-y-2">
                {section.data.slice(0, section.limit).map((task) => (
                  <div
                    key={task.id}
                    className={cn(
                      "group flex flex-col gap-1 p-3 rounded-xl border transition-all cursor-default",
                      classes.item
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-800 leading-tight group-hover:text-primary transition-colors">
                        {task.title}
                      </span>
                      <Badge className="text-[10px] h-5 px-1.5 shrink-0 bg-slate-200/50 text-slate-600 hover:bg-slate-200" variant="secondary">
                        {statusLabel(task.status)}
                      </Badge>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <Calendar className="w-3 h-3" />
                        Due {formatDueDate(task.dueDate)}
                      </div>
                    )}
                  </div>
                ))}

                {section.data.length === 0 && (
                  <div className={cn("flex flex-col items-center justify-center py-8 rounded-xl border border-dashed", classes.empty)}>
                    <p className="text-xs font-medium italic">{section.empty}</p>
                  </div>
                )}

                {section.data.length > section.limit && (
                  <p className="text-[11px] text-center text-slate-400 font-medium pt-1">
                    + {section.data.length - section.limit} more tasks
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}