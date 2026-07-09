import { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Accent bordür/glow rengi (CSS renk değeri). Verilmezse nötr kart. */
  accent?: string;
  /** Yükseltilmiş görünüm (daha belirgin gölge) */
  elevated?: boolean;
  children: ReactNode;
}

export function Card({ accent, elevated = false, className = '', style, children, ...rest }: CardProps) {
  return (
    <div
      className={`bg-surface rounded-card ${elevated ? 'shadow-card' : ''} ${className}`}
      style={{
        border: `1px solid ${accent ?? 'var(--bg-border)'}`,
        ...(accent ? { boxShadow: `0 0 24px ${accent}22` } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
