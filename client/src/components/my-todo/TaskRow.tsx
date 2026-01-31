import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Dot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@shared/schema";

type TaskRowProps = {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onOpenDetails: (task: Task) => void;
  onUpdateTitle: (task: Task, title: string) => void;
};

const priorityDot: Record<string, string> = {
  high: "text-red-400",
  medium: "text-amber-400",
  low: "text-emerald-400",
};

const formatDueChip = (dueDate?: string | Date | null) => {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];
  const dateKey = date.toISOString().split("T")[0];

  if (dateKey === todayKey) return { label: "Today", tone: "text-blue-600 bg-blue-50" };
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (dateKey === tomorrow.toISOString().split("T")[0]) {
    return { label: "Tomorrow", tone: "text-slate-600 bg-slate-50" };
  }
  if (dateKey < todayKey) {
    return { label: "Overdue", tone: "text-red-600 bg-red-50" };
  }
  return { label: date.toLocaleDateString(), tone: "text-slate-600 bg-slate-50" };
};

export default function TaskRow({
  task,
  onToggleComplete,
  onOpenDetails,
  onUpdateTitle,
}: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);

  const dueChip = formatDueChip(task.dueDate);
  const priorityClass = priorityDot[task.priority ?? "medium"] ?? "text-slate-300";

  const commitTitle = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdateTitle(task, trimmed);
    } else {
      setTitleValue(task.title);
    }
    setIsEditing(false);
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="group flex items-center gap-3 px-4 py-3 hover:bg-white/70 transition-colors"
    >
      <button
        type="button"
        onClick={() => onToggleComplete(task)}
        className="text-slate-300 hover:text-emerald-500 transition-colors"
        aria-label="Mark complete"
      >
        <CheckCircle2 className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            value={titleValue}
            onChange={(event) => setTitleValue(event.target.value)}
            onBlur={commitTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                commitTitle();
              }
              if (event.key === "Escape") {
                setTitleValue(task.title);
                setIsEditing(false);
              }
            }}
            autoFocus
            className="w-full bg-transparent text-sm font-medium text-slate-800 outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-left w-full text-sm font-medium text-slate-800 truncate"
          >
            {task.title}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {dueChip ? (
          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", dueChip.tone)}>
            {dueChip.label}
          </span>
        ) : null}
        <Dot className={cn("h-5 w-5", priorityClass)} />
      </div>

      <button
        type="button"
        onClick={() => onOpenDetails(task)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700"
        aria-label="Open details"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </motion.li>
  );
}
