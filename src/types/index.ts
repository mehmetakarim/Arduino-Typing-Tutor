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
  | 'profile-select'
  | 'menu'
  | 'lesson'
  | 'exam'
  | 'result'
  | 'finalExam'
  | 'certificate'
  | 'parent-panel'
  | 'teacher-panel';

export interface Profile {
  id: string;
  name: string;
  color: string;
  emoji?: string; // isteğe bağlı avatar emoji
  createdAt: string;
}

export interface ParentSettings {
  pin: string | null; // null = PIN yok
  pinEnabled: boolean;
}

export interface TypingResult {
  lessonId: number;
  wpm: number;
  accuracy: number;
  timeSpent: number;
  errors: number;
  passed: boolean;
  errorKeyMap: Record<string, number>;
}

export interface TeacherNote {
  id: string;
  teacherId: string;
  classId: string;
  profileId: string;
  studentName: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

// Redesign paleti: klavye ↔ el rehberi ortak, camgöbeği/mor/turuncu ekseni
// (design/arduino-typing-tutor-redesign LessonView prototipiyle birebir)
export const FINGER_COLORS: Record<FingerName, string> = {
  leftPinky:   '#A78BFA',
  leftRing:    '#60A5FA',
  leftMiddle:  '#34D399',
  leftIndex:   '#F87171',
  leftThumb:   '#94A3B8',
  rightThumb:  '#94A3B8',
  rightIndex:  '#F472B6',
  rightMiddle: '#22D3EE',
  rightRing:   '#FACC15',
  rightPinky:  '#FB923C',
};
