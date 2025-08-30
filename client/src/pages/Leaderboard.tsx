import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '@/hooks/useSocket';
import { useLeaderboardStore } from '@/store/leaderboardStore';
import TopStats from '@/components/TopStats';
import TeamCard from '@/components/TeamCard';
import CelebrationPopup from '@/components/CelebrationPopup';

interface CelebrationData {
  agentId: string;
  agentName: string;
  photoUrl: string;
  teamId: string;
  newActivationCount: number;
  timestamp: string;
}

export default function Leaderboard() {
  const { teams, topStats, setTeams, setTopStats, setLoading } = useLeaderboardStore();
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  
  useSocket();

  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/stats/leaderboard'],
    refetchInterval: 30000, // Refetch every 30 seconds as backup
  });

  useEffect(() => {
    if (data) {
      setTeams(data.teams || []);
      setTopStats(data.topStats);
      setLoading(false);
    }
  }, [data, setTeams, setTopStats, setLoading]);

  useEffect(() => {
    const handleCelebration = (event: CustomEvent<CelebrationData>) => {
      setCelebrationData(event.detail);
      setShowCelebration(true);
    };

    window.addEventListener('show-celebration', handleCelebration as EventListener);
    
    return () => {
      window.removeEventListener('show-celebration', handleCelebration as EventListener);
    };
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Error Loading Leaderboard</h1>
          <p className="text-muted-foreground">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Stats Bar */}
      <TopStats topStats={topStats} />

      {/* Team Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg shadow-lg border border-border p-8 animate-pulse">
                <div className="h-32 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : teams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {teams.map((team, index) => (
              <TeamCard
                key={team.id}
                team={team}
                rank={index + 1}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-2">No Teams Available</h2>
            <p className="text-muted-foreground">Teams will appear here once they are created</p>
          </div>
        )}
      </div>

      {/* Celebration Popup */}
      <CelebrationPopup
        isVisible={showCelebration}
        data={celebrationData}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}
