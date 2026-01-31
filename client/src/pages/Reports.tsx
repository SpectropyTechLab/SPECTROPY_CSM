import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Users,
  FolderKanban,
  Calendar,
  RefreshCw,
  Layers,
  ListTodo,
  PieChart
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Project, User } from "@shared/schema";

import ProjectReports from "@/components/reports/ProjectReports";
import UserReports from "@/components/reports/UserReports";
import DeadlineReports from "@/components/reports/DeadlineReports";
import BucketReports from "@/components/reports/BucketReports";
import TaskReport from "@/components/reports/taskreport";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("projects");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedBucketId, setSelectedBucketId] = useState<string>("");
  const [bucketProjectFilter, setBucketProjectFilter] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userRole = localStorage.getItem("userRole") || "User";
  const currentUserId = Number(localStorage.getItem("userId")) || 0;
  const isAdmin = userRole === "Admin";

  const { data: projects = [], refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: users = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const availableProjects = isAdmin
    ? projects
    : projects.filter((p) => true); // Add filter logic if needed

  useEffect(() => {
    if (availableProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(String(availableProjects[0].id));
    }
  }, [availableProjects, selectedProjectId]);

  useEffect(() => {
    if (!isAdmin && currentUserId && !selectedUserId) {
      setSelectedUserId(String(currentUserId));
    }
  }, [isAdmin, currentUserId, selectedUserId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchProjects(), refetchUsers()]);
    setTimeout(() => setIsRefreshing(false), 500); // Visual feedback delay
  };

  const tabItems = [
    { value: "projects", label: "Projects", icon: FolderKanban },
    { value: "users", label: "Users", icon: Users },
    { value: "deadlines", label: "Deadlines", icon: Calendar },
    { value: "buckets", label: "Stages", icon: Layers },
    { value: "tasks", label: "Customers", icon: ListTodo },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-primary">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900" data-testid="text-reports-title">
              Analytics & Reports
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Data-driven insights for your workspace
            </p>
          </div>
        </div>

        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm h-10 px-4 rounded-xl transition-all"
          data-testid="button-refresh-reports"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh Data
        </Button>
      </motion.div>

      {/* Main Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Modern Floating Tab List */}
        <div className="sticky top-0 z-10 -mx-6 px-6 md:px-0 md:mx-0 py-2 md:py-0 bg-slate-50/95 backdrop-blur-sm md:bg-transparent">
          <TabsList className="h-auto p-1.5 bg-white border border-slate-200/60 shadow-sm rounded-xl inline-flex w-full md:w-auto overflow-x-auto justify-start">
            {tabItems.map((item) => (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="rounded-lg px-4 py-2.5 gap-2 text-slate-500 data-[state=active]:bg-primary/5 data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none transition-all duration-200"
                data-testid={`tab-${item.value}`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm min-h-[500px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-6 md:p-8"
            >
              <TabsContent value="projects" className="mt-0 focus-visible:outline-none">
                <ProjectReports
                  selectedProjectId={selectedProjectId}
                  onProjectChange={setSelectedProjectId}
                  projects={availableProjects}
                  isAdmin={isAdmin}
                />
              </TabsContent>

              <TabsContent value="users" className="mt-0 focus-visible:outline-none">
                <UserReports
                  selectedUserId={selectedUserId}
                  onUserChange={setSelectedUserId}
                  users={users}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                />
              </TabsContent>

              <TabsContent value="deadlines" className="mt-0 focus-visible:outline-none">
                <DeadlineReports isAdmin={isAdmin} currentUserId={currentUserId} />
              </TabsContent>

              <TabsContent value="buckets" className="mt-0 focus-visible:outline-none">
                <BucketReports
                  selectedBucketId={selectedBucketId}
                  onBucketChange={setSelectedBucketId}
                  selectedProjectFilter={bucketProjectFilter}
                  onProjectFilterChange={setBucketProjectFilter}
                  projects={availableProjects}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                />
              </TabsContent>

              <TabsContent value="tasks" className="mt-0 focus-visible:outline-none">
                <TaskReport
                  selectedProjectId={selectedProjectId}
                  onProjectChange={setSelectedProjectId}
                  projects={availableProjects}
                  isAdmin={isAdmin}
                  currentUserId={currentUserId}
                />
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}