import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcrypt";

const otpMap = new Map<string, { code: string; expires: number; verified: boolean }>();
const SALT_ROUNDS = 10;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function seedDatabase() {
  const users = await storage.getUsers();
  if (users.length === 0) {
    const adminHash = await hashPassword("admin123");
    const userHash = await hashPassword("user123");
    
    const user = await storage.createUser({
      username: "admin",
      email: "admin@spectropy.com",
      password: adminHash,
      name: "Admin User",
      title: "Project Manager",
      avatar: "https://github.com/shadcn.png",
      role: "Admin",
      otpVerified: true,
    });

    await storage.createUser({
      username: "user",
      email: "user@spectropy.com",
      password: userHash,
      name: "Standard User",
      title: "Developer",
      role: "User",
      otpVerified: true,
    });

    const project = await storage.createProject({
      name: "Website Redesign",
      description: "Redesigning the corporate website for better UX.",
      status: "active",
      startDate: new Date(),
      ownerId: user.id,
    });

    const bucket1 = await storage.createBucket({
      title: "To Do",
      projectId: project.id,
      position: 0,
    });

    const bucket2 = await storage.createBucket({
      title: "In Progress",
      projectId: project.id,
      position: 1,
    });

    const bucket3 = await storage.createBucket({
      title: "Done",
      projectId: project.id,
      position: 2,
    });

    await storage.createTask({
      title: "Design Mockups",
      description: "Create initial high-fidelity mockups in Figma",
      status: "in_progress",
      priority: "high",
      projectId: project.id,
      bucketId: bucket2.id,
      assigneeId: user.id,
      dueDate: new Date(Date.now() + 86400000 * 3),
      position: 0,
      history: [`Created on ${new Date().toLocaleDateString()}`],
    });

    await storage.createTask({
      title: "Setup CI/CD",
      description: "Configure GitHub Actions pipeline",
      status: "todo",
      priority: "medium",
      projectId: project.id,
      bucketId: bucket1.id,
      position: 0,
      history: [`Created on ${new Date().toLocaleDateString()}`],
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

  // Buckets
  app.get(api.buckets.list.path, async (req, res) => {
    const projectId = Number(req.query.projectId);
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    const buckets = await storage.getBuckets(projectId);
    res.json(buckets);
  });

  app.post(api.buckets.create.path, async (req, res) => {
    try {
      const input = api.buckets.create.input.parse(req.body);
      const bucket = await storage.createBucket(input);
      res.status(201).json(bucket);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.patch(api.buckets.update.path, async (req, res) => {
    try {
      const input = api.buckets.update.input.parse(req.body);
      const bucket = await storage.updateBucket(Number(req.params.id), input);
      res.json(bucket);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(404).json({ message: "Bucket not found" });
    }
  });

  app.delete(api.buckets.delete.path, async (req, res) => {
    await storage.deleteBucket(Number(req.params.id));
    res.status(204).send();
  });

  // Auth - OTP
  app.post(api.auth.sendOtp.path, async (req, res) => {
    try {
      const { email } = api.auth.sendOtp.input.parse(req.body);
      const otp = generateOTP();
      otpMap.set(email, { 
        code: otp, 
        expires: Date.now() + 5 * 60 * 1000,
        verified: false 
      });
      console.log(`OTP for ${email}: ${otp}`);
      res.json({ message: "OTP sent successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.auth.verifyOtp.path, async (req, res) => {
    try {
      const { email, otp } = api.auth.verifyOtp.input.parse(req.body);
      const stored = otpMap.get(email);
      
      if (!stored) {
        return res.status(400).json({ message: "No OTP found for this email" });
      }
      if (Date.now() > stored.expires) {
        otpMap.delete(email);
        return res.status(400).json({ message: "OTP expired" });
      }
      if (stored.code !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      
      stored.verified = true;
      res.json({ verified: true });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const { email, password, name, role } = api.auth.register.input.parse(req.body);
      
      const stored = otpMap.get(email);
      if (!stored || !stored.verified) {
        return res.status(400).json({ message: "Please verify OTP first" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }
      
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username: email.split('@')[0],
        email,
        password: hashedPassword,
        name,
        role: role || "User",
        otpVerified: true,
      });
      
      otpMap.delete(email);
      const { password: _, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const { email, password } = api.auth.login.input.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const isValid = await verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  // Reports API
  app.get('/api/reports/summary', async (req, res) => {
    const projects = await storage.getProjects();
    const tasks = await storage.getTasks();
    const users = await storage.getUsers();
    const activeUsers = users.filter(u => u.otpVerified);
    
    res.json({
      totalProjects: projects.length,
      totalTasks: tasks.length,
      activeUsers: activeUsers.length,
    });
  });

  app.get('/api/reports/project-progress', async (req, res) => {
    const projects = await storage.getProjects();
    const tasks = await storage.getTasks();
    
    const projectProgress = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const completed = projectTasks.filter(t => t.status === 'completed').length;
      return {
        name: project.name,
        completed,
        total: projectTasks.length,
        percentage: projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
      };
    });
    
    res.json(projectProgress);
  });

  app.get('/api/reports/user-performance', async (req, res) => {
    const users = await storage.getUsers();
    const tasks = await storage.getTasks();
    
    const userPerformance = users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const completed = userTasks.filter(t => t.status === 'completed').length;
      const totalEstimate = userTasks.reduce((acc, t) => acc + (t.estimateHours || 0) + (t.estimateMinutes || 0) / 60, 0);
      const avgTime = userTasks.length > 0 ? totalEstimate / userTasks.length : 0;
      return {
        user: user.name,
        userId: user.id,
        completed,
        total: userTasks.length,
        avgTime: Math.round(avgTime * 10) / 10,
      };
    }).filter(u => u.total > 0);
    
    res.json(userPerformance);
  });

  app.get('/api/reports/bucket-stats', async (req, res) => {
    const tasks = await storage.getTasks();
    const projects = await storage.getProjects();
    
    const bucketStats: { bucket: string; count: number }[] = [];
    
    for (const project of projects) {
      const buckets = await storage.getBuckets(project.id);
      for (const bucket of buckets) {
        const existingBucket = bucketStats.find(b => b.bucket === bucket.title);
        const bucketTaskCount = tasks.filter(t => t.bucketId === bucket.id).length;
        if (existingBucket) {
          existingBucket.count += bucketTaskCount;
        } else {
          bucketStats.push({ bucket: bucket.title, count: bucketTaskCount });
        }
      }
    }
    
    res.json(bucketStats);
  });

  app.get('/api/reports/status-breakdown', async (req, res) => {
    const tasks = await storage.getTasks();
    
    const statusMap: Record<string, number> = {};
    tasks.forEach(task => {
      const status = task.status || 'unknown';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    const statusBreakdown = Object.entries(statusMap).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      count,
    }));
    
    res.json(statusBreakdown);
  });

  // Seed data
  seedDatabase();

  return httpServer;
}
