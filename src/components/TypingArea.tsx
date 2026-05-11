
interface TypingAreaProps {
  content: string;
  typed: string;
  currentIndex: number;
}

export function TypingArea({ content, typed, currentIndex }: TypingAreaProps) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 font-mono text-lg leading-relaxed tracking-wide select-none">
      {content.split('').map((char, i) => {
        let className = 'text-gray-500';

        if (i < typed.length) {
          className = typed[i] === char ? 'text-green-400' : 'text-red-400 bg-red-900/40 rounded';
        } else if (i === currentIndex) {
          className = 'text-white bg-blue-600 rounded px-0.5 animate-pulse';
        }

        return (
          <span key={i} className={className}>
            {char === ' ' && i === currentIndex ? '·' : char === ' ' && i < typed.length ? '·' : char}
          </span>
        );
      })}
    </div>
  );
}
