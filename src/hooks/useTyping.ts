import { useState, useCallback, useRef, useEffect } from 'react';
import { calcWPM } from '../utils/wpmCalculator';
import { calcAccuracy } from '../utils/accuracyCalculator';

interface TypingState {
  typed: string;
  currentIndex: number;
  errors: number;
  correctChars: number;
  isComplete: boolean;
  wpm: number;
  accuracy: number;
  elapsedSeconds: number;
  startedAt: number | null;
  errorKeyMap: Record<string, number>;
}

export function useTyping(content: string) {
  const [state, setState] = useState<TypingState>({
    typed: '',
    currentIndex: 0,
    errors: 0,
    correctChars: 0,
    isComplete: false,
    wpm: 0,
    accuracy: 100,
    elapsedSeconds: 0,
    startedAt: null,
    errorKeyMap: {},
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    setState(s => {
      if (!s.startedAt || s.isComplete) return s;
      const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
      return { ...s, elapsedSeconds: elapsed, wpm: calcWPM(s.correctChars, elapsed) };
    });
  }, []);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleKey = useCallback((key: string) => {
    setState(s => {
      if (s.isComplete) return s;
      const expected = content[s.currentIndex];
      if (expected === undefined) return s;

      const isCorrect = key === expected;
      const now = Date.now();
      const startedAt = s.startedAt ?? now;

      if (!s.startedAt) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(tick, 500);
      }

      const newIndex = s.currentIndex + 1;
      const newErrors = isCorrect ? s.errors : s.errors + 1;
      const newCorrect = isCorrect ? s.correctChars + 1 : s.correctChars;
      const isComplete = newIndex >= content.length;

      if (isComplete && intervalRef.current) clearInterval(intervalRef.current);

      const elapsed = Math.max(1, Math.floor((now - startedAt) / 1000));

      const errorKeyMap = isCorrect ? s.errorKeyMap : {
        ...s.errorKeyMap,
        [expected]: (s.errorKeyMap[expected] ?? 0) + 1,
      };

      return {
        ...s,
        typed: s.typed + key,
        currentIndex: newIndex,
        errors: newErrors,
        correctChars: newCorrect,
        isComplete,
        startedAt,
        elapsedSeconds: elapsed,
        wpm: calcWPM(newCorrect, elapsed),
        accuracy: calcAccuracy(newCorrect, s.currentIndex + 1),
        errorKeyMap,
      };
    });
  }, [content, tick]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setState({
      typed: '',
      currentIndex: 0,
      errors: 0,
      correctChars: 0,
      isComplete: false,
      wpm: 0,
      accuracy: 100,
      elapsedSeconds: 0,
      startedAt: null,
      errorKeyMap: {},
    });
  }, []);

  return { ...state, handleKey, reset };
}
