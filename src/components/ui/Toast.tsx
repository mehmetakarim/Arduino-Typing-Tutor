import { ReactNode } from 'react';

interface ToastProps {
  /** Sol taraftaki ikon (kutu içinde gösterilir) */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Alt satırda gösterilecek aksiyon butonları */
  actions?: ReactNode;
  className?: string;
}

/** Köşe bildirimi görseli — konumlandırma çağırana aittir. */
export function Toast({ icon, title, description, actions, className = '' }: ToastProps) {
  return (
    <div
      className={`w-[340px] bg-surface border border-border rounded-panel p-4 flex gap-3 items-start animate-toast-in ${className}`}
      style={{ boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}
    >
      {icon && (
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--accent-cyan) 12%, transparent)' }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-extrabold text-primary">{title}</div>
        {description && <div className="text-xs font-semibold text-secondary mt-0.5">{description}</div>}
        {actions && <div className="flex gap-2 mt-2.5">{actions}</div>}
      </div>
    </div>
  );
}
