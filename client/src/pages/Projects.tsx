import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus, Eye, User, CheckCircle2, Circle } from "lucide-react";
import { motion } from "framer-motion";

const projectList = [
  { id: 1, name: "Spectropy LMS", createdBy: "Krishna", status: "In Progress", tasks: 8 },
  { id: 2, name: "CognifyX", createdBy: "Arjun", status: "Completed", tasks: 12 },
  { id: 3, name: "RA Portal", createdBy: "Nithya", status: "In Progress", tasks: 5 }
];

const Projects = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <FolderKanban className="w-8 h-8 text-primary" />
            Projects
          </h2>
          <p className="text-slate-500 text-sm">Manage and track all your active project portfolios.</p>
        </div>
        <Button className="bg-primary hover:bg-indigo-600 text-white gap-2 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-5 h-5" />
          Create Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectList.map((project) => (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="hover-elevate bg-white border-slate-200 group overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <Badge variant={project.status === "Completed" ? "default" : "secondary"} className={
                    project.status === "Completed" 
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 no-default-hover-elevate" 
                      : "bg-blue-100 text-blue-700 hover:bg-blue-100 no-default-hover-elevate"
                  }>
                    {project.status === "Completed" ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <Circle className="w-3 h-3 mr-1" />
                    )}
                    {project.status}
                  </Badge>
                  <span className="text-xs font-medium text-slate-400">ID: #{project.id}</span>
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 line-clamp-1">{project.name}</CardTitle>
                <CardDescription className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <User className="w-3.5 h-3.5" />
                  Created by {project.createdBy}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Tasks</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{project.tasks} total</span>
                </div>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${project.status === "Completed" ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ width: project.status === "Completed" ? "100%" : "60%" }}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t border-slate-100 bg-slate-50/50">
                <Button variant="ghost" className="w-full text-primary hover:text-indigo-700 hover:bg-primary/5 font-semibold py-6 transition-colors group">
                  <Eye className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  View Project Details
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
