import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListTodo, CheckCircle2, Clock, AlertTriangle } from "lucide-react";

type DummyTaskStatus = "todo" | "in_progress" | "completed";
type DummyTaskPriority = "low" | "medium" | "high";

interface DummyTask {
  id: number;
  title: string;
  project: string;
  assignee: string;
  status: DummyTaskStatus;
  priority: DummyTaskPriority;
  dueDate: string;
  estimateHours: number;
}

const dummyTasks: DummyTask[] = [
  {
    id: 1,
    title: "Draft onboarding checklist",
    project: "CRM Revamp",
    assignee: "Ava Patel",
    status: "completed",
    priority: "medium",
    dueDate: "2026-01-10",
    estimateHours: 6,
  },
  {
    id: 2,
    title: "Follow up with top leads",
    project: "Sales Ops",
    assignee: "Liam Chen",
    status: "in_progress",
    priority: "high",
    dueDate: "2026-01-28",
    estimateHours: 4,
  },
  {
    id: 3,
    title: "Prepare Q1 report layout",
    project: "Reporting",
    assignee: "Noah Williams",
    status: "todo",
    priority: "medium",
    dueDate: "2026-02-05",
    estimateHours: 8,
  },
  {
    id: 4,
    title: "Clean up old contacts",
    project: "Data Hygiene",
    assignee: "Emma Johnson",
    status: "in_progress",
    priority: "low",
    dueDate: "2026-01-22",
    estimateHours: 3,
  },
  {
    id: 5,
    title: "Update pipeline stages",
    project: "CRM Revamp",
    assignee: "Olivia Brown",
    status: "todo",
    priority: "high",
    dueDate: "2026-01-18",
    estimateHours: 5,
  },
];

const getStatusLabel = (status: DummyTaskStatus) => {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "completed":
      return "Completed";
    default:
      return "Not Started";
  }
};

const getStatusColor = (status: DummyTaskStatus) => {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "in_progress":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
};

const getPriorityLabel = (priority: DummyTaskPriority) => {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
};

const getPriorityColor = (priority: DummyTaskPriority) => {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "medium":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  }
};

export default function TaskReport() {
  const totalTasks = dummyTasks.length;
  const completedTasks = dummyTasks.filter((task) => task.status === "completed").length;
  const inProgressTasks = dummyTasks.filter((task) => task.status === "in_progress").length;
  const overdueTasks = dummyTasks.filter((task) => {
    if (task.status === "completed") return false;
    return new Date(task.dueDate) < new Date();
  }).length;
  const totalEstimatedHours = dummyTasks.reduce((sum, task) => sum + task.estimateHours, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <ListTodo className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Dummy data</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{completedTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Finished tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{inProgressTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">Active work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalEstimatedHours}h estimated
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Task Report (Dummy Data)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Estimate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyTasks.map((task) => (
                <TableRow key={task.id} data-testid={`row-task-report-${task.id}`}>
                  <TableCell className="font-medium">{task.title}</TableCell>
                  <TableCell>{task.project}</TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                      {getPriorityLabel(task.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">{task.estimateHours}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
