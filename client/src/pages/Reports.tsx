import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
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
    : projects.filter((p) => {
        return true;
      });

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

  const handleRefresh = () => {
    refetchProjects();
    refetchUsers();
  };

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-reports-title">
            <BarChart3 className="inline-block h-8 w-8 mr-2 text-primary" />
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics dashboard for your projects and customers
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" data-testid="button-refresh-reports">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </motion.div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="projects" className="gap-2" data-testid="tab-projects">
                <FolderKanban className="h-4 w-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2" data-testid="tab-users">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="deadlines" className="gap-2" data-testid="tab-deadlines">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Deadlines</span>
              </TabsTrigger>
              <TabsTrigger value="buckets" className="gap-2" data-testid="tab-buckets">
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Stages</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-2" data-testid="tab-tasks">
                <ListTodo className="h-4 w-4" />
                <span className="hidden sm:inline">Customers</span>
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent key="projects" value="projects" className="mt-0">
                <motion.div
                  key="projects"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProjectReports
                    selectedProjectId={selectedProjectId}
                    onProjectChange={setSelectedProjectId}
                    projects={availableProjects}
                    isAdmin={isAdmin}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="users" value="users" className="mt-0">
                <motion.div
                  key="users"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <UserReports
                    selectedUserId={selectedUserId}
                    onUserChange={setSelectedUserId}
                    users={users}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="deadlines" value="deadlines" className="mt-0">
                <motion.div
                  key="deadlines"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <DeadlineReports isAdmin={isAdmin} currentUserId={currentUserId} />
                </motion.div>
              </TabsContent>

              <TabsContent key="buckets" value="buckets" className="mt-0">
                <motion.div
                  key="buckets"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <BucketReports
                    selectedBucketId={selectedBucketId}
                    onBucketChange={setSelectedBucketId}
                    selectedProjectFilter={bucketProjectFilter}
                    onProjectFilterChange={setBucketProjectFilter}
                    projects={availableProjects}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                  />
                </motion.div>
              </TabsContent>

              <TabsContent key="tasks" value="tasks" className="mt-0">
                <motion.div
                  key="tasks"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TaskReport
                    selectedProjectId={selectedProjectId}
                    onProjectChange={setSelectedProjectId}
                    projects={availableProjects}
                    isAdmin={isAdmin}
                    currentUserId={currentUserId}
                  />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}


