import { db } from "./db";
import {
  users, projects, tasks, buckets, notifications, activityLogs,
  deletedProjects, deletedTasks,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Bucket, type InsertBucket,
  type Task, type InsertTask,
  type Notification, type InsertNotification,
  type ActivityLog, type InsertActivityLog,
  type UpdateProjectRequest,
  type UpdateBucketRequest,
  type UpdateTaskRequest
} from "@shared/schema";
import { eq, asc, desc, and } from "drizzle-orm";

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
  deleteProject(id: number, deletedBy: number, deletedByName: string): Promise<{
    project: Project;
    tasks: Task[];
    buckets: Bucket[];
  }>;
  restoreProject(id: number): Promise<{
    project: Project;
    tasks: Task[];
    buckets: Bucket[];
  }>;
  cloneProject(id: number, newName: string, ownerId: number): Promise<Project>;

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
  deleteTask(id: number, deletedBy: number, deletedByName: string, deletedByProject?: boolean): Promise<Task>;
  restoreTask(id: number): Promise<Task>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotifications(userId: number): Promise<Notification[]>;

  // Activity Logs
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(): Promise<ActivityLog[]>;
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

  async deleteProject(id: number, deletedBy: number, deletedByName: string): Promise<{
    project: Project;
    tasks: Task[];
    buckets: Bucket[];
  }> {
    return await db.transaction(async (tx) => {
      const [project] = await tx.select().from(projects).where(eq(projects.id, id));
      if (!project) {
        throw new Error("Project not found");
      }

      const projectBuckets = await tx.select().from(buckets).where(eq(buckets.projectId, id)).orderBy(asc(buckets.position));
      const projectTasks = await tx.select().from(tasks).where(eq(tasks.projectId, id)).orderBy(asc(tasks.position));

      if (projectTasks.length > 0) {
        await tx.insert(deletedTasks).values(
          projectTasks.map((task) => ({
            ...task,
            deletedByProject: true,
            deletedAt: new Date(),
            deletedBy,
            deletedByName,
          })),
        );
      }

      await tx.insert(deletedProjects).values({
        ...project,
        buckets: JSON.parse(JSON.stringify(projectBuckets)),
        deletedAt: new Date(),
        deletedBy,
        deletedByName,
      });

      await tx.delete(tasks).where(eq(tasks.projectId, id));
      await tx.delete(buckets).where(eq(buckets.projectId, id));
      await tx.delete(projects).where(eq(projects.id, id));

      return { project, tasks: projectTasks, buckets: projectBuckets };
    });
  }

  async cloneProject(id: number, newName: string, ownerId: number): Promise<Project> {
    const sourceProject = await this.getProject(id);
    if (!sourceProject) {
      throw new Error("Project not found");
    }

    const [newProject] = await db.insert(projects).values({
      name: newName,
      description: sourceProject.description,
      status: "active",
      startDate: new Date(),
      ownerId: ownerId,
      lastModifiedBy: ownerId,
    }).returning();

    const sourceBuckets = await this.getBuckets(id);

    for (const bucket of sourceBuckets) {
      await db.insert(buckets).values({
        title: bucket.title,
        projectId: newProject.id,
        position: bucket.position,
      });
    }

    return newProject;
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
    await db.delete(tasks).where(eq(tasks.bucketId, id));
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

  async deleteTask(id: number, deletedBy: number, deletedByName: string, deletedByProject = false): Promise<Task> {
    return await db.transaction(async (tx) => {
      const [task] = await tx.select().from(tasks).where(eq(tasks.id, id));
      if (!task) {
        throw new Error("Task not found");
      }

      await tx.insert(deletedTasks).values({
        ...task,
        deletedByProject,
        deletedAt: new Date(),
        deletedBy,
        deletedByName,
      });

      await tx.delete(tasks).where(eq(tasks.id, id));
      return task;
    });
  }

  async restoreProject(id: number): Promise<{
    project: Project;
    tasks: Task[];
    buckets: Bucket[];
  }> {
    return await db.transaction(async (tx) => {
      const [deletedProject] = await tx.select().from(deletedProjects).where(eq(deletedProjects.id, id));
      if (!deletedProject) {
        throw new Error("Deleted project not found");
      }

      const existingProject = await tx.select().from(projects).where(eq(projects.id, id));
      if (existingProject.length > 0) {
        throw new Error("Project already exists");
      }

      const [restoredProject] = await tx.insert(projects).values({
        id: deletedProject.id,
        name: deletedProject.name,
        description: deletedProject.description,
        status: deletedProject.status ?? "active",
        startDate: deletedProject.startDate,
        endDate: deletedProject.endDate,
        ownerId: deletedProject.ownerId,
        lastModifiedBy: deletedProject.lastModifiedBy,
      }).returning();

      const bucketSnapshots = Array.isArray(deletedProject.buckets) ? deletedProject.buckets : [];
      let restoredBuckets: Bucket[] = [];
      if (bucketSnapshots.length > 0) {
        const bucketValues = bucketSnapshots.map((bucket) => ({
          id: bucket.id,
          title: bucket.title,
          projectId: restoredProject.id,
          position: bucket.position ?? 0,
          customFieldsConfig: bucket.customFieldsConfig ?? [],
        }));
        restoredBuckets = await tx.insert(buckets).values(bucketValues).returning();
      }

      const deletedProjectTasks = await tx
        .select()
        .from(deletedTasks)
        .where(eq(deletedTasks.projectId, restoredProject.id))
        .orderBy(asc(deletedTasks.position));

      const tasksToRestore = deletedProjectTasks.filter((task) => task.deletedByProject);
      let restoredTasks: Task[] = [];
      if (tasksToRestore.length > 0) {
        const bucketIdSet = new Set(restoredBuckets.map((bucket) => bucket.id));
        const taskValues = tasksToRestore.map((task) => {
          const {
            deletedAt: _deletedAt,
            deletedBy: _deletedBy,
            deletedByName: _deletedByName,
            deletedByProject: _deletedByProject,
            ...taskData
          } = task;

          const bucketId = taskData.bucketId && bucketIdSet.has(taskData.bucketId)
            ? taskData.bucketId
            : null;

          return {
            ...taskData,
            bucketId,
          };
        });

        restoredTasks = await tx.insert(tasks).values(taskValues).returning();
        await tx.delete(deletedTasks).where(and(
          eq(deletedTasks.projectId, restoredProject.id),
          eq(deletedTasks.deletedByProject, true),
        ));
      } else {
        await tx.delete(deletedTasks).where(and(
          eq(deletedTasks.projectId, restoredProject.id),
          eq(deletedTasks.deletedByProject, true),
        ));
      }

      await tx.delete(deletedProjects).where(eq(deletedProjects.id, restoredProject.id));

      return { project: restoredProject, tasks: restoredTasks, buckets: restoredBuckets };
    });
  }

  async restoreTask(id: number): Promise<Task> {
    return await db.transaction(async (tx) => {
      const [deletedTask] = await tx.select().from(deletedTasks).where(eq(deletedTasks.id, id));
      if (!deletedTask) {
        throw new Error("Deleted task not found");
      }

      const existingTask = await tx.select().from(tasks).where(eq(tasks.id, id));
      if (existingTask.length > 0) {
        throw new Error("Task already exists");
      }

      if (deletedTask.projectId) {
        const [project] = await tx.select().from(projects).where(eq(projects.id, deletedTask.projectId));
        if (!project) {
          throw new Error("Project not found for task restore");
        }
      }

      let bucketId: number | null = deletedTask.bucketId ?? null;
      if (bucketId) {
        const [bucket] = await tx.select().from(buckets).where(eq(buckets.id, bucketId));
        if (!bucket) {
          bucketId = null;
        }
      }

      const {
        deletedAt: _deletedAt,
        deletedBy: _deletedBy,
        deletedByName: _deletedByName,
        deletedByProject: _deletedByProject,
        ...taskData
      } = deletedTask;

      const [restoredTask] = await tx.insert(tasks).values({
        ...taskData,
        bucketId,
      }).returning();

      await tx.delete(deletedTasks).where(eq(deletedTasks.id, id));
      return restoredTask;
    });
  }

  // Notifications
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getNotifications(userId: number): Promise<Notification[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId));
  }

  // Activity Logs
  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(insertLog).returning();
    return log;
  }

  async getActivityLogs(): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt));
  }
}

export const storage = new DatabaseStorage();
