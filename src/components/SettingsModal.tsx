import { useSettingsStore } from '../store/settingsStore';
import { useProgressStore } from '../store/progressStore';

interface SettingsModalProps {
  onClose: () => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 dark:border-gray-700 last:border-0">
      <span className="text-sm font-medium text-gray-200 dark:text-gray-200">{label}</span>
      <button
        onClick={onChange}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy',   label: '😊 Kolay',  desc: 'Min doğruluk -10%' },
  { value: 'normal', label: '😐 Normal', desc: 'Plan gereksinimlerine göre' },
  { value: 'hard',   label: '💪 Zor',    desc: 'Min doğruluk +5%' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">⚙️ Ayarlar</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          {/* Toggles */}
          <Toggle
            checked={soundEnabled}
            onChange={toggleSound}
            label={`🔊 Ses Efektleri — ${soundEnabled ? 'Açık' : 'Kapalı'}`}
          />
          <Toggle
            checked={theme === 'light'}
            onChange={toggleTheme}
            label={`${theme === 'light' ? '☀️' : '🌙'} Tema — ${theme === 'light' ? 'Aydınlık' : 'Karanlık'}`}
          />

          {/* Difficulty */}
          <div className="py-3 border-b border-gray-700">
            <p className="text-sm font-medium text-gray-200 mb-2">🎮 Zorluk Seviyesi</p>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  title={opt.desc}
                  className={`flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
                    difficulty === opt.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1.5">
              {DIFFICULTY_OPTIONS.find(o => o.value === difficulty)?.desc}
            </p>
          </div>

          {/* App info */}
          <div className="py-3 border-b border-gray-700">
            <p className="text-xs text-gray-500">Arduino Typing Tutor v0.1.0</p>
            <p className="text-xs text-gray-600">Tauri v2 + React + TypeScript</p>
          </div>

          {/* Reset */}
          <div className="pt-3">
            <button
              onClick={handleReset}
              className="w-full bg-red-900/40 hover:bg-red-800/50 border border-red-700 text-red-300 text-sm py-2.5 rounded-xl transition-colors font-medium"
            >
              🗑️ Tüm İlerlemeyi Sıfırla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
