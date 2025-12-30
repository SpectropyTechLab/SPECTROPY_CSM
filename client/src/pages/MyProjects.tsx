import React from "react";

export default function MyProjects() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-white mb-1">My Projects</h1>
      <p className="text-muted-foreground">Manage your assigned projects and tasks.</p>
      
      <div className="flex flex-col items-center justify-center h-96 text-center border border-dashed border-border rounded-3xl bg-card/20">
        <h3 className="text-xl font-bold text-white mb-2">Welcome to your workspace</h3>
        <p className="text-muted-foreground max-w-sm mb-6">You will see your assigned projects here soon.</p>
      </div>
    </div>
  );
}
