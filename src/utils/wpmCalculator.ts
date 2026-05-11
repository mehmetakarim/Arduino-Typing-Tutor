export function calcWPM(charsTyped: number, elapsedSeconds: number): number {
  if (elapsedSeconds < 1) return 0;
  const words = charsTyped / 5;
  const minutes = elapsedSeconds / 60;
  return Math.round(words / minutes);
}
