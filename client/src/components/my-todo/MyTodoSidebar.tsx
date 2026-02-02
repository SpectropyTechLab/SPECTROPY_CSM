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
    <nav className="w-full">
      {/* Removed 'flex lg:flex-col' and 'overflow-x-auto' 
          This container is now strictly a vertical stack (flex-col)
      */}
      <div className="flex flex-col gap-1.5">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.key;
          const Icon = filter.icon;
          const count = counts[filter.key];

          return (
            <button
              key={filter.key}
              onClick={() => onFilterChange(filter.key)}
              className={cn(
                "group flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
              type="button"
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : filter.key === "overdue" && count > 0
                        ? "text-red-500"
                        : "text-slate-400 group-hover:text-slate-600",
                  )}
                />
                <span className={cn(isActive ? "font-semibold" : "font-medium")}>
                  {filter.label}
                </span>
              </div>

              {count > 0 && (
                <span
                  className={cn(
                    "min-w-[1.5rem] h-5 flex items-center justify-center text-[10px] font-bold px-1.5 rounded-md border transition-colors",
                    isActive
                      ? "bg-primary text-white border-primary"
                      : filter.key === "overdue"
                        ? "bg-red-50 text-red-600 border-red-100"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}