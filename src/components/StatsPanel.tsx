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

export function StatsPanel({ wpm, accuracy, elapsedSeconds, errors, progress }: StatsPanelProps) {
  const animatedWpm = useAnimatedValue(wpm);
  const accuracyColor = accuracy >= 90 ? 'text-green-400' : accuracy >= 75 ? 'text-yellow-400' : 'text-red-400';
  const wpmColor = animatedWpm >= 30 ? 'text-green-400' : animatedWpm >= 15 ? 'text-yellow-400' : 'text-blue-400';

  return (
    <div className="bg-gray-800 dark:bg-gray-900 rounded-xl p-3 shadow-lg">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex flex-col items-center min-w-[60px]">
          <span className={`text-2xl font-bold tabular-nums transition-colors duration-300 ${wpmColor}`}>
            {animatedWpm}
          </span>
          <span className="text-xs text-gray-400">WPM</span>
        </div>

        <div className="w-px h-8 bg-gray-600" />

        <div className="flex flex-col items-center min-w-[60px]">
          <span className={`text-2xl font-bold ${accuracyColor}`}>{accuracy}%</span>
          <span className="text-xs text-gray-400">Doğruluk</span>
        </div>

        <div className="w-px h-8 bg-gray-600" />

        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-2xl font-bold text-gray-200">{formatTime(elapsedSeconds)}</span>
          <span className="text-xs text-gray-400">Süre</span>
        </div>

        <div className="w-px h-8 bg-gray-600" />

        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-2xl font-bold text-red-400">{errors}</span>
          <span className="text-xs text-gray-400">Hata</span>
        </div>

        <div className="flex-1 min-w-[120px]">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>İlerleme</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
