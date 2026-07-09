import { CSSProperties } from 'react';
import { FINGER_COLORS, FingerName } from '../types';
import layout from '../data/keyboard-layout.json';

interface KeyboardProps {
  activeKey?: string;
  lastKey?: string;
  wasCorrect?: boolean;
  errorKeyMap?: Record<string, number>;
}

interface KeyDef {
  key: string;
  code: string;
  finger: FingerName;
  shiftKey?: string;
  altKey?: string;
}

const KEY_W = 50;
const KEY_H = 42;

interface KeyProps {
  keyDef: KeyDef;
  isActive: boolean;
  isPressed: boolean;
  wasCorrect: boolean;
  errorIntensity?: number; // 0-1 arası, kırmızı overlay yoğunluğu
}

function Key({ keyDef, isActive, isPressed, wasCorrect, errorIntensity = 0 }: KeyProps) {
  const finger = FINGER_COLORS[keyDef.finger];

  let transform = 'none';
  let shadow = 'none';
  let zIndex = 1;

  if (isActive) {
    transform = 'scale(1.16)';
    shadow = `0 0 0 3px #FFFFFF, 0 0 20px ${finger}`;
    zIndex = 3;
  }
  if (isPressed) {
    transform = 'scale(0.92)';
    shadow = wasCorrect ? '0 0 0 3px #4ADE80' : '0 0 0 3px var(--accent-red)';
    zIndex = 2;
  }

  const style: CSSProperties = {
    width: KEY_W,
    height: KEY_H,
    background: finger,
    color: '#0B1220',
    border: '1px solid rgba(11,18,32,.35)',
    borderBottomWidth: 3,
    borderRadius: 9,
    transform,
    boxShadow: shadow,
    zIndex,
    transition: 'transform 75ms, box-shadow 75ms',
  };

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={style}>
      {/* Hata ısı haritası overlay */}
      {errorIntensity > 0 && !isActive && !isPressed && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: 8, backgroundColor: `rgba(190,18,60,${errorIntensity * 0.5})` }}
        />
      )}
      <span className="font-mono font-extrabold uppercase" style={{ fontSize: 15 }}>{keyDef.key}</span>
      {keyDef.shiftKey && (
        <span className="absolute font-mono font-bold" style={{ top: 2, right: 5, fontSize: 8.5, color: 'rgba(11,18,32,.55)' }}>
          {keyDef.shiftKey}
        </span>
      )}
      {keyDef.altKey && (
        <span className="absolute font-mono font-bold" style={{ bottom: 2, right: 5, fontSize: 8.5, color: 'rgba(11,18,32,.55)' }}>
          {keyDef.altKey}
        </span>
      )}
      {isActive && (
        <span
          className="absolute left-1/2 rounded-full pointer-events-none"
          style={{
            bottom: -15, width: 8, height: 8, marginLeft: -4,
            background: '#FFFFFF', boxShadow: '0 0 8px rgba(255,255,255,.9)',
            animation: 'dotBounce .6s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}

function SpecialKey({ label, width, active = false }: { label: string; width: number; active?: boolean }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 font-mono font-bold"
      style={{
        width, height: KEY_H, borderRadius: 9, fontSize: 10.5,
        background: active ? 'rgba(250,204,21,.22)' : 'var(--bg-elevated)',
        border: `1px solid ${active ? '#FACC15' : 'var(--bg-border)'}`,
        borderBottomWidth: 3,
        color: active ? '#FACC15' : 'var(--text-muted)',
        animation: active ? 'shiftPulse 1.4s ease-in-out infinite' : undefined,
        transition: 'background 100ms, color 100ms',
      }}
    >
      {active ? '⇧ ' : ''}{label}
    </div>
  );
}

function SpaceKey({ isActive, isPressed }: { isActive: boolean; isPressed: boolean }) {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 font-mono font-bold"
      style={{
        width: 380, height: KEY_H, borderRadius: 9, fontSize: 10.5,
        background: FINGER_COLORS.leftThumb,
        color: '#0B1220',
        border: '1px solid rgba(11,18,32,.35)',
        borderBottomWidth: 3,
        transform: isPressed ? 'scale(0.97)' : isActive ? 'scale(1.03)' : 'none',
        boxShadow: isActive ? '0 0 0 3px #FFFFFF, 0 0 16px rgba(148,163,184,.8)' : 'none',
        transition: 'transform 75ms, box-shadow 75ms',
        zIndex: isActive ? 3 : 1,
      }}
    >
      BOŞLUK
    </div>
  );
}

const FINGER_LABELS: Record<FingerName, string> = {
  leftPinky: 'Sol Serçe', leftRing: 'Sol Yüzük', leftMiddle: 'Sol Orta',
  leftIndex: 'Sol İşaret', leftThumb: 'Başparmak', rightThumb: 'Başparmak',
  rightIndex: 'Sağ İşaret', rightMiddle: 'Sağ Orta', rightRing: 'Sağ Yüzük',
  rightPinky: 'Sağ Serçe',
};

export function Keyboard({ activeKey, lastKey, wasCorrect = true, errorKeyMap = {} }: KeyboardProps) {
  const allKeys = layout.rows.flatMap(r => r.keys) as KeyDef[];

  const maxErrors = Math.max(1, ...Object.values(errorKeyMap));

  function getErrorIntensity(k: KeyDef): number {
    const count = (errorKeyMap[k.key] ?? 0) +
                  (errorKeyMap[k.key.toLowerCase()] ?? 0) +
                  (k.shiftKey ? (errorKeyMap[k.shiftKey] ?? 0) : 0) +
                  (k.altKey   ? (errorKeyMap[k.altKey]   ?? 0) : 0);
    if (count === 0) return 0;
    return Math.min(count / maxErrors, 1);
  }

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

  const renderKeys = (keys: KeyDef[]) =>
    keys.map(k => (
      <Key
        key={k.code}
        keyDef={k}
        isActive={keyIsActive(k)}
        isPressed={keyIsPressed(k)}
        wasCorrect={wasCorrect}
        errorIntensity={getErrorIntensity(k)}
      />
    ));

  return (
    <div
      className="flex flex-col gap-1.5 items-center bg-muted border border-border"
      style={{ borderRadius: 20, padding: '14px 16px 10px', boxShadow: '0 12px 32px rgba(0,0,0,.35)' }}
    >
      {/* AltGr ipucu — gerektiğinde göster */}
      {isAltNeeded && (
        <div
          className="text-xs font-bold rounded-md px-2 py-0.5 mb-1 animate-pulse"
          style={{ color: 'var(--accent-cyan-soft)', background: 'color-mix(in srgb, var(--accent-cyan) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-cyan) 45%, transparent)' }}
        >
          AltGr (Option) tuşunu basılı tut + sağ alttaki karakter
        </div>
      )}

      {/* Sayı sırası */}
      <div className="flex gap-1.5">
        {renderKeys(rows[0].keys)}
        <SpecialKey label="⌫" width={70} />
      </div>

      {/* Üst sıra */}
      <div className="flex gap-1.5">
        <SpecialKey label="TAB" width={70} />
        {renderKeys(rows[1].keys)}
      </div>

      {/* Ev sırası */}
      <div className="flex gap-1.5">
        <SpecialKey label="CAPS" width={82} />
        {renderKeys(rows[2].keys)}
        <SpecialKey label="ENTER" width={88} />
      </div>

      {/* Alt sıra */}
      <div className="flex gap-1.5">
        <SpecialKey label="SHIFT" width={104} active={useLeftShift} />
        {renderKeys(rows[3].keys)}
        <SpecialKey label="SHIFT" width={104} active={useRightShift} />
      </div>

      {/* Boşluk sırası */}
      <div className="flex gap-1.5">
        <SpecialKey label="CTRL" width={64} />
        <SpecialKey label="ALT" width={64} />
        <SpaceKey isActive={activeKey === ' '} isPressed={lastKey === ' '} />
        <SpecialKey label="ALTGR" width={64} />
        <SpecialKey label="CTRL" width={64} />
      </div>

      {/* Parmak lejantı */}
      <div className="flex gap-3.5 mt-1.5 flex-wrap justify-center">
        {(Object.entries(FINGER_COLORS) as [FingerName, string][])
          .filter(([finger]) => finger !== 'rightThumb')
          .map(([finger, color]) => (
            <div key={finger} className="flex items-center gap-1.5">
              <span className="rounded-[3px]" style={{ width: 9, height: 9, background: color }} />
              <span className="text-[11px] font-bold text-subtle">{FINGER_LABELS[finger]}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
