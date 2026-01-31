import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Task } from "@shared/schema";
import { toDateKey, isAfterDateKey, isBeforeDateKey, isSameDateKey } from "@shared/dateUtils";

export type MyTodoFilterKey = "my-day" | "today" | "overdue" | "upcoming" | "all";

type UseMyTodoTasksResult = {
  tasks: Task[];
  filteredTasks: Task[];
  counts: Record<MyTodoFilterKey, number>;
  isLoading: boolean;
};

const priorityRank: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const getPriorityRank = (value?: string | null) =>
  priorityRank[value ?? "medium"] ?? 3;

export function useMyTodoTasks(activeFilter: MyTodoFilterKey): UseMyTodoTasksResult {
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my-todo"],
  });

  const todayKey = toDateKey(new Date());

  const datedTasks = useMemo(
    () => tasks.filter((task) => task.dueDate),
    [tasks],
  );

  const overdueTasks = useMemo(
    () => datedTasks.filter((task) => isBeforeDateKey(task.dueDate, todayKey)),
    [datedTasks, todayKey],
  );

  const todayTasks = useMemo(
    () => tasks.filter((task) => isSameDateKey(task.startDate, todayKey)),
    [tasks, todayKey],
  );

  const upcomingTasks = useMemo(
    () => datedTasks.filter((task) => isAfterDateKey(task.dueDate, todayKey)),
    [datedTasks, todayKey],
  );

  const myDayTasks = useMemo(() => {
    return tasks.filter((task) => {
      const startKey = toDateKey(task.startDate);
      const dueKey = toDateKey(task.dueDate);

      if (!startKey) {
        return true;
      }

      if (startKey === todayKey || dueKey === todayKey) {
        return true;
      }

      if (startKey && dueKey && startKey <= todayKey && dueKey >= todayKey) {
        return true;
      }

      return false;
    });
  }, [tasks, todayKey]);

  const counts: Record<MyTodoFilterKey, number> = {
    "my-day": myDayTasks.length,
    today: todayTasks.length,
    overdue: overdueTasks.length,
    upcoming: upcomingTasks.length,
    all: tasks.length,
  };

  const groupRank = (task: Task) => {
    if (isBeforeDateKey(task.dueDate, todayKey)) return 0;
    if (isSameDateKey(task.dueDate, todayKey)) return 1;
    if (isAfterDateKey(task.dueDate, todayKey)) return 2;
    return 3;
  };

  const sortTasks = (list: Task[]) =>
    [...list].sort((a, b) => {
      const groupDiff = groupRank(a) - groupRank(b);
      if (groupDiff !== 0) return groupDiff;
      const priorityDiff = getPriorityRank(a.priority) - getPriorityRank(b.priority);
      if (priorityDiff !== 0) return priorityDiff;
      const dateA = toDateKey(a.dueDate);
      const dateB = toDateKey(b.dueDate);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.title.localeCompare(b.title);
    });

  const filteredTasks = useMemo(() => {
    switch (activeFilter) {
      case "today":
        return sortTasks(
          tasks.filter((task) => isSameDateKey(task.startDate, todayKey)),
        );
      case "overdue":
        return sortTasks(overdueTasks);
      case "upcoming":
        return sortTasks(upcomingTasks);
      case "my-day":
        return sortTasks(myDayTasks);
      case "all":
      default:
        return sortTasks(tasks);
    }
  }, [activeFilter, myDayTasks, overdueTasks, tasks, todayTasks, upcomingTasks]);

  return { tasks, filteredTasks, counts, isLoading };
}
