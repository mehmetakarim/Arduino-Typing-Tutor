import { useCallback, useRef } from 'react';
import { useSettingsStore } from '../store/settingsStore';

function createCtx(): AudioContext | null {
  try {
    return new AudioContext();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainVal = 0.15,
  fadeOut = true,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  if (fadeOut) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  }
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const { soundEnabled } = useSettingsStore();

  const getCtx = useCallback((): AudioContext | null => {
    if (!soundEnabled) return null;
    if (!ctxRef.current || ctxRef.current.state === 'closed') {
      ctxRef.current = createCtx();
    }
    if (ctxRef.current?.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [soundEnabled]);

  const playCorrect = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 880, 0.08, 'sine', 0.1);
  }, [getCtx]);

  const playError = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 220, 0.15, 'sawtooth', 0.08);
  }, [getCtx]);

  const playLessonComplete = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, freq, 0.2, 'sine', 0.12), i * 100);
    });
  }, [getCtx]);

  const playBadge = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    const notes = [784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(ctx, freq, 0.25, 'sine', 0.14), i * 120);
    });
  }, [getCtx]);

  const playExamFail = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    playTone(ctx, 300, 0.3, 'sawtooth', 0.1);
    setTimeout(() => playTone(ctx, 220, 0.4, 'sawtooth', 0.08), 200);
  }, [getCtx]);

  return { playCorrect, playError, playLessonComplete, playBadge, playExamFail };
}
