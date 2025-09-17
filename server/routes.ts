import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { storage } from "./storage";
import { authenticate, requireRole, requireTLOrAdmin } from "./middleware/auth";
import { computeLeaderboard } from "./utils/computeLeaderboard";
import { computeTopStats } from "./utils/topStats";
import { loginSchema, tlUpdateSchema, insertNotificationSchema, insertAgentSchema } from "@shared/schema";

// Rate limiting
const tlUpdateLimiter = rateLimit({
  windowMs: 1000, // 1 second
  max: 10, // max 10 requests per second per IP
  message: { message: 'Too many requests, please slow down' }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();
  const roomClients = new Map<string, Set<WebSocket>>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle room joining
        if (message.type === 'join') {
          const room = message.room;
          if (!roomClients.has(room)) {
            roomClients.set(room, new Set());
          }
          roomClients.get(room)!.add(ws);
        }
        
        // Handle TL updates (requires authentication)
        if (message.type === 'tl:updateCounters') {
          // Validate token
          const token = message.token;
          if (!token) return;
          
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as { userId: string };
            const user = await storage.getUser(decoded.userId);
            
            if (!user || !['admin', 'tl'].includes(user.role)) return;
            
            // Process the update
            const { agentId, delta } = message.data;
            const agent = await storage.getAgent(agentId);
            
            if (!agent) return;
            
            // For TL role, ensure they can only update their team's agents
            if (user.role === 'tl') {
              const team = await storage.getTeamByTlId(user.id);
              if (!team || agent.teamId !== team.id) return;
            }
            
            const updates: Partial<typeof agent> = {};
            if (delta.submissions !== undefined) {
              updates.submissions = Math.max(0, agent.submissions + delta.submissions);
            }
            if (delta.activations !== undefined) {
              updates.activations = Math.max(0, agent.activations + delta.activations);
              
              // If activation was incremented, trigger celebration
              if (delta.activations > 0) {
                broadcastToAll({
                  type: 'sale:activation',
                  data: {
                    agentId: agent.id,
                    agentName: agent.name,
                    photoUrl: agent.photoUrl,
                    teamId: agent.teamId,
                    newActivationCount: updates.activations,
                    timestamp: new Date().toISOString()
                  }
                });
              }
            }
            if (delta.points !== undefined) {
              updates.points = Math.max(0, agent.points + delta.points);
            }
            
            await storage.updateAgent(agentId, updates);
            
            // Recompute and broadcast leaderboard
            const leaderboardData = await computeLeaderboard();
            broadcastToAll({
              type: 'leaderboard:update',
              data: leaderboardData
            });
            
          } catch (error) {
            console.error('Authentication error:', error);
          }
        }
        
        // Handle admin notifications
        if (message.type === 'admin:pushNotification') {
          const token = message.token;
          if (!token) return;
          
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as { userId: string };
            const user = await storage.getUser(decoded.userId);
            
            if (!user || user.role !== 'admin') return;
            
            const notification = await storage.createNotification(message.data);
            
            broadcastToAll({
              type: 'notification:active',
              data: notification
            });
            
            // Auto-clear after duration
            setTimeout(async () => {
              await storage.clearActiveNotifications();
              broadcastToAll({
                type: 'notification:clear',
                data: {}
              });
            }, notification.duration);
            
          } catch (error) {
            console.error('Admin notification error:', error);
          }
        }
        
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      // Remove from all rooms
      roomClients.forEach((roomSet) => {
        roomSet.delete(ws);
      });
    });
  });

  function broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  function broadcastToRoom(room: string, message: any) {
    const roomSet = roomClients.get(room);
    if (!roomSet) return;
    
    const messageStr = JSON.stringify(message);
    roomSet.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Check hardcoded credentials from env
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const tlEmail = process.env.TL_EMAIL || 'tl@example.com';
      const tlPassword = process.env.TL_PASSWORD || 'tl123';
      
      let user = null;
      
      if (email === adminEmail && password === adminPassword) {
        // Find or create admin user
        user = await storage.getUserByEmail(email);
        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await storage.createUser({
            name: 'Admin User',
            email,
            passwordHash: hashedPassword,
            role: 'admin',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
          });
        }
      } else if (email === tlEmail && password === tlPassword) {
        // Find or create TL user
        user = await storage.getUserByEmail(email);
        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await storage.createUser({
            name: 'John Smith',
            email,
            passwordHash: hashedPassword,
            role: 'tl',
            avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
          });
        }
      }
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'supersecret',
        { expiresIn: '24h' }
      );
      
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.get('/api/auth/me', authenticate, async (req, res) => {
    res.json({
      user: {
        id: req.user!.id,
        name: req.user!.name,
        email: req.user!.email,
        role: req.user!.role,
        teamId: req.user!.teamId,
        avatarUrl: req.user!.avatarUrl
      }
    });
  });

  // Stats routes (public)
  app.get('/api/stats/leaderboard', async (req, res) => {
    try {
      const leaderboardData = await computeLeaderboard();
      const topStats = await computeTopStats();
      
      res.json({
        ...leaderboardData,
        topStats
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to compute leaderboard' });
    }
  });

  // TL routes
  app.get('/api/tl/agents', authenticate, requireTLOrAdmin, async (req, res) => {
    try {
      if (req.user!.role === 'admin') {
        const agents = await storage.getAllAgents();
        res.json(agents);
      } else {
        const team = await storage.getTeamByTlId(req.user!.id);
        if (!team) {
          return res.status(404).json({ message: 'Team not found' });
        }
        
        const agents = await storage.getAgentsByTeamId(team.id);
        res.json(agents);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch agents' });
    }
  });

  app.patch('/api/tl/agents/:id/increment', 
    authenticate, 
    requireTLOrAdmin, 
    tlUpdateLimiter,
    async (req, res) => {
      try {
        const agentId = req.params.id;
        const { delta } = tlUpdateSchema.parse({ agentId, delta: req.body });
        
        const agent = await storage.getAgent(agentId);
        if (!agent) {
          return res.status(404).json({ message: 'Agent not found' });
        }
        
        // For TL role, ensure they can only update their team's agents
        if (req.user!.role === 'tl') {
          const team = await storage.getTeamByTlId(req.user!.id);
          if (!team || agent.teamId !== team.id) {
            return res.status(403).json({ message: 'Cannot update agents from other teams' });
          }
        }
        
        const updates: Partial<typeof agent> = {};
        if (delta.submissions !== undefined) {
          updates.submissions = Math.max(0, agent.submissions + delta.submissions);
        }
        if (delta.activations !== undefined) {
          updates.activations = Math.max(0, agent.activations + delta.activations);
          
          // If activation was incremented, trigger celebration
          if (delta.activations > 0) {
            broadcastToAll({
              type: 'sale:activation',
              data: {
                agentId: agent.id,
                agentName: agent.name,
                photoUrl: agent.photoUrl,
                teamId: agent.teamId,
                newActivationCount: updates.activations,
                timestamp: new Date().toISOString()
              }
            });
          }
        }
        if (delta.points !== undefined) {
          updates.points = Math.max(0, agent.points + delta.points);
        }
        
        const updatedAgent = await storage.updateAgent(agentId, updates);
        
        // Recompute and broadcast leaderboard
        const leaderboardData = await computeLeaderboard();
        broadcastToAll({
          type: 'leaderboard:update',
          data: leaderboardData
        });
        
        res.json(updatedAgent);
      } catch (error) {
        res.status(400).json({ message: 'Invalid request data' });
      }
    }
  );

  // Agent management routes for TLs
  app.post('/api/tl/agents', authenticate, requireTLOrAdmin, async (req, res) => {
    try {
      const user = req.user!;
      
      // Get the team for this TL
      let team;
      if (user.role === 'tl') {
        team = await storage.getTeamByTlId(user.id);
        if (!team) {
          return res.status(404).json({ message: 'Team not found for this team leader' });
        }
      }

      const agentData = insertAgentSchema.parse({
        ...req.body,
        teamId: user.role === 'tl' ? team!.id : req.body.teamId
      });
      
      const newAgent = await storage.createAgent(agentData);
      
      // Recompute and broadcast leaderboard
      const leaderboardData = await computeLeaderboard();
      broadcastToAll({
        type: 'leaderboard:update',
        data: leaderboardData
      });
      
      res.status(201).json(newAgent);
    } catch (error) {
      console.error('Create agent error:', error);
      res.status(400).json({ message: 'Invalid agent data' });
    }
  });

  app.delete('/api/tl/agents/:id', authenticate, requireTLOrAdmin, async (req, res) => {
    try {
      const agentId = req.params.id;
      const user = req.user!;
      
      const agent = await storage.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({ message: 'Agent not found' });
      }
      
      // For TL role, ensure they can only delete their team's agents
      if (user.role === 'tl') {
        const team = await storage.getTeamByTlId(user.id);
        if (!team || agent.teamId !== team.id) {
          return res.status(403).json({ message: 'Cannot delete agents from other teams' });
        }
      }
      
      const deleted = await storage.deleteAgent(agentId);
      if (!deleted) {
        return res.status(404).json({ message: 'Agent not found' });
      }
      
      // Recompute and broadcast leaderboard
      const leaderboardData = await computeLeaderboard();
      broadcastToAll({
        type: 'leaderboard:update',
        data: leaderboardData
      });
      
      res.json({ message: 'Agent deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete agent' });
    }
  });

  // Admin routes
  app.post('/api/admin/notifications', authenticate, requireRole('admin'), async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification({
        ...notificationData,
        duration: notificationData.duration || parseInt(process.env.DEFAULT_NOTIFICATION_DURATION_MS || '15000')
      });
      
      // Broadcast to all clients
      broadcastToAll({
        type: 'notification:active',
        data: notification
      });
      
      // Auto-clear after duration
      setTimeout(async () => {
        await storage.clearActiveNotifications();
        broadcastToAll({
          type: 'notification:clear',
          data: {}
        });
      }, notification.duration);
      
      res.json(notification);
    } catch (error) {
      res.status(400).json({ message: 'Invalid notification data' });
    }
  });

  app.patch('/api/admin/notifications/clear', authenticate, requireRole('admin'), async (req, res) => {
    try {
      await storage.clearActiveNotifications();
      
      broadcastToAll({
        type: 'notification:clear',
        data: {}
      });
      
      res.json({ message: 'Notifications cleared' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear notifications' });
    }
  });

  return httpServer;
}
