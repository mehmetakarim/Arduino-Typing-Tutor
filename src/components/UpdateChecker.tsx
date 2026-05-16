import { useState, useEffect, useRef } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

type Update = Awaited<ReturnType<typeof check>>;

export function UpdateChecker() {
  const [update, setUpdate] = useState<Update>(null);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (!isTauri() || checked.current) return;
    checked.current = true;

    // App init zincirini bloklamayacak şekilde 3 sn bekle
    const t = setTimeout(async () => {
      try {
        const u = await check();
        if (u?.available) setUpdate(u);
      } catch {
        // Offline veya endpoint hatası — sessizce geç
      }
    }, 3000);

    return () => clearTimeout(t);
  }, []);

  async function handleInstall() {
    if (!update || installing) return;
    setInstalling(true);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch {
      setInstalling(false);
    }
  }

  if (!update || dismissed) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 shadow-xl"
      style={{ backgroundColor: '#1A1A1B' }}
    >
      <span className="text-lg">🆕</span>
      <div>
        <p className="text-white text-sm font-semibold">
          Güncelleme mevcut — v{update.version}
        </p>
        <p className="text-gray-400 text-xs">İndirilip yeniden başlatılacak.</p>
      </div>
      <button
        onClick={handleInstall}
        disabled={installing}
        className="rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-3 py-1.5 text-white text-xs font-semibold transition-colors"
      >
        {installing ? 'Yükleniyor…' : 'Yeniden Başlat'}
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors"
        aria-label="Kapat"
      >
        ×
      </button>
    </div>
  );
}
