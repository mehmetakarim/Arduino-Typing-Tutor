export type FingerName =
  | 'leftPinky'
  | 'leftRing'
  | 'leftMiddle'
  | 'leftIndex'
  | 'leftThumb'
  | 'rightThumb'
  | 'rightIndex'
  | 'rightMiddle'
  | 'rightRing'
  | 'rightPinky';

export interface KeyDef {
  key: string;
  shiftKey?: string;
  code: string;
  finger: FingerName;
  width?: number;
}

export interface KeyboardRow {
  keys: KeyDef[];
}

export interface Lesson {
  id: number;
  moduleId: number;
  title: string;
  description: string;
  targetKeys: string[];
  content: string;
  minAccuracy: number;
  minWPM?: number;
  isExam: boolean;
}

export interface Module {
  id: number;
  title: string;
  description: string;
  lessonIds: number[];
  examId: number;
  unlockCondition: number[];
}

export interface LessonStats {
  lessonId: number;
  attempts: number;
  bestWPM: number;
  bestAccuracy: number;
  totalTimeSpent: number;
  completedAt?: string;
}

export interface UserProgress {
  completedLessons: number[];
  currentLesson: number;
  lessonStats: LessonStats[];
  examsPassed: number[];
  finalExamPassed: boolean;
  finalExamAttempts: number;
  badges: string[];
  totalTimeSpent: number;
  currentStreak: number;
  longestStreak: number;
  errorKeys: Record<string, number>;
  newlyEarnedBadges: string[];
}

export type AppScreen =
  | 'menu'
  | 'lesson'
  | 'exam'
  | 'result'
  | 'finalExam'
  | 'certificate';

export interface TypingResult {
  lessonId: number;
  wpm: number;
  accuracy: number;
  timeSpent: number;
  errors: number;
  passed: boolean;
  errorKeyMap: Record<string, number>;
}

export const FINGER_COLORS: Record<FingerName, string> = {
  leftPinky:   '#9333EA',
  leftRing:    '#3B82F6',
  leftMiddle:  '#10B981',
  leftIndex:   '#EF4444',
  leftThumb:   '#6B7280',
  rightThumb:  '#6B7280',
  rightIndex:  '#EC4899',
  rightMiddle: '#06B6D4',
  rightRing:   '#EAB308',
  rightPinky:  '#F97316',
};
