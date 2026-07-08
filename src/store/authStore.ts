import { create } from 'zustand';
import { supabase, SupabaseUser, UserRole } from '../lib/supabase';

interface AuthState {
  user: SupabaseUser | null;
  loading: boolean;
  error: string | null;
  pendingReset: boolean;

  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  handleResetDeepLink: (url: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  clearPendingReset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  pendingReset: false,

  loadSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { set({ user: null }); return; }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role, full_name')
      .eq('id', session.user.id)
      .single();

    if (roleData) {
      set({
        user: {
          id: session.user.id,
          email: session.user.email ?? '',
          role: roleData.role as UserRole,
          fullName: roleData.full_name ?? '',
        },
      });
    }
  },

  signUp: async (email, password, fullName, role) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: fullName } },
      });
      if (error) { set({ error: error.message, loading: false }); return false; }
      if (!data.user) { set({ error: 'Kayıt başarısız.', loading: false }); return false; }

      // Trigger yoksa fallback olarak manuel insert dene
      await supabase.from('user_roles').upsert(
        { id: data.user.id, role, full_name: fullName },
        { onConflict: 'id' },
      );

      set({
        user: { id: data.user.id, email, role, fullName },
        loading: false,
      });
      return true;
    } catch {
      set({ error: 'Bağlantı hatası.', loading: false });
      return false;
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { set({ error: 'E-posta veya şifre hatalı.', loading: false }); return false; }
      if (!data.user) { set({ error: 'Giriş başarısız.', loading: false }); return false; }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, full_name')
        .eq('id', data.user.id)
        .single();

      set({
        user: {
          id: data.user.id,
          email,
          role: (roleData?.role as UserRole) ?? 'parent',
          fullName: roleData?.full_name ?? '',
        },
        loading: false,
      });
      return true;
    } catch {
      set({ error: 'Bağlantı hatası.', loading: false });
      return false;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  clearError: () => set({ error: null }),
  clearPendingReset: () => set({ pendingReset: false, error: null }),

  handleResetDeepLink: async (url: string) => {
    try {
      const hash = url.includes('#') ? url.split('#')[1] : url.split('?')[1] ?? '';
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      if (type !== 'recovery' || !accessToken || !refreshToken) return;
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      set({ pendingReset: true, error: null });
    } catch {
      // URL parse hatası — yok say
    }
  },

  updatePassword: async (newPassword: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      set({ loading: false });
      if (error) { set({ error: 'Şifre güncellenemedi.' }); return false; }
      set({ pendingReset: false });
      return true;
    } catch {
      set({ error: 'Bağlantı hatası.', loading: false });
      return false;
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'arduinotypingtutor://reset-password',
      });
      set({ loading: false });
      if (error) { set({ error: 'E-posta gönderilemedi. Adresi kontrol et.' }); return false; }
      return true;
    } catch {
      set({ error: 'Bağlantı hatası.', loading: false });
      return false;
    }
  },
}));
