import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password"),
  name: text("name").notNull(),
  avatar: text("avatar"),
  title: text("title"),
  role: text("role").notNull().default("User"),
  otpVerified: boolean("otp_verified").default(false),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  ownerId: integer("owner_id").references(() => users.id),
});

export const buckets = pgTable("buckets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"),
  priority: text("priority").notNull().default("medium"),
  projectId: integer("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  bucketId: integer("bucket_id").references(() => buckets.id, { onDelete: "set null" }),
  assigneeId: integer("assignee_id").references(() => users.id),
  estimateHours: integer("estimate_hours").default(0),
  estimateMinutes: integer("estimate_minutes").default(0),
  history: text("history").array().default([]),
  startDate: timestamp("start_date"),
  dueDate: timestamp("due_date"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const projectsRelations = relations(projects, ({ many, one }) => ({
  tasks: many(tasks),
  buckets: many(buckets),
  owner: one(users, {
    fields: [projects.ownerId],
    references: [users.id],
  }),
}));

export const bucketsRelations = relations(buckets, ({ one, many }) => ({
  project: one(projects, {
    fields: [buckets.projectId],
    references: [projects.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  bucket: one(buckets, {
    fields: [tasks.bucketId],
    references: [buckets.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true });
export const insertBucketSchema = createInsertSchema(buckets).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true }).extend({
  startDate: z.union([z.coerce.date(), z.null()]).optional(),
  dueDate: z.union([z.coerce.date(), z.null()]).optional(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Bucket = typeof buckets.$inferSelect;
export type InsertBucket = z.infer<typeof insertBucketSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// API Types
export type CreateProjectRequest = InsertProject;
export type UpdateProjectRequest = Partial<InsertProject>;
export type CreateBucketRequest = InsertBucket;
export type UpdateBucketRequest = Partial<InsertBucket>;
export type CreateTaskRequest = InsertTask;
export type UpdateTaskRequest = Partial<InsertTask>;
