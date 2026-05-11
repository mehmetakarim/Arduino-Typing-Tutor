import { UserProgress } from '../types';

const KEY = 'arduino-typing-tutor-progress';

const defaultProgress: UserProgress = {
  completedLessons: [],
  currentLesson: 1,
  lessonStats: [],
  examsPassed: [],
  finalExamPassed: false,
  finalExamAttempts: 0,
  badges: [],
  totalTimeSpent: 0,
  currentStreak: 0,
  longestStreak: 0,
  errorKeys: {},
  newlyEarnedBadges: [],
};

export function loadProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultProgress };
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return { ...defaultProgress };
  }
}

export function saveProgress(progress: UserProgress): void {
  localStorage.setItem(KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
  localStorage.removeItem(KEY);
}
