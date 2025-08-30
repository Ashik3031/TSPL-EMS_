import { storage } from '../storage';
import { Agent } from '@shared/schema';

export interface TopStats {
  topAgentMonth: {
    name: string;
    photoUrl: string;
    activations: number;
  };
  topAgentToday: {
    name: string;
    photoUrl: string;
    submissions: number;
  };
  totalActivations: number;
  totalSubmissions: number;
}

export const computeTopStats = async (): Promise<TopStats> => {
  const allAgents = await storage.getAllAgents();
  
  // For demo purposes, we'll use simple logic
  // In production, you'd track daily/monthly data separately
  
  // Top agent by total activations (representing monthly)
  const topAgentMonth = allAgents.reduce((top, agent) => 
    agent.activations > top.activations ? agent : top
  , allAgents[0] || { name: 'No agents', photoUrl: '', activations: 0 });

  // Top agent by submissions (representing today)
  const topAgentToday = allAgents.reduce((top, agent) => 
    agent.submissions > top.submissions ? agent : top
  , allAgents[0] || { name: 'No agents', photoUrl: '', submissions: 0 });

  const totalActivations = allAgents.reduce((sum, agent) => sum + agent.activations, 0);
  const totalSubmissions = allAgents.reduce((sum, agent) => sum + agent.submissions, 0);

  return {
    topAgentMonth: {
      name: topAgentMonth.name,
      photoUrl: topAgentMonth.photoUrl,
      activations: topAgentMonth.activations
    },
    topAgentToday: {
      name: topAgentToday.name,
      photoUrl: topAgentToday.photoUrl,
      submissions: topAgentToday.submissions
    },
    totalActivations,
    totalSubmissions
  };
};
