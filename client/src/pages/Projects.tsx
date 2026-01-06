import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  FolderKanban,
  Plus,
  Eye,
  User,
  CheckCircle2,
  Circle,
  Loader2,
  MoreVertical,
  Pencil,
  Trash2,
  Type,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Project, Task, User as UserType } from "@shared/schema";

const Projects = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editingTitleId, setEditingTitleId] = useState<number | null>(null);
  const [inlineTitle, setInlineTitle] = useState("");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: Partial<Project>) => {
      return apiRequest("POST", "/api/projects", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      toast({
        title: "Project created",
        description: "Your new project has been created successfully.",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Project> & { id: number }) => {
      return apiRequest("PATCH", `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingProject(null);
      setEditingTitleId(null);
      toast({
        title: "Project updated",
        description: "Project has been updated successfully.",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project deleted",
        description: "Project has been deleted.",
      });
    },
  });

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    createProjectMutation.mutate({
      name: newProjectName,
      description: newProjectDescription || null,
      status: "active",
    });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingProject || !editName.trim()) return;
    updateProjectMutation.mutate({
      id: editingProject.id,
      name: editName,
      description: editDescription || null,
    });
  };

  const handleStartInlineEdit = (project: Project) => {
    setEditingTitleId(project.id);
    setInlineTitle(project.name);
  };

  const handleSaveInlineTitle = (projectId: number) => {
    if (!inlineTitle.trim()) return;
    updateProjectMutation.mutate({ id: projectId, name: inlineTitle });
  };

  const handleDeleteProject = (projectId: number) => {
    deleteProjectMutation.mutate(projectId);
  };

  const getProjectTaskCount = (projectId: number) => {
    return tasks.filter((t) => t.projectId === projectId).length;
  };

  const getProjectCompletedCount = (projectId: number) => {
    return tasks.filter(
      (t) => t.projectId === projectId && t.status === "completed",
    ).length;
  };

  const getProjectOwner = (ownerId: number | null) => {
    if (!ownerId) return null;
    return users.find((u) => u.id === ownerId);
  };

  const getProjectProgress = (projectId: number) => {
    const total = getProjectTaskCount(projectId);
    const completed = getProjectCompletedCount(projectId);
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2
            className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3"
            data-testid="text-projects-title"
          >
            <FolderKanban className="w-8 h-8 text-primary" />
            Projects
          </h2>
          <p className="text-slate-500 text-sm">
            Manage and track all your active project portfolios.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-primary hover:bg-indigo-600 text-white gap-2 shadow-lg shadow-primary/20 transition-all"
              data-testid="button-create-project"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Project name..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                data-testid="input-project-name"
              />
              <Textarea
                placeholder="Description (optional)..."
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                data-testid="input-project-description"
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleCreateProject}
                disabled={createProjectMutation.isPending}
                data-testid="button-submit-project"
              >
                {createProjectMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-white border-slate-200 p-8 text-center">
          <FolderKanban className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">
            No projects yet
          </h3>
          <p className="text-slate-500 mt-2">
            Create your first project to get started
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            console.log("Project details *****", projects);
            console.log("tasks details *****", tasks);
            return (
              <motion.div key={project.id}>
                <Card className="hover-elevate bg-white border-slate-200 group overflow-visible cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge
                        className={
                          getProjectTaskCount(project.id) === 0
                            ? "bg-slate-200 text-slate-700"
                            : getProjectCompletedCount(project.id) ===
                                getProjectTaskCount(project.id)
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-indigo-100 text-indigo-700"
                        }
                      >
                        {getProjectTaskCount(project.id) === 0
                          ? "Not Started"
                          : getProjectCompletedCount(project.id) ===
                              getProjectTaskCount(project.id)
                            ? "Completed"
                            : "In Progress"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-600"
                            data-testid={`button-project-actions-${project.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            data-testid={`button-edit-project-${project.id}`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project.id);
                            }}
                            data-testid={`button-delete-project-${project.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <User className="w-3.5 h-3.5" />
                      {getProjectOwner(project.ownerId)?.name || "Unknown"}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pb-6">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">Tasks</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getProjectTaskCount(project.id)} total
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          getProjectCompletedCount(project.id) ===
                          getProjectTaskCount(project.id)
                            ? "bg-emerald-500"
                            : "bg-primary"
                        }`}
                        style={{
                          width: `${getProjectProgress(project.id)}%`,
                        }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-slate-100 bg-slate-50/50 flex flex-col items-start gap-2">
                    <Button
                      variant="ghost"
                      className="w-full text-primary hover:text-indigo-700 font-semibold py-4 transition-colors group"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                      View Board
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit Project Dialog */}
      <Dialog
        open={!!editingProject}
        onOpenChange={(open) => !open && setEditingProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Project Name
              </label>
              <Input
                placeholder="Project name..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-project-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Description
              </label>
              <Textarea
                placeholder="Description (optional)..."
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                data-testid="input-edit-project-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateProjectMutation.isPending}
              data-testid="button-save-edit-project"
            >
              {updateProjectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
