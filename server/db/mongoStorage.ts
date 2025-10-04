import { type User, type InsertUser, type Team, type InsertTeam, type Agent, type InsertAgent, type Notification, type InsertNotification } from "@shared/schema";
import { UserModel, TeamModel, AgentModel, NotificationModel } from "./models";
import { IStorage } from "../storage";

export class MongoStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const user = await UserModel.findById(id).lean();
    if (!user) return undefined;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as 'admin' | 'tl',
      teamId: user.teamId || undefined,
      avatarUrl: user.avatarUrl || undefined
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = await UserModel.findOne({ email }).lean();
    if (!user) return undefined;
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as 'admin' | 'tl',
      teamId: user.teamId || undefined,
      avatarUrl: user.avatarUrl || undefined
    };
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = await UserModel.create(insertUser);
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role as 'admin' | 'tl',
      teamId: user.teamId || undefined,
      avatarUrl: user.avatarUrl || undefined
    };
  }

  async getTeam(id: string): Promise<Team | undefined> {
    const team = await TeamModel.findById(id).lean();
    if (!team) return undefined;
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints
    };
  }

  async getTeamByTlId(tlId: string): Promise<Team | undefined> {
    const team = await TeamModel.findOne({ tlId }).lean();
    if (!team) return undefined;
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints
    };
  }

  async getAllTeams(): Promise<Team[]> {
    const teams = await TeamModel.find().lean();
    return teams.map(team => ({
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints
    }));
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const team = await TeamModel.create(insertTeam);
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints
    };
  }

  async updateTeam(id: string, updates: Partial<Team>): Promise<Team | undefined> {
    const team = await TeamModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!team) return undefined;
    return {
      id: team._id.toString(),
      name: team.name,
      tlId: team.tlId,
      agents: team.agents,
      avgActivation: team.avgActivation,
      totalActivations: team.totalActivations,
      totalSubmissions: team.totalSubmissions,
      totalPoints: team.totalPoints
    };
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const agent = await AgentModel.findById(id).lean();
    if (!agent) return undefined;
    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      lastSubmissionReset: agent.lastSubmissionReset
    };
  }

  async getAgentsByTeamId(teamId: string): Promise<Agent[]> {
    const agents = await AgentModel.find({ teamId }).lean();
    return agents.map(agent => ({
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      lastSubmissionReset: agent.lastSubmissionReset
    }));
  }

  async getAllAgents(): Promise<Agent[]> {
    const agents = await AgentModel.find().lean();
    return agents.map(agent => ({
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      lastSubmissionReset: agent.lastSubmissionReset
    }));
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const agent = await AgentModel.create(insertAgent);
    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      lastSubmissionReset: agent.lastSubmissionReset
    };
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | undefined> {
    const agent = await AgentModel.findByIdAndUpdate(id, updates, { new: true }).lean();
    if (!agent) return undefined;
    return {
      id: agent._id.toString(),
      name: agent.name,
      photoUrl: agent.photoUrl,
      teamId: agent.teamId,
      activationTarget: agent.activationTarget,
      activations: agent.activations,
      submissions: agent.submissions,
      points: agent.points,
      lastSubmissionReset: agent.lastSubmissionReset
    };
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await AgentModel.findByIdAndDelete(id);
    return !!result;
  }

  async resetDailySubmissions(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const agents = await AgentModel.find().lean();
    
    for (const agent of agents) {
      const lastReset = new Date(agent.lastSubmissionReset);
      const lastResetDay = new Date(lastReset.getFullYear(), lastReset.getMonth(), lastReset.getDate());
      
      if (lastResetDay < today) {
        await AgentModel.findByIdAndUpdate(agent._id, {
          submissions: 0,
          lastSubmissionReset: now
        });
      }
    }
  }

  async getActiveNotification(): Promise<Notification | undefined> {
    const notification = await NotificationModel.findOne({ isActive: true }).lean();
    if (!notification) return undefined;
    return {
      id: notification._id.toString(),
      type: notification.type as 'text' | 'image' | 'video' | 'audio',
      title: notification.title || undefined,
      message: notification.message || undefined,
      mediaUrl: notification.mediaUrl || undefined,
      isActive: notification.isActive,
      duration: notification.duration,
      createdAt: notification.createdAt
    };
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    await this.clearActiveNotifications();
    
    const notification = await NotificationModel.create(insertNotification);
    return {
      id: notification._id.toString(),
      type: notification.type as 'text' | 'image' | 'video' | 'audio',
      title: notification.title || undefined,
      message: notification.message || undefined,
      mediaUrl: notification.mediaUrl || undefined,
      isActive: notification.isActive,
      duration: notification.duration,
      createdAt: notification.createdAt
    };
  }

  async clearActiveNotifications(): Promise<void> {
    await NotificationModel.updateMany({ isActive: true }, { isActive: false });
  }
}
