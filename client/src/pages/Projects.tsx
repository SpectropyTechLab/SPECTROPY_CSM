import { useState } from "react";
import { Plus, Search, Calendar, MoreVertical } from "lucide-react";
import { useProjects, useCreateProject } from "@/hooks/use-projects";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProjectSchema } from "@shared/schema";
import { type CreateProjectRequest } from "@shared/routes";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Projects() {
  const { data: projects, isLoading } = useProjects();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredProjects = projects?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Projects</h1>
          <p className="text-muted-foreground">Manage your ongoing initiatives.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-64 transition-all"
            />
          </div>
          <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-card/50 animate-pulse" />
          ))}
        </div>
      ) : filteredProjects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-center border border-dashed border-border rounded-3xl bg-card/20">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Get started by creating your first project to track tasks and progress.</p>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-primary hover:bg-primary/90 text-white rounded-xl">
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects?.map((project, index) => (
            <motion.div 
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl p-6 group hover:border-primary/50 transition-colors border border-border"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  project.status === 'active' ? 'bg-primary/20 text-primary' : 
                  project.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  <FolderIcon className="w-5 h-5" />
                </div>
                <button className="text-muted-foreground hover:text-white transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{project.name}</h3>
              <p className="text-muted-foreground text-sm mb-6 line-clamp-2 min-h-[40px]">
                {project.description || "No description provided."}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'No date'}</span>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-md font-medium capitalize ${
                   project.status === 'active' ? 'bg-primary/10 text-primary-foreground' : 
                   project.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-gray-500/10 text-gray-400'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 2H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function CreateProjectDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { mutate, isPending } = useCreateProject();
  
  const form = useForm<CreateProjectRequest>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      startDate: new Date(),
    }
  });

  const onSubmit = (data: CreateProjectRequest) => {
    mutate(data, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl px-5 h-11 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
          <Plus className="w-4 h-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">Create New Project</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Website Redesign" className="bg-background border-border focus-visible:ring-primary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What's this project about?" className="bg-background border-border focus-visible:ring-primary min-h-[100px]" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border hover:bg-white/5">Cancel</Button>
              <Button type="submit" disabled={isPending} className="bg-primary hover:bg-primary/90 text-white min-w-[100px]">
                {isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
