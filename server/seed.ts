import { storage } from './storage';
import bcrypt from 'bcryptjs';

export async function seedData() {
  console.log('Seeding data...');
  
  // Create users
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  const tlPassword = await bcrypt.hash(process.env.TL_PASSWORD || 'tl123', 10);
  
  const admin = await storage.createUser({
    name: 'Admin User',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    passwordHash: adminPassword,
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
  });

  const tl1 = await storage.createUser({
    name: 'John Smith',
    email: process.env.TL_EMAIL || 'tl@example.com',
    passwordHash: tlPassword,
    role: 'tl',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face'
  });

  const tl2 = await storage.createUser({
    name: 'Maria Garcia',
    email: 'maria@example.com',
    passwordHash: tlPassword,
    role: 'tl',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=64&h=64&fit=crop&crop=face'
  });

  // Create teams
  const teamAlpha = await storage.createTeam({
    name: 'Team Alpha',
    tlId: tl1.id,
    agents: [],
    avgActivation: 0,
    totalActivations: 0,
    totalSubmissions: 0,
    totalPoints: 0
  });

  const teamBravo = await storage.createTeam({
    name: 'Team Bravo',
    tlId: tl2.id,
    agents: [],
    avgActivation: 0,
    totalActivations: 0,
    totalSubmissions: 0,
    totalPoints: 0
  });

  // Create agents for Team Alpha
  const agentPhotos = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face',
    'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=64&h=64&fit=crop&crop=face'
  ];

  const alphaAgents = [
    {
      name: 'Sarah Chen',
      photoUrl: agentPhotos[0],
      teamId: teamAlpha.id,
      activationTarget: 25,
      activations: 23,
      submissions: 89,
      points: 1234
    },
    {
      name: 'Lisa Wong',
      photoUrl: agentPhotos[1],
      teamId: teamAlpha.id,
      activationTarget: 25,
      activations: 19,
      submissions: 67,
      points: 987
    },
    {
      name: 'David Park',
      photoUrl: agentPhotos[2],
      teamId: teamAlpha.id,
      activationTarget: 20,
      activations: 12,
      submissions: 54,
      points: 678
    }
  ];

  const bravoAgents = [
    {
      name: 'Mike Rodriguez',
      photoUrl: agentPhotos[3],
      teamId: teamBravo.id,
      activationTarget: 25,
      activations: 21,
      submissions: 78,
      points: 1156
    },
    {
      name: 'Emma Thompson',
      photoUrl: agentPhotos[1],
      teamId: teamBravo.id,
      activationTarget: 24,
      activations: 16,
      submissions: 61,
      points: 892
    },
    {
      name: 'Ryan Lee',
      photoUrl: agentPhotos[2],
      teamId: teamBravo.id,
      activationTarget: 20,
      activations: 9,
      submissions: 43,
      points: 567
    }
  ];

  // Create all agents
  for (const agentData of [...alphaAgents, ...bravoAgents]) {
    await storage.createAgent(agentData);
  }

  console.log('Data seeded successfully!');
}

// Auto-seed if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData().catch(console.error);
}
