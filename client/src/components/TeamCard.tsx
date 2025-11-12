import { Users, Award } from 'lucide-react';
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
{/* Team Header (square TL photo, header height auto) */}
<div className={`p-1.5 lg:p-6 ${isTopTeam ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
  {/* Left = fixed square image, Right = 2 rows */}
  <div className="grid grid-cols-[auto,1fr] items-center gap-2 lg:gap-6">
    {/* LEFT: fixed square TL photo */}
    <div className="flex items-center">
      <img
        src={team.tlPhotoUrl}
        alt={`${team.tlName} photo`}
        className={`w-24 h-24 lg:w-32 lg:h-32 object-cover rounded-xl border-2 lg:border-4 ${
          isTopTeam ? 'border-white/20' : 'border-gray-300'
        }`}
        data-testid={`team-leader-photo-${team.id}`}
      />
    </div>

    {/* RIGHT: name/TL + avg (top), stats (bottom) */}
    <div className="grid grid-rows-[auto,auto] gap-2 lg:gap-4">
      {/* Top row */}
      <div className="grid grid-cols-2 gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            {rank === 1 && <Award className="w-3 h-3 lg:w-5 lg:h-5 text-yellow-300 flex-shrink-0" />}
            <h3 className="text-[10px] lg:text-xl font-bold truncate" data-testid={`team-name-${team.id}`}>
              {team.name}
            </h3>
          </div>
          <p
            className={`text-[8px] lg:text-base truncate ${
              isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'
            }`}
            data-testid={`team-leader-name-${team.id}`}
          >
            {team.tlName} - TL
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm lg:text-3xl font-bold" data-testid={`team-avg-activation-${team.id}`}>
            {team.avgActivation}%
          </div>
          <div className={`${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'} text-[7px] lg:text-sm`}>
            Avg Act
          </div>
        </div>
      </div>

      {/* Bottom row: stats (unchanged) */}
      <div
        className={`grid grid-cols-2 gap-4 pt-1.5 lg:pt-4 border-t ${
          isTopTeam ? 'border-primary-foreground/20' : 'border-secondary-foreground/20'
        }`}
      >
        <div className="text-center">
          <div className="text-xs lg:text-2xl font-bold" data-testid={`team-total-activations-${team.id}`}>
            {team.totalActivations}
          </div>
          <div className={`${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'} text-[7px] lg:text-xs uppercase`}>
            Activations
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs lg:text-2xl font-bold" data-testid={`team-total-submissions-${team.id}`}>
            {team.totalSubmissions}
          </div>
          <div className={`${isTopTeam ? 'text-primary-foreground/80' : 'text-secondary-foreground/80'} text-[7px] lg:text-xs uppercase`}>
            Submissions
          </div>
        </div>
      </div>
    </div>
  </div>
</div>



      {/* Agents List */}
      <div className="p-1.5 lg:p-6">
        {team.agents.length > 0 ? (
          team.agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))
        ) : (
          <div className="text-center py-4 lg:py-8 text-muted-foreground">
            <Users className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-2" />
            <p className="text-xs lg:text-base">No agents in this team</p>
          </div>
        )}
      </div>
    </div>
  );
}