import { useEffect, useState } from 'react';
import { useSound } from '../hooks/useSound';

const BADGE_LABELS: Record<string, { emoji: string; label: string; color: string }> = {
  first_lesson:  { emoji: '🎯', label: 'İlk Ders!',          color: 'from-blue-600 to-blue-800' },
  streak5:       { emoji: '🔥', label: 'Üst Üste 5!',        color: 'from-orange-600 to-red-700' },
  fast_fingers:  { emoji: '⚡', label: 'Hızlı Parmaklar!',   color: 'from-yellow-500 to-orange-600' },
  perfect:       { emoji: '🎖️', label: 'Mükemmel!',          color: 'from-emerald-600 to-green-800' },
  module1_done:  { emoji: '🥉', label: 'Modül 1 Tamam!',     color: 'from-amber-600 to-yellow-700' },
  module5_done:  { emoji: '🥇', label: 'Modül 5 Tamam!',     color: 'from-yellow-400 to-amber-600' },
  module6_done:  { emoji: '🔬', label: 'Modül 6 Tamam!',     color: 'from-cyan-500 to-blue-600' },
  module7_done:  { emoji: '📡', label: 'Modül 7 Tamam!',     color: 'from-teal-500 to-green-700' },
  module8_done:  { emoji: '🤖', label: 'Modül 8 Tamam!',     color: 'from-indigo-500 to-violet-700' },
  final_champ:   { emoji: '👑', label: 'Final Şampiyonu!',   color: 'from-purple-600 to-pink-700' },
};

// Basit confetti parçacıkları
function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ['#f97316','#6366f1','#22c55e','#ec4899','#eab308','#06b6d4'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map(i => (
        <div
          key={i}
          className="absolute w-2.5 h-2.5 rounded-sm opacity-0"
          style={{
            left: `${10 + (i * 5) % 80}%`,
            top: '-10px',
            backgroundColor: colors[i % colors.length],
            animation: `confettiFall ${0.8 + (i % 4) * 0.3}s ease-in ${(i % 6) * 0.1}s forwards`,
            transform: `rotate(${i * 37}deg)`,
          }}
        />
      ))}
    </div>
  );
}

interface BadgeNotificationProps {
  badges: string[];
  onDone: () => void;
}

export function BadgeNotification({ badges, onDone }: BadgeNotificationProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const { playBadge } = useSound();

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
    }, 2800);
    return () => clearTimeout(t);
  }, [index, badges.length]);

  if (badges.length === 0) return null;

  const badge = badges[index];
  const info = BADGE_LABELS[badge] ?? { emoji: '🏅', label: 'Yeni Rozet!', color: 'from-gray-600 to-gray-800' };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Karartma */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', opacity: visible ? 1 : 0 }}
      />

      {/* Kart */}
      <div
        className={`
          relative bg-gradient-to-br ${info.color}
          rounded-3xl px-12 py-10 shadow-2xl text-center
          transition-all duration-350
          ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}
        style={{ minWidth: 280 }}
      >
        {visible && <Confetti />}

        {/* Parlayan halka */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            boxShadow: '0 0 0 0 rgba(255,255,255,0.3)',
            animation: visible ? 'pulse-ring 1.5s ease-out infinite' : 'none',
          }}
        />

        <div
          className="text-7xl mb-4 block"
          style={{ animation: visible ? 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' : 'none' }}
        >
          {info.emoji}
        </div>

        <div className="text-xs text-white/70 uppercase tracking-widest mb-2 font-semibold">
          🎉 Rozet Kazandın!
        </div>
        <div className="text-2xl font-bold text-white">{info.label}</div>

        {badges.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {badges.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === index ? 'white' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
