import { FingerName, FINGER_COLORS } from '../types';

interface HandGuideProps {
  activeFinger?: FingerName;
  isShiftRequired?: boolean;
}

interface FingerSegment {
  finger: FingerName;
  x: number;
  y: number;
  height: number;
}

/* 200×126 viewBox — tasarım prototipiyle aynı geometri */
const FINGER_W = 26;
const FINGER_RX = 13;

const LEFT_FINGERS: FingerSegment[] = [
  { finger: 'leftPinky',  x: 38,  y: 14, height: 62 },
  { finger: 'leftRing',   x: 70,  y: 4,  height: 72 },
  { finger: 'leftMiddle', x: 102, y: 0,  height: 76 },
  { finger: 'leftIndex',  x: 134, y: 8,  height: 68 },
];

const RIGHT_FINGERS: FingerSegment[] = [
  { finger: 'rightIndex',  x: 40,  y: 8,  height: 68 },
  { finger: 'rightMiddle', x: 72,  y: 0,  height: 76 },
  { finger: 'rightRing',   x: 104, y: 4,  height: 72 },
  { finger: 'rightPinky',  x: 136, y: 14, height: 62 },
];

function Hand({ side, activeFinger, shiftFinger }: {
  side: 'left' | 'right';
  activeFinger?: FingerName;
  shiftFinger?: FingerName;
}) {
  const fingers = side === 'left' ? LEFT_FINGERS : RIGHT_FINGERS;
  const thumb: FingerName = side === 'left' ? 'leftThumb' : 'rightThumb';
  const thumbActive = activeFinger === thumb;
  // Başparmak: avucun iç tarafına doğru eğik küçük segment
  const thumbProps = side === 'left'
    ? { x: 164, y: 72, rotate: 'rotate(28 179 84)' }
    : { x: 6, y: 72, rotate: 'rotate(-28 21 84)' };

  return (
    <svg width="190" height="118" viewBox="0 0 200 126" fill="none" className="overflow-visible">
      {/* Avuç */}
      <rect x="30" y="62" width="140" height="52" rx="24" fill="var(--bg-elevated)" stroke="var(--bg-border)" strokeWidth="2" />

      {/* Başparmak */}
      <rect
        x={thumbProps.x} y={thumbProps.y} width="30" height="24" rx="12"
        fill={FINGER_COLORS[thumb]}
        opacity={thumbActive ? 1 : 0.45}
        transform={thumbProps.rotate}
        className={thumbActive ? 'animate-wiggle' : ''}
        style={thumbActive ? { filter: `drop-shadow(0 0 6px ${FINGER_COLORS[thumb]})` } : undefined}
      />

      {fingers.map(seg => {
        const color = FINGER_COLORS[seg.finger];
        const isActive = activeFinger === seg.finger;
        const isShift = shiftFinger === seg.finger && !isActive;
        const cx = seg.x + FINGER_W / 2;

        return (
          <g key={seg.finger} className={isActive ? 'animate-wiggle' : isShift ? 'animate-pulse' : ''}>
            <rect
              x={seg.x} y={seg.y} width={FINGER_W} height={seg.height} rx={FINGER_RX}
              fill={color}
              opacity={isActive || isShift ? 1 : 0.45}
              stroke={isShift ? '#FACC15' : undefined}
              strokeWidth={isShift ? 3 : undefined}
              style={{
                filter: isActive
                  ? `drop-shadow(0 0 6px ${color})`
                  : isShift
                    ? 'drop-shadow(0 0 8px #FACC15)'
                    : undefined,
                transition: 'opacity .2s, filter .2s',
              }}
            />
            {/* Eklem noktası */}
            <circle cx={cx} cy={seg.y + 13} r="5" fill="var(--bg-base)" opacity={isActive || isShift ? 0.35 : 0.25} />
            {isActive && (
              <text x={cx} y={seg.y - 4} textAnchor="middle" fontSize="15" fontWeight="900" fill={color} fontFamily="Nunito, sans-serif">
                ↓
              </text>
            )}
            {isShift && (
              <text x={cx} y={seg.y - 4} textAnchor="middle" fontSize="11" fontWeight="900" fill="#FACC15" fontFamily="Nunito, sans-serif">
                SHIFT
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

  const activeColor = activeFinger ? FINGER_COLORS[activeFinger] : undefined;

  return (
    <div className="flex items-center justify-center gap-10 py-1">
      {/* Sol El */}
      <div className="text-center">
        <div className={`transition-transform duration-200 ${isLeftHand ? 'scale-110' : ''}`}>
          <Hand side="left" activeFinger={activeFinger} shiftFinger={shiftFinger} />
        </div>
        <div className="text-[11px] font-black tracking-[1.5px] uppercase text-subtle">Sol El</div>
      </div>

      {/* Orta gösterge */}
      {activeFinger && activeColor && (
        <div className="flex flex-col items-center gap-1.5 px-2">
          {isShiftRequired && (
            <div
              className="rounded-lg px-3 py-1 text-xs font-extrabold animate-pulse"
              style={{ background: 'rgba(250,204,21,.14)', border: '1px solid #FACC15', color: '#FACC15' }}
            >
              ⇧ SHIFT basılı tut
            </div>
          )}
          <div
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-xl font-black"
            style={{
              background: `color-mix(in srgb, ${activeColor} 14%, transparent)`,
              border: `2px solid ${activeColor}`,
              color: activeColor,
              boxShadow: `0 0 18px ${activeColor}59`,
            }}
          >
            {activeFinger.startsWith('left') ? '←' : '→'}
          </div>
          <span className="text-xs font-extrabold text-secondary">
            {isShiftRequired ? 'bu parmakla bas' : 'aktif parmak'}
          </span>
        </div>
      )}

      {/* Sağ El */}
      <div className="text-center">
        <div className={`transition-transform duration-200 ${isRightHand ? 'scale-110' : ''}`}>
          <Hand side="right" activeFinger={activeFinger} shiftFinger={shiftFinger} />
        </div>
        <div className="text-[11px] font-black tracking-[1.5px] uppercase text-subtle">Sağ El</div>
      </div>
    </div>
  );
}
