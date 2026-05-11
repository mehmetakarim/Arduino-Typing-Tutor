import { FINGER_COLORS, FingerName } from '../types';
import layout from '../data/keyboard-layout.json';

interface KeyboardProps {
  activeKey?: string;
  lastKey?: string;
  wasCorrect?: boolean;
}

const FINGER_BG: Record<FingerName, string> = {
  leftPinky:   'bg-purple-500',
  leftRing:    'bg-blue-500',
  leftMiddle:  'bg-emerald-500',
  leftIndex:   'bg-red-500',
  leftThumb:   'bg-gray-500',
  rightThumb:  'bg-gray-500',
  rightIndex:  'bg-pink-500',
  rightMiddle: 'bg-cyan-500',
  rightRing:   'bg-yellow-500',
  rightPinky:  'bg-orange-500',
};

interface KeyDef {
  key: string;
  code: string;
  finger: FingerName;
  shiftKey?: string;
  altKey?: string;
}

interface KeyProps {
  keyDef: KeyDef;
  isActive: boolean;
  isShiftActive: boolean; // bu tuş shift + bir şey gerektiriyor
  isAltActive: boolean;   // bu tuş AltGr + bir şey gerektiriyor
  isPressed: boolean;
  wasCorrect: boolean;
}

function Key({ keyDef, isActive, isShiftActive: _isShiftActive, isAltActive: _isAltActive, isPressed, wasCorrect }: KeyProps) {
  const bgClass = FINGER_BG[keyDef.finger];

  let border = 'border-gray-300 dark:border-gray-600';
  let scale = '';
  let shadow = '';

  if (isActive) {
    border = 'border-white';
    shadow = 'ring-2 ring-white ring-offset-1';
    scale = 'scale-110';
  }

  if (isPressed) {
    scale = 'scale-90';
    border = wasCorrect ? 'border-green-300' : 'border-red-400';
    shadow = wasCorrect ? 'ring-2 ring-green-400' : 'ring-2 ring-red-500';
  }

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        rounded-md border-2 ${border}
        ${bgClass} text-white
        w-9 h-10 text-xs font-semibold
        transition-all duration-75
        ${scale} ${shadow}
        ${isActive ? 'animate-glow' : ''}
        opacity-90 hover:opacity-100
      `}
    >
      {/* üst sağ: shift karakteri */}
      {keyDef.shiftKey && (
        <span className="absolute top-0.5 right-1 text-[9px] opacity-60">
          {keyDef.shiftKey}
        </span>
      )}
      {/* üst sol: AltGr karakteri */}
      {keyDef.altKey && (
        <span className="absolute top-0.5 left-1 text-[8px] opacity-50 text-cyan-200">
          {keyDef.altKey}
        </span>
      )}
      <span className="text-sm font-bold uppercase">{keyDef.key}</span>
      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
      )}
    </div>
  );
}

function ShiftKey({ isActive, label = 'SHIFT' }: { isActive: boolean; label?: string }) {
  return (
    <div
      className={`
        h-10 rounded-md flex items-center justify-center text-xs font-semibold border-2
        transition-all duration-75
        ${isActive
          ? 'bg-yellow-400 border-yellow-200 text-gray-900 ring-2 ring-yellow-300 scale-110 animate-glow'
          : 'bg-gray-700 text-gray-400 border-gray-600'
        }
      `}
      style={{ width: label === 'SHIFT' ? '4rem' : '5rem' }}
    >
      {isActive ? '⇧ ' : ''}{label}
    </div>
  );
}

function SpaceKey({ isActive, isPressed }: { isActive: boolean; isPressed: boolean }) {
  return (
    <div
      className={`
        w-64 h-10 rounded-md border-2 flex items-center justify-center
        text-xs font-semibold
        transition-all duration-75
        ${isActive
          ? 'bg-gray-500 border-white ring-2 ring-white animate-glow'
          : 'bg-gray-700 border-gray-600 text-gray-400'
        }
        ${isPressed ? 'scale-95' : ''}
      `}
    >
      BOŞLUK
    </div>
  );
}

export function Keyboard({ activeKey, lastKey, wasCorrect = true }: KeyboardProps) {
  const allKeys = layout.rows.flatMap(r => r.keys) as KeyDef[];

  // Shift gerekli mi? (activeKey bir shiftKey değeri ise)
  const isShiftNeeded = activeKey !== undefined &&
    allKeys.some(k => k.shiftKey === activeKey);

  // AltGr gerekli mi? (activeKey bir altKey değeri ise)
  const isAltNeeded = activeKey !== undefined &&
    allKeys.some(k => k.altKey === activeKey);

  // Hangi Shift tuşu vurgulansın? (tuşun bulunduğu elin tersi)
  const shiftSourceKey = allKeys.find(k => k.shiftKey === activeKey);
  const useLeftShift  = isShiftNeeded && shiftSourceKey?.finger.startsWith('right') === true;
  const useRightShift = isShiftNeeded && shiftSourceKey?.finger.startsWith('left') === true;

  const rows = layout.rows as { keys: KeyDef[] }[];

  function keyIsActive(k: KeyDef): boolean {
    if (activeKey === undefined) return false;
    return (
      k.key === activeKey ||
      k.key.toLowerCase() === activeKey.toLowerCase() ||
      k.shiftKey === activeKey ||
      k.altKey === activeKey
    );
  }

  function keyIsPressed(k: KeyDef): boolean {
    if (!lastKey) return false;
    return (
      k.key === lastKey ||
      k.key.toLowerCase() === lastKey.toLowerCase() ||
      k.shiftKey === lastKey ||
      k.altKey === lastKey
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-center p-4 bg-gray-800 dark:bg-gray-900 rounded-2xl shadow-xl">
      {/* AltGr ipucu — gerektiğinde göster */}
      {isAltNeeded && (
        <div className="text-xs text-cyan-300 font-semibold bg-cyan-900/40 border border-cyan-600 rounded px-2 py-0.5 mb-1 animate-pulse">
          🔵 AltGr (Option) tuşunu basılı tut + sol üstteki tuş
        </div>
      )}

      {/* Number row */}
      <div className="flex gap-1">
        {rows[0].keys.map((k) => (
          <Key key={k.code} keyDef={k}
            isActive={keyIsActive(k)}
            isShiftActive={isShiftNeeded}
            isAltActive={isAltNeeded}
            isPressed={keyIsPressed(k)}
            wasCorrect={wasCorrect}
          />
        ))}
      </div>

      {/* QWERTY row */}
      <div className="flex gap-1 ml-4">
        <div className="w-12 h-10 rounded-md bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-semibold border-2 border-gray-600">
          TAB
        </div>
        {rows[1].keys.map((k) => (
          <Key key={k.code} keyDef={k}
            isActive={keyIsActive(k)}
            isShiftActive={isShiftNeeded}
            isAltActive={isAltNeeded}
            isPressed={keyIsPressed(k)}
            wasCorrect={wasCorrect}
          />
        ))}
      </div>

      {/* Home row */}
      <div className="flex gap-1 ml-6">
        <div className="w-14 h-10 rounded-md bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-semibold border-2 border-gray-600">
          CAPS
        </div>
        {rows[2].keys.map((k) => (
          <Key key={k.code} keyDef={k}
            isActive={keyIsActive(k)}
            isShiftActive={isShiftNeeded}
            isAltActive={isAltNeeded}
            isPressed={keyIsPressed(k)}
            wasCorrect={wasCorrect}
          />
        ))}
        <div className="w-16 h-10 rounded-md bg-gray-700 flex items-center justify-center text-xs text-gray-400 font-semibold border-2 border-gray-600">
          ENTER
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex gap-1 ml-8">
        <ShiftKey isActive={useLeftShift} label="SHIFT" />
        {rows[3].keys.map((k) => (
          <Key key={k.code} keyDef={k}
            isActive={keyIsActive(k)}
            isShiftActive={isShiftNeeded}
            isAltActive={isAltNeeded}
            isPressed={keyIsPressed(k)}
            wasCorrect={wasCorrect}
          />
        ))}
        <ShiftKey isActive={useRightShift} label="SHIFT" />
      </div>

      {/* Space bar */}
      <div className="flex gap-1 justify-center">
        <div className="w-8 h-10 rounded-md bg-gray-700 border-2 border-gray-600" />
        <div className="w-8 h-10 rounded-md bg-gray-700 border-2 border-gray-600" />
        <SpaceKey isActive={activeKey === ' '} isPressed={lastKey === ' '} />
        <div className="w-8 h-10 rounded-md bg-gray-700 border-2 border-gray-600" />
        <div className="w-8 h-10 rounded-md bg-gray-700 border-2 border-gray-600" />
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-2 flex-wrap justify-center">
        {(Object.entries(FINGER_COLORS) as [FingerName, string][]).map(([finger, color]) => {
          const labels: Record<FingerName, string> = {
            leftPinky: 'Sol Serçe', leftRing: 'Sol Yüzük', leftMiddle: 'Sol Orta',
            leftIndex: 'Sol İşaret', leftThumb: 'Sol Baş', rightThumb: 'Sağ Baş',
            rightIndex: 'Sağ İşaret', rightMiddle: 'Sağ Orta', rightRing: 'Sağ Yüzük',
            rightPinky: 'Sağ Serçe',
          };
          return (
            <div key={finger} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400">{labels[finger]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
