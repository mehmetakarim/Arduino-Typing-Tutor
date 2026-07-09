
interface TypingAreaProps {
  content: string;
  typed: string;
  currentIndex: number;
}

/**
 * Kod editörü görünümlü yazma alanı: satır numarası + aktif satır vurgusu.
 * Karakter durum makinesi korunur: doğru / yanlış / aktif (caret) / bekleyen,
 * boşluklar yazıldığında ve aktifken "·" olarak gösterilir.
 */
export function TypingArea({ content, typed, currentIndex }: TypingAreaProps) {
  // Uzun içerikte (örn. ders 74: 315 karakter) tek ekran kuralını korumak için font küçülür
  const fontSize = content.length > 220 ? 17 : content.length > 140 ? 19 : 22;
  return (
    <div className="bg-muted border border-border rounded-panel px-5 py-4 font-mono select-none">
      <div
        className="flex items-start gap-2.5 rounded-md px-3 py-2"
        style={{
          background: 'color-mix(in srgb, var(--accent-cyan) 5%, transparent)',
          borderLeft: '3px solid var(--accent-cyan)',
        }}
      >
        <span className="text-[11px] font-bold w-4 select-none leading-[1.5] pt-[7px]" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
          1
        </span>
        <div className="leading-[1.5] font-medium whitespace-pre-wrap break-words min-w-0" style={{ fontSize, letterSpacing: '1.5px' }}>
          {content.split('').map((char, i) => {
            const isSpace = char === ' ';
            let style: React.CSSProperties;
            let anim = '';

            if (i < typed.length) {
              style = typed[i] === char
                ? { color: 'var(--type-correct)' }
                : { color: 'var(--accent-red)', background: 'color-mix(in srgb, var(--accent-red) 16%, transparent)', borderRadius: 4 };
            } else if (i === currentIndex) {
              style = { color: 'var(--type-caret-fg)', background: 'var(--type-caret-bg)', borderRadius: 4 };
              anim = 'caretPulse 1s ease-in-out infinite';
            } else {
              style = { color: 'var(--type-pending)' };
            }

            const shown = isSpace && (i === currentIndex || i < typed.length) ? '·' : char;
            return (
              <span key={i} style={{ ...style, padding: '1px 1px', animation: anim || undefined }}>
                {shown}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
