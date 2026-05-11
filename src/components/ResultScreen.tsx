import { useEffect, useState } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useConfetti } from '../hooks/useConfetti';
import { BadgeNotification } from './BadgeNotification';
import { StatsChart } from './StatsChart';
import lessonsData from '../data/lessons.json';
import modulesData from '../data/modules.json';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function ResultScreen() {
  const { lastResult, setScreen, startLesson, progress, clearNewBadges } = useProgressStore();
  const fireConfetti = useConfetti();
  const [showBadges, setShowBadges] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [badgesDone, setBadgesDone] = useState(false);

  useEffect(() => {
    if (!lastResult) return;
    if (lastResult.passed) {
      fireConfetti('pass');
      if (progress.newlyEarnedBadges.length > 0) {
        const t = setTimeout(() => setShowBadges(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, []);

  const handleBadgesDone = () => {
    setShowBadges(false);
    setBadgesDone(true);
    if (progress.newlyEarnedBadges.length > 0) {
      fireConfetti('badge');
    }
    clearNewBadges();
  };

  const lesson = lessonsData.find(l => l.id === lastResult?.lessonId);
  const nextLesson = lessonsData.find(l => l.id === (lastResult?.lessonId ?? 0) + 1);

  // Klavye kısayolları — el klavyeden kalkmadan navigasyon
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (showBadges) return; // rozet gösteriminde kısayol çalışmasın
      const key = e.key;
      if (key === 'r' || key === 'R') {
        if (lesson) { e.preventDefault(); startLesson(lesson.id); }
      } else if ((key === 'Enter' || key === 'n' || key === 'N') && lastResult?.passed && nextLesson) {
        e.preventDefault(); startLesson(nextLesson.id);
      } else if (key === 'm' || key === 'M' || key === 'Escape') {
        e.preventDefault(); setScreen('menu');
      } else if (key === 'g' || key === 'G') {
        e.preventDefault(); setShowStats(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lesson?.id, nextLesson?.id, lastResult?.passed, showBadges, startLesson, setScreen]);

  if (!lastResult) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <button onClick={() => setScreen('menu')} className="text-blue-400 underline">
          Ana Menü'ye dön
        </button>
      </div>
    );
  }

  const module = lesson ? modulesData.find(m => m.id === lesson.moduleId) : null;

  const accuracyColor = lastResult.accuracy >= 90
    ? 'text-green-400' : lastResult.accuracy >= 75
    ? 'text-yellow-400' : 'text-red-400';
  const wpmColor = lastResult.wpm >= 30 ? 'text-green-400' : 'text-blue-400';

  const newBadgesForDisplay = badgesDone ? [] : progress.newlyEarnedBadges;

  return (
    <>
      {showBadges && (
        <BadgeNotification badges={newBadgesForDisplay} onDone={handleBadgesDone} />
      )}

      <div className="flex flex-col items-center justify-center min-h-screen text-white p-8 gap-5 screen-bg">
        {/* Result icon */}
        <div className={`text-6xl ${lastResult.passed ? 'animate-bounce' : ''}`}>
          {lastResult.passed ? '🎉' : '💪'}
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold mb-1">
            {lastResult.passed ? 'Harika! Geçtin!' : 'Tekrar Dene!'}
          </h1>
          <p className="text-gray-400 text-sm">
            {lesson?.title}
            {module ? ` — ${module.title}` : ''}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-3 w-full max-w-md">
          <div className="rounded-xl p-4 text-center col-span-1" style={{ backgroundColor: '#1A1A1B', border: '1px solid #2E2E2F' }}>
            <div className={`text-3xl font-bold ${wpmColor}`}>{lastResult.wpm}</div>
            <div className="text-xs text-gray-400 mt-1">WPM</div>
          </div>
          <div className="rounded-xl p-4 text-center col-span-1" style={{ backgroundColor: '#1A1A1B', border: '1px solid #2E2E2F' }}>
            <div className={`text-3xl font-bold ${accuracyColor}`}>{lastResult.accuracy}%</div>
            <div className="text-xs text-gray-400 mt-1">Doğruluk</div>
          </div>
          <div className="rounded-xl p-4 text-center col-span-1" style={{ backgroundColor: '#1A1A1B', border: '1px solid #2E2E2F' }}>
            <div className="text-3xl font-bold text-gray-200">{formatTime(lastResult.timeSpent)}</div>
            <div className="text-xs text-gray-400 mt-1">Süre</div>
          </div>
          <div className="rounded-xl p-4 text-center col-span-1" style={{ backgroundColor: '#1A1A1B', border: '1px solid #2E2E2F' }}>
            <div className="text-3xl font-bold text-red-400">{lastResult.errors}</div>
            <div className="text-xs text-gray-400 mt-1">Hata</div>
          </div>
        </div>

        {/* Streak */}
        {lastResult.passed && progress.currentStreak > 1 && (
          <div className="flex items-center gap-2 bg-orange-900/40 border border-orange-600 rounded-xl px-4 py-2">
            <span className="text-xl">🔥</span>
            <span className="text-orange-300 font-semibold">
              {progress.currentStreak} ders üst üste!
            </span>
          </div>
        )}

        {/* Pass criteria (only shown on fail) */}
        {!lastResult.passed && lesson && (
          <div className="bg-yellow-900/30 border border-yellow-600 rounded-xl p-4 text-sm w-full max-w-md">
            <p className="text-yellow-300 font-semibold mb-2">Geçmek için:</p>
            <div className="flex flex-col gap-1">
              <div className={`flex justify-between ${lastResult.accuracy >= lesson.minAccuracy ? 'text-green-400' : 'text-red-400'}`}>
                <span>Doğruluk</span>
                <span>{lastResult.accuracy}% / min %{lesson.minAccuracy}</span>
              </div>
              {lesson.minWPM && (
                <div className={`flex justify-between ${lastResult.wpm >= lesson.minWPM ? 'text-green-400' : 'text-red-400'}`}>
                  <span>Hız</span>
                  <span>{lastResult.wpm} / min {lesson.minWPM} WPM</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Klavye kısayol ipucu */}
        <div className="text-xs text-gray-600 text-center">
          Klavye kısayolları: <span className="text-gray-500 font-mono">[R]</span> Tekrar &nbsp;
          {lastResult.passed && nextLesson && <><span className="text-gray-500 font-mono">[Enter]</span> Sonraki &nbsp;</>}
          <span className="text-gray-500 font-mono">[M]</span> Menü &nbsp;
          <span className="text-gray-500 font-mono">[G]</span> Grafik
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap justify-center">
          {lesson && (
            <button
              onClick={() => startLesson(lesson.id)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex flex-col items-center"
            >
              <span>🔄 Tekrar {lastResult.passed ? 'Oyna' : 'Dene'}</span>
              <span className="text-xs opacity-60 mt-0.5 font-mono">[R]</span>
            </button>
          )}
          {lastResult.passed && nextLesson && (
            <button
              onClick={() => startLesson(nextLesson.id)}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex flex-col items-center"
            >
              <span>Sonraki Ders →</span>
              <span className="text-xs opacity-60 mt-0.5 font-mono">[Enter]</span>
            </button>
          )}
          <button
            onClick={() => setScreen('menu')}
            className="text-white px-6 py-3 rounded-xl font-semibold transition-colors flex flex-col items-center"
            style={{ backgroundColor: '#242425' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2E2E2F')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#242425')}
          >
            <span>🏠 Ana Menü</span>
            <span className="text-xs opacity-60 mt-0.5 font-mono">[M]</span>
          </button>
          <button
            onClick={() => setShowStats(s => !s)}
            className="text-white px-6 py-3 rounded-xl font-semibold transition-colors flex flex-col items-center"
            style={{ backgroundColor: '#242425' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#2E2E2F')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#242425')}
          >
            <span>📊 {showStats ? 'Grafikleri Gizle' : 'Grafikleri Gör'}</span>
            <span className="text-xs opacity-60 mt-0.5 font-mono">[G]</span>
          </button>
        </div>

        {/* Charts panel */}
        {showStats && (
          <div className="w-full max-w-2xl rounded-2xl p-6" style={{ backgroundColor: '#1A1A1B', border: '1px solid #2E2E2F' }}>
            <StatsChart
              lessonStats={progress.lessonStats}
              errorKeys={progress.errorKeys}
            />
          </div>
        )}
      </div>
    </>
  );
}
