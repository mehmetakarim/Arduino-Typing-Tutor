import { HTMLAttributes, ReactNode } from 'react';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  /** Chip rengi (hex). Kazanılmamış/pasif için `dashed` kullan. */
  color?: string;
  /** Kesikli bordürlü pasif görünüm (ör. kazanılmamış rozet) */
  dashed?: boolean;
  size?: 'sm' | 'md';
  children: ReactNode;
}

export function Chip({ color = 'var(--accent-cyan)', dashed = false, size = 'md', className = '', style, children, ...rest }: ChipProps) {
  const pad = size === 'sm' ? 'px-3 py-1 text-xs' : 'px-3.5 py-2 text-[13.5px]';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-extrabold whitespace-nowrap ${pad} ${className}`}
      style={
        dashed
          ? { background: 'var(--bg-surface)', border: '1px dashed var(--bg-border)', color: 'var(--text-muted)', ...style }
          : { background: `color-mix(in srgb, ${color} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`, color, ...style }
      }
      {...rest}
    >
      {children}
    </span>
  );
}
