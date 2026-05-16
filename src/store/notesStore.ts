import { create } from 'zustand';
import { TeacherNote } from '../types';
import { fetchUnreadNotes, markNoteRead } from '../utils/storage';

interface NotesState {
  unreadNotes: TeacherNote[];
  loading: boolean;
  loadNotes: (profileId: string) => Promise<void>;
  markRead: (noteId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  unreadNotes: [],
  loading: false,

  loadNotes: async (profileId: string) => {
    set({ loading: true });
    const notes = await fetchUnreadNotes(profileId);
    set({ unreadNotes: notes, loading: false });
  },

  markRead: async (noteId: string) => {
    await markNoteRead(noteId);
    set(s => ({ unreadNotes: s.unreadNotes.filter(n => n.id !== noteId) }));
  },

  markAllRead: async () => {
    const { unreadNotes } = get();
    await Promise.all(unreadNotes.map(n => markNoteRead(n.id)));
    set({ unreadNotes: [] });
  },

  clear: () => set({ unreadNotes: [], loading: false }),
}));
