import { type User, type InsertUser, type Team, type InsertTeam, type Agent, type InsertAgent, type Notification, type InsertNotification } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Team methods
  getTeam(id: string): Promise<Team | undefined>;
  getTeamByTlId(tlId: string): Promise<Team | undefined>;
  getAllTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined>;
  
  // Agent methods
  getAgent(id: string): Promise<Agent | undefined>;
  getAgentsByTeamId(teamId: string): Promise<Agent[]>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<boolean>;
  resetDailySubmissions(): Promise<void>;
  
  // Notification methods
  getActiveNotification(): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  clearActiveNotifications(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private teams: Map<string, Team>;
  private agents: Map<string, Agent>;
  private notifications: Map<string, Notification>;

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.agents = new Map();
    this.notifications = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamByTlId(tlId: string): Promise<Team | undefined> {
    return Array.from(this.teams.values()).find(team => team.tlId === tlId);
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { ...insertTeam, id };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...updates };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentsByTeamId(teamId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.teamId === teamId);
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const id = randomUUID();
    const agent: Agent = { ...insertAgent, id };
    this.agents.set(id, agent);
    return agent;
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    
    const updatedAgent = { ...agent, ...updates };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async deleteAgent(id: string): Promise<boolean> {
    return this.agents.delete(id);
  }

  async resetDailySubmissions(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    Array.from(this.agents.entries()).forEach(([id, agent]) => {
      const lastReset = new Date(agent.lastSubmissionReset);
      const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
      
      // If last reset was before today, reset submissions
      if (lastResetDay < today) {
        this.agents.set(id, {
          ...agent,
          submissions: 0,
          lastSubmissionReset: now
        });
      }
    });
  }

  async getActiveNotification(): Promise<Notification | undefined> {
    return Array.from(this.notifications.values()).find(notification => notification.isActive);
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    // Clear any existing active notifications
    await this.clearActiveNotifications();
    
    const id = randomUUID();
    const notification: Notification = { 
      ...insertNotification, 
      id, 
      createdAt: new Date() 
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async clearActiveNotifications(): Promise<void> {
    Array.from(this.notifications.entries()).forEach(([id, notification]) => {
      if (notification.isActive) {
        this.notifications.set(id, { ...notification, isActive: false });
      }
    });
  }
}

export const storage = new MemStorage();
