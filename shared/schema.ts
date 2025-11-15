import { z } from "zod";

// User (Admin/TL) schema
export const users = {
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['admin', 'tl']),
  teamId: z.string().optional(),
  avatarUrl: z.string().optional(),
};

export const insertUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string(),
  role: z.enum(['admin', 'tl']),
  teamId: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = InsertUser & { id: string };

// Team schema
export const teams = {
  id: z.string(),
  name: z.string(),
  tlId: z.string(),
  agents: z.array(z.string()),
  avgActivation: z.number(),
  totalActivations: z.number(),
  totalSubmissions: z.number(),
  totalPoints: z.number(),
};

export const insertTeamSchema = z.object({
  name: z.string().min(1),
  tlId: z.string(),
  agents: z.array(z.string()).default([]),
  avgActivation: z.number().default(0),
  totalActivations: z.number().default(0),
  totalSubmissions: z.number().default(0),
  totalPoints: z.number().default(0),
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = InsertTeam & { id: string };

//
// 🔽🔽🔽 AGENT SCHEMA – UPDATED 🔽🔽🔽
//
export const agents = {
  id: z.string(),
  name: z.string(),
  photoUrl: z.string(),
  teamId: z.string(),
  activationTarget: z.number(),
  activations: z.number(),
  submissions: z.number(),
  points: z.number(),
  todaySubmissions: z.number(),     // 👈 NEW: today-only submissions counter
  lastSubmissionReset: z.date(),    // used for daily/monthly reset logic
};

export const insertAgentSchema = z.object({
  name: z.string().min(1),
  photoUrl: z.string().url(),
  teamId: z.string(),
  activationTarget: z.number().min(1),
  activations: z.number().default(0),       // monthly activations
  submissions: z.number().default(0),       // monthly submissions
  points: z.number().default(0),
  todaySubmissions: z.number().default(0),  // 👈 NEW: defaults to 0
  // we’ll store when we last reset (day/month).
  // I’ll keep it as "now" so the very first reset works correctly.
  lastSubmissionReset: z.date().default(() => new Date()),
});

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = InsertAgent & { id: string };

//
// Notification & auth schemas (unchanged)
//
export const notifications = {
  id: z.string(),
  type: z.enum(['text', 'image', 'video', 'audio']),
  title: z.string(),
  message: z.string(),
  mediaUrl: z.string(),
  isActive: z.boolean(),
  duration: z.number(),
  createdAt: z.date(),
};

export const insertNotificationSchema = z.object({
  type: z.enum(['text', 'image', 'video', 'audio']),
  title: z.string().optional(),
  message: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  duration: z.number().default(15000),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = InsertNotification & { id: string; createdAt: Date };

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  teamName: z.string().min(2, "Team name must be at least 2 characters"),
});

export type RegisterData = z.infer<typeof registerSchema>;

// TL Update schema
export const tlUpdateSchema = z.object({
  agentId: z.string(),
  delta: z.object({
    submissions: z.number().optional(),
    activations: z.number().optional(),
    points: z.number().optional(),
  }),
});

export type TLUpdate = z.infer<typeof tlUpdateSchema>;
