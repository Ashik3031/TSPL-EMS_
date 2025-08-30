import { useEffect, useState } from 'react';
import { X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioStore } from '@/store/audioStore';

interface CelebrationData {
  agentId: string;
  agentName: string;
  photoUrl: string;
  teamId: string;
  newActivationCount: number;
  timestamp: string;
}

interface CelebrationPopupProps {
  isVisible: boolean;
  data: CelebrationData | null;
  onClose: () => void;
}

export default function CelebrationPopup({ isVisible, data, onClose }: CelebrationPopupProps) {
  const { isSoundEnabled, toggleSound } = useAudioStore();
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number }>>([]);

  useEffect(() => {
    if (isVisible) {
      // Generate confetti
      const newConfetti = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2000,
      }));
      setConfetti(newConfetti);

      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="celebration-popup">
      <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden celebration-popup">
        {/* Confetti Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="confetti"
              style={{
                left: `${piece.left}%`,
                animationDelay: `${piece.delay}ms`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          {/* Celebration Icon */}
          <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
            🎉
          </div>

          {/* Agent Info */}
          <div className="mb-6">
            <img
              src={data.photoUrl}
              alt={`${data.agentName} celebrating`}
              className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-yellow-400 shadow-lg"
              data-testid="celebration-agent-photo"
            />
            <h3 className="text-2xl font-bold text-foreground mb-2" data-testid="celebration-agent-name">
              {data.agentName}
            </h3>
            <p className="text-lg text-muted-foreground">New Activation!</p>
            <p className="text-3xl font-bold text-green-600 mt-2" data-testid="celebration-activation-count">
              {data.newActivationCount} activations
            </p>
          </div>

          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            data-testid="celebration-sound-toggle"
          >
            {isSoundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>

          {/* Close Button */}
          <Button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="celebration-close"
          >
            Awesome!
          </Button>
        </div>
      </div>
    </div>
  );
}
