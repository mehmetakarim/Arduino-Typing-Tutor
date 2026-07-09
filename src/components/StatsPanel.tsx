import { useEffect, useRef, useState } from 'react';

interface StatsPanelProps {
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  errors: number;
  progress: number;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function useAnimatedValue(target: number, duration = 350): number {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    const from = prev.current;
    if (from === target) return;
    const startTime = performance.now();
    let raf: number;

    function step(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) raf = requestAnimationFrame(step);
      else prev.current = target;
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return display;
}

function Stat({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="flex items-baseline gap-[7px]">
      <span className="text-2xl font-black tabular-nums transition-colors duration-300" style={{ color }}>
        {value}
      </span>
      <span className="text-xs font-extrabold uppercase tracking-wider text-subtle">{label}</span>
    </div>
  );
}

export function StatsPanel({ wpm, accuracy, elapsedSeconds, errors, progress }: StatsPanelProps) {
  const animatedWpm = useAnimatedValue(wpm);
  const accuracyColor = accuracy >= 90 ? 'var(--accent-lime)' : accuracy >= 75 ? 'var(--accent-amber)' : 'var(--accent-red)';
  const wpmColor = animatedWpm >= 30 ? 'var(--accent-lime)' : animatedWpm >= 15 ? 'var(--accent-amber)' : 'var(--accent-cyan)';

  return (
    <div className="bg-surface border border-border rounded-panel px-5 py-2.5 flex items-center gap-[22px] flex-wrap">
      <Stat value={animatedWpm} label="WPM" color={wpmColor} />
      <div className="w-px h-6 bg-border" />
      <Stat value={`%${accuracy}`} label="Doğruluk" color={accuracyColor} />
      <div className="w-px h-6 bg-border" />
      <Stat value={formatTime(elapsedSeconds)} label="Süre" color="var(--accent-cyan)" />
      <div className="w-px h-6 bg-border" />
      <Stat value={errors} label="Hata" color="var(--accent-red)" />

      <div className="flex-1 min-w-[120px] flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full bg-elevated overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-cyan-deep), var(--accent-cyan))',
              boxShadow: '0 0 10px rgba(34,211,238,.6)',
            }}
          />
        </div>
        <span className="text-sm font-black" style={{ color: 'var(--accent-cyan)' }}>
          %{Math.round(progress)}
        </span>
      </div>
    </div>
  );
}
