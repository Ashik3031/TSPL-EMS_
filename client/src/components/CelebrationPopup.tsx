import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioStore } from '@/store/audioStore';

interface CelebrationData {
  agentId: string;
  agentName: string;
  photoUrl: string;
  teamId: string; // swap to teamName if available
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
  flipDelayMs?: number;
  autoCloseMs?: number;
}

export default function CelebrationPopup({
  isVisible,
  data,
  onClose,
  bgMusicUrl = 'https://res.cloudinary.com/dxq0nrirt/video/upload/v1758179396/ssvid.net--Rolex-Theme-Video-Vikram-Kamal-Haasan-ANIRUDH_128kbps.m4a_maxsqf.mp3',
  musicVolume = 0.25,
  duckedVolume = 0.08,
  flipDelayMs = 2600,   // longer suspense window
  autoCloseMs = 9500,   // slightly longer overall
}: CelebrationPopupProps) {
  const { isSoundEnabled, toggleSound } = useAudioStore();

  const [mounted, setMounted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [confetti, setConfetti] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);
  const [frontProgress, setFrontProgress] = useState(0); // ring progress 0-100

  const musicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const voiceUrlRef = useRef<string | null>(null);

  const teamLabel = data?.teamId ? `TEAM ${String(data.teamId).toUpperCase()}` : 'TEAM';
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

  useEffect(() => {
    if (!isVisible || !data) return;
    setMounted(true);
    setIsFlipped(false);
    setFrontProgress(0);

    // background confetti prepared but mostly hidden until flip
    const colors = ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#96CEB4','#FFEAA7','#DDA0DD','#98D8C8'];
    setConfetti(Array.from({ length: 110 }, (_, i) => ({
      id: i, left: Math.random()*100, delay: Math.random()*2200, color: colors[Math.floor(Math.random()*colors.length)],
    })));

    // music now, if allowed
    (async () => { if (isSoundEnabled) await startMusic(); })();

    // progress ring animation for suspense
    const started = Date.now();
    const tick = () => {
      const elapsed = Date.now() - started;
      const pct = Math.min(100, (elapsed / flipDelayMs) * 100);
      setFrontProgress(pct);
      if (pct < 100 && mounted) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // flip + voice timing
    const flipTimer = setTimeout(async () => {
      setIsFlipped(true);
      // voice a beat after the flip for dramatic reveal
      if (isSoundEnabled) setTimeout(() => playVoice(), 420);
    }, flipDelayMs);

    // auto close
    const closeTimer = setTimeout(onClose, autoCloseMs);

    return () => {
      clearTimeout(flipTimer);
      clearTimeout(closeTimer);
      setMounted(false);
      setIsFlipped(false);

      if (voiceRef.current) { try { voiceRef.current.pause(); } catch {} voiceRef.current.src=''; voiceRef.current=null; }
      if (voiceUrlRef.current) { URL.revokeObjectURL(voiceUrlRef.current); voiceUrlRef.current=null; }
      stopMusic();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, data, isSoundEnabled, onClose, autoCloseMs, flipDelayMs]);

  const manualReveal = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      if (isSoundEnabled) setTimeout(() => playVoice(), 320);
    }
  };

  if (!isVisible || !data) return null;

  return (
    <>
      <style jsx>{`
        /* Popup entrance */
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.96) translateY(6px); }
          60% { opacity: 1; transform: scale(1.01) translateY(0); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* Aurora background movement */
        @keyframes auroraShift {
          0% { transform: translateX(-10%) translateY(-6%) rotate(0deg); }
          50% { transform: translateX(8%) translateY(6%) rotate(6deg); }
          100% { transform: translateX(-10%) translateY(-6%) rotate(0deg); }
        }

        /* Scene */
        .scene {
          perspective: 1600px;
          animation: popIn 480ms ease forwards;
        }

        .card3d {
          width: min(88vw, 440px);       /* narrower card */
          height: min(82vh, 660px);
          max-height: 660px;
          transform-style: preserve-3d;
          transition: transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          will-change: transform;
        }
        .card3d.flipped { transform: rotateY(180deg); }

        .face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 28px 80px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.08);
        }

        /* FRONT: darker, suspense */
        .front {
          background:
            radial-gradient(120% 120% at 50% 10%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 48%),
            linear-gradient(135deg, #060b17 0%, #0a1228 35%, #0f1c3f 100%);
        }

        /* BACK: luxe glass-metal */
        .back {
          transform: rotateY(180deg);
          background:
            radial-gradient(120% 140% at 50% -10%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 50%, transparent 70%),
            linear-gradient(135deg, #0d1326 0%, #101833 40%, #0b1020 100%);
        }

        /* Float & heartbeat on front for tension */
        .floaty { animation: floaty 3.2s ease-in-out infinite; }
        @keyframes floaty { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }

        .heartbeat { animation: heartbeat 1500ms ease-in-out infinite; }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.01); }
          40% { transform: scale(0.995); }
          60% { transform: scale(1.012); }
        }

        /* Confetti (only impactful post-flip) */
        @keyframes confettiFall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .confetti-piece {
          position: absolute; width: 10px; height: 10px;
          animation: confettiFall 3.2s linear infinite;
          border-radius: 2px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.25));
          opacity: ${isFlipped ? 1 : 0}; transition: opacity 220ms ease;
        }

        /* Shine sweep on the back */
        .shine::before {
          content: ''; position: absolute; inset: -40%;
          background: conic-gradient(from 0deg, rgba(255,255,255,0.14), rgba(255,255,255,0) 30%);
          transform: rotate(0deg); animation: sweep 4.5s linear infinite;
          pointer-events: none;
        }
        @keyframes sweep { to { transform: rotate(360deg); } }

        .metric {
          background: linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.16);
          backdrop-filter: blur(6px);
        }

        /* Circular reveal ring (front) */
        .ring {
          --size: 220px;
          width: var(--size);
          height: var(--size);
          border-radius: 9999px;
          position: relative;
          display: grid;
          place-items: center;
          background:
            radial-gradient(closest-side, rgba(0,0,0,0) 80%, transparent 81% 100%),
            conic-gradient(#ffd84d ${frontProgress}%, rgba(255,255,255,0.15) 0);
          transition: background 120ms linear;
        }
        .ring img {
          width: calc(var(--size) - 20px);
          height: calc(var(--size) - 20px);
          border-radius: 18px;
          object-fit: cover; object-position: top;
          filter: blur(9px) brightness(0.85) saturate(0.85);
        }

        /* Background aurora + vignette */
        .bg-aurora {
          position: absolute; inset: 0; overflow: hidden;
          background:
            radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0.6), rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.9) 100%),
            #030712;
        }
        .bg-aurora::after {
          content: ''; position: absolute; inset: -20%;
          background:
            radial-gradient(40% 30% at 20% 20%, rgba(59,130,246,0.25), transparent 60%),
            radial-gradient(35% 35% at 80% 30%, rgba(16,185,129,0.25), transparent 60%),
            radial-gradient(45% 40% at 60% 80%, rgba(236,72,153,0.20), transparent 60%);
          filter: blur(40px);
          animation: auroraShift 20s ease-in-out infinite;
        }
        .vignette {
          position: absolute; inset: 0;
          background: radial-gradient(100% 100% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%);
          pointer-events: none;
        }
      `}</style>

      <div className="fixed inset-0 z-[60]">
        {/* Animated background */}
        <div className="bg-aurora" />
        <div className="vignette" />

        {/* Parallax orbs */}
        <div className="pointer-events-none absolute -top-20 -left-28 w-96 h-96 rounded-full blur-3xl opacity-20 bg-cyan-400" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-15 bg-fuchsia-500" />
      </div>

      {/* Confetti layer (pops post-flip) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[61]">
        {confetti.map((piece) => (
          <div
            key={piece.id}
            className="confetti-piece"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}ms`,
              backgroundColor: piece.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            }}
          />
        ))}
      </div>

      {/* Sound Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSound}
        className="absolute top-4 left-4 text-white/90 hover:text-white hover:bg-white/10 w-9 h-9 p-0 rounded-full z-[65]"
        data-testid="celebration-sound-toggle"
        title={isSoundEnabled ? 'Mute' : 'Unmute'}
      >
        {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </Button>

      {/* Scene */}
      <div className="fixed inset-0 flex items-center justify-center z-[64]">
        <div className="scene">
          <div className={`card3d ${isFlipped ? 'flipped' : ''} ${mounted && !isFlipped ? 'floaty heartbeat' : ''}`}>
            {/* FRONT — Suspense state */}
            <div className="face front relative">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_-10%,rgba(255,255,255,0.06),rgba(255,255,255,0)_60%)]" />
              </div>

              <div className="relative z-10 h-full flex flex-col items-center justify-center p-7 text-white">
                <div className="text-center mb-6">
                  <div className="text-xs tracking-[0.28em] opacity-70">INTRODUCING</div>
                  <div className="mt-2 text-3xl md:text-4xl font-extrabold tracking-wide">{teamLabel}</div>
                </div>

                {/* Suspense ring with blurred avatar */}
                <div className="ring select-none">
                  <img
                    src={data.photoUrl}
                    alt={`${agentDisplay} blurred`}
                    draggable={false}
                  />
                </div>

                <div className="mt-6 text-white/80 text-sm md:text-base text-center max-w-[30ch]">
                  Big moment loading… stay tuned.
                </div>

                <div className="mt-8">
                  <Button
                    onClick={manualReveal}
                    className="bg-white text-black font-semibold px-5 py-2 rounded-lg hover:opacity-90"
                  >
                    Reveal Now
                  </Button>
                </div>
              </div>
            </div>

            {/* BACK — Reveal state */}
            <div className="face back relative shine">
              <div className="absolute inset-0">
                <div className="absolute -top-12 -left-10 w-64 h-64 rounded-full blur-3xl opacity-25 bg-emerald-400" />
                <div className="absolute -bottom-12 -right-14 w-72 h-72 rounded-full blur-3xl opacity-20 bg-fuchsia-500" />
              </div>

              <div className="relative z-10 h-full flex flex-col p-7 text-white">
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-5xl font-black leading-none">99</div>
                    <div className="text-[10px] font-semibold opacity-80 mt-1 tracking-[0.28em]">ST</div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-white/12 border border-white/20 text-[11px] font-semibold">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                      SALES CHAMPION
                    </div>
                    <div className="mt-2 text-[10px] opacity-75 tracking-widest">{teamLabel}</div>
                  </div>
                </div>

                {/* Portrait */}
                <div className="flex-1 flex items-center justify-center my-6">
                  <div className="relative">
                    <img
                      src={data.photoUrl}
                      alt={`${data.agentName} celebrating`}
                      className="w-56 h-64 md:w-60 md:h-72 object-cover object-top rounded-xl ring-2 ring-white/40 shadow-2xl"
                      data-testid="celebration-agent-photo"
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                      🎉
                    </div>
                  </div>
                </div>

                {/* Names */}
                <div className="text-center">
                  <h3 className="text-2xl md:text-3xl font-extrabold tracking-wide" data-testid="celebration-agent-name">
                    {agentDisplay.toUpperCase()}
                  </h3>
                  <div className="mt-1 text-[11px] tracking-[0.28em] text-white/70">{teamLabel}</div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  <div className="metric rounded-xl px-3 py-3 text-center">
                    <div className="text-[10px] tracking-widest opacity-80">PAC</div>
                    <div className="text-xl font-black">85</div>
                  </div>
                  <div className="metric rounded-xl px-3 py-3 text-center">
                    <div className="text-[10px] tracking-widest opacity-80">DRI</div>
                    <div className="text-xl font-black">86</div>
                  </div>
                  <div className="metric rounded-xl px-3 py-3 text-center">
                    <div className="text-[10px] tracking-widest opacity-80">ACT</div>
                    <div className="text-xl font-black text-emerald-400" data-testid="celebration-activation-count">
                      {data.newActivationCount}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6 flex items-center justify-center">
                  <Button
                    onClick={onClose}
                    className="bg-gradient-to-r from-yellow-300 via-amber-300 to-orange-300 text-black font-extrabold px-7 py-3 rounded-xl shadow-lg hover:brightness-110 transition"
                    data-testid="celebration-close"
                  >
                    AWESOME! 🏆
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tap anywhere to reveal (before auto-flip) */}
        {!isFlipped && (
          <button
            aria-label="Flip card"
            onClick={manualReveal}
            className="absolute inset-0"
            style={{ cursor: 'pointer' }}
          />
        )}
      </div>
    </>
  );
}
