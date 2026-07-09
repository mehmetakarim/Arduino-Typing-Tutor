import { ReactNode } from 'react';

export interface TabItem<T extends string = string> {
  key: T;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (key: T) => void;
}

/** Hap görünümlü sekme çubuğu (TeacherPanel: Sınıflar / Sıralama) */
export function Tabs<T extends string>({ items, value, onChange }: TabsProps<T>) {
  return (
    <div className="inline-flex bg-surface border border-border rounded-[14px] p-1 gap-1">
      {items.map(item => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-2 text-sm font-extrabold px-[18px] py-2.5 rounded-[10px] cursor-pointer border-none transition-colors duration-150
              ${active ? 'bg-elevated text-primary' : 'bg-transparent text-subtle hover:text-secondary'}`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
