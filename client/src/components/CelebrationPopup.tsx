import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CelebrationData {
  agentId: string;
  agentName: string;
  photoUrl: string;
  teamName?: string;
  teamId?: string;
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
  countdownSeconds?: number;
  autoCloseMs?: number;
  videoUrl?: string;
}

// Mock audio store for demo
const useAudioStore = () => {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  return {
    isSoundEnabled,
    toggleSound: () => setIsSoundEnabled(!isSoundEnabled)
  };
};

export default function CelebrationPopup({
  isVisible,
  data,
  onClose,
  bgMusicUrl = 'https://res.cloudinary.com/dxq0nrirt/video/upload/v1758179396/ssvid.net--Rolex-Theme-Video-Vikram-Kamal-Haasan-ANIRUDH_128kbps.m4a_maxsqf.mp3',
  musicVolume = 0.25,
  duckedVolume = 0.08,
  countdownSeconds = 3,
  autoCloseMs = 12000,
  videoUrl = 'https://cdn.coverr.co/videos/coverr-confetti-people-celebrating-6388/1080p.mp4'
}: CelebrationPopupProps) {
  const { isSoundEnabled, toggleSound } = useAudioStore();

  const [countdown, setCountdown] = useState(countdownSeconds);
  const [showCard, setShowCard] = useState(false);
  const [poppers, setPoppers] = useState<Array<{ id: number; side: 'left' | 'right' }>>([]);
  const [continuousGlitters, setContinuousGlitters] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voiceUrlRef = useRef<string | null>(null);

  const agentDisplay = (data?.agentName || 'ഏജന്റ്').trim();
  const buildSentence = () => `${agentDisplay} ഒരു സെയിൽ ഇട്ടു, നന്ദി!`;

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
    try { await musicRef.current.play(); } catch {}
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
    try {
      const res = await fetch(`/api/tts?text=${encodeURIComponent(buildSentence())}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      voiceUrlRef.current = url;

      if (!voiceRef.current) voiceRef.current = new Audio();
      const v = voiceRef.current;
      v.src = url;
      v.preload = 'auto';

      v.onplay = () => { if (musicRef.current) musicRef.current.volume = duckedVolume; };
      const restore = () => { if (musicRef.current) musicRef.current.volume = musicVolume; };
      v.onended = restore; v.onpause = restore; v.onerror = restore;

      await v.play();
    } catch {}
  };

  const triggerPoppers = () => {
    setPoppers([
      { id: Date.now(), side: 'left' },
      { id: Date.now() + 1, side: 'right' }
    ]);
  };

  const generateContinuousGlitters = () => {
    const interval = setInterval(() => {
      const newGlitters = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 200
      }));
      setContinuousGlitters(prev => [...prev.slice(-50), ...newGlitters]);
    }, 400);
    return interval;
  };

  useEffect(() => {
    if (!isVisible || !data) return;

    setCountdown(countdownSeconds);
    setShowCard(false);
    setPoppers([]);
    setContinuousGlitters([]);

    if (isSoundEnabled) startMusic();

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    let glitterInterval: NodeJS.Timeout;

    const showCardTimer = setTimeout(() => {
      setShowCard(true);
      triggerPoppers();
      glitterInterval = generateContinuousGlitters();
      if (isSoundEnabled) setTimeout(() => playVoice(), 250);
    }, countdownSeconds * 1000);

    const closeTimer = setTimeout(onClose, countdownSeconds * 1000 + autoCloseMs);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(showCardTimer);
      clearTimeout(closeTimer);
      if (glitterInterval) clearInterval(glitterInterval);

      if (voiceRef.current) {
        try { voiceRef.current.pause(); } catch {}
        voiceRef.current.src = '';
        voiceRef.current = null;
      }
      if (voiceUrlRef.current) {
        URL.revokeObjectURL(voiceUrlRef.current);
        voiceUrlRef.current = null;
      }
      stopMusic();
    };
  }, [isVisible, data, isSoundEnabled, onClose, autoCloseMs, countdownSeconds]);

  if (!isVisible || !data) return null;

  return (
    <>
      <style jsx>{`
        @keyframes countdownPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        .countdown-number {
          animation: countdownPulse 1s ease-in-out;
        }

        @keyframes cardEnter {
          0% { transform: scale(0.9) translateY(30px); opacity: 0; }
          60% { transform: scale(1.02) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        .card-enter {
          animation: cardEnter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes fadeOut {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.95); }
        }
        .fade-out {
          animation: fadeOut 0.3s ease-out forwards;
        }

        .popper-skyburst {
          position: absolute;
          top: 50%;
          width: 0;
          height: 0;
          pointer-events: none;
          will-change: transform;
        }
        .popper-left { left: 10%; }
        .popper-right { right: 10%; }

        .flash {
          position: absolute;
          left: 0;
          top: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0.3);
          background: radial-gradient(circle, #fff, #ffd700 40%, rgba(255,200,0,0.3) 70%, transparent 90%);
          animation: flashPop 300ms ease-out forwards;
        }
        @keyframes flashPop {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
          40% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2.8); }
        }

        .ring {
          position: absolute;
          left: 0;
          top: 0;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          border: 4px solid rgba(255,215,0,0.9);
          transform: translate(-50%, -50%) scale(0.2);
          opacity: 0.9;
          animation: ringOut 600ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          filter: drop-shadow(0 0 15px rgba(255,215,0,0.5));
        }
        @keyframes ringOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
          25% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(10); }
        }

        .comet {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--cw, 16px);
          height: var(--ch, 4px);
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,1), rgba(255,215,0,0.8) 40%, transparent 100%);
          transform-origin: left center;
          filter: drop-shadow(0 0 8px rgba(255,215,0,0.6));
          will-change: transform, opacity;
          animation: 
            cometBurst var(--t1, 400ms) cubic-bezier(0.15, 0.95, 0.25, 1) var(--d, 0ms) forwards,
            cometDrift var(--t2, 1400ms) ease-out calc(var(--d, 0ms) + var(--t1, 400ms)) forwards;
        }
        @keyframes cometBurst {
          0% { transform: translate(0, 0) rotate(var(--r0, 0deg)) scaleX(0.6); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(var(--r1, 360deg)) scaleX(1); opacity: 1; }
        }
        @keyframes cometDrift {
          0% { transform: translate(var(--tx), var(--ty)) rotate(var(--r1, 360deg)); opacity: 1; }
          100% { 
            transform: translate(calc(var(--tx) + var(--fx)), calc(var(--ty) + var(--fy))) rotate(calc(var(--r1, 360deg) + 180deg));
            opacity: 0;
          }
        }

        .star {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--s, 12px);
          height: var(--s, 12px);
          transform: translate(-50%, -50%) rotate(45deg) scale(0.5);
          background: var(--c, #FFD700);
          filter: drop-shadow(0 0 8px rgba(255,215,0,0.8));
          opacity: 1;
          will-change: transform, opacity;
          animation: 
            starFly var(--st1, 450ms) cubic-bezier(0.18, 0.9, 0.28, 1) var(--sd, 0ms) forwards,
            starFade var(--st2, 1000ms) ease-out calc(var(--sd, 0ms) + var(--st1, 450ms)) forwards;
        }
        @keyframes starFly {
          0% { transform: translate(-50%, -50%) rotate(45deg) scale(0.5); }
          100% { transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y))) rotate(45deg) scale(1.2); }
        }
        @keyframes starFade {
          0% { opacity: 1; }
          100% { 
            opacity: 0;
            transform: translate(calc(-50% + var(--x)), calc(-50% + var(--y) + 100px)) rotate(45deg) scale(1.2);
          }
        }

        .glitter {
          position: absolute;
          left: 0;
          top: 0;
          width: var(--g, 8px);
          height: var(--g, 8px);
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0.6);
          background: radial-gradient(circle, #fff, rgba(255,255,255,0) 70%);
          filter: drop-shadow(0 0 10px rgba(255,255,255,1));
          will-change: transform, opacity;
          animation: glitterOut var(--gt, 800ms) ease-out var(--gd, 0ms) forwards;
        }
        @keyframes glitterOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
          35% { opacity: 1; }
          100% { 
            opacity: 0;
            transform: translate(calc(-50% + var(--gx)), calc(-50% + var(--gy))) scale(0.1);
          }
        }

        .continuous-glitter {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          pointer-events: none;
          animation: continuousGlitterPop 1.5s ease-out forwards;
        }
        @keyframes continuousGlitterPop {
          0% {
            opacity: 0;
            transform: scale(0) rotate(0deg);
          }
          10% {
            opacity: 1;
            transform: scale(1.5) rotate(90deg);
          }
          50% {
            opacity: 1;
            transform: scale(1) rotate(180deg) translateY(-30px);
          }
          100% {
            opacity: 0;
            transform: scale(0.3) rotate(360deg) translateY(-80px);
          }
        }

        .sparkle-burst {
          position: absolute;
          width: 4px;
          height: 4px;
          background: white;
          border-radius: 50%;
          pointer-events: none;
          animation: sparkleBurst 1s ease-out forwards;
          box-shadow: 0 0 10px currentColor;
        }
        @keyframes sparkleBurst {
          0% {
            opacity: 1;
            transform: scale(0);
          }
          50% {
            opacity: 1;
            transform: scale(2);
          }
          100% {
            opacity: 0;
            transform: scale(0.5) translate(var(--sparkle-x), var(--sparkle-y));
          }
        }
      `}</style>

      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gradient-to-br from-black/70 via-purple-900/30 to-black/70 backdrop-blur-sm">
        {/* Sound Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSound}
          className="absolute top-6 right-6 text-white/90 hover:text-white hover:bg-white/10 w-11 h-11 p-0 rounded-full z-[65] transition-all duration-300 hover:scale-110"
          data-testid="celebration-sound-toggle"
          title={isSoundEnabled ? 'Mute' : 'Unmute'}
        >
          {isSoundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </Button>

        {/* Countdown Screen - Full screen centered */}
        {!showCard && countdown > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="text-[10rem] md:text-[14rem] font-black countdown-number drop-shadow-2xl" 
                 style={{ 
                   background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                   WebkitBackgroundClip: 'text',
                   WebkitTextFillColor: 'transparent',
                   textShadow: '0 0 80px rgba(255,215,0,0.5)'
                 }}
                 key={countdown}>
              {countdown}
            </div>
            <div className="flex items-center gap-3 mt-8">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              <p className="text-2xl md:text-3xl font-bold opacity-90 drop-shadow-lg">
                Get Ready for Something Special...
              </p>
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          </div>
        )}

        {/* Celebration Card - Appears after countdown */}
        {showCard && (
          <div className="relative w-full max-w-5xl mx-auto px-4 min-h-[620px]">
            {/* Continuous Glitters - Keep popping throughout */}
            {continuousGlitters.map((glitter) => {
              const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A78BFA', '#F59E0B', '#F472B6', '#10B981', '#FBBF24', '#EC4899'];
              const color = colors[Math.floor(Math.random() * colors.length)];
              return (
                <div
                  key={glitter.id}
                  className="continuous-glitter"
                  style={{
                    left: `${glitter.x}%`,
                    top: `${glitter.y}%`,
                    background: `radial-gradient(circle, ${color}, transparent 70%)`,
                    filter: `drop-shadow(0 0 8px ${color})`,
                    animationDelay: `${glitter.delay}ms`
                  }}
                >
                  {/* Add sparkle bursts around each glitter */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const angle = (i / 6) * Math.PI * 2;
                    const distance = 15 + Math.random() * 20;
                    return (
                      <span
                        key={i}
                        className="sparkle-burst"
                        style={{
                          '--sparkle-x': `${Math.cos(angle) * distance}px`,
                          '--sparkle-y': `${Math.sin(angle) * distance}px`,
                          color: color,
                          animationDelay: `${glitter.delay + i * 50}ms`
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Poppers */}
            {poppers.map((popper) => {
              const comets = 40;
              const stars = 20;
              const glitters = 30;

              return (
                <div
                  key={popper.id}
                  className={`popper-skyburst ${popper.side === 'left' ? 'popper-left' : 'popper-right'}`}
                >
                  <span className="flash" />
                  <span className="ring" />

                  {Array.from({ length: comets }).map((_, i) => {
                    const dir = popper.side === 'left' ? 1 : -1;
                    const spread = Math.PI * 1.8;
                    const base = popper.side === 'left' ? -Math.PI * 0.1 : Math.PI * 1.1;
                    const angle = base + (i / comets) * spread * (popper.side === 'left' ? 1 : -1) + (Math.random() - 0.5) * 0.2;
                    const dist = 250 + Math.random() * 500;
                    const tx = Math.cos(angle) * dist * dir;
                    const ty = Math.sin(angle) * dist;
                    const fx = (Math.random() * 200 - 100);
                    const fy = 200 + Math.random() * 250;
                    const r0 = `${Math.random() * 60 - 30}deg`;
                    const r1 = `${Math.random() * 720 - 360}deg`;
                    const t1 = 300 + Math.random() * 150;
                    const t2 = 1200 + Math.random() * 900;
                    const d = i * 8 + Math.random() * 40;
                    const cw = 14 + Math.random() * 18;
                    const ch = 4 + Math.random() * 3;

                    return (
                      <i
                        key={`c-${i}`}
                        className="comet"
                        style={{
                          '--tx': `${tx}px`,
                          '--ty': `${ty}px`,
                          '--fx': `${fx}px`,
                          '--fy': `${fy}px`,
                          '--r0': r0,
                          '--r1': r1,
                          '--t1': `${t1}ms`,
                          '--t2': `${t2}ms`,
                          '--d': `${d}ms`,
                          '--cw': `${cw}px`,
                          '--ch': `${ch}px`,
                        } as React.CSSProperties}
                      />
                    );
                  })}

                  {Array.from({ length: stars }).map((_, i) => {
                    const dir = popper.side === 'left' ? 1 : -1;
                    const ang = Math.random() * Math.PI * 2;
                    const radius = 150 + Math.random() * 300;
                    const x = Math.cos(ang) * radius * dir;
                    const y = Math.sin(ang) * radius;
                    const st1 = 350 + Math.random() * 160;
                    const st2 = 900 + Math.random() * 800;
                    const sd = i * 30 + Math.random() * 70;
                    const s = 10 + Math.random() * 12;
                    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#A78BFA', '#F59E0B', '#F472B6', '#10B981'];
                    const c = colors[Math.floor(Math.random() * colors.length)];
                    return (
                      <b
                        key={`s-${i}`}
                        className="star"
                        style={{
                          '--x': `${x}px`,
                          '--y': `${y}px`,
                          '--st1': `${st1}ms`,
                          '--st2': `${st2}ms`,
                          '--sd': `${sd}ms`,
                          '--s': `${s}px`,
                          '--c': c,
                          background: c,
                        } as React.CSSProperties}
                      />
                    );
                  })}

                  {Array.from({ length: glitters }).map((_, i) => {
                    const dir = popper.side === 'left' ? 1 : -1;
                    const ang = Math.random() * Math.PI * 2;
                    const dist = 100 + Math.random() * 280;
                    const gx = Math.cos(ang) * dist * dir;
                    const gy = Math.sin(ang) * dist;
                    const gt = 650 + Math.random() * 600;
                    const gd = i * 20;
                    const g = 5 + Math.random() * 8;
                    return (
                      <em
                        key={`g-${i}`}
                        className="glitter"
                        style={{
                          '--gx': `${gx}px`,
                          '--gy': `${gy}px`,
                          '--gt': `${gt}ms`,
                          '--gd': `${gd}ms`,
                          '--g': `${g}px`,
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* Main Card */}
            <div className="card-enter">
<div className="relative bg-gradient-to-br from-white via-amber-50/50 to-white backdrop-blur-xl rounded-[2rem] shadow-2xl p-10 md:p-14 overflow-hidden min-h-[620px] flex items-center">
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer pointer-events-none" />
                
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-br-full" />
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-orange-400/20 to-transparent rounded-tl-full" />

                {/* Content */}
     
{/* Content — photo LEFT (full size rectangle), text RIGHT */}
<div className="relative z-10">
  <div className="grid grid-cols-1 md:grid-cols-[48%,1fr] items-stretch gap-10 md:gap-14 min-h-[680px]">
    {/* LEFT: Full-size rectangular image */}
    <div className="md:self-stretch">
      <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-2xl">
        {/* soft glow */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 blur-2xl" />
        <img
          src={data.photoUrl}
          alt={agentDisplay}
          className="h-full w-full object-cover object-center"
          data-testid="celebration-agent-photo"
        />
        {/* sparkle badge (keep if you like) */}
        <div className="absolute bottom-4 right-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl p-3 md:p-4 shadow-xl">
          <Sparkles className="w-7 h-7 md:w-9 md:h-9 text-white" />
        </div>
      </div>
    </div>

    {/* RIGHT: text (left-aligned) */}
    <div className="flex items-center">
      <div className="w-full text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 text-black text-sm font-bold mb-6 shadow-lg">
          <span className="text-lg">🏆</span>
          <span>{Math.max(1, data.newActivationCount)} Activation{data.newActivationCount > 1 ? 's' : ''}</span>
          <span className="text-lg">🏆</span>
        </div>

        {/* Agent Name */}
        <h3 className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 mb-2">
          {agentDisplay}
        </h3>

        {/* Team Name */}
        {data.teamName && (
          <p className="text-lg md:text-xl text-gray-600 font-semibold mb-6">
            Team {data.teamName}
          </p>
        )}

        {/* Message + Timestamp */}
        <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 rounded-2xl p-5 md:p-6 mb-6 shadow-inner inline-block">
          <p className="text-2xl md:text-3xl font-black mb-2">🎊 Congratulations! 🎊</p>
          <p className="text-sm md:text-base font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600">
            Outstanding Achievement!
          </p>
          <p className="text-xs md:text-sm text-gray-500 mt-2 font-medium">
            {new Date(data.timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
          </p>
        </div>

        {/* Close button */}
        <Button
          onClick={onClose}
          className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 hover:from-yellow-500 hover:via-orange-500 hover:to-yellow-500 text-black font-bold text-lg px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
          data-testid="celebration-close"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Awesome! Keep It Up!
          <Sparkles className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  </div>
</div>



              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Demo component
function Demo() {
  const [showCelebration, setShowCelebration] = useState(false);
  
  const mockData: CelebrationData = {
    agentId: '123',
    agentName: 'രാജേഷ് കുമാർ',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    teamName: 'Sales Champions',
    teamId: 'team-001',
    newActivationCount: 3,
    timestamp: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Button
        onClick={() => setShowCelebration(true)}
        className="bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-yellow-500 hover:to-orange-500 text-black font-bold text-xl py-6 px-12 rounded-2xl shadow-2xl hover:scale-105 transition-all duration-300"
      >
        <Sparkles className="w-6 h-6 mr-2" />
        Trigger Celebration
      </Button>

      <CelebrationPopup
        isVisible={showCelebration}
        data={mockData}
        onClose={() => setShowCelebration(false)}
      />
    </div>
  );
}

export  {Demo};