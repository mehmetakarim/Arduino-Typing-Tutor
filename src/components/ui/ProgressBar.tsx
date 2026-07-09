interface ProgressBarProps {
  /** 0-100 */
  value: number;
  /** Piksel yüksekliği */
  height?: number;
  /** Dolgu rengi: tek renk verilirse düz, verilmezse cyan gradient */
  color?: string;
  /** Cyan glow efekti */
  glow?: boolean;
  className?: string;
}

export function ProgressBar({ value, height = 10, color, glow = true, className = '' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`w-full rounded-full bg-elevated overflow-hidden ${className}`}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${pct}%`,
          background: color ?? 'linear-gradient(90deg, var(--accent-cyan-deep), var(--accent-cyan))',
          boxShadow: glow ? '0 0 10px rgba(34,211,238,.6)' : undefined,
        }}
      />
    </div>
  );
}
