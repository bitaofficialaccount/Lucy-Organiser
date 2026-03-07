import { db } from "./db";
import {
  users, type User, type InsertUser,
  chores, type Chore, type InsertChore,
  allowanceRequests, type AllowanceRequest, type InsertAllowanceRequest,
  messages, type Message, type InsertMessage,
  appointments, type Appointment, type InsertAppointment
} from "@shared/schema";
import { eq, or, and } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role: string, parentId?: number | null, color?: string | null }): Promise<User>;
  updateUserBalance(id: number, amount: number): Promise<User | undefined>;
  getFamilyMembers(parentId: number): Promise<User[]>;
  
  getChores(userId: number, role: string): Promise<Chore[]>;
  createChore(chore: InsertChore): Promise<Chore>;
  markChoreDone(id: number): Promise<Chore | undefined>;

  getAllowanceRequests(userId: number, role: string): Promise<AllowanceRequest[]>;
  createAllowanceRequest(request: InsertAllowanceRequest): Promise<AllowanceRequest>;
  updateAllowanceRequest(id: number, status: string): Promise<AllowanceRequest | undefined>;

  getMessages(userId: number, otherId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  getAppointments(familyId: number): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { role: string, parentId?: number | null, color?: string | null }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserBalance(id: number, amount: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({ balance: amount }).where(eq(users.id, id)).returning();
    return user;
  }

  async getFamilyMembers(parentId: number): Promise<User[]> {
    return await db.select().from(users).where(or(eq(users.id, parentId), eq(users.parentId, parentId)));
  }

  async getChores(userId: number, role: string): Promise<Chore[]> {
    if (role === 'parent') {
      return await db.select().from(chores).where(eq(chores.parentId, userId));
    }
    return await db.select().from(chores).where(eq(chores.kidId, userId));
  }

  async createChore(chore: InsertChore): Promise<Chore> {
    const [newChore] = await db.insert(chores).values(chore).returning();
    return newChore;
  }

  async markChoreDone(id: number): Promise<Chore | undefined> {
    const [updatedChore] = await db.update(chores).set({ isDone: true }).where(eq(chores.id, id)).returning();
    return updatedChore;
  }

  async getAllowanceRequests(userId: number, role: string): Promise<AllowanceRequest[]> {
    if (role === 'parent') {
      return await db.select().from(allowanceRequests).where(eq(allowanceRequests.parentId, userId));
    }
    return await db.select().from(allowanceRequests).where(eq(allowanceRequests.kidId, userId));
  }

  async createAllowanceRequest(request: InsertAllowanceRequest): Promise<AllowanceRequest> {
    const [newReq] = await db.insert(allowanceRequests).values(request).returning();
    return newReq;
  }

  async updateAllowanceRequest(id: number, status: string): Promise<AllowanceRequest | undefined> {
    const [updated] = await db.update(allowanceRequests).set({ status }).where(eq(allowanceRequests.id, id)).returning();
    return updated;
  }

  async getMessages(userId: number, otherId: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, otherId)),
        and(eq(messages.senderId, otherId), eq(messages.receiverId, userId))
      )
    ).orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getAppointments(familyId: number): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.familyId, familyId));
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const [newAppt] = await db.insert(appointments).values(appointment).returning();
    return newAppt;
  }
}

export const storage = new DatabaseStorage();
