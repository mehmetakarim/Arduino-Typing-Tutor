import { useState } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useSettingsStore } from '../store/settingsStore';
import { StatsChart } from './StatsChart';
import { SettingsModal } from './SettingsModal';
import lessonsData from '../data/lessons.json';
import modulesData from '../data/modules.json';

const BADGE_LABELS: Record<string, string> = {
  first_lesson:  '🎯 İlk Ders',
  fast_fingers:  '⚡ Hızlı Parmaklar',
  perfect:       '🎖️ Mükemmeliyetçi',
  streak5:       '🔥 Üst Üste 5',
  module1_done:  '🥉 Modül 1',
  module5_done:  '🥇 Modül 5',
  final_champ:   '👑 Final Şampiyonu',
};

const LEVEL_INFO = [
  { min: 0,  label: '🥉 Çırak',          next: 11, color: 'from-[#131318] to-[#0D0D12]', colorLight: 'from-[#EEF2FF] to-[#E0E7FF]', accent: '#6366F1' },
  { min: 11, label: '🥈 Usta Adayı',     next: 21, color: 'from-[#0F1A14] to-[#0A100E]', colorLight: 'from-[#ECFDF5] to-[#D1FAE5]', accent: '#059669' },
  { min: 21, label: '🥇 Kod Ustası',     next: 31, color: 'from-[#1A1508] to-[#110E05]', colorLight: 'from-[#FFFBEB] to-[#FEF3C7]', accent: '#D97706' },
  { min: 31, label: '🏆 Arduino Uzmanı', next: 41, color: 'from-[#081520] to-[#050D18]', colorLight: 'from-[#EFF6FF] to-[#DBEAFE]', accent: '#2563EB' },
  { min: 41, label: '💎 Sertifikalı',    next: 41, color: 'from-[#160B22] to-[#0E0716]', colorLight: 'from-[#FAF5FF] to-[#EDE9FE]', accent: '#7C3AED' },
];

function getLevelInfo(completed: number) {
  for (let i = LEVEL_INFO.length - 1; i >= 0; i--) {
    if (completed >= LEVEL_INFO[i].min) return LEVEL_INFO[i];
  }
  return LEVEL_INFO[0];
}

function formatTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}s ${m}dk`;
  return `${m} dakika`;
}

export function MainMenu() {
  const { progress, startLesson, setScreen, reset } = useProgressStore();
  const { theme } = useSettingsStore();
  const isLight = theme === 'light';
  const [showReset, setShowReset] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const totalLessons = lessonsData.filter(l => !l.isExam).length;
  // Sadece sınav olmayan dersleri say (sınav ID'leri hariç, tekrar oynananlar hariç)
  const nonExamIds = new Set(lessonsData.filter(l => !l.isExam).map(l => l.id));
  const completed = progress.completedLessons.filter(id => nonExamIds.has(id)).length;
  const overallProgress = Math.min(100, Math.round((completed / totalLessons) * 100));
  const levelInfo = getLevelInfo(completed);
  const nextLevelAt = levelInfo.next;
  const levelProgress = progress.finalExamPassed || completed >= nextLevelAt
    ? 100
    : Math.round(((completed - levelInfo.min) / (nextLevelAt - levelInfo.min)) * 100);

  function isModuleUnlocked(moduleId: number): boolean {
    const mod = modulesData.find(m => m.id === moduleId);
    if (!mod) return false;
    return mod.unlockCondition.every(reqId => {
      const reqMod = modulesData.find(m => m.id === reqId);
      return reqMod ? progress.examsPassed.includes(reqMod.examId) : true;
    });
  }

  const finalUnlocked = modulesData.every(m => progress.examsPassed.includes(m.examId));
  const bestWPM = progress.lessonStats.reduce((max, s) => Math.max(max, s.bestWPM), 0);

  return (
    <>
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    <div className="flex flex-col min-h-screen bg-gray-900 text-white overflow-auto">
      {/* Header with level */}
      <div
        className={`bg-gradient-to-br ${isLight ? levelInfo.colorLight : levelInfo.color} p-6 shadow-xl`}
        style={{ borderBottom: `1px solid ${levelInfo.accent}33` }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: isLight ? '#111827' : '#F9FAFB' }}>
              ⌨️ Arduino Typing Tutor
            </h1>
            <p className="text-sm mt-0.5" style={{ color: isLight ? `${levelInfo.accent}CC` : 'rgba(255,255,255,0.4)' }}>
              10 parmak yazarak Arduino öğren!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div
                className="text-base font-semibold px-3 py-1 rounded-full border"
                style={{ color: levelInfo.accent, borderColor: `${levelInfo.accent}50`, backgroundColor: `${levelInfo.accent}18` }}
              >
                {levelInfo.label}
              </div>
              <div className="text-xs mt-1 text-center" style={{ color: isLight ? '#6B7280' : 'rgba(255,255,255,0.4)' }}>
                {Math.min(completed, totalLessons)}/{totalLessons} ders
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-lg transition-colors"
              style={{ backgroundColor: `${levelInfo.accent}18`, border: `1px solid ${levelInfo.accent}40` }}
              title="Ayarlar"
            >
              ⚙️
            </button>
          </div>
        </div>

        {/* Level progress bar */}
        <div className="max-w-4xl mx-auto mt-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: isLight ? '#9CA3AF' : 'rgba(255,255,255,0.35)' }}>
            <span>Seviye ilerleme</span>
            <span>{levelProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? `${levelInfo.accent}20` : 'rgba(0,0,0,0.4)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${levelProgress}%`, backgroundColor: levelInfo.accent }}
            />
          </div>
        </div>
      </div>

      {/* Quick stats bar */}
      <div style={{ backgroundColor: isLight ? '#F3F4F6' : '#111111', borderBottom: isLight ? '1px solid #E5E7EB' : '1px solid #1E1E1F' }}>
        <div className="max-w-4xl mx-auto flex gap-6 px-6 py-3 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🔥 Seri:</span>
            <span className="font-semibold text-orange-400">{progress.currentStreak}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">⚡ En iyi WPM:</span>
            <span className="font-semibold text-blue-400">{bestWPM}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">⏱️ Toplam süre:</span>
            <span className="font-semibold" style={{ color: isLight ? '#374151' : '#E5E7EB' }}>{formatTime(progress.totalTimeSpent)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">🏅 Rozet:</span>
            <span className="font-semibold text-yellow-400">{progress.badges.length}</span>
          </div>
          <button
            onClick={() => setShowStats(s => !s)}
            className="ml-auto text-blue-400 hover:text-blue-300 transition-colors text-xs"
          >
            📊 {showStats ? 'Grafikleri Gizle' : 'İstatistikleri Gör'}
          </button>
        </div>

        {/* Stats panel */}
        {showStats && (
          <div className="max-w-4xl mx-auto px-6 pb-6">
            <StatsChart
              lessonStats={progress.lessonStats}
              errorKeys={progress.errorKeys}
            />
          </div>
        )}
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Badges */}
        {progress.badges.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Rozetlerin</h2>
            <div className="flex gap-2 flex-wrap">
              {progress.badges.map(badge => (
                <span
                  key={badge}
                  className="text-xs px-3 py-1.5 rounded-full font-medium"
                  style={isLight
                    ? { backgroundColor: '#FEF9C3', border: '1px solid #FDE047', color: '#854D0E' }
                    : { backgroundColor: 'rgba(120,53,15,0.4)', border: '1px solid rgba(202,138,4,0.6)', color: '#FDE68A' }
                  }
                >
                  {BADGE_LABELS[badge] ?? badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modules */}
        <h2 className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Modüller</h2>
        <div className="grid gap-3">
          {modulesData.map(mod => {
            const unlocked = isModuleUnlocked(mod.id);
            const examPassed = progress.examsPassed.includes(mod.examId);
            const modLessons = lessonsData.filter(l => mod.lessonIds.includes(l.id));
            const modCompleted = modLessons.filter(l => progress.completedLessons.includes(l.id)).length;
            const modProgress = modLessons.length > 0 ? (modCompleted / modLessons.length) * 100 : 0;

            return (
              <div
                key={mod.id}
                className={`rounded-xl border p-4 transition-all ${
                  unlocked
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-500'
                    : 'bg-gray-800 border-gray-800 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{examPassed ? '✅' : unlocked ? '🔓' : '🔒'}</span>
                    <div>
                      <h3 className="font-semibold text-sm">Modül {mod.id}: {mod.title}</h3>
                      <p className="text-xs text-gray-400">{mod.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{modCompleted}/{modLessons.length}</span>
                </div>

                <div className="h-1 bg-gray-700 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${examPassed ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${modProgress}%` }}
                  />
                </div>

                {unlocked && (
                  <div className="flex gap-1.5 flex-wrap">
                    {modLessons.map(l => {
                      const done = progress.completedLessons.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => startLesson(l.id)}
                          title={l.title}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all font-medium ${
                            l.isExam
                              ? done
                                ? 'bg-green-900/40 border-green-600 text-green-300'
                                : 'bg-orange-900/40 border-orange-600 text-orange-300 hover:bg-orange-900/60'
                              : done
                                ? 'bg-blue-900/30 border-blue-800 text-blue-400 hover:bg-blue-900/50'
                                : 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                          }`}
                        >
                          {l.isExam ? '📝' : done ? '✓' : ''} {l.isExam ? 'Sınav' : `D${l.id}`}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Final exam card */}
          <div className={`rounded-xl border p-4 transition-all ${
            finalUnlocked
              ? ''
              : 'bg-gray-800 border-gray-800 opacity-50'
          }`}
          style={finalUnlocked ? {
            background: isLight
              ? 'linear-gradient(to right, #FEF9C3, #FEF3C7)'
              : 'linear-gradient(to right, rgba(120,53,15,0.3), rgba(124,45,18,0.3))',
            border: isLight ? '1px solid #FDE047' : '1px solid #CA8A04'
          } : undefined}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{progress.finalExamPassed ? '🏆' : finalUnlocked ? '⭐' : '🔒'}</span>
                <div>
                  <h3 className="font-semibold" style={{ color: isLight ? '#92400E' : '#FDE68A' }}>Final Sınavı</h3>
                  <p className="text-xs text-gray-400">
                    {progress.finalExamPassed
                      ? 'Sertifikayı kazandın!'
                      : '5 dk · %95 doğruluk · 20 WPM · 3 hak'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {finalUnlocked && !progress.finalExamPassed && (
                  <button
                    onClick={() => startLesson(47)}
                    className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                  >
                    Başla →
                  </button>
                )}
                {progress.finalExamPassed && (
                  <button
                    onClick={() => setScreen('certificate')}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                  >
                    Sertifikam 🎓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Overall progress */}
        <div className="mt-4 rounded-xl p-4" style={{
          backgroundColor: isLight ? '#FFFFFF' : '#1A1A1B',
          border: isLight ? '1px solid #E5E7EB' : '1px solid #2E2E2F'
        }}>
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: isLight ? '#6B7280' : '#9A9A9E' }}>Genel İlerleme</span>
            <span className="font-semibold" style={{ color: isLight ? '#111827' : '#F9FAFB' }}>{overallProgress}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isLight ? '#E5E7EB' : '#2E2E2F' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallProgress}%`, backgroundColor: levelInfo.accent }}
            />
          </div>
        </div>

        {/* Reset */}
        <div className="mt-6 text-center">
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="text-xs text-gray-600 hover:text-gray-500 transition-colors"
            >
              İlerlemeyi sıfırla
            </button>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <span className="text-sm text-red-400">Emin misin? Geri alınamaz!</span>
              <button onClick={reset} className="text-sm bg-red-700 hover:bg-red-600 px-3 py-1 rounded-lg transition-colors">
                Evet, sıfırla
              </button>
              <button onClick={() => setShowReset(false)} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-lg transition-colors">
                İptal
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
