import { useEffect } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useProfileStore } from '../store/profileStore';
import { useConfetti } from '../hooks/useConfetti';

function formatDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dakika`;
}

const BADGE_LABELS: Record<string, string> = {
  first_lesson:  '🎯 İlk Ders',
  fast_fingers:  '⚡ Hızlı Parmaklar',
  perfect:       '🎖️ Mükemmeliyetçi',
  streak5:       '🔥 5 Günlük Seri',
  module1_done:  '🥉 Modül 1',
  module5_done:  '🥇 Modül 5',
  final_champ:   '👑 Final Şampiyonu',
};

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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 gap-5">

      {/* Sertifika kartı */}
      <div
        id="certificate-card"
        className="w-full max-w-2xl rounded-3xl p-1 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #B8860B, #FFD700, #DAA520, #B8860B)' }}
      >
        <div
          className="rounded-[22px] p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #1a1200 0%, #2d1f00 50%, #1a1200 100%)' }}
        >
          {/* Köşe süsleri */}
          {['top-3 left-3', 'top-3 right-3', 'bottom-3 left-3', 'bottom-3 right-3'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} text-yellow-600/30 text-3xl select-none`}>✦</div>
          ))}

          {/* Arka plan desen */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg, #FFD700 0, #FFD700 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }}
          />

          {/* İçerik */}
          <div className="relative text-center">
            {/* Üst rozet */}
            <div className="flex justify-center mb-3">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl shadow-xl"
                style={{ background: 'linear-gradient(135deg, #FFD700, #B8860B)', boxShadow: '0 0 30px rgba(255,215,0,0.4)' }}>
                🏆
              </div>
            </div>

            <p className="text-yellow-600 text-xs font-semibold tracking-[0.3em] uppercase mb-1">Arduino Typing Tutor</p>
            <h1 className="text-3xl font-bold text-yellow-300 mb-1" style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}>
              Başarı Sertifikası
            </h1>
            <p className="text-yellow-700 text-xs tracking-widest uppercase mb-6">Certificate of Achievement</p>

            <div className="border-t border-yellow-800/50 pt-5 mb-5">
              <p className="text-yellow-600/80 text-sm mb-2">Bu sertifika aşağıdakini onaylar:</p>
              <p className="text-white text-xl font-bold mb-1">
                {activeProfile?.name ?? 'Öğrenci'}
              </p>
              <p className="text-yellow-200/70 text-sm">
                10 Parmak Arduino Yazımını Başarıyla Tamamladı
              </p>
            </div>

            {/* Ana istatistikler */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              {[
                { value: finalStat?.bestWPM ?? avgWpm, label: 'En İyi WPM', color: '#34D399' },
                { value: `%${finalStat?.bestAccuracy ?? 0}`, label: 'Doğruluk', color: '#60A5FA' },
                { value: progress.completedLessons.length, label: 'Tamamlanan Ders', color: '#F59E0B' },
                { value: progress.longestStreak, label: 'En Uzun Seri', color: '#F472B6' },
              ].map(({ value, label, color }) => (
                <div key={label} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,215,0,0.15)' }}>
                  <div className="text-2xl font-bold" style={{ color }}>{value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,215,0,0.5)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* İkincil istatistikler */}
            <div className="flex justify-center gap-6 text-sm text-yellow-700 mb-5">
              <span>⏱️ {formatTime(progress.totalTimeSpent)}</span>
              <span>🏅 {progress.badges.length} rozet</span>
              {avgWpm > 0 && <span>📊 Ort. {avgWpm} WPM</span>}
            </div>

            {/* Kazanılan rozetler */}
            {progress.badges.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-5">
                {progress.badges.map(b => (
                  <span key={b} className="text-xs px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.25)', color: '#D4AF37' }}>
                    {BADGE_LABELS[b] ?? b}
                  </span>
                ))}
              </div>
            )}

            {/* Alt bilgi */}
            <div className="border-t border-yellow-800/40 pt-4 flex items-center justify-between text-xs text-yellow-800">
              <span className="font-mono">{certId}</span>
              <div className="text-2xl">⭐⭐⭐</div>
              <span>{formatDate(finalStat?.completedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Butonlar */}
      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors text-white"
          style={{ backgroundColor: '#B8860B' }}
        >
          🖨️ Yazdır / Kaydet
        </button>
        <button
          onClick={() => setScreen('menu')}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-white transition-colors"
          style={{ backgroundColor: '#1A1A1B' }}
        >
          ← Ana Menü
        </button>
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
