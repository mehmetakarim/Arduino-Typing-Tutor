import { useEffect, useState } from 'react';

export function useKeyboard(onKey: (key: string) => void, active: boolean) {
  const [lastKey, setLastKey] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    const handler = (e: KeyboardEvent) => {
      // Ctrl ve Meta (Cmd) kısayollarını engelle, ama AltGr'yi geçir
      // (Türkçe Q klavyede { } , ; gibi karakterler AltGr ile yazılır)
      if (e.ctrlKey || e.metaKey) return;
      if (e.key === 'Backspace' || e.key === 'Tab' || e.key === 'Escape') return;
      if (e.key.length !== 1) return;

      e.preventDefault();
      setLastKey(e.key);
      onKey(e.key);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onKey, active]);

  return lastKey;
}
