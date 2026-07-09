import { useState } from 'react';
import {
  Award, BarChart3, Check, CheckCircle2, Clock, Code2, Flame, GraduationCap,
  Keyboard as KeyboardIcon, Layers, Lock, Mail, Medal, Play, Rocket, Settings,
  ShieldCheck, Target, Trophy, Users, Zap,
} from 'lucide-react';
import { useProgressStore } from '../store/progressStore';
import { useProfileStore } from '../store/profileStore';
import { useNotesStore } from '../store/notesStore';
import { StatsChart } from './StatsChart';
import { SettingsModal } from './SettingsModal';
import { TeacherNotesModal } from './TeacherNotesModal';
import { Chip, ProgressBar, Button } from './ui';
import lessonsData from '../data/lessons.json';
import modulesData from '../data/modules.json';

const BADGE_DEFS: { id: string; label: string; color: string; Icon: typeof Flame }[] = [
  { id: 'first_lesson', label: 'İlk Ders',        color: '#A3E635', Icon: Rocket },
  { id: 'fast_fingers', label: 'Hızlı Parmaklar', color: '#FBBF24', Icon: Zap },
  { id: 'perfect',      label: 'Mükemmeliyetçi',  color: '#22D3EE', Icon: Target },
  { id: 'streak5',      label: 'Üst Üste 5',      color: '#FB923C', Icon: Flame },
  { id: 'module1_done', label: 'Modül 1',         color: '#A78BFA', Icon: ShieldCheck },
  { id: 'module5_done', label: 'Modül 5',         color: '#F472B6', Icon: Medal },
  { id: 'final_champ',  label: 'Final Şampiyonu', color: '#FBBF24', Icon: Trophy },
];

const LEVEL_INFO = [
  { min: 0,  num: 1, name: 'Çırak',          next: 11, Icon: Layers },
  { min: 11, num: 2, name: 'Usta Adayı',     next: 21, Icon: Rocket },
  { min: 21, num: 3, name: 'Kod Ustası',     next: 31, Icon: Code2 },
  { min: 31, num: 4, name: 'Arduino Uzmanı', next: 41, Icon: ShieldCheck },
  { min: 41, num: 5, name: 'Sertifikalı',    next: 41, Icon: Trophy },
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
  return `${m} dk`;
}

/* ── Öğrenme haritası geometrisi ──────────────────────────────────────
   Zigzag düzen: düğümler solda (x=260) / sağda (x=760) dönüşümlü,
   dikey aralık 220px. Kartlar düğümün karşı tarafına yerleşir. */
const MAP_W = 1020;
const NODE_XS = [260, 760];
const START_Y = 110;
const STEP_Y = 220;
const CARD_W = 500;

function nodeX(i: number) { return NODE_XS[i % 2]; }
function nodeY(i: number) { return START_Y + i * STEP_Y; }

function buildPath(fromIdx: number, toIdx: number): string {
  let d = `M ${nodeX(fromIdx)} ${nodeY(fromIdx)}`;
  for (let i = fromIdx; i < toIdx; i++) {
    const midY = (nodeY(i) + nodeY(i + 1)) / 2;
    d += ` C ${nodeX(i)} ${midY}, ${nodeX(i + 1)} ${midY}, ${nodeX(i + 1)} ${nodeY(i + 1)}`;
  }
  return d;
}

/** Son modülden merkezdeki final düğümüne inen kapanış segmentiyle tam yol */
function buildFullTrack(nModules: number, finalY: number): string {
  const lastIdx = nModules - 1;
  const lastY = nodeY(lastIdx);
  const midY = (lastY + finalY) / 2;
  return `${buildPath(0, lastIdx)} C ${nodeX(lastIdx)} ${midY}, ${MAP_W / 2} ${midY}, ${MAP_W / 2} ${finalY}`;
}

export function MainMenu() {
  const { progress, startLesson, setScreen, reset } = useProgressStore();
  const { activeProfile } = useProfileStore();
  const { unreadNotes } = useNotesStore();
  const [showReset, setShowReset] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const totalLessons = lessonsData.filter(l => !l.isExam).length;
  const nonExamIds = new Set(lessonsData.filter(l => !l.isExam).map(l => l.id));
  const completed = progress.completedLessons.filter(id => nonExamIds.has(id)).length;
  const overallProgress = Math.min(100, Math.round((completed / totalLessons) * 100));
  const levelInfo = getLevelInfo(completed);
  const LevelIcon = levelInfo.Icon;
  const levelAccent = `var(--level-${levelInfo.num}-accent)`;
  const nextLevel = LEVEL_INFO.find(l => l.min === levelInfo.next);
  const levelProgress = progress.finalExamPassed || completed >= levelInfo.next
    ? 100
    : Math.round(((completed - levelInfo.min) / (levelInfo.next - levelInfo.min)) * 100);

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

  // Hata tuşları özeti (istatistik paneli için StatsChart'a gidiyor zaten)
  const finalIdx = modulesData.length; // final sınavı düğüm indeksi
  const finalY = nodeY(finalIdx);
  const mapHeight = finalY + 300;

  // Aktif (frontier) modül: kilidi açık ama sınavı geçilmemiş ilk modül
  const activeModuleIdx = modulesData.findIndex(
    m => isModuleUnlocked(m.id) && !progress.examsPassed.includes(m.examId),
  );
  // Tamamlanan yol: son geçilen sınava kadar cyan çizgi
  const completedUpTo = modulesData.filter(m => progress.examsPassed.includes(m.examId)).length;

  return (
    <>
    {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    {showNotes && <TeacherNotesModal onClose={() => setShowNotes(false)} />}
    <div className="flex flex-col min-h-screen bg-base text-primary overflow-auto pb-12">

      {/* ══ HEADER — seviye kimliği ══ */}
      <header
        className="relative overflow-hidden px-8 pt-6 pb-5"
        style={{ background: `var(--level-${levelInfo.num}-gradient)`, borderBottom: `1px solid color-mix(in srgb, ${levelAccent} 30%, var(--bg-border))` }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: -80, right: 120, width: 320, height: 320, borderRadius: '50%',
            background: `radial-gradient(circle, color-mix(in srgb, ${levelAccent} 14%, transparent) 0%, transparent 70%)` }}
        />
        <div className="flex items-center gap-4 max-w-5xl mx-auto relative">
          <div
            className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #164E63, var(--accent-cyan-deep))', boxShadow: '0 0 24px rgba(34,211,238,.35), inset 0 1px 0 rgba(255,255,255,.15)' }}
          >
            <KeyboardIcon size={28} color="#67E8F9" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="m-0 text-2xl font-black tracking-tight">Arduino Typing Tutor</h1>
              <Chip color={levelAccent} size="sm">
                <LevelIcon size={14} strokeWidth={2.4} />
                Seviye {levelInfo.num} · {levelInfo.name}
              </Chip>
            </div>
            <p className="m-0 mt-1 text-secondary text-sm font-semibold">10 parmak yazarak Arduino öğren!</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setScreen('parent-panel')}
              title="Ebeveyn Paneli"
              className="w-11 h-11 rounded-[14px] bg-elevated border border-border text-secondary hover:text-primary cursor-pointer flex items-center justify-center transition-colors"
            >
              <Users size={20} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              title="Ayarlar"
              className="w-11 h-11 rounded-[14px] bg-elevated border border-border text-secondary hover:text-primary cursor-pointer flex items-center justify-center transition-colors"
            >
              <Settings size={20} strokeWidth={2.2} />
            </button>
            {activeProfile && (
              <button
                onClick={() => setScreen('profile-select')}
                title={`${activeProfile.name} — Profil değiştir`}
                className="w-11 h-11 rounded-[14px] border-none cursor-pointer flex items-center justify-center text-white font-black text-base transition-transform hover:scale-105"
                style={{ background: activeProfile.color, boxShadow: `0 0 16px ${activeProfile.color}66` }}
              >
                {activeProfile.name.charAt(0).toUpperCase()}
              </button>
            )}
          </div>
        </div>

        {/* Seviye ilerlemesi */}
        <div className="max-w-5xl mx-auto mt-[18px] flex items-center gap-3.5 relative">
          <div className="flex-1">
            <div className="flex justify-between mb-1.5">
              <span className="text-xs font-extrabold text-secondary uppercase tracking-wider">Seviye ilerlemesi</span>
              <span className="text-xs font-extrabold" style={{ color: levelAccent }}>
                {Math.min(completed, totalLessons)}/{totalLessons} ders
                {nextLevel && levelProgress < 100 && ` · ${nextLevel.name}'na ${levelInfo.next - completed} ders`}
              </span>
            </div>
            <ProgressBar value={levelProgress} height={12} />
          </div>
          <span className="text-xl font-black" style={{ color: levelAccent }}>%{levelProgress}</span>
        </div>
      </header>

      {/* ══ HIZLI İSTATİSTİK ÇUBUĞU ══ */}
      <div className="bg-muted border-b border-elevated px-8 py-3.5">
        <div className="max-w-5xl mx-auto flex items-center gap-2 flex-wrap">
          {[
            { Icon: Flame, label: 'Seri', value: `${progress.currentStreak} gün`, color: '#FB923C' },
            { Icon: Zap, label: 'En iyi WPM', value: String(bestWPM), color: '#FBBF24' },
            { Icon: Clock, label: 'Toplam süre', value: formatTime(progress.totalTimeSpent), color: 'var(--accent-cyan)' },
            { Icon: Award, label: 'Rozet', value: String(progress.badges.length), color: '#A78BFA' },
          ].map(({ Icon, label, value, color }, i) => (
            <div key={label} className="flex items-center gap-2 px-3.5 py-2">
              {i > 0 && <div className="w-px h-[22px] bg-border -ml-5 mr-3" />}
              <Icon size={18} strokeWidth={2.2} style={{ color }} />
              <span className="text-sm font-bold text-secondary">{label}</span>
              <span className="text-[17px] font-black" style={{ color }}>{value}</span>
            </div>
          ))}
          <div className="flex-1" />
          <Button variant="secondary" size="sm" onClick={() => setShowStats(s => !s)} className="!text-accent-cyan-soft">
            <BarChart3 size={16} strokeWidth={2.4} />
            {showStats ? 'İstatistikleri Gizle' : 'İstatistikleri Gör'}
          </Button>
        </div>

        {showStats && (
          <div className="max-w-5xl mx-auto pt-4 pb-2 animate-slide-down">
            <StatsChart lessonStats={progress.lessonStats} errorKeys={progress.errorKeys} />
          </div>
        )}
      </div>

      {/* ══ ROZETLER ══ */}
      <div className="max-w-5xl mx-auto w-full px-8 pt-6">
        <div className="text-xs font-black tracking-[1.5px] uppercase text-subtle mb-2.5">
          Rozetlerin · {progress.badges.length}/{BADGE_DEFS.length}
        </div>
        <div className="flex flex-wrap gap-2.5">
          {BADGE_DEFS.map(({ id, label, color, Icon }) => {
            const earned = progress.badges.includes(id);
            return earned ? (
              <Chip key={id} color={color}><Icon size={15} strokeWidth={2.2} />{label}</Chip>
            ) : (
              <Chip key={id} dashed><Lock size={14} strokeWidth={2.2} />{label}</Chip>
            );
          })}
        </div>
      </div>

      {/* ══ ÖĞRETMEN NOTU BANNER ══ */}
      {unreadNotes.length > 0 && (
        <div className="max-w-5xl mx-auto w-full px-8 mt-[18px]">
          <div
            className="flex items-center gap-3.5 rounded-panel px-[18px] py-3.5"
            style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--accent-cyan) 10%, transparent), color-mix(in srgb, var(--accent-cyan) 3%, transparent))', border: '1px solid color-mix(in srgb, var(--accent-cyan) 35%, transparent)' }}
          >
            <div
              className="w-10 h-10 rounded-control flex items-center justify-center animate-floaty flex-shrink-0"
              style={{ background: 'color-mix(in srgb, var(--accent-cyan) 15%, transparent)' }}
            >
              <Mail size={20} strokeWidth={2.2} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-extrabold text-primary">
                Öğretmeninden {unreadNotes.length} yeni not var
              </div>
              <div className="text-[13px] font-semibold text-secondary truncate">
                {unreadNotes[0]?.content ? `"${unreadNotes[0].content}"` : 'Görüntülemek için tıkla'}
              </div>
            </div>
            <Button size="sm" onClick={() => setShowNotes(true)}>Oku</Button>
          </div>
        </div>
      )}

      {/* ══ ÖĞRENME HARİTASI ══ */}
      <div className="max-w-5xl mx-auto w-full px-8 pt-[26px]">
        <div className="text-xs font-black tracking-[1.5px] uppercase text-subtle mb-1">Öğrenme Haritası</div>
      </div>
      <div className="mx-auto relative" style={{ width: MAP_W, height: mapHeight }}>
        {/* Yol */}
        <svg width={MAP_W} height={mapHeight} viewBox={`0 0 ${MAP_W} ${mapHeight}`} className="absolute inset-0" fill="none">
          <path d={buildFullTrack(modulesData.length, finalY)} stroke="var(--bg-border)" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14" />
          {completedUpTo > 0 && (
            <path
              d={completedUpTo >= modulesData.length
                ? buildFullTrack(modulesData.length, finalY)
                : buildPath(0, completedUpTo)}
              stroke="var(--accent-cyan)" strokeWidth="5" strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,.6))' }}
            />
          )}
        </svg>

        {modulesData.map((mod, i) => {
          const unlocked = isModuleUnlocked(mod.id);
          const examPassed = progress.examsPassed.includes(mod.examId);
          const isActive = i === activeModuleIdx;
          const modLessons = lessonsData.filter(l => mod.lessonIds.includes(l.id));
          const exam = lessonsData.find(l => l.id === mod.examId);
          const modCompleted = modLessons.filter(l => progress.completedLessons.includes(l.id)).length;
          const modProgress = modLessons.length > 0 ? (modCompleted / modLessons.length) * 100 : 0;
          const nx = nodeX(i);
          const ny = nodeY(i);
          const cardLeft = nx === NODE_XS[0] ? nx + 70 : nx - 70 - CARD_W;
          const nextUncompleted = modLessons.find(l => !progress.completedLessons.includes(l.id));
          const prevMod = modulesData[i - 1];

          return (
            <div key={mod.id}>
              {/* Düğüm */}
              <div
                className={`absolute rounded-full flex items-center justify-center z-[2] ${isActive ? 'animate-glow-pulse' : ''}`}
                style={{
                  left: nx - 36, top: ny - 36, width: 72, height: 72,
                  background: examPassed
                    ? 'linear-gradient(135deg, #365314, #4D7C0F)'
                    : isActive
                      ? 'linear-gradient(135deg, #155E75, var(--accent-cyan-deep))'
                      : 'var(--bg-surface)',
                  border: `3px solid ${examPassed ? 'var(--accent-lime)' : isActive ? 'var(--accent-cyan)' : 'var(--bg-border)'}`,
                  boxShadow: examPassed ? '0 0 20px rgba(163,230,53,.35)' : undefined,
                }}
              >
                {examPassed ? (
                  <Check size={30} color="#A3E635" strokeWidth={3} />
                ) : isActive ? (
                  <span className="text-2xl font-black" style={{ color: '#A5F3FC' }}>{mod.id}</span>
                ) : (
                  <Lock size={22} strokeWidth={2.2} className="text-subtle" />
                )}
              </div>

              {/* Kart */}
              <div
                className="absolute rounded-card p-[18px] px-5"
                style={{
                  left: cardLeft, top: ny - 80, width: CARD_W,
                  background: isActive ? 'color-mix(in srgb, var(--accent-cyan) 4%, var(--bg-surface))' : unlocked ? 'var(--bg-surface)' : 'var(--bg-muted)',
                  border: isActive
                    ? '2px solid color-mix(in srgb, var(--accent-cyan) 50%, transparent)'
                    : examPassed
                      ? '1px solid color-mix(in srgb, var(--accent-lime) 30%, var(--bg-border))'
                      : '1px solid var(--bg-border)',
                  boxShadow: isActive ? '0 0 32px rgba(34,211,238,.12), var(--shadow-card)' : 'var(--shadow-card)',
                  opacity: unlocked ? 1 : 0.62,
                }}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[17px] font-black ${unlocked ? 'text-primary' : 'text-secondary'}`}>
                        Modül {mod.id} · {mod.title}
                      </span>
                      {isActive && (
                        <span
                          className="text-[11px] font-black uppercase tracking-wider rounded-full px-2.5 py-0.5"
                          style={{ background: 'var(--accent-cyan)', color: 'var(--on-cyan)' }}
                        >
                          Buradasın
                        </span>
                      )}
                    </div>
                    <div className="text-[13px] font-semibold text-secondary mt-0.5">{mod.description}</div>
                  </div>
                  {unlocked ? (
                    <Chip size="sm" color={examPassed ? 'var(--accent-lime)' : 'var(--accent-cyan)'}>
                      {examPassed && <Check size={13} strokeWidth={3} />}
                      {modCompleted}/{modLessons.length}
                    </Chip>
                  ) : (
                    <Chip size="sm" dashed>{modLessons.length} ders</Chip>
                  )}
                </div>

                {unlocked ? (
                  <>
                    <div className="my-3">
                      <ProgressBar
                        value={modProgress} height={8} glow={!examPassed}
                        color={examPassed ? 'var(--accent-lime)' : undefined}
                      />
                    </div>
                    <div className="flex flex-wrap gap-[7px]">
                      {modLessons.map(l => {
                        const done = progress.completedLessons.includes(l.id);
                        const isNext = nextUncompleted?.id === l.id;
                        return (
                          <button
                            key={l.id}
                            onClick={() => startLesson(l.id)}
                            title={l.title}
                            className="font-mono text-xs font-extrabold rounded-lg px-2.5 py-[5px] cursor-pointer transition-all hover:brightness-110"
                            style={
                              isNext
                                ? { background: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', color: 'var(--on-cyan)', boxShadow: '0 0 12px rgba(34,211,238,.5)' }
                                : done
                                  ? { background: 'color-mix(in srgb, var(--accent-lime) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-lime) 30%, transparent)', color: 'var(--accent-lime)' }
                                  : { background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', color: 'var(--text-muted)' }
                            }
                          >
                            {isNext ? <Play size={9} className="inline -mt-0.5 mr-0.5" fill="currentColor" /> : done ? '✓' : ''}D{l.id}
                          </button>
                        );
                      })}
                      {exam && (
                        <button
                          onClick={() => startLesson(exam.id)}
                          title={exam.title}
                          className="text-xs font-extrabold rounded-lg px-2.5 py-[5px] cursor-pointer transition-all hover:brightness-110"
                          style={
                            examPassed
                              ? { background: 'color-mix(in srgb, var(--accent-lime) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-lime) 40%, transparent)', color: 'var(--accent-lime)' }
                              : { background: 'color-mix(in srgb, var(--accent-orange) 10%, transparent)', border: '1px dashed color-mix(in srgb, var(--accent-orange) 50%, transparent)', color: 'var(--accent-orange)' }
                          }
                        >
                          Sınav {examPassed ? '✓' : ''}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-xs font-bold text-subtle mt-2 flex items-center gap-1.5">
                    <Lock size={12} strokeWidth={2.4} />
                    {prevMod ? `Modül ${prevMod.id} sınavını geç` : 'Kilitli'}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Final Sınavı düğümü */}
        <div
          className="absolute rounded-full flex items-center justify-center z-[2]"
          style={{
            left: MAP_W / 2 - 40, top: finalY - 40, width: 80, height: 80,
            background: finalUnlocked ? 'linear-gradient(135deg, #92400E, #B45309)' : 'var(--bg-surface)',
            border: `3px solid ${finalUnlocked ? 'var(--accent-amber)' : 'var(--bg-border)'}`,
            boxShadow: finalUnlocked ? '0 0 28px rgba(251,191,36,.3)' : undefined,
          }}
        >
          {finalUnlocked
            ? <Trophy size={34} color="#FDE68A" strokeWidth={2.2} />
            : <Lock size={26} strokeWidth={2.2} className="text-subtle" />}
        </div>
        <div
          className="absolute rounded-card p-5 px-[22px]"
          style={{
            left: MAP_W / 2 - CARD_W / 2, top: finalY + 58, width: CARD_W,
            background: finalUnlocked ? 'linear-gradient(140deg, #1C1608, #201A0B 60%, #17130A)' : 'var(--bg-muted)',
            border: finalUnlocked ? '2px solid rgba(251,191,36,.5)' : '1px solid var(--bg-border)',
            boxShadow: finalUnlocked ? '0 0 36px rgba(251,191,36,.12)' : undefined,
            opacity: finalUnlocked ? 1 : 0.62,
          }}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-lg font-black" style={{ color: finalUnlocked ? '#FDE68A' : 'var(--text-secondary)' }}>Final Sınavı</span>
            <span
              className="text-[11px] font-black tracking-wider uppercase rounded-full px-2.5 py-0.5"
              style={{ color: '#78350F', background: 'linear-gradient(90deg, #FBBF24, #FDE68A)' }}
            >
              Sertifika
            </span>
          </div>
          <div className="text-[13.5px] font-semibold mt-1.5" style={{ color: finalUnlocked ? '#D6C08A' : 'var(--text-muted)' }}>
            {progress.finalExamPassed ? 'Sertifikayı kazandın! 🎉' : 'Tüm modülleri bitir, sertifikanı kazan!'}
          </div>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {['5 dk', '%95 doğruluk', '20 WPM', '3 hak'].map(t => (
              <span
                key={t}
                className="text-xs font-extrabold rounded-lg px-2.5 py-[5px]"
                style={{ color: finalUnlocked ? '#FDE68A' : 'var(--text-muted)', background: finalUnlocked ? 'rgba(251,191,36,.1)' : 'var(--bg-elevated)', border: finalUnlocked ? '1px solid rgba(251,191,36,.3)' : '1px solid var(--bg-border)' }}
              >
                {t}
              </span>
            ))}
            <div className="flex-1" />
            {finalUnlocked && !progress.finalExamPassed && (
              <Button variant="gold" size="sm" onClick={() => startLesson(47)}>Başla →</Button>
            )}
            {progress.finalExamPassed && (
              <Button variant="gold" size="sm" onClick={() => setScreen('certificate')}>
                <GraduationCap size={15} strokeWidth={2.4} /> Sertifikam
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ══ GENEL İLERLEME + SIFIRLA ══ */}
      <div className="max-w-5xl mx-auto w-full px-8 mt-7">
        <div className="bg-surface border border-border rounded-card px-[22px] py-[18px] flex items-center gap-[18px]">
          <div className="flex-1">
            <div className="text-sm font-extrabold text-primary mb-2 flex items-center gap-2">
              <CheckCircle2 size={16} strokeWidth={2.4} style={{ color: 'var(--accent-lime)' }} />
              Genel ilerleme · {completed}/{totalLessons} ders tamamlandı
            </div>
            <ProgressBar value={overallProgress} height={10} color="linear-gradient(90deg, var(--accent-cyan), var(--accent-lime))" glow={false} />
          </div>
          <span className="text-2xl font-black" style={{ color: 'var(--accent-lime)' }}>%{overallProgress}</span>
        </div>

        <div className="text-center mt-5">
          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="bg-transparent border-none text-subtle text-xs font-bold cursor-pointer underline underline-offset-[3px] hover:text-accent-red transition-colors"
            >
              İlerlemeyi sıfırla
            </button>
          ) : (
            <div className="inline-flex items-center gap-2.5 animate-fade-in">
              <span className="text-sm font-bold text-accent-red">Emin misin? Geri alınamaz!</span>
              <Button variant="destructive" size="sm" onClick={reset}>Evet, sıfırla</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowReset(false)}>İptal</Button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
