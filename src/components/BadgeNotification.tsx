import { useEffect, useState } from 'react';
import { Award, Crown, Cpu, Flame, Medal, Microscope, Radio, Rocket, ShieldCheck, Target, Zap } from 'lucide-react';
import { useSound } from '../hooks/useSound';

const BADGE_LABELS: Record<string, { Icon: typeof Award; label: string; color: string }> = {
  first_lesson:  { Icon: Rocket,      label: 'İlk Ders!',        color: '#A3E635' },
  streak5:       { Icon: Flame,       label: 'Üst Üste 5!',      color: '#FB923C' },
  fast_fingers:  { Icon: Zap,         label: 'Hızlı Parmaklar!', color: '#FBBF24' },
  perfect:       { Icon: Target,      label: 'Mükemmel!',        color: '#22D3EE' },
  module1_done:  { Icon: ShieldCheck, label: 'Modül 1 Tamam!',   color: '#A78BFA' },
  module5_done:  { Icon: Medal,       label: 'Modül 5 Tamam!',   color: '#F472B6' },
  module6_done:  { Icon: Microscope,  label: 'Modül 6 Tamam!',   color: '#67E8F9' },
  module7_done:  { Icon: Radio,       label: 'Modül 7 Tamam!',   color: '#34D399' },
  module8_done:  { Icon: Cpu,         label: 'Modül 8 Tamam!',   color: '#A78BFA' },
  final_champ:   { Icon: Crown,       label: 'Final Şampiyonu!', color: '#FBBF24' },
};

// Basit confetti parçacıkları
function Confetti() {
  const pieces = Array.from({ length: 18 }, (_, i) => i);
  const colors = ['#22D3EE', '#A3E635', '#FBBF24', '#F472B6', '#A78BFA', '#FB923C'];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[28px]">
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
  const info = BADGE_LABELS[badge] ?? { Icon: Award, label: 'Yeni Rozet!', color: '#FBBF24' };
  const { Icon } = info;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      {/* Karartma */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ background: 'rgba(5,9,18,.78)', backdropFilter: 'blur(6px)', opacity: visible ? 1 : 0 }}
      />

      {/* Kart */}
      <div
        className={`relative bg-surface rounded-[28px] px-12 py-10 text-center transition-all duration-300
          ${visible ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}
        style={{
          minWidth: 320,
          border: `2px solid color-mix(in srgb, ${info.color} 50%, transparent)`,
          boxShadow: `0 0 60px color-mix(in srgb, ${info.color} 20%, transparent)`,
        }}
      >
        {visible && <Confetti />}

        {/* İkon madalyonu */}
        <div
          className="w-[110px] h-[110px] mx-auto mb-[18px] rounded-full flex items-center justify-center animate-floaty"
          style={{
            background: `color-mix(in srgb, ${info.color} 14%, transparent)`,
            border: `3px solid ${info.color}`,
            boxShadow: `0 0 40px color-mix(in srgb, ${info.color} 40%, transparent)`,
          }}
        >
          <Icon size={52} strokeWidth={2} style={{ color: info.color }} />
        </div>

        <div className="text-xs font-black uppercase tracking-[2px] mb-1.5" style={{ color: info.color }}>
          Yeni Rozet Kazandın!
        </div>
        <div className="text-[28px] font-black text-primary">{info.label}</div>

        {badges.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4">
            {badges.map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === index ? info.color : 'var(--bg-border)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
