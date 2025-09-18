import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioStore } from '@/store/audioStore';

interface CelebrationData {
  agentId: string;
  agentName: string;
  photoUrl: string;
  teamId: string;
  teamName?: string; // keep optional like the premium UI version
  newActivationCount: number;
  timestamp: string;
}

interface CelebrationPopupProps {
  isVisible: boolean;
  data: CelebrationData | null;
  onClose: () => void;
  bgMusicUrl?: string;
  musicVolume?: number;
  duckedVolume?: number;
}

export default function CelebrationPopup({
  isVisible,
  data,
  onClose,
  bgMusicUrl = 'https://res.cloudinary.com/dxq0nrirt/video/upload/v1758179396/ssvid.net--Rolex-Theme-Video-Vikram-Kamal-Haasan-ANIRUDH_128kbps.m4a_maxsqf.mp3',
  musicVolume = 0.25,
  duckedVolume = 0.08,
}: CelebrationPopupProps) {
  const { isSoundEnabled, toggleSound } = useAudioStore();

  // UI state from premium version
  const [confetti, setConfetti] = useState<
    Array<{ id: number; left: number; delay: number; color: string; type: 'circle' | 'square' | 'triangle' | 'star' | 'heart' }>
  >([]);
  const [showCard, setShowCard] = useState(false);
  const [flipCard, setFlipCard] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  // Audio (from your old real-time code)
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voiceUrlRef = useRef<string | null>(null);
  const speakingRef = useRef(false);

  const buildSentence = () => {
    if (!data) return '';
    const name = (data.agentName || '').trim() || 'ഏജന്റ്';
    return `${name} ഒരു സെയിൽ ഇട്ടു, നന്ദി!`;
  };

  const startMusic = async () => {
    if (!bgMusicUrl) return;
    if (!musicRef.current) {
      musicRef.current = new Audio(bgMusicUrl);
      musicRef.current.loop = true;
      musicRef.current.preload = 'auto';
      musicRef.current.volume = musicVolume;
    } else {
      musicRef.current.src = bgMusicUrl;
      musicRef.current.loop = true;
      musicRef.current.volume = musicVolume;
    }
    try {
      await musicRef.current.play();
    } catch {
      // autoplay might be blocked, ignore
    }
  };

  const stopMusic = () => {
    if (musicRef.current) {
      musicRef.current.pause();
      musicRef.current.currentTime = 0;
      musicRef.current.src = '';
      musicRef.current = null;
    }
  };

  const playVoice = async () => {
    const text = buildSentence();
    if (!text) return;
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(text)}`);
      if (!res.ok) return;

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      voiceUrlRef.current = url;

      if (!voiceRef.current) voiceRef.current = new Audio();
      const voice = voiceRef.current;

      voice.src = url;
      voice.preload = 'auto';

      voice.onplay = () => {
        speakingRef.current = true;
        if (musicRef.current) musicRef.current.volume = duckedVolume;
      };

      const restore = () => {
        speakingRef.current = false;
        if (musicRef.current) musicRef.current.volume = musicVolume;
      };
      voice.onended = restore;
      voice.onpause = restore;
      voice.onerror = restore;

      await voice.play();
    } catch {
      // ignore TTS errors silently
    }
  };

  useEffect(() => {
    if (!isVisible || !data) return;

    // Confetti (premium version w/ shapes)
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF69B4', '#00CED1'];
    const types: Array<'circle' | 'square' | 'triangle' | 'star' | 'heart'> = ['circle', 'square', 'triangle', 'star', 'heart'];

    setConfetti(
      Array.from({ length: 150 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 3000,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
      }))
    );

    // Timed animations
    const t1 = setTimeout(() => setShowCard(true), 300);
    const t2 = setTimeout(() => setFlipCard(true), 2000);
    const t3 = setTimeout(() => setShowFireworks(true), 2500);
    const autoClose = setTimeout(onClose, 12000);

    // Audio (real-time logic)
    (async () => {
      if (!isSoundEnabled) return;
      await startMusic();
      setTimeout(() => playVoice(), 2500);
    })();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(autoClose);
      setShowCard(false);
      setFlipCard(false);
      setShowFireworks(false);

      if (voiceRef.current) {
        try {
          voiceRef.current.pause();
        } catch {}
        voiceRef.current.src = '';
        voiceRef.current = null;
      }
      if (voiceUrlRef.current) {
        URL.revokeObjectURL(voiceUrlRef.current);
        voiceUrlRef.current = null;
      }
      stopMusic();
    };
  }, [isVisible, data, isSoundEnabled, onClose, duckedVolume, musicVolume]);

  if (!isVisible || !data) return null;

  const teamName = (data.teamName || 'SALES TEAM').toUpperCase();
  const agentName = data.agentName || 'സെയിൽസ് ഏജന്റ്';
  const agentPhoto =
    data.photoUrl ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face';

  return (
    <>
      {/* Premium Styles (kept intact) */}
      <style jsx>{`
        @keyframes cardDrop {
          0% { transform: translateY(-120vh) rotateY(180deg) rotateX(45deg) scale(0.8); opacity: 0; }
          70% { transform: translateY(30px) rotateY(0deg) rotateX(0deg) scale(1.05); opacity: 1; }
          85% { transform: translateY(-15px) rotateY(0deg) rotateX(0deg) scale(0.98); }
          100% { transform: translateY(0) rotateY(0deg) rotateX(0deg) scale(1); opacity: 1; }
        }
        @keyframes cardFlip {
          0% { transform: rotateY(0deg) scale(1); }
          50% { transform: rotateY(90deg) scale(1.05); }
          100% { transform: rotateY(180deg) scale(1); }
        }
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0) rotateY(0deg) rotateZ(0deg); }
          25% { transform: translateY(-8px) rotateY(2deg) rotateZ(-1deg); }
          50% { transform: translateY(-12px) rotateY(0deg) rotateZ(0deg); }
          75% { transform: translateY(-6px) rotateY(-2deg) rotateZ(1deg); }
        }
        @keyframes shimmer {
          0% { background-position: -300px 0; opacity: 0; }
          50% { opacity: 1; }
          100% { background-position: 300px 0; opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow:
              0 0 40px rgba(255, 215, 0, 0.6),
              0 0 80px rgba(255, 215, 0, 0.3),
              inset 0 0 30px rgba(255, 215, 0, 0.15),
              0 5px 20px rgba(0,0,0,0.3);
          }
          50% {
            box-shadow:
              0 0 70px rgba(255, 215, 0, 0.9),
              0 0 120px rgba(255, 215, 0, 0.5),
              inset 0 0 50px rgba(255, 215, 0, 0.25),
              0 10px 30px rgba(0,0,0,0.4);
          }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes teamPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes firewerk {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
          100% { transform: scale(2) rotate(360deg); opacity: 0; }
        }
        @keyframes textGlow {
          0%, 100% {
            text-shadow:
              0 0 10px rgba(255,215,0,0.8),
              0 0 20px rgba(255,215,0,0.5),
              0 0 30px rgba(255,215,0,0.3);
          }
          50% {
            text-shadow:
              0 0 15px rgba(255,215,0,1),
              0 0 30px rgba(255,215,0,0.8),
              0 0 45px rgba(255,215,0,0.5);
          }
        }
        @keyframes borderPulse {
          0%, 100% { background-size: 200% 200%; background-position: 0% 50%; }
          50% { background-size: 200% 200%; background-position: 100% 50%; }
        }
        .card-container {
          animation: ${showCard ? 'cardDrop 1.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none'};
          transform-style: preserve-3d;
          perspective: 1200px;
        }
        .card-floating { animation: cardFloat 6s ease-in-out infinite; }
        .card-flip-container { position: relative; transform-style: preserve-3d; animation: ${flipCard ? 'cardFlip 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards' : 'none'}; }
        .card-shimmer { position: relative; overflow: hidden; }
        .card-shimmer::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          animation: shimmer 3s infinite;
        }
        .confetti-piece { position: absolute; width: 12px; height: 12px; animation: confettiFall 5s linear infinite; }
        .sparkle { position: absolute; width: 8px; height: 8px; background: #FFD700; border-radius: 50%; animation: sparkle 2.5s ease-in-out infinite; }
        .firework { position: absolute; width: 60px; height: 60px; border-radius: 50%; animation: firewerk 2s ease-out infinite; }
        .premium-card {
          background: linear-gradient(145deg,#0a0e27 0%,#16213e 15%,#1e3a8a 35%,#312e81 50%,#1e3a8a 65%,#16213e 85%,#0a0e27 100%);
          border: 8px solid transparent; background-clip: padding-box; position: relative;
        }
        .premium-card::before {
          content: ''; position: absolute; inset: -8px;
          background: linear-gradient(45deg,#ffd700 0%, #ff6b35 12.5%, #4ecdc4 25%, #45b7d1 37.5%, #96ceb4 50%, #ffeaa7 62.5%, #dda0dd 75%, #98d8c8 87.5%, #ffd700 100%);
          background-size: 200% 200%; animation: borderPulse 4s ease infinite; border-radius: 24px; z-index: -1;
        }
        .team-pulse { animation: teamPulse 3s ease-in-out infinite; }
        .text-glow { animation: textGlow 2.5s ease-in-out infinite; }
        .blur-heavy { filter: blur(20px) brightness(0.6) contrast(0.8); }
        .card-back { transform: rotateY(0deg); backface-visibility: hidden; }
        .card-front { transform: rotateY(180deg); backface-visibility: hidden; }
        .rarity-glow {
          background: radial-gradient(circle at center, rgba(255,215,0,0.25) 0%, rgba(255,165,0,0.2) 25%, rgba(138,43,226,0.15) 50%, rgba(75,0,130,0.1) 75%, transparent 90%);
          animation: pulseGlow 4s ease-in-out infinite;
        }
        .holographic {
          background: linear-gradient(45deg, rgba(255,0,150,0.1) 0%, rgba(0,255,255,0.1) 25%, rgba(255,255,0,0.1) 50%, rgba(255,0,255,0.1) 75%, rgba(0,255,0,0.1) 100%);
          background-size: 300% 300%; animation: borderPulse 3s ease infinite;
        }
      `}</style>

      <div className="fixed inset-0 bg-gradient-to-br from-black via-purple-950/90 to-black backdrop-blur-md flex items-center justify-center z-50" data-testid="celebration-popup">
        {/* Confetti + sparkles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((piece) => {
            let shape = '';
            switch (piece.type) {
              case 'triangle': shape = 'polygon(50% 0%, 0% 100%, 100% 100%)'; break;
              case 'star': shape = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'; break;
              case 'heart': shape = ''; break; // let borderRadius/size handle
              case 'square': shape = 'none'; break;
              default: shape = 'none';
            }
            return (
              <div
                key={piece.id}
                className="confetti-piece"
                style={{
                  left: `${piece.left}%`,
                  animationDelay: `${piece.delay}ms`,
                  backgroundColor: piece.color,
                  borderRadius: piece.type === 'circle' ? '50%' : piece.type === 'square' ? '2px' : '0',
                  clipPath: shape || 'none',
                  width: piece.type === 'star' ? '16px' : '12px',
                  height: piece.type === 'star' ? '16px' : '12px',
                }}
              />
            );
          })}

          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={`sparkle-${i}`}
              className="sparkle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 4}s`,
                background: i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FF6B35' : i % 4 === 2 ? '#4ECDC4' : '#FF69B4',
                width: `${6 + Math.random() * 4}px`,
                height: `${6 + Math.random() * 4}px`,
              }}
            />
          ))}

          {showFireworks &&
            Array.from({ length: 8 }, (_, i) => (
              <div
                key={`firework-${i}`}
                className="firework"
                style={{
                  left: `${20 + i * 10}%`,
                  top: `${20 + Math.random() * 60}%`,
                  background: `radial-gradient(circle, ${confetti[i % confetti.length]?.color || '#FFD700'} 20%, transparent 70%)`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
        </div>

        {/* Premium Card */}
        <div className={`card-container ${showCard ? 'card-floating' : ''}`}>
          <div className="card-flip-container">
            <div className="premium-card card-shimmer shadow-2xl w-96 h-[620px] mx-4 relative overflow-hidden rounded-3xl">
              <div className="rarity-glow absolute inset-0" />
              <div className="holographic absolute inset-0 opacity-30" />

              {/* Back (tease) */}
              <div className={`card-back absolute inset-0 p-8 flex flex-col justify-center items-center transition-opacity duration-500 ${flipCard ? 'opacity-0' : 'opacity-100'}`}>
                <div className="text-center">
                  <div className="w-28 h-28 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center mb-8 mx-auto shadow-2xl relative">
                    <span className="text-4xl">🏆</span>
                    <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping opacity-20" />
                  </div>

                  <div className="team-pulse mb-10">
                    <h2 className="text-4xl font-black text-white tracking-wider mb-3 text-glow">{teamName}</h2>
                    <div className="h-1.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full mb-2" />
                    <div className="h-0.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
                  </div>

                  <div className="relative mb-8">
                    <div className="w-36 h-44 rounded-xl overflow-hidden mx-auto relative">
                      <img src={agentPhoto} alt="Agent preview" className="w-full h-full object-cover object-top blur-heavy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent rounded-xl flex items-center justify-center">
                        <div className="text-6xl animate-pulse">❓</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-yellow-400 text-xl font-bold animate-bounce">🎯 NEW SALE CHAMPION 🎯</div>
                    <div className="text-white/80 text-lg font-semibold">Ready to Reveal...</div>
                  </div>
                </div>
              </div>

              {/* Front (real data) */}
              <div className={`card-front absolute inset-0 p-8 transition-opacity duration-500 ${flipCard ? 'opacity-100' : 'opacity-0'}`}>
                <div className="h-full flex flex-col">
                  <div className="flex justify-between items-start mb-6">
                    <div className="text-left">
                      <div className="text-6xl font-black text-yellow-400 mb-1 drop-shadow-xl text-glow">{data.newActivationCount}</div>
                      <div className="text-sm font-bold text-white/90 tracking-wider">SALES</div>
                    </div>
                    <div className="text-right">
                      <div className="w-12 h-7 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4 shadow-lg">
                        <div className="text-xs text-white font-bold">★ VIP</div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <div className="text-xl">🏢</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 flex items-center justify-center mb-6">
                    <div className="relative">
                      <div className="w-52 h-60 bg-gradient-to-b from-transparent via-transparent to-black/40 rounded-2xl overflow-hidden shadow-2xl relative">
                        <img
                          src={agentPhoto}
                          alt={`${agentName} celebrating`}
                          className="w-full h-full object-cover object-top"
                          data-testid="celebration-agent-photo"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      </div>

                      <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-black text-sm font-bold px-4 py-3 rounded-full shadow-2xl animate-bounce">
                        🎉 സെയിൽ! 🎉
                      </div>

                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-3 py-2 rounded-full shadow-xl">
                        +{data.newActivationCount} Sales Today!
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-6">
                    <h3 className="text-3xl font-black text-white tracking-wider drop-shadow-xl text-glow" data-testid="celebration-agent-name">
                      {agentName}
                    </h3>
                    <div className="text-yellow-400 text-sm font-bold mt-2 tracking-wide">{teamName}</div>
                    <div className="text-white/70 text-xs mt-1">Agent ID: {data.agentId}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-white text-sm font-bold mb-6">
                    <div className="text-center bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-sm rounded-xl py-3 border border-green-400/30">
                      <div className="text-xl text-green-400 font-black">98</div>
                      <div className="text-xs text-green-300">PERFORMANCE</div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-sm rounded-xl py-3 border border-blue-400/30">
                      <div className="text-xl text-blue-400 font-black">94</div>
                      <div className="text-xs text-blue-300">SKILL</div>
                    </div>
                    <div className="text-center bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-sm rounded-xl py-3 border border-yellow-400/30">
                      <div className="text-xl text-yellow-400 font-black" data-testid="celebration-activation-count">
                        {data.newActivationCount}
                      </div>
                      <div className="text-xs text-yellow-300">TODAY</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="inline-block bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-0.5 rounded-full">
                      <div className="bg-gradient-to-r from-purple-900/90 to-pink-900/90 px-6 py-3 rounded-full backdrop-blur-sm">
                        <div className="text-sm text-white font-bold flex items-center gap-2">⭐ സെയിൽസ് ലെജൻഡ് ⭐</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sound Toggle (real-time store) */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSound}
                className="absolute top-4 left-4 text-white/80 hover:text-white hover:bg-white/20 w-12 h-12 p-0 rounded-full z-10 backdrop-blur-sm border border-white/20"
                data-testid="celebration-sound-toggle"
                title={isSoundEnabled ? 'Mute' : 'Unmute'}
              >
                {isSoundEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
              </Button>
            </div>
          </div>

          {/* Close */}
          <div className="absolute -bottom-24 left-1/2 -translate-x-1/2">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-300 hover:via-orange-400 hover:to-red-400 text-black font-bold px-10 py-4 rounded-2xl shadow-2xl transform transition-all duration-300 hover:scale-110 text-xl border-2 border-yellow-300/50"
              data-testid="celebration-close"
            >
              🎊 FANTASTIC! 🏆✨
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
