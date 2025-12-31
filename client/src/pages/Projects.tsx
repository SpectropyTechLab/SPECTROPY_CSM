import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { FolderKanban, Plus, Eye, User, CheckCircle2, Circle, Loader2, MoreVertical, Pencil, Archive, Type } from "lucide-react";
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
      toast({ title: "Project created", description: "Your new project has been created successfully." });
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
      toast({ title: "Project updated", description: "Project has been updated successfully." });
    },
  });

  const archiveProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("PATCH", `/api/projects/${id}`, { status: "archived" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project archived", description: "Project has been archived." });
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

  const handleArchiveProject = (projectId: number) => {
    archiveProjectMutation.mutate(projectId);
  };

  const getProjectTaskCount = (projectId: number) => {
    return tasks.filter((t) => t.projectId === projectId).length;
  };

  const getProjectCompletedCount = (projectId: number) => {
    return tasks.filter((t) => t.projectId === projectId && t.status === "done").length;
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
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3" data-testid="text-projects-title">
            <FolderKanban className="w-8 h-8 text-primary" />
            Projects
          </h2>
          <p className="text-slate-500 text-sm">Manage and track all your active project portfolios.</p>
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
                {createProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <Card className="bg-white border-slate-200 p-8 text-center">
          <FolderKanban className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">No projects yet</h3>
          <p className="text-slate-500 mt-2">Create your first project to get started</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const taskCount = getProjectTaskCount(project.id);
            const progress = getProjectProgress(project.id);
            const owner = getProjectOwner(project.ownerId);
            const isCompleted = project.status === "completed" || progress === 100;

            return (
              <motion.div 
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                data-testid={`project-card-${project.id}`}
              >
                <Card 
                  className="hover-elevate bg-white border-slate-200 group overflow-visible cursor-pointer"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <Badge 
                        variant={isCompleted ? "default" : "secondary"} 
                        className={
                          project.status === "archived"
                            ? "bg-slate-100 text-slate-600 no-default-hover-elevate"
                            : isCompleted 
                              ? "bg-emerald-100 text-emerald-700 no-default-hover-elevate" 
                              : "bg-blue-100 text-blue-700 no-default-hover-elevate"
                        }
                      >
                        {project.status === "archived" ? (
                          <Archive className="w-3 h-3 mr-1" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Circle className="w-3 h-3 mr-1" />
                        )}
                        {project.status === "archived" ? "Archived" : isCompleted ? "Completed" : "In Progress"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`button-project-menu-${project.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={() => handleEditProject(project)}
                            data-testid={`menu-edit-project-${project.id}`}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleStartInlineEdit(project)}
                            data-testid={`menu-edit-title-${project.id}`}
                          >
                            <Type className="h-4 w-4 mr-2" />
                            Edit Title
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleArchiveProject(project.id)}
                            className="text-amber-600"
                            data-testid={`menu-archive-project-${project.id}`}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {editingTitleId === project.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={inlineTitle}
                          onChange={(e) => setInlineTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveInlineTitle(project.id);
                            if (e.key === "Escape") setEditingTitleId(null);
                          }}
                          className="text-lg font-bold"
                          autoFocus
                          data-testid={`input-inline-title-${project.id}`}
                        />
                        <Button size="sm" onClick={() => handleSaveInlineTitle(project.id)} data-testid={`button-save-title-${project.id}`}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1" data-testid={`text-project-name-${project.id}`}>
                        {project.name}
                      </CardTitle>
                    )}
                    <CardDescription className="flex items-center gap-1.5 text-slate-500 text-sm">
                      <User className="w-3.5 h-3.5" />
                      {owner ? `Created by ${owner.name}` : "No owner assigned"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Tasks</span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{taskCount} total</span>
                    </div>
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all ${isCompleted ? "bg-emerald-500" : "bg-primary"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-slate-100 bg-slate-50/50">
                    <Button 
                      variant="ghost" 
                      className="w-full text-primary hover:text-indigo-700 font-semibold py-6 transition-colors group"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}
                      data-testid={`button-view-project-${project.id}`}
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
      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Project Name</label>
              <Input
                placeholder="Project name..."
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="input-edit-project-name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
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
              {updateProjectMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
