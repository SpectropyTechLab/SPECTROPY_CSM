import { db } from "./db";
import {
  users, projects, tasks, buckets,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Bucket, type InsertBucket,
  type Task, type InsertTask,
  type UpdateProjectRequest,
  type UpdateBucketRequest,
  type UpdateTaskRequest
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: UpdateProjectRequest): Promise<Project>;
  deleteProject(id: number): Promise<void>;

  // Buckets
  getBuckets(projectId: number): Promise<Bucket[]>;
  getAllBuckets(): Promise<Bucket[]>;
  getBucket(id: number): Promise<Bucket | undefined>;
  createBucket(bucket: InsertBucket): Promise<Bucket>;
  updateBucket(id: number, updates: UpdateBucketRequest): Promise<Bucket>;
  deleteBucket(id: number): Promise<void>;

  // Tasks
  getTasks(projectId?: number): Promise<Task[]>;
  getTasksByBucket(bucketId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  deleteTask(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, updates: UpdateProjectRequest): Promise<Project> {
    const [project] = await db.update(projects).set(updates).where(eq(projects.id, id)).returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Buckets
  async getBuckets(projectId: number): Promise<Bucket[]> {
    return await db.select().from(buckets).where(eq(buckets.projectId, projectId)).orderBy(asc(buckets.position));
  }

  async getAllBuckets(): Promise<Bucket[]> {
    return await db.select().from(buckets).orderBy(asc(buckets.position));
  }

  async getBucket(id: number): Promise<Bucket | undefined> {
    const [bucket] = await db.select().from(buckets).where(eq(buckets.id, id));
    return bucket;
  }

  async createBucket(insertBucket: InsertBucket): Promise<Bucket> {
    const [bucket] = await db.insert(buckets).values(insertBucket).returning();
    return bucket;
  }

  async updateBucket(id: number, updates: UpdateBucketRequest): Promise<Bucket> {
    const [bucket] = await db.update(buckets).set(updates).where(eq(buckets.id, id)).returning();
    return bucket;
  }

  async deleteBucket(id: number): Promise<void> {
    await db.delete(buckets).where(eq(buckets.id, id));
  }

  // Tasks
  async getTasks(projectId?: number): Promise<Task[]> {
    if (projectId) {
      return await db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(asc(tasks.position));
    }
    return await db.select().from(tasks).orderBy(asc(tasks.position));
  }

  async getTasksByBucket(bucketId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.bucketId, bucketId)).orderBy(asc(tasks.position));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const [task] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return task;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }
}

export const storage = new DatabaseStorage();
