import { create } from 'zustand';
import { UserProgress, LessonStats, AppScreen, TypingResult } from '../types';
import {
  getCachedProgress,
  setCachedProgress,
  saveProgressToFS,
  saveProfileProgressToFS,
  resetProgressFS,
  defaultProgress,
} from '../utils/storage';

const ALL_BADGES = [
  { id: 'first_lesson',  check: (p: UserProgress) => p.completedLessons.length >= 1 },
  { id: 'streak5',       check: (p: UserProgress) => p.currentStreak >= 5 },
  { id: 'fast_fingers',  check: (p: UserProgress) => p.lessonStats.some(s => s.bestWPM >= 40) },
  { id: 'perfect',       check: (p: UserProgress) => p.lessonStats.some(s => s.bestAccuracy === 100) },
  { id: 'module1_done',  check: (p: UserProgress) => p.examsPassed.includes(11) },
  { id: 'module5_done',  check: (p: UserProgress) => p.examsPassed.includes(46) },
  { id: 'final_champ',   check: (p: UserProgress) => p.finalExamPassed },
];

function checkNewBadges(progress: UserProgress): string[] {
  return ALL_BADGES
    .filter(b => !progress.badges.includes(b.id) && b.check(progress))
    .map(b => b.id);
}

// Aktif profil ID'sini dışarıdan set etmek için — circular import'tan kaçınır
let _activeProfileId: string | null = null;
export function setActiveProfileId(id: string | null) { _activeProfileId = id; }

function save(progress: UserProgress) {
  setCachedProgress(progress);
  if (_activeProfileId) {
    saveProfileProgressToFS(_activeProfileId, progress); // fire-and-forget
  } else {
    saveProgressToFS(progress); // fire-and-forget
  }
}

interface ProgressState {
  progress: UserProgress;
  screen: AppScreen;
  activeLessonId: number | null;
  lastResult: TypingResult | null;

  setScreen: (screen: AppScreen) => void;
  startLesson: (lessonId: number) => void;
  completeLesson: (result: TypingResult) => void;
  passExam: (examId: number) => void;
  completeFinalExam: () => void;
  incrementFinalAttempt: () => void;
  addTime: (seconds: number) => void;
  clearNewBadges: () => void;
  reset: () => void;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: getCachedProgress(),
  screen: 'menu',
  activeLessonId: null,
  lastResult: null,

  setScreen: (screen) => set({ screen }),

  startLesson: (lessonId) => set({ activeLessonId: lessonId, screen: 'lesson' }),

  completeLesson: (result) => {
    const { progress } = get();
    const existing = progress.lessonStats.find(s => s.lessonId === result.lessonId);

    const updatedStats: LessonStats = {
      lessonId: result.lessonId,
      attempts: (existing?.attempts ?? 0) + 1,
      bestWPM: Math.max(existing?.bestWPM ?? 0, result.wpm),
      bestAccuracy: Math.max(existing?.bestAccuracy ?? 0, result.accuracy),
      totalTimeSpent: (existing?.totalTimeSpent ?? 0) + result.timeSpent,
      completedAt: result.passed ? new Date().toISOString() : existing?.completedAt,
    };

    const alreadyCompleted = progress.completedLessons.includes(result.lessonId);
    const completedLessons = result.passed && !alreadyCompleted
      ? [...progress.completedLessons, result.lessonId]
      : progress.completedLessons;

    const newStreak = result.passed ? progress.currentStreak + 1 : 0;
    const longestStreak = Math.max(progress.longestStreak, newStreak);

    const mergedErrorKeys = { ...progress.errorKeys };
    for (const [key, count] of Object.entries(result.errorKeyMap)) {
      mergedErrorKeys[key] = (mergedErrorKeys[key] ?? 0) + count;
    }

    const updated: UserProgress = {
      ...progress,
      completedLessons,
      lessonStats: [...progress.lessonStats.filter(s => s.lessonId !== result.lessonId), updatedStats],
      currentLesson: result.passed
        ? Math.max(progress.currentLesson, result.lessonId + 1)
        : progress.currentLesson,
      currentStreak: newStreak,
      longestStreak,
      errorKeys: mergedErrorKeys,
      newlyEarnedBadges: [],
    };

    const newBadges = checkNewBadges(updated);
    if (newBadges.length > 0) {
      updated.badges = [...updated.badges, ...newBadges];
      updated.newlyEarnedBadges = newBadges;
    }

    save(updated);
    set({ progress: updated, lastResult: result, screen: 'result' });
  },

  passExam: (examId) => {
    const { progress } = get();
    if (progress.examsPassed.includes(examId)) return;
    const updated = { ...progress, examsPassed: [...progress.examsPassed, examId] };
    const newBadges = checkNewBadges(updated);
    if (newBadges.length > 0) {
      updated.badges = [...updated.badges, ...newBadges];
      updated.newlyEarnedBadges = [...(updated.newlyEarnedBadges ?? []), ...newBadges];
    }
    save(updated);
    set({ progress: updated });
  },

  completeFinalExam: () => {
    const { progress } = get();
    const updated: UserProgress = { ...progress, finalExamPassed: true };
    const newBadges = checkNewBadges(updated);
    if (newBadges.length > 0) {
      updated.badges = [...updated.badges, ...newBadges];
      updated.newlyEarnedBadges = newBadges;
    }
    save(updated);
    set({ progress: updated, screen: 'certificate' });
  },

  incrementFinalAttempt: () => {
    const { progress } = get();
    const updated = { ...progress, finalExamAttempts: progress.finalExamAttempts + 1 };
    save(updated);
    set({ progress: updated });
  },

  addTime: (seconds) => {
    const { progress } = get();
    const updated = { ...progress, totalTimeSpent: progress.totalTimeSpent + seconds };
    save(updated);
    set({ progress: updated });
  },

  clearNewBadges: () => {
    const { progress } = get();
    const updated = { ...progress, newlyEarnedBadges: [] };
    save(updated);
    set({ progress: updated });
  },

  reset: () => {
    if (_activeProfileId) {
      saveProfileProgressToFS(_activeProfileId, { ...defaultProgress });
      setCachedProgress({ ...defaultProgress });
    } else {
      resetProgressFS(); // global dosyayı sıfırla
    }
    set({ progress: { ...defaultProgress }, screen: 'menu', activeLessonId: null, lastResult: null });
  },
}));
