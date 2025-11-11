import { Trophy, Zap, RotateCcw, FileText } from 'lucide-react';

interface TopStatsProps {
  topStats: {
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
  } | null;
}

export default function TopStats({ topStats }: TopStatsProps) {
  if (!topStats) {
    return (
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg p-4 animate-pulse">
                <div className="h-16 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 lg:py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 lg:gap-6">
          {/* Top Agent of the Month */}
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-1.5 lg:p-4">
            <div className="flex items-center space-x-1.5 lg:space-x-3">
              <img
                src={topStats.topAgentMonth.photoUrl}
                alt="Top agent photo"
                className="w-6 h-6 lg:w-12 lg:h-12 rounded-full object-cover border border-yellow-300"
                data-testid="top-agent-month-photo"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-xs font-medium text-yellow-700 uppercase tracking-wider flex items-center">
                  <Trophy className="w-2 h-2 lg:w-3 lg:h-3 mr-0.5" />
                  Top Agent (Month)
                </p>
                <p className="text-xs lg:text-lg font-bold text-yellow-900 truncate" data-testid="top-agent-month-name">
                  {topStats.topAgentMonth.name}
                </p>
                <p className="text-[10px] lg:text-sm text-yellow-700" data-testid="top-agent-month-activations">
                  {topStats.topAgentMonth.activations} activations
                </p>
              </div>
            </div>
          </div>

          {/* Top Agent Today */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-1.5 lg:p-4">
            <div className="flex items-center space-x-1.5 lg:space-x-3">
              <img
                src={topStats.topAgentToday.photoUrl}
                alt="Top daily agent photo"
                className="w-6 h-6 lg:w-12 lg:h-12 rounded-full object-cover border border-blue-300"
                data-testid="top-agent-today-photo"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[9px] lg:text-xs font-medium text-blue-700 uppercase tracking-wider flex items-center">
                  <Zap className="w-2 h-2 lg:w-3 lg:h-3 mr-0.5" />
                  Top Agent (Today)
                </p>
                <p className="text-xs lg:text-lg font-bold text-blue-900 truncate" data-testid="top-agent-today-name">
                  {topStats.topAgentToday.name}
                </p>
                <p className="text-[10px] lg:text-sm text-blue-700" data-testid="top-agent-today-submissions">
                  {topStats.topAgentToday.submissions} submissions
                </p>
              </div>
            </div>
          </div>

          {/* Total Activations */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-1.5 lg:p-4">
            <div className="text-center">
              <p className="text-[9px] lg:text-xs font-medium text-green-700 uppercase tracking-wider flex items-center justify-center">
                <RotateCcw className="w-2 h-2 lg:w-3 lg:h-3 mr-0.5" />
                Total Activations
              </p>
              <p className="text-lg lg:text-3xl font-bold text-green-900" data-testid="total-activations">
                {topStats.totalActivations.toLocaleString()}
              </p>
              {/* <p className="text-[10px] lg:text-sm text-green-700">All teams</p> */}
            </div>
          </div>

          {/* Total Submissions */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-1.5 lg:p-4">
            <div className="text-center">
              <p className="text-[9px] lg:text-xs font-medium text-purple-700 uppercase tracking-wider flex items-center justify-center">
                <FileText className="w-2 h-2 lg:w-3 lg:h-3 mr-0.5" />
                Total Submissions
              </p>
              <p className="text-lg lg:text-3xl font-bold text-purple-900" data-testid="total-submissions">
                {topStats.totalSubmissions.toLocaleString()}
              </p>
              {/* <p className="text-[10px] lg:text-sm text-purple-700">All teams</p> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}