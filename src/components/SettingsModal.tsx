import { Moon, Settings, Sun, Trash2, Volume2, Zap } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useProgressStore } from '../store/progressStore';
import { Button, Modal, SegmentedControl, Toggle } from './ui';

interface SettingsModalProps {
  onClose: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: 'Kolay',  desc: 'Min doğruluk -10%', activeBg: '#166534', activeFg: '#DCFCE7' },
  { value: 'normal', label: 'Normal', desc: 'Plan gereksinimlerine göre', activeBg: '#0E7490', activeFg: '#CFFAFE' },
  { value: 'hard',   label: 'Zor',    desc: 'Min doğruluk +5%', activeBg: '#9A3412', activeFg: '#FFEDD5' },
] as const;

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { soundEnabled, theme, difficulty, toggleSound, toggleTheme, setDifficulty } = useSettingsStore();
  const { reset } = useProgressStore();

  function handleReset() {
    if (window.confirm('Tüm ilerleme silinecek. Emin misin?')) {
      reset();
      onClose();
    }
  }

  return (
    <Modal open onClose={onClose} title="Ayarlar" width={400}
      icon={<Settings size={19} strokeWidth={2.1} style={{ color: 'var(--accent-cyan-soft)' }} />}>

      {/* Ses */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <span className="flex items-center gap-2.5 text-[14.5px] font-bold text-primary">
          <Volume2 size={17} strokeWidth={2.1} className="text-secondary" />
          Ses Efektleri
        </span>
        <Toggle checked={soundEnabled} onChange={toggleSound} aria-label="Ses efektleri" />
      </div>

      {/* Tema */}
      <div className="flex items-center justify-between py-3 border-b border-border">
        <span className="flex items-center gap-2.5 text-[14.5px] font-bold text-primary">
          {theme === 'light'
            ? <Sun size={17} strokeWidth={2.1} className="text-secondary" />
            : <Moon size={17} strokeWidth={2.1} className="text-secondary" />}
          Tema
        </span>
        <SegmentedControl
          options={[
            { key: 'dark', label: 'Koyu', icon: <Moon size={13} strokeWidth={2.2} /> },
            { key: 'light', label: 'Aydınlık', icon: <Sun size={13} strokeWidth={2.2} /> },
          ]}
          value={theme === 'light' ? 'light' : 'dark'}
          onChange={key => { if ((key === 'light') !== (theme === 'light')) toggleTheme(); }}
        />
      </div>

      {/* Zorluk */}
      <div className="py-3.5 border-b border-border">
        <span className="flex items-center gap-2.5 text-[14.5px] font-bold text-primary mb-2.5">
          <Zap size={17} strokeWidth={2.1} className="text-secondary" />
          Zorluk
        </span>
        <SegmentedControl
          stretch
          options={DIFFICULTY_OPTIONS.map(o => ({ key: o.value, label: o.label, activeBg: o.activeBg, activeFg: o.activeFg }))}
          value={difficulty}
          onChange={key => setDifficulty(key as typeof difficulty)}
        />
        <p className="m-0 text-[11.5px] font-bold text-subtle mt-2 text-center">
          {DIFFICULTY_OPTIONS.find(o => o.value === difficulty)?.desc}
        </p>
      </div>

      {/* Uygulama bilgisi */}
      <div className="py-3 border-b border-border">
        <p className="m-0 text-xs font-semibold text-subtle">Arduino Typing Tutor</p>
        <p className="m-0 text-xs font-semibold text-subtle opacity-70">Tauri v2 + React + TypeScript</p>
      </div>

      {/* Sıfırla */}
      <div className="pt-4">
        <Button variant="destructive" size="sm" className="w-full" onClick={handleReset}>
          <Trash2 size={14} strokeWidth={2.2} />
          Tüm İlerlemeyi Sıfırla
        </Button>
      </div>
    </Modal>
  );
}
