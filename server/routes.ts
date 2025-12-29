import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

async function seedDatabase() {
  const users = await storage.getUsers();
  if (users.length === 0) {
    const user = await storage.createUser({
      username: "admin",
      name: "Admin User",
      title: "Project Manager",
      avatar: "https://github.com/shadcn.png"
    });

    const project = await storage.createProject({
      name: "Website Redesign",
      description: "Redesigning the corporate website for better UX.",
      status: "active",
      startDate: new Date(),
    });

    await storage.createTask({
      title: "Design Mockups",
      description: "Create initial high-fidelity mockups in Figma",
      status: "in_progress",
      priority: "high",
      projectId: project.id,
      assigneeId: user.id,
      dueDate: new Date(Date.now() + 86400000 * 3), // 3 days
    });

    await storage.createTask({
      title: "Setup CI/CD",
      description: "Configure GitHub Actions pipeline",
      status: "todo",
      priority: "medium",
      projectId: project.id,
    });
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Projects
  app.get(api.projects.list.path, async (req, res) => {
    const projects = await storage.getProjects();
    res.json(projects);
  });

  app.get(api.projects.get.path, async (req, res) => {
    const project = await storage.getProject(Number(req.params.id));
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  });

  app.post(api.projects.create.path, async (req, res) => {
    try {
      const input = api.projects.create.input.parse(req.body);
      const project = await storage.createProject(input);
      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.projects.update.path, async (req, res) => {
    try {
      const input = api.projects.update.input.parse(req.body);
      const project = await storage.updateProject(Number(req.params.id), input);
      res.json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Project not found" });
    }
  });

  app.delete(api.projects.delete.path, async (req, res) => {
    await storage.deleteProject(Number(req.params.id));
    res.status(204).send();
  });

  // Tasks
  app.get(api.tasks.list.path, async (req, res) => {
    const projectId = req.query.projectId ? Number(req.query.projectId) : undefined;
    const tasks = await storage.getTasks(projectId);
    res.json(tasks);
  });

  app.post(api.tasks.create.path, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    try {
      const input = api.tasks.update.input.parse(req.body);
      const task = await storage.updateTask(Number(req.params.id), input);
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Task not found" });
    }
  });

  app.delete(api.tasks.delete.path, async (req, res) => {
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // Users
  app.get(api.users.list.path, async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });

  // Seed data
  seedDatabase();

  return httpServer;
}
