import { ReactNode } from 'react';

export interface SegmentOption<T extends string = string> {
  key: T;
  label: ReactNode;
  icon?: ReactNode;
  /** Seçiliyken uygulanacak özel zemin (ör. zorluk: yeşil/cyan/turuncu) */
  activeBg?: string;
  /** Seçiliyken metin rengi */
  activeFg?: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (key: T) => void;
  /** true ise segmentler eşit genişlikte esner */
  stretch?: boolean;
}

/** Küçük seçim grubu (tema koyu/aydınlık, zorluk kolay/normal/zor) */
export function SegmentedControl<T extends string>({ options, value, onChange, stretch = false }: SegmentedControlProps<T>) {
  return (
    <div className={`${stretch ? 'flex' : 'inline-flex'} bg-base border border-border rounded-control p-1 gap-1`}>
      {options.map(opt => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`${stretch ? 'flex-1' : ''} flex items-center justify-center gap-1.5 text-[13px] font-extrabold px-3 py-2 rounded-[9px] cursor-pointer border-none transition-colors duration-150`}
            style={
              active
                ? { background: opt.activeBg ?? 'var(--bg-elevated)', color: opt.activeFg ?? 'var(--text-primary)' }
                : { background: 'transparent', color: 'var(--text-muted)' }
            }
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
