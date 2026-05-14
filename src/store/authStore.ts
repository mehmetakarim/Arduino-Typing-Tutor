import { create } from 'zustand';
import { supabase, SupabaseUser, UserRole } from '../lib/supabase';

interface AuthState {
  user: SupabaseUser | null;
  loading: boolean;
  error: string | null;

  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

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
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) { set({ error: error.message, loading: false }); return false; }
      if (!data.user) { set({ error: 'Kayıt başarısız.', loading: false }); return false; }

      await supabase.from('user_roles').insert({
        id: data.user.id,
        role,
        full_name: fullName,
      });

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
}));
