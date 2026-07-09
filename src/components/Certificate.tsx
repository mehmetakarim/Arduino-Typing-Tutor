import { useEffect } from 'react';
import { Flame, Medal, Printer, Rocket, ShieldCheck, Target, Trophy, Zap, Keyboard as KeyboardIcon, Home } from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { useProfileStore } from '../store/profileStore';
import { useConfetti } from '../hooks/useConfetti';
import { Button } from './ui';

function formatDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m} dakika`;
}

const BADGE_ICONS: Record<string, typeof Flame> = {
  first_lesson: Rocket,
  fast_fingers: Zap,
  perfect:      Target,
  streak5:      Flame,
  module1_done: ShieldCheck,
  module5_done: Medal,
  final_champ:  Trophy,
};

/* Köşe süsü */
function Corner({ style }: { style: React.CSSProperties }) {
  return (
    <svg style={{ position: 'absolute', ...style }} width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="1.5">
      <path d="M3 3h6v6H3zM3 3l6 6" />
    </svg>
  );
}

export function Certificate() {
  const { progress, setScreen } = useProgressStore();
  const { activeProfile } = useProfileStore();
  const finalStat = progress.lessonStats.find(s => s.lessonId === 47);
  const fireConfetti = useConfetti();

  const avgWpm = progress.lessonStats.length
    ? Math.round(progress.lessonStats.reduce((s, l) => s + l.bestWPM, 0) / progress.lessonStats.length)
    : 0;

  const certId = `ATT-${(activeProfile?.id ?? 'X').slice(-6).toUpperCase()}-${new Date(finalStat?.completedAt ?? Date.now()).getFullYear()}`;

  useEffect(() => {
    fireConfetti('certificate');
  }, []);

  const gold = '#FBBF24';
  const goldSoft = '#FDE8B8';
  const goldMuted = '#C9A44B';
  const goldDim = '#8A7442';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-10 gap-7"
      style={{ background: 'radial-gradient(1200px 700px at 50% 0%, #1B1408 0%, var(--bg-base) 55%)' }}
    >
      {/* Sertifika belgesi */}
      <div
        id="certificate-card"
        className="w-full max-w-[880px] rounded-lg p-2"
        style={{ background: 'linear-gradient(155deg, #17130A 0%, #1D1709 50%, #17130A 100%)', boxShadow: '0 24px 70px rgba(0,0,0,.5)' }}
      >
        <div className="rounded p-[3px]" style={{ border: '2px solid #B8892F' }}>
          <div className="relative text-center rounded-sm px-[60px] py-[50px]" style={{ border: '1px solid rgba(251,191,36,.4)' }}>
            <Corner style={{ top: 14, left: 14 }} />
            <Corner style={{ top: 14, right: 14, transform: 'scaleX(-1)' }} />
            <Corner style={{ bottom: 14, left: 14, transform: 'scaleY(-1)' }} />
            <Corner style={{ bottom: 14, right: 14, transform: 'scale(-1,-1)' }} />

            {/* Madalyon */}
            <div
              className="w-[68px] h-[68px] mx-auto mb-[18px] rounded-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, #92400E, ${gold})`, boxShadow: '0 0 30px rgba(251,191,36,.35)' }}
            >
              <KeyboardIcon size={34} color="#1C1608" strokeWidth={2.2} />
            </div>

            <div className="text-xs font-extrabold uppercase" style={{ letterSpacing: 4, color: goldMuted }}>
              Arduino Typing Tutor
            </div>
            <h1 className="m-0 mt-2.5 text-[32px] font-black" style={{ letterSpacing: 1, color: goldSoft }}>
              Başarı Sertifikası
            </h1>
            <div className="mx-auto my-[18px]" style={{ width: 80, height: 2, background: `linear-gradient(90deg, transparent, ${gold}, transparent)` }} />

            <p className="m-0 text-sm font-semibold" style={{ color: goldMuted }}>
              Bu sertifika, aşağıdaki öğrencinin 10 parmak klavye tekniğiyle
            </p>
            <p className="m-0 mt-0.5 mb-5 text-sm font-semibold" style={{ color: goldMuted }}>
              Arduino kod yazma programını başarıyla tamamladığını onaylar.
            </p>

            <h2 className="m-0 text-[40px] font-black italic text-white" style={{ letterSpacing: 0.5 }}>
              {activeProfile?.name ?? 'Öğrenci'}
            </h2>

            {/* İstatistikler */}
            <div className="flex justify-center gap-10 mt-7">
              {[
                { value: `${finalStat?.bestWPM ?? avgWpm} WPM`, label: 'En İyi Hız' },
                { value: `%${finalStat?.bestAccuracy ?? 0}`, label: 'Doğruluk' },
                { value: formatTime(progress.totalTimeSpent), label: 'Toplam Süre' },
              ].map(({ value, label }, i) => (
                <div key={label} className="flex gap-10">
                  {i > 0 && <div className="w-px" style={{ background: 'rgba(251,191,36,.25)' }} />}
                  <div>
                    <div className="text-2xl font-black" style={{ color: gold }}>{value}</div>
                    <div className="text-[11px] font-extrabold uppercase mt-0.5" style={{ letterSpacing: 1, color: goldDim }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rozet madalyonları */}
            {progress.badges.length > 0 && (
              <div className="flex justify-center gap-2.5 mt-6">
                {progress.badges.map(b => {
                  const Icon = BADGE_ICONS[b] ?? Medal;
                  return (
                    <div
                      key={b}
                      className="w-[34px] h-[34px] rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.4)' }}
                      title={b}
                    >
                      <Icon size={16} strokeWidth={2.4} color={gold} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Alt bilgi */}
            <div className="flex justify-between items-end mt-10 pt-5" style={{ borderTop: '1px solid rgba(251,191,36,.25)' }}>
              <div className="text-left">
                <div className="text-[13px] font-bold" style={{ color: goldSoft }}>{formatDate(finalStat?.completedAt)}</div>
                <div className="text-[10.5px] font-bold uppercase mt-0.5" style={{ letterSpacing: 1, color: goldDim }}>Tamamlanma Tarihi</div>
              </div>
              <div className="text-center">
                <svg width="120" height="34" viewBox="0 0 120 34" fill="none">
                  <path d="M4 24C14 8 22 30 32 16 42 4 50 28 60 14 70 4 78 26 88 12 96 4 104 22 116 10" stroke={goldSoft} strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                <div className="text-[10.5px] font-bold uppercase" style={{ letterSpacing: 1, color: goldDim }}>Eğitmen İmzası</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold font-mono" style={{ color: goldSoft }}>{certId}</div>
                <div className="text-[10.5px] font-bold uppercase mt-0.5" style={{ letterSpacing: 1, color: goldDim }}>Sertifika No</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex gap-3">
        <Button variant="gold" onClick={() => window.print()}>
          <Printer size={16} strokeWidth={2.4} />
          Yazdır / PDF Kaydet
        </Button>
        <Button variant="secondary" onClick={() => setScreen('menu')}>
          <Home size={16} strokeWidth={2.4} />
          Ana Menü
        </Button>
      </div>

      {/* Yazdırma stili */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #certificate-card { display: block !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  );
}
