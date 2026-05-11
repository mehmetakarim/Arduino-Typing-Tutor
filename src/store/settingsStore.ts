import { create } from 'zustand';

interface Settings {
  soundEnabled: boolean;
  theme: 'dark' | 'light';
  difficulty: 'easy' | 'normal' | 'hard';
}

interface SettingsState extends Settings {
  toggleSound: () => void;
  toggleTheme: () => void;
  setDifficulty: (d: Settings['difficulty']) => void;
}

const STORAGE_KEY = 'arduino-typing-tutor-settings';

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { soundEnabled: true, theme: 'dark', difficulty: 'normal' };
    return { soundEnabled: true, theme: 'dark', difficulty: 'normal', ...JSON.parse(raw) };
  } catch {
    return { soundEnabled: true, theme: 'dark', difficulty: 'normal' };
  }
}

function save(s: Settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export const useSettingsStore = create<SettingsState>((set, get) => {
  const initial = loadSettings();

  // Apply theme on load (.light sınıfı yok = koyu tema, var = aydınlık tema)
  if (initial.theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }

  return {
    ...initial,

    toggleSound: () => {
      const next = !get().soundEnabled;
      const s = { ...get(), soundEnabled: next };
      save(s);
      set({ soundEnabled: next });
    },

    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      if (next === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
      const s = { ...get(), theme: next } as Settings;
      save(s);
      set({ theme: next });
    },

    setDifficulty: (difficulty) => {
      const s = { ...get(), difficulty } as Settings;
      save(s);
      set({ difficulty });
    },
  };
});

// Zorluk seviyesine göre minAccuracy override'ı
export function getAccuracyThreshold(base: number, difficulty: Settings['difficulty']): number {
  if (difficulty === 'easy')   return Math.max(base - 10, 60);
  if (difficulty === 'hard')   return Math.min(base + 5, 100);
  return base;
}
