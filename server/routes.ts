import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import passport from "passport";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth } from "./auth";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  app.post(api.auth.registerParent.path, async (req, res) => {
    try {
      const input = api.auth.registerParent.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        username: input.username,
        password: input.password,
        phone: input.phone || null,
        role: "parent",
        parentId: null,
        color: null,
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        req.session.save((err) => {
          if (err) return res.status(500).json({ message: "Session save failed" });
          res.status(201).json(user);
        });
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.registerKid.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "parent") {
      return res.status(401).json({ message: "Only parents can register kids" });
    }
    
    try {
      const input = api.auth.registerKid.input.parse(req.body);
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...input,
        role: "kid",
        parentId: req.user.id,
      });

      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return res.status(500).json({ message: "Internal server error" });
      if (!user) return res.status(401).json(info || { message: "Invalid username or password" });
      req.login(user, (err: any) => {
        if (err) return res.status(500).json({ message: "Internal server error" });
        req.session.save((err) => {
          if (err) return res.status(500).json({ message: "Session save failed" });
          res.status(200).json(user);
        });
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.status(200).send();
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
    res.status(200).json(req.user);
  });

  app.get(api.auth.lookup.path, async (req, res) => {
    const user = await storage.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({
      username: user.username,
      color: user.color,
      role: user.role,
    });
  });

  app.patch(api.auth.updateProfile.path, (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  }, async (req, res) => {
    try {
      const input = api.auth.updateProfile.input.parse(req.body);
      const user = await storage.updateUserProfile(req.user!.id, input);
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  // Check auth middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  };

  app.get(api.family.getMembers.path, requireAuth, async (req, res) => {
    const familyId = req.user.role === 'parent' ? req.user.id : req.user.parentId;
    const members = await storage.getFamilyMembers(familyId!);
    res.status(200).json(members);
  });

  app.patch(api.family.updateBalance.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'parent') return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.family.updateBalance.input.parse(req.body);
      const user = await storage.updateUserBalance(Number(req.params.id), input.amount);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.status(200).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.get(api.chores.list.path, requireAuth, async (req, res) => {
    const chores = await storage.getChores(req.user.id, req.user.role);
    res.status(200).json(chores);
  });

  app.post(api.chores.create.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'parent') return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.chores.create.input.parse(req.body);
      const chore = await storage.createChore({
        ...input,
        parentId: req.user.id,
      });
      res.status(201).json(chore);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.patch(api.chores.markDone.path, requireAuth, async (req, res) => {
    const chore = await storage.markChoreDone(Number(req.params.id));
    if (!chore) return res.status(404).json({ message: "Chore not found" });
    res.status(200).json(chore);
  });

  app.get(api.allowance.list.path, requireAuth, async (req, res) => {
    const requests = await storage.getAllowanceRequests(req.user.id, req.user.role);
    res.status(200).json(requests);
  });

  app.post(api.allowance.request.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'kid') return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.allowance.request.input.parse(req.body);
      const request = await storage.createAllowanceRequest({
        kidId: req.user.id,
        parentId: req.user.parentId!,
        amount: input.amount,
      });
      res.status(201).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.patch(api.allowance.respond.path, requireAuth, async (req, res) => {
    if (req.user.role !== 'parent') return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.allowance.respond.input.parse(req.body);
      const request = await storage.updateAllowanceRequest(Number(req.params.id), input.status);
      if (!request) return res.status(404).json({ message: "Request not found" });
      
      if (input.status === "approved") {
        const kid = await storage.getUser(request.kidId);
        if (kid) {
          await storage.updateUserBalance(kid.id, kid.balance + request.amount);
        }
      }
      
      res.status(200).json(request);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.get(api.messages.list.path, requireAuth, async (req, res) => {
    const messages = await storage.getMessages(req.user.id, Number(req.params.otherId));
    res.status(200).json(messages);
  });

  app.post(api.messages.send.path, requireAuth, async (req, res) => {
    try {
      const input = api.messages.send.input.parse(req.body);
      const message = await storage.createMessage({
        senderId: req.user.id,
        receiverId: input.receiverId,
        content: input.content,
      });
      res.status(201).json(message);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.get(api.appointments.list.path, requireAuth, async (req, res) => {
    const familyId = req.user.role === 'parent' ? req.user.id : req.user.parentId;
    const appointments = await storage.getAppointments(familyId!);
    res.status(200).json(appointments);
  });

  app.post(api.appointments.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.appointments.create.input.parse(req.body);
      const familyId = req.user.role === 'parent' ? req.user.id : req.user.parentId!;
      const appointment = await storage.createAppointment({
        familyId,
        title: input.title,
        date: input.date, // YYYY-MM-DD as string, no timezone confusion
        createdBy: req.user.id,
      });
      res.status(201).json(appointment);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.delete(api.appointments.delete.path, requireAuth, async (req, res) => {
    await storage.deleteAppointment(Number(req.params.id));
    res.status(200).send();
  });

  // Personal Tasks (private to-do list)
  app.get(api.tasks.list.path, requireAuth, async (req, res) => {
    const tasks = await storage.getPersonalTasks(req.user.id);
    res.status(200).json(tasks);
  });

  app.post(api.tasks.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createPersonalTask({
        userId: req.user.id,
        title: input.title,
      });
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.patch(api.tasks.toggle.path, requireAuth, async (req, res) => {
    const task = await storage.togglePersonalTask(Number(req.params.id));
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(task);
  });

  app.delete(api.tasks.delete.path, requireAuth, async (req, res) => {
    await storage.deletePersonalTask(Number(req.params.id));
    res.status(200).send();
  });

  // Reminders
  app.get(api.reminders.list.path, requireAuth, async (req, res) => {
    const list = await storage.getReminders(req.user.id);
    res.status(200).json(list);
  });

  app.post(api.reminders.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.reminders.create.input.parse(req.body);
      const reminder = await storage.createReminder({
        userId: req.user.id,
        title: input.title,
        time: input.time,
        recurring: input.recurring,
        sound: input.sound,
        enabled: true,
      });
      res.status(201).json(reminder);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.patch(api.reminders.update.path, requireAuth, async (req, res) => {
    try {
      const input = api.reminders.update.input.parse(req.body);
      const reminder = await storage.updateReminder(Number(req.params.id), input);
      if (!reminder) return res.status(404).json({ message: "Reminder not found" });
      res.status(200).json(reminder);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      res.status(500).json({ message: "Error" });
    }
  });

  app.delete(api.reminders.delete.path, requireAuth, async (req, res) => {
    await storage.deleteReminder(Number(req.params.id));
    res.status(200).send();
  });

  // Setup WebSocket for Simple-Peer signaling
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });
  
  const clients = new Map<number, WebSocket>();

  wss.on("connection", (ws, req) => {
    // Simple basic auth via query param for simplicity in this MVP
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const userId = Number(url.searchParams.get("userId"));
    
    if (userId && !isNaN(userId)) {
      clients.set(userId, ws);
    }

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "signal" && message.payload) {
          const receiverWs = clients.get(message.payload.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: "signal",
              payload: {
                senderId: userId,
                signalData: message.payload.signalData
              }
            }));
          }
        }
      } catch (err) {
        console.error("WS error", err);
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
      }
    });
  });

  return httpServer;
}
