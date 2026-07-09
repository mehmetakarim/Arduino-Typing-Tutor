import { createPortal } from 'react-dom';
import { Check, Mail, X } from 'lucide-react';
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-in"
      style={{ background: 'rgba(5,9,18,.78)', backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-lg bg-surface border border-border rounded-3xl flex flex-col max-h-[80vh] animate-pop-in" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Başlık */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <Mail size={19} strokeWidth={2.1} style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h2 className="m-0 text-primary font-black text-lg">Öğretmen Notları</h2>
              <p className="m-0 text-secondary text-xs font-semibold mt-0.5">{unreadNotes.length} okunmamış not</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadNotes.length > 1 && (
              <button
                onClick={handleMarkAll}
                className="bg-transparent border-none cursor-pointer text-xs font-extrabold px-3 py-1.5 rounded-lg hover:bg-elevated transition-colors"
                style={{ color: 'var(--accent-cyan-soft)' }}
              >
                Tümünü Okundu İşaretle
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="w-8 h-8 rounded-[9px] bg-elevated border border-border text-secondary hover:text-primary cursor-pointer flex items-center justify-center transition-colors"
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          </div>
        </div>

        {/* Not listesi */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2.5">
          {unreadNotes.map(note => (
            <div
              key={note.id}
              className="rounded-control p-3.5"
              style={{
                background: 'color-mix(in srgb, var(--accent-cyan) 6%, transparent)',
                border: '1px solid color-mix(in srgb, var(--accent-cyan) 25%, transparent)',
                borderLeft: '3px solid var(--accent-cyan)',
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: 'var(--accent-cyan)' }} />
                    <span className="text-xs font-bold text-subtle">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="m-0 mt-1.5 text-primary text-[13.5px] font-semibold leading-normal">{note.content}</p>
                </div>
                <button
                  onClick={() => handleMarkRead(note)}
                  title="Okundu olarak işaretle"
                  className="bg-transparent border border-border rounded-lg cursor-pointer p-1.5 text-subtle hover:text-accent-lime hover:border-accent-lime shrink-0 transition-colors flex items-center"
                >
                  <Check size={14} strokeWidth={2.6} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
