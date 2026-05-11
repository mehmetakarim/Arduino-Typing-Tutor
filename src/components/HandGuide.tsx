import { FingerName, FINGER_COLORS } from '../types';

interface HandGuideProps {
  activeFinger?: FingerName;
  isShiftRequired?: boolean;
}

interface FingerSegment {
  finger: FingerName;
  x: number;
  y: number;
  width: number;
  height: number;
  rx: number;
  label: string;
}

const LEFT_FINGERS: FingerSegment[] = [
  { finger: 'leftPinky',  x: 10,  y: 20, width: 22, height: 90, rx: 10, label: 'S' },
  { finger: 'leftRing',   x: 38,  y: 10, width: 22, height: 100, rx: 10, label: 'Y' },
  { finger: 'leftMiddle', x: 66,  y: 5,  width: 22, height: 105, rx: 10, label: 'O' },
  { finger: 'leftIndex',  x: 94,  y: 12, width: 22, height: 98, rx: 10, label: 'İ' },
  { finger: 'leftThumb',  x: 118, y: 100, width: 28, height: 22, rx: 10, label: 'B' },
];

const RIGHT_FINGERS: FingerSegment[] = [
  { finger: 'rightThumb',  x: 14,  y: 100, width: 28, height: 22, rx: 10, label: 'B' },
  { finger: 'rightIndex',  x: 44,  y: 12, width: 22, height: 98, rx: 10, label: 'İ' },
  { finger: 'rightMiddle', x: 72,  y: 5,  width: 22, height: 105, rx: 10, label: 'O' },
  { finger: 'rightRing',   x: 100, y: 10, width: 22, height: 100, rx: 10, label: 'Y' },
  { finger: 'rightPinky',  x: 128, y: 20, width: 22, height: 90, rx: 10, label: 'S' },
];

function Hand({ fingers, activeFinger, shiftFinger }: {
  fingers: FingerSegment[];
  activeFinger?: FingerName;
  shiftFinger?: FingerName;
}) {
  return (
    <svg width="160" height="140" viewBox="0 0 160 140" className="drop-shadow-md">
      {/* Palm */}
      <rect x="10" y="108" width="140" height="25" rx="8" fill="#374151" />

      {fingers.map((seg) => {
        const isActive = activeFinger === seg.finger;
        const isShift = shiftFinger === seg.finger;
        const color = isShift && !isActive ? '#EAB308' : FINGER_COLORS[seg.finger];

        return (
          <g key={seg.finger}>
            <rect
              x={seg.x}
              y={seg.y}
              width={seg.width}
              height={seg.height}
              rx={seg.rx}
              fill={color}
              opacity={isActive || isShift ? 1 : 0.4}
              className={isActive ? 'animate-wiggle' : isShift ? 'animate-pulse' : ''}
              style={{
                filter: isActive
                  ? `drop-shadow(0 0 6px ${color})`
                  : isShift
                  ? `drop-shadow(0 0 8px #EAB308)`
                  : undefined,
                transition: 'opacity 0.2s, filter 0.2s',
              }}
            />
            {isActive && (
              <text
                x={seg.x + seg.width / 2}
                y={seg.y + seg.height / 2 + 4}
                textAnchor="middle"
                fill="white"
                fontSize="10"
                fontWeight="bold"
              >
                ↓
              </text>
            )}
            {isShift && !isActive && (
              <text
                x={seg.x + seg.width / 2}
                y={seg.y + seg.height / 2 + 4}
                textAnchor="middle"
                fill="white"
                fontSize="11"
                fontWeight="bold"
              >
                ⇧
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function HandGuide({ activeFinger, isShiftRequired = false }: HandGuideProps) {
  const isLeftHand  = activeFinger?.startsWith('left');
  const isRightHand = activeFinger?.startsWith('right');

  // Shift hangi elin serçesiyle yapılır?
  // Kural: aktif tuş sağ elde ise → sol serçe Shift; sol elde ise → sağ serçe Shift
  const shiftFinger: FingerName | undefined = isShiftRequired
    ? (isRightHand ? 'leftPinky' : 'rightPinky')
    : undefined;

  return (
    <div className="flex items-center justify-center gap-8 py-2">
      {/* Sol El */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500 mb-1 font-semibold">SOL EL</span>
        <div className={`transition-transform duration-200 ${isLeftHand ? 'scale-110' : ''}`}>
          <Hand
            fingers={LEFT_FINGERS}
            activeFinger={activeFinger}
            shiftFinger={shiftFinger}
          />
        </div>
      </div>

      {/* Orta gösterge */}
      {activeFinger && (
        <div className="flex flex-col items-center px-4 gap-2">
          {isShiftRequired && (
            <div className="flex flex-col items-center gap-1">
              <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg px-3 py-1 text-xs text-yellow-300 font-bold animate-pulse">
                ⇧ SHIFT basılı tut
              </div>
              <div className="text-yellow-400 text-sm font-bold">+</div>
            </div>
          )}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: FINGER_COLORS[activeFinger] }}
          >
            {activeFinger.startsWith('left') ? '←' : '→'}
          </div>
          <span className="text-xs text-gray-400">
            {isShiftRequired ? 'bu tuşa bas' : 'aktif parmak'}
          </span>
        </div>
      )}

      {/* Sağ El */}
      <div className="flex flex-col items-center">
        <span className="text-xs text-gray-500 mb-1 font-semibold">SAĞ EL</span>
        <div className={`transition-transform duration-200 ${isRightHand ? 'scale-110' : ''}`}>
          <Hand
            fingers={RIGHT_FINGERS}
            activeFinger={activeFinger}
            shiftFinger={shiftFinger}
          />
        </div>
      </div>
    </div>
  );
}
