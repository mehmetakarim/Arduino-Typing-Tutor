import { appDataDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { UserProgress } from '../types';

// ── Tipler ──────────────────────────────────────────────────────────────────

export interface Settings {
  soundEnabled: boolean;
  theme: 'dark' | 'light';
  difficulty: 'easy' | 'normal' | 'hard';
}

// ── Varsayılanlar ────────────────────────────────────────────────────────────

export const defaultProgress: UserProgress = {
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

export const defaultSettings: Settings = {
  soundEnabled: true,
  theme: 'dark',
  difficulty: 'normal',
};

// ── localStorage anahtarları (migrasyon için) ────────────────────────────────

const LS_PROGRESS_KEY = 'arduino-typing-tutor-progress';
const LS_SETTINGS_KEY = 'arduino-typing-tutor-settings';

// ── Modül-seviye cache (senkron store init için) ─────────────────────────────

let _cachedProgress: UserProgress = { ...defaultProgress };
let _cachedSettings: Settings = { ...defaultSettings };

export function getCachedProgress(): UserProgress { return _cachedProgress; }
export function getCachedSettings(): Settings { return _cachedSettings; }
export function setCachedProgress(p: UserProgress) { _cachedProgress = p; }
export function setCachedSettings(s: Settings) { _cachedSettings = s; }

// ── Yardımcı ─────────────────────────────────────────────────────────────────

async function ensureAppDir(dir: string): Promise<void> {
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
}

// ── Progress ──────────────────────────────────────────────────────────────────

export async function loadProgressFromFS(): Promise<UserProgress> {
  try {
    const dir = await appDataDir();
    const filePath = await join(dir, 'progress.json');

    if (await exists(filePath)) {
      const raw = await readTextFile(filePath);
      return { ...defaultProgress, ...JSON.parse(raw) };
    }

    // Dosya yok — localStorage'dan migrate et
    const lsRaw = localStorage.getItem(LS_PROGRESS_KEY);
    if (lsRaw) {
      const migrated: UserProgress = { ...defaultProgress, ...JSON.parse(lsRaw) };
      await saveProgressToFS(migrated);
      localStorage.removeItem(LS_PROGRESS_KEY);
      return migrated;
    }

    return { ...defaultProgress };
  } catch {
    return { ...defaultProgress };
  }
}

export async function saveProgressToFS(progress: UserProgress): Promise<void> {
  try {
    const dir = await appDataDir();
    await ensureAppDir(dir);
    const filePath = await join(dir, 'progress.json');
    await writeTextFile(filePath, JSON.stringify(progress));
  } catch (e) {
    console.error('progress kaydetme hatası:', e);
  }
}

export async function resetProgressFS(): Promise<void> {
  _cachedProgress = { ...defaultProgress };
  await saveProgressToFS({ ...defaultProgress });
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function loadSettingsFromFS(): Promise<Settings> {
  try {
    const dir = await appDataDir();
    const filePath = await join(dir, 'settings.json');

    if (await exists(filePath)) {
      const raw = await readTextFile(filePath);
      return { ...defaultSettings, ...JSON.parse(raw) };
    }

    // Dosya yok — localStorage'dan migrate et
    const lsRaw = localStorage.getItem(LS_SETTINGS_KEY);
    if (lsRaw) {
      const migrated: Settings = { ...defaultSettings, ...JSON.parse(lsRaw) };
      await saveSettingsToFS(migrated);
      localStorage.removeItem(LS_SETTINGS_KEY);
      return migrated;
    }

    return { ...defaultSettings };
  } catch {
    return { ...defaultSettings };
  }
}

export async function saveSettingsToFS(settings: Settings): Promise<void> {
  try {
    const dir = await appDataDir();
    await ensureAppDir(dir);
    const filePath = await join(dir, 'settings.json');
    await writeTextFile(filePath, JSON.stringify(settings));
  } catch (e) {
    console.error('settings kaydetme hatası:', e);
  }
}
