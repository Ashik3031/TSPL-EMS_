import { Users, Target, Award } from 'lucide-react';
import AgentRow from './AgentRow';

interface Agent {
  id: string;
  name: string;
  photoUrl: string;
  activations: number;
  submissions: number;
  activationTarget: number;
}

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    tlName: string;
    tlPhotoUrl: string;
    avgActivation: number;
    totalActivations: number;
    totalSubmissions: number;
    totalPoints: number;
    agents: Agent[];
  };
  rank: number;
}

export default function TeamCard({ team, rank }: TeamCardProps) {
  const isTopTeam = rank === 1;

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
      {/* Team Header */}
      <div className={`p-6 ${isTopTeam ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <img
              src={team.tlPhotoUrl}
              alt={`${team.tlName} photo`}
              className={`w-14 h-14 rounded-full object-cover border-3 ${
                isTopTeam ? 'border-white/20' : 'border-gray-300'
              }`}
              data-testid={`team-leader-photo-${team.id}`}
            />
            <div>
              <div className="flex items-center space-x-2">
                {rank === 1 && <Award className="w-5 h-5 text-yellow-300" />}
                <h3 className="text-xl font-bold" data-testid={`team-name-${team.id}`}>
                  {team.name}
                </h3>
              </div>
              <p className={`${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'}`} data-testid={`team-leader-name-${team.id}`}>
                {team.tlName} - Team Leader
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold" data-testid={`team-avg-activation-${team.id}`}>
              {team.avgActivation}%
            </div>
            <div className={`text-sm ${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'}`}>
              Avg Activation
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className={`flex justify-between items-center mt-4 pt-4 border-t ${
          isTopTeam ? 'border-primary-foreground/20' : 'border-secondary-foreground/20'
        }`}>
          <div className="text-center">
            <div className="text-2xl font-bold" data-testid={`team-total-activations-${team.id}`}>
              {team.totalActivations}
            </div>
            <div className={`text-xs uppercase ${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'}`}>
              Activations
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" data-testid={`team-total-submissions-${team.id}`}>
              {team.totalSubmissions}
            </div>
            <div className={`text-xs uppercase ${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'}`}>
              Submissions
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold" data-testid={`team-total-points-${team.id}`}>
              {team.totalPoints.toLocaleString()}
            </div>
            <div className={`text-xs uppercase ${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'}`}>
              Points
            </div>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="p-6">
        {team.agents.length > 0 ? (
          team.agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2" />
            <p>No agents in this team</p>
          </div>
        )}
      </div>
    </div>
  );
}
