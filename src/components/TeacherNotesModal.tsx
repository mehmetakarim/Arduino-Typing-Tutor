import { useNotesStore } from '../store/notesStore';
import { TeacherNote } from '../types';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

interface Props {
  onClose: () => void;
}

export function TeacherNotesModal({ onClose }: Props) {
  const { unreadNotes, markRead, markAllRead } = useNotesStore();

  async function handleMarkRead(note: TeacherNote) {
    await markRead(note.id);
    if (unreadNotes.length <= 1) onClose();
  }

  async function handleMarkAll() {
    await markAllRead();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh]"
        style={{ backgroundColor: '#1A1A1B' }}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-lg">📬 Öğretmen Notları</h2>
            <p className="text-gray-400 text-xs mt-0.5">{unreadNotes.length} okunmamış not</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadNotes.length > 1 && (
              <button
                onClick={handleMarkAll}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Tümünü Okundu İşaretle
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-300 text-xl leading-none transition-colors w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
          </div>
        </div>

        {/* Not listesi */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {unreadNotes.map(note => (
            <div
              key={note.id}
              className="rounded-xl border border-white/10 p-4 bg-white/[0.03]"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-white text-sm leading-relaxed flex-1">{note.content}</p>
                <button
                  onClick={() => handleMarkRead(note)}
                  className="text-xs text-gray-500 hover:text-indigo-400 transition-colors shrink-0 mt-0.5"
                  title="Okundu olarak işaretle"
                >
                  ✓
                </button>
              </div>
              <p className="text-gray-600 text-xs mt-2">{timeAgo(note.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
