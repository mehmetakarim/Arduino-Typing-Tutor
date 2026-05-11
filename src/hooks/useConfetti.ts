import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export function useConfetti() {
  const fire = useCallback((type: 'pass' | 'badge' | 'certificate' = 'pass') => {
    if (type === 'certificate') {
      const end = Date.now() + 3000;
      const interval = setInterval(() => {
        if (Date.now() > end) { clearInterval(interval); return; }
        confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 } });
      }, 250);
    } else if (type === 'badge') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#EAB308', '#F59E0B', '#FDE68A'],
      });
    } else {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, []);

  return fire;
}
