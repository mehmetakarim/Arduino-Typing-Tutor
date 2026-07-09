import { ReactNode } from 'react';

interface KbdProps {
  children: ReactNode;
  /** Koyu zeminli buton içinde kullanım için ters renk şeması */
  inverted?: boolean;
}

/** Klavye kısayolu tuş kapağı (ör. sonuç ekranındaki R / ⏎ / M / G) */
export function Kbd({ children, inverted = false }: KbdProps) {
  return (
    <span
      className="font-mono text-[11px] font-bold rounded-md px-[7px] py-0.5"
      style={
        inverted
          ? { color: 'var(--accent-cyan-deep)', background: 'rgba(255,255,255,.35)' }
          : {
              color: 'var(--text-muted)',
              background: 'var(--bg-muted)',
              border: '1px solid var(--bg-border)',
              borderBottomWidth: 2,
            }
      }
    >
      {children}
    </span>
  );
}
