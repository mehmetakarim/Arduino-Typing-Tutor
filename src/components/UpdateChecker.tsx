import { useState, useEffect, useRef } from 'react';
import { Download, X } from 'lucide-react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Toast } from './ui';

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
        if (u) setUpdate(u);
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
    <div className="fixed bottom-5 right-5 z-50">
      <Toast
        icon={<Download size={18} strokeWidth={2.2} style={{ color: 'var(--accent-cyan-soft)' }} />}
        title={`Yeni sürüm hazır: v${update.version}`}
        description="İndirilip yeniden başlatılacak."
        actions={
          <>
            <button
              onClick={handleInstall}
              disabled={installing}
              className="border-none rounded-lg px-3.5 py-[7px] text-xs font-extrabold cursor-pointer transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent-cyan)', color: 'var(--on-cyan)' }}
            >
              {installing ? 'Yükleniyor…' : 'Yeniden Başlat'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="bg-transparent border-none cursor-pointer px-2 py-[7px] text-xs font-bold text-subtle hover:text-secondary transition-colors inline-flex items-center gap-1"
              aria-label="Kapat"
            >
              <X size={12} strokeWidth={2.6} />
              Sonra
            </button>
          </>
        }
      />
    </div>
  );
}
