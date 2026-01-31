import { Sun, CalendarDays, AlertTriangle, CalendarArrowUp, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MyTodoFilterKey } from "@/hooks/use-my-todo";

type FilterItem = {
  key: MyTodoFilterKey;
  label: string;
  icon: typeof Sun;
  description?: string;
};

type MyTodoSidebarProps = {
  activeFilter: MyTodoFilterKey;
  onFilterChange: (value: MyTodoFilterKey) => void;
  counts: Record<MyTodoFilterKey, number>;
};

const filters: FilterItem[] = [
  { key: "my-day", label: "My Day", icon: Sun },
  { key: "today", label: "Today", icon: CalendarDays },
  { key: "overdue", label: "Overdue", icon: AlertTriangle },
  { key: "upcoming", label: "Upcoming", icon: CalendarArrowUp },
  { key: "all", label: "All Tasks", icon: ListTodo },
];

export default function MyTodoSidebar({
  activeFilter,
  onFilterChange,
  counts,
}: MyTodoSidebarProps) {
  return (
    <aside className="w-full lg:w-64">
      <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-transparent lg:border-slate-100 shadow-sm lg:shadow-none p-2">
        <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.key;
            const Icon = filter.icon;
            const count = counts[filter.key];
            return (
              <button
                key={filter.key}
                onClick={() => onFilterChange(filter.key)}
                className={cn(
                  "flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap lg:whitespace-normal",
                  isActive
                    ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                    : "text-slate-500 hover:bg-white/70",
                )}
                type="button"
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      filter.key === "overdue" ? "text-red-400" : "text-slate-400",
                    )}
                  />
                  <span>{filter.label}</span>
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    filter.key === "overdue" && count > 0
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
