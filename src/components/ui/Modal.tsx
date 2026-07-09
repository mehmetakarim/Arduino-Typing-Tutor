import { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  /** Başlık yanında gösterilecek ikon */
  icon?: ReactNode;
  /** Piksel genişliği */
  width?: number;
  /** Accent bordür rengi (ör. silme onayında kırmızı) */
  accent?: string;
  children: ReactNode;
}

/**
 * Portal tabanlı merkez modal — WebKit stacking context sorunlarına karşı
 * document.body'ye render edilir (TeacherNotesModal deneyiminden).
 */
export function Modal({ open, onClose, title, icon, width = 460, accent, children }: ModalProps) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center animate-fade-in"
      style={{ background: 'rgba(5,9,18,.78)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-3xl p-7 animate-pop-in max-h-[85vh] overflow-y-auto"
        style={{ width, maxWidth: 'calc(100vw - 48px)', border: `1px solid ${accent ?? 'var(--bg-border)'}` }}
        onClick={e => e.stopPropagation()}
      >
        {(title || icon) && (
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              {icon}
              <h2 className="m-0 text-lg font-black text-primary">{title}</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="w-8 h-8 rounded-[9px] bg-elevated border border-border text-secondary hover:text-primary cursor-pointer flex items-center justify-center transition-colors"
            >
              <X size={14} strokeWidth={2.6} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
