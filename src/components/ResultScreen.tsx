import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, Check, Clock, Flame, Home, RotateCcw, Target, XCircle, Zap } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { useConfetti } from '../hooks/useConfetti';
import { BadgeNotification } from './BadgeNotification';
import { StatsChart } from './StatsChart';
import { Button, Chip, Kbd } from './ui';
import lessonsData from '../data/lessons.json';
import modulesData from '../data/modules.json';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
  hint?: string;
  hintOk?: boolean;
  delay: number;
  highlight?: boolean;
}

function StatCard({ icon, value, label, color, hint, hintOk, delay, highlight }: StatCardProps) {
  return (
    <div
      className="bg-surface rounded-card p-5 text-center animate-pop-in"
      style={{
        width: 180,
        border: highlight ? `1px solid color-mix(in srgb, ${color} 40%, transparent)` : '1px solid var(--bg-border)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex justify-center mb-1.5">{icon}</div>
      <div className="text-[38px] font-black tabular-nums leading-tight" style={{ color }}>{value}</div>
      <div className="text-xs font-black tracking-[1.5px] uppercase text-subtle">{label}</div>
      <div className="text-[11.5px] font-bold mt-1" style={{ color: hint ? (hintOk ? 'var(--accent-lime)' : 'var(--accent-red)') : 'transparent' }}>
        {hint ?? ' '}
      </div>
    </div>
  );
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
      <div className="flex items-center justify-center h-screen bg-base text-primary">
        <Button variant="ghost" onClick={() => setScreen('menu')}>Ana Menü'ye dön</Button>
      </div>
    );
  }

  const module = lesson ? modulesData.find(m => m.id === lesson.moduleId) : null;
  const passed = lastResult.passed;

  const accuracyColor = lastResult.accuracy >= 90
    ? 'var(--accent-lime)' : lastResult.accuracy >= 75
    ? 'var(--accent-amber)' : 'var(--accent-red)';
  const wpmColor = lastResult.wpm >= 30 ? 'var(--accent-lime)' : 'var(--accent-cyan)';
  const heroColor = passed ? 'var(--accent-lime)' : 'var(--accent-orange)';

  const newBadgesForDisplay = badgesDone ? [] : progress.newlyEarnedBadges;

  return (
    <>
      {showBadges && (
        <BadgeNotification badges={newBadgesForDisplay} onDone={handleBadgesDone} />
      )}

      <div className="flex flex-col items-center justify-center min-h-screen text-primary p-6 screen-bg">
        {/* Hero */}
        <div className="text-center animate-pop-in">
          <div
            className={`w-[88px] h-[88px] mx-auto mb-3.5 rounded-full flex items-center justify-center ${passed ? 'animate-glow-pulse' : ''}`}
            style={{
              background: `color-mix(in srgb, ${heroColor} 12%, transparent)`,
              border: `3px solid ${heroColor}`,
            }}
          >
            {passed
              ? <Check size={44} strokeWidth={3} style={{ color: heroColor }} />
              : <RotateCcw size={40} strokeWidth={2.6} style={{ color: heroColor }} />}
          </div>
          <h1 className="m-0 text-[40px] font-black tracking-tight" style={{ color: heroColor }}>
            {passed ? 'Geçtin!' : 'Neredeyse!'}
          </h1>
          <p className="m-0 mt-1.5 text-base font-bold text-secondary">
            {passed
              ? `${lesson?.title ?? ''}${module ? ` · ${module.title}` : ''} tamamlandı`
              : 'Hedefe çok yaklaştın — bir tur daha deneyelim'}
          </p>
        </div>

        {/* Stat kartları */}
        <div className="flex gap-3.5 mt-7 flex-wrap justify-center">
          <StatCard
            icon={<Zap size={22} strokeWidth={2.2} style={{ color: wpmColor }} />}
            value={lastResult.wpm} label="WPM" color={wpmColor} delay={100}
            hint={lesson?.minWPM ? `hedef ${lesson.minWPM} ${lastResult.wpm >= lesson.minWPM ? '✓' : '✗'}` : undefined}
            hintOk={lesson?.minWPM ? lastResult.wpm >= lesson.minWPM : undefined}
            highlight={lesson?.minWPM ? lastResult.wpm >= lesson.minWPM : false}
          />
          <StatCard
            icon={<Target size={22} strokeWidth={2.2} style={{ color: accuracyColor }} />}
            value={`%${lastResult.accuracy}`} label="Doğruluk" color={accuracyColor} delay={180}
            hint={lesson ? `hedef %${lesson.minAccuracy} ${lastResult.accuracy >= lesson.minAccuracy ? '✓' : '✗'}` : undefined}
            hintOk={lesson ? lastResult.accuracy >= lesson.minAccuracy : undefined}
            highlight={lesson ? lastResult.accuracy >= lesson.minAccuracy : false}
          />
          <StatCard
            icon={<Clock size={22} strokeWidth={2.2} style={{ color: 'var(--accent-cyan)' }} />}
            value={formatTime(lastResult.timeSpent)} label="Süre" color="var(--accent-cyan)" delay={260}
          />
          <StatCard
            icon={<XCircle size={22} strokeWidth={2.2} style={{ color: 'var(--accent-red)' }} />}
            value={lastResult.errors} label="Hata" color="var(--accent-red)" delay={340}
          />
        </div>

        {/* Seri şeridi */}
        {passed && progress.currentStreak > 1 && (
          <div className="mt-[22px] animate-pop-in" style={{ animationDelay: '400ms' }}>
            <Chip color="var(--accent-orange)">
              <Flame size={15} strokeWidth={2.4} />
              Seri {progress.currentStreak}. ders!
            </Chip>
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="flex items-center gap-3 mt-[26px] flex-wrap justify-center animate-pop-in" style={{ animationDelay: '480ms' }}>
          {lesson && (
            <Button variant="secondary" onClick={() => startLesson(lesson.id)}>
              <RotateCcw size={16} strokeWidth={2.4} />
              Tekrar {passed ? 'Oyna' : 'Dene'}
              <Kbd>R</Kbd>
            </Button>
          )}
          {passed && nextLesson && (
            <Button size="lg" onClick={() => startLesson(nextLesson.id)}>
              Sonraki Ders
              <ArrowRight size={17} strokeWidth={2.8} />
              <Kbd inverted>⏎</Kbd>
            </Button>
          )}
          <Button variant="secondary" onClick={() => setScreen('menu')}>
            <Home size={16} strokeWidth={2.4} />
            Menü
            <Kbd>M</Kbd>
          </Button>
          <Button variant="ghost" onClick={() => setShowStats(s => !s)}>
            <BarChart3 size={16} strokeWidth={2.4} />
            {showStats ? 'Grafikleri Gizle' : 'Grafikler'}
            <Kbd>G</Kbd>
          </Button>
        </div>

        {/* Grafik paneli */}
        {showStats && (
          <div className="w-full max-w-2xl bg-surface border border-border rounded-card p-6 mt-6 animate-slide-up">
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
