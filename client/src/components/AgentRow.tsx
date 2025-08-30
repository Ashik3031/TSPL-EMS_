interface Agent {
  id: string;
  name: string;
  photoUrl: string;
  activations: number;
  submissions: number;
  activationTarget: number;
}

interface AgentRowProps {
  agent: Agent;
}

export default function AgentRow({ agent }: AgentRowProps) {
  const activationPercent = agent.activationTarget > 0 
    ? Math.round((agent.activations / agent.activationTarget) * 100)
    : 0;

  const getPercentColor = (percent: number) => {
    if (percent >= 80) return 'text-green-600 bg-green-600';
    if (percent >= 60) return 'text-yellow-600 bg-yellow-600';
    if (percent >= 40) return 'text-orange-600 bg-orange-600';
    return 'text-red-600 bg-red-600';
  };

  const colorClasses = getPercentColor(activationPercent);

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center space-x-3">
        <img
          src={agent.photoUrl}
          alt={`${agent.name} photo`}
          className="w-12 h-12 rounded-full object-cover"
          data-testid={`agent-photo-${agent.id}`}
        />
        <div>
          <p className="font-semibold text-foreground" data-testid={`agent-name-${agent.id}`}>
            {agent.name}
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span data-testid={`agent-activations-${agent.id}`}>
              {agent.activations} activations
            </span>
            <span data-testid={`agent-submissions-${agent.id}`}>
              {agent.submissions} submissions
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-bold ${colorClasses.split(' ')[0]}`} data-testid={`agent-percent-${agent.id}`}>
          {activationPercent}%
        </div>
        <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
          <div
            className={`h-2 rounded-full progress-bar ${colorClasses.split(' ')[1]}`}
            style={{ width: `${Math.min(100, activationPercent)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
