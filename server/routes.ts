import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Middleware to verify JWT
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(401).json({ message: "Forbidden" });
    (req as any).user = user;
    next();
  });
};

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Auth Routes
  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      
      const existingUser = await storage.getUserByUsername(input.username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);
      const user = await storage.createUser({ ...input, password: hashedPassword });
      
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      
      res.status(201).json({ token, user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByUsername(input.username);
      
      if (!user || !(await bcrypt.compare(input.password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user });
    } catch (err) {
       if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.auth.me.path, authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(user);
  });

  // Task Routes - All protected
  app.get(api.tasks.list.path, authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const tasks = await storage.getTasks(userId);
    res.json(tasks);
  });

  app.post(api.tasks.create.path, authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const input = api.tasks.create.input.parse(req.body);
      const task = await storage.createTask(userId, input);
      res.status(201).json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.patch(api.tasks.update.path, authenticateToken, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const taskId = Number(req.params.id);
      const input = api.tasks.update.input.parse(req.body);
      
      const task = await storage.updateTask(taskId, userId, input);
      if (!task) return res.status(404).json({ message: "Task not found" });
      
      res.json(task);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.tasks.delete.path, authenticateToken, async (req, res) => {
    const userId = (req as any).user.id;
    const taskId = Number(req.params.id);
    await storage.deleteTask(taskId, userId);
    res.status(204).send();
  });

  // Seed Demo User
  const existingUser = await storage.getUserByUsername("demo");
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash("password", 10);
    await storage.createUser({ username: "demo", password: hashedPassword });
    console.log("Seeded demo user: demo / password");
  }

  return httpServer;
}
