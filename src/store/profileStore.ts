import { create } from 'zustand';
import { Profile, ParentSettings } from '../types';
import {
  getCachedProfiles,
  setCachedProfiles,
  getCachedParentSettings,
  saveProfilesToFS,
  saveProfileProgressToFS,
  saveParentSettingsToFS,
  loadProfileProgressFromFS,
  defaultProgress,
  setCachedProgress,
  fetchProgressFromSupabase,
  syncProfilesToSupabase,
  deleteProfileFromSupabase,
  fetchProfilesFromSupabase,
} from '../utils/storage';
import { setActiveProfileId, useProgressStore } from './progressStore';
import { useAuthStore } from './authStore';

// Profil renk seçenekleri
export const PROFILE_COLORS = [
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#EF4444', // red
  '#F97316', // orange
  '#EAB308', // yellow
  '#22C55E', // green
  '#06B6D4', // cyan
];

interface ProfileState {
  profiles: Profile[];
  activeProfile: Profile | null;
  parentSettings: ParentSettings;

  setActiveProfile: (profile: Profile) => Promise<void>;
  addProfile: (name: string, color: string, emoji?: string) => Promise<Profile>;
  deleteProfile: (id: string) => Promise<void>;
  updateParentSettings: (settings: ParentSettings) => void;
  verifyPin: (pin: string) => boolean;
  reloadProfilesFromCloud: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: getCachedProfiles(),
  activeProfile: null,
  parentSettings: getCachedParentSettings(),

  setActiveProfile: async (profile) => {
    // Önce FS'ten yükle (hızlı, offline çalışır)
    let progress = await loadProfileProgressFromFS(profile.id);

    // Giriş yapılmışsa Supabase'den dene — daha güncel olabilir
    const user = useAuthStore.getState().user;
    if (user) {
      const cloud = await fetchProgressFromSupabase(user.id, profile.id);
      if (cloud) progress = cloud;
    }

    setCachedProgress(progress);
    setActiveProfileId(profile.id);
    useProgressStore.setState({ progress, screen: 'menu', activeLessonId: null, lastResult: null });
    set({ activeProfile: profile });
  },

  addProfile: async (name, color, emoji) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const profile: Profile = {
      id,
      name: name.trim(),
      color,
      ...(emoji ? { emoji } : {}),
      createdAt: new Date().toISOString(),
    };
    await saveProfileProgressToFS(id, { ...defaultProgress });

    const updated = [...get().profiles, profile];
    setCachedProfiles(updated);
    saveProfilesToFS(updated); // fire-and-forget

    const user = useAuthStore.getState().user;
    if (user) syncProfilesToSupabase(user.id, updated); // fire-and-forget

    set({ profiles: updated });
    return profile;
  },

  deleteProfile: async (id) => {
    const updated = get().profiles.filter(p => p.id !== id);
    setCachedProfiles(updated);
    saveProfilesToFS(updated); // fire-and-forget

    const user = useAuthStore.getState().user;
    if (user) {
      deleteProfileFromSupabase(id); // fire-and-forget
    }

    set({ profiles: updated, activeProfile: get().activeProfile?.id === id ? null : get().activeProfile });
  },

  updateParentSettings: (settings) => {
    saveParentSettingsToFS(settings); // fire-and-forget
    set({ parentSettings: settings });
  },

  verifyPin: (pin) => {
    const { parentSettings } = get();
    if (!parentSettings.pinEnabled || !parentSettings.pin) return true;
    return parentSettings.pin === pin;
  },

  reloadProfilesFromCloud: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const cloud = await fetchProfilesFromSupabase(user.id);
    if (cloud.length === 0) return;
    setCachedProfiles(cloud);
    saveProfilesToFS(cloud); // yerel cache'i de güncelle
    set({ profiles: cloud });
  },
}));
