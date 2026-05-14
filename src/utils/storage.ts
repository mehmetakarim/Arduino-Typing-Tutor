import { appDataDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { UserProgress, Profile, ParentSettings } from '../types';
import { supabase } from '../lib/supabase';

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

// ── Profiller ─────────────────────────────────────────────────────────────────

export const defaultParentSettings: ParentSettings = {
  pin: null,
  pinEnabled: false,
};

let _cachedProfiles: Profile[] = [];
let _cachedParentSettings: ParentSettings = { ...defaultParentSettings };

export function getCachedProfiles(): Profile[] { return _cachedProfiles; }
export function setCachedProfiles(p: Profile[]) { _cachedProfiles = p; }
export function getCachedParentSettings(): ParentSettings { return _cachedParentSettings; }
export function setCachedParentSettings(p: ParentSettings) { _cachedParentSettings = p; }

export async function loadProfilesFromFS(): Promise<Profile[]> {
  try {
    const dir = await appDataDir();
    const filePath = await join(dir, 'profiles.json');
    if (await exists(filePath)) {
      return JSON.parse(await readTextFile(filePath));
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveProfilesToFS(profiles: Profile[]): Promise<void> {
  try {
    const dir = await appDataDir();
    await ensureAppDir(dir);
    const filePath = await join(dir, 'profiles.json');
    await writeTextFile(filePath, JSON.stringify(profiles));
  } catch (e) {
    console.error('profiles kaydetme hatası:', e);
  }
}

export async function loadProfileProgressFromFS(profileId: string): Promise<UserProgress> {
  try {
    const dir = await appDataDir();
    const profileDir = await join(dir, 'profiles', profileId);
    const filePath = await join(profileDir, 'progress.json');
    if (await exists(filePath)) {
      return { ...defaultProgress, ...JSON.parse(await readTextFile(filePath)) };
    }
    return { ...defaultProgress };
  } catch {
    return { ...defaultProgress };
  }
}

export async function saveProfileProgressToFS(profileId: string, progress: UserProgress): Promise<void> {
  try {
    const dir = await appDataDir();
    const profileDir = await join(dir, 'profiles', profileId);
    await ensureAppDir(profileDir);
    const filePath = await join(profileDir, 'progress.json');
    await writeTextFile(filePath, JSON.stringify(progress));
  } catch (e) {
    console.error('profil progress kaydetme hatası:', e);
  }
}

export async function loadParentSettingsFromFS(): Promise<ParentSettings> {
  try {
    const dir = await appDataDir();
    const filePath = await join(dir, 'parent.json');
    if (await exists(filePath)) {
      return { ...defaultParentSettings, ...JSON.parse(await readTextFile(filePath)) };
    }
    return { ...defaultParentSettings };
  } catch {
    return { ...defaultParentSettings };
  }
}

export async function saveParentSettingsToFS(settings: ParentSettings): Promise<void> {
  try {
    const dir = await appDataDir();
    await ensureAppDir(dir);
    const filePath = await join(dir, 'parent.json');
    await writeTextFile(filePath, JSON.stringify(settings));
  } catch (e) {
    console.error('parent settings kaydetme hatası:', e);
  }
}

// ── Supabase Cloud Sync ───────────────────────────────────────────────────────

export async function syncProgressToSupabase(
  userId: string,
  profileId: string,
  progress: UserProgress,
): Promise<void> {
  try {
    await supabase.from('progress').upsert(
      { owner_id: userId, profile_id: profileId, data: progress, updated_at: new Date().toISOString() },
      { onConflict: 'owner_id,profile_id' },
    );
  } catch (e) {
    console.error('Supabase sync hatası:', e);
  }
}

export async function fetchProgressFromSupabase(
  userId: string,
  profileId: string,
): Promise<UserProgress | null> {
  try {
    const { data, error } = await supabase
      .from('progress')
      .select('data')
      .eq('owner_id', userId)
      .eq('profile_id', profileId)
      .single();
    if (error || !data) return null;
    return { ...defaultProgress, ...(data.data as Partial<UserProgress>) };
  } catch {
    return null;
  }
}
