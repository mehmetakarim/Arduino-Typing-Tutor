import { useEffect, useState } from 'react';
import { useSound } from '../hooks/useSound';

const BADGE_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  first_lesson:  { emoji: '🎯', label: 'İlk Ders!',          color: 'from-blue-600 to-blue-800' },
  streak5:       { emoji: '🔥', label: 'Üst Üste 5!',        color: 'from-orange-600 to-red-700' },
  fast_fingers:  { emoji: '⚡', label: 'Hızlı Parmaklar!',   color: 'from-yellow-500 to-orange-600' },
  perfect:       { emoji: '🎖️', label: 'Mükemmel!',          color: 'from-emerald-600 to-green-800' },
  module1_done:  { emoji: '🥉', label: 'Modül 1 Tamam!',     color: 'from-amber-600 to-yellow-700' },
  module5_done:  { emoji: '🥇', label: 'Modül 5 Tamam!',     color: 'from-yellow-400 to-amber-600' },
  final_champ:   { emoji: '👑', label: 'Final Şampiyonu!',   color: 'from-purple-600 to-pink-700' },
};

interface BadgeNotificationProps {
  badges: string[];
  onDone: () => void;
}

export function BadgeNotification({ badges, onDone }: BadgeNotificationProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const { playBadge } = useSound();

  // Play sound whenever a new badge is shown
  useEffect(() => {
    if (badges.length > 0) playBadge();
  }, [index, badges.length]);

  useEffect(() => {
    if (badges.length === 0) { onDone(); return; }
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        if (index + 1 < badges.length) {
          setIndex(i => i + 1);
          setVisible(true);
        } else {
          onDone();
        }
      }, 400);
    }, 2500);
    return () => clearTimeout(t);
  }, [index, badges.length]);

  if (badges.length === 0) return null;

  const badge = badges[index];
  const info = BADGE_LABELS[badge] ?? { emoji: '🏅', label: 'Yeni Rozet!', color: 'from-gray-600 to-gray-800' };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className={`
          bg-gradient-to-br ${info.color}
          rounded-2xl px-10 py-8 shadow-2xl text-center
          transition-all duration-400
          ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}
      >
        <div className="text-6xl mb-3">{info.emoji}</div>
        <div className="text-xs text-white/70 uppercase tracking-widest mb-1">Rozet Kazandın!</div>
        <div className="text-2xl font-bold text-white">{info.label}</div>
        {badges.length > 1 && (
          <div className="text-xs text-white/60 mt-2">{index + 1} / {badges.length}</div>
        )}
      </div>
    </div>
  );
}
