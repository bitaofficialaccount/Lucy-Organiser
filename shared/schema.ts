import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'parent' | 'kid'
  parentId: integer("parent_id"), // null if parent
  color: text("color"), // e.g. #FF4F00 for kids
  balance: integer("balance").default(0).notNull(), // Allowance balance in cents
  phone: text("phone"), // Parent's phone for "If Lost" feature
});

export const chores = pgTable("chores", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  kidId: integer("kid_id").notNull(),
  parentId: integer("parent_id").notNull(),
  isDone: boolean("is_done").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const allowanceRequests = pgTable("allowance_requests", {
  id: serial("id").primaryKey(),
  kidId: integer("kid_id").notNull(),
  parentId: integer("parent_id").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default('pending').notNull(), // 'pending' | 'approved' | 'rejected'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  familyId: integer("family_id").notNull(), // ID of the parent
  title: text("title").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format to avoid timezone issues
  createdBy: integer("created_by").notNull(), // user id who added it
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Personal to-do list items (private to each user)
export const personalTasks = pgTable("personal_tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  isDone: boolean("is_done").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reminders with optional recurrence and sound
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  time: text("time").notNull(), // "HH:MM" 24-hour
  recurring: text("recurring").notNull().default("none"), // 'none' | 'daily' | 'weekly'
  sound: text("sound").notNull().default("bell"), // 'bell' | 'chime' | 'beep'
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  parent: one(users, {
    fields: [users.parentId],
    references: [users.id],
    relationName: "family_members"
  }),
  kids: many(users, { relationName: "family_members" })
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertChoreSchema = createInsertSchema(chores).omit({ id: true, createdAt: true });
export const insertAllowanceRequestSchema = createInsertSchema(allowanceRequests).omit({ id: true, createdAt: true, status: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true, createdAt: true });
export const insertPersonalTaskSchema = createInsertSchema(personalTasks).omit({ id: true, createdAt: true, isDone: true });
export const insertReminderSchema = createInsertSchema(reminders).omit({ id: true, createdAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Chore = typeof chores.$inferSelect;
export type InsertChore = z.infer<typeof insertChoreSchema>;

export type AllowanceRequest = typeof allowanceRequests.$inferSelect;
export type InsertAllowanceRequest = z.infer<typeof insertAllowanceRequestSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type PersonalTask = typeof personalTasks.$inferSelect;
export type InsertPersonalTask = z.infer<typeof insertPersonalTaskSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;
