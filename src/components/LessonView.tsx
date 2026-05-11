import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Lesson } from '../types';
import { useTyping } from '../hooks/useTyping';
import { useKeyboard } from '../hooks/useKeyboard';
import { useSound } from '../hooks/useSound';
import { useProgressStore } from '../store/progressStore';
import { getAccuracyThreshold } from '../store/settingsStore';
import { useSettingsStore } from '../store/settingsStore';
import { Keyboard } from './Keyboard';
import { HandGuide } from './HandGuide';
import { StatsPanel } from './StatsPanel';
import { TypingArea } from './TypingArea';
import layoutData from '../data/keyboard-layout.json';
import { FingerName } from '../types';

interface LessonViewProps {
  lesson: Lesson;
}

type KeyEntry = { key: string; finger: string; shiftKey?: string; altKey?: string };

function getFingerForKey(key: string): FingerName | undefined {
  for (const row of layoutData.rows) {
    for (const k of row.keys as KeyEntry[]) {
      if (
        k.key === key ||
        k.key.toLowerCase() === key.toLowerCase() ||
        k.shiftKey === key ||
        k.altKey === key
      ) {
        return k.finger as FingerName;
      }
    }
  }
  if (key === ' ') return 'leftThumb';
  return undefined;
}

function isShiftChar(char: string): boolean {
  for (const row of layoutData.rows) {
    for (const k of row.keys as KeyEntry[]) {
      if (k.shiftKey === char) return true;
    }
  }
  return false;
}

export function LessonView({ lesson }: LessonViewProps) {
  const { completeLesson, setScreen, passExam, completeFinalExam, addTime } = useProgressStore();
  const { difficulty } = useSettingsStore();
  const { playCorrect, playError, playLessonComplete, playExamFail } = useSound();
  const prevIndex = useRef(0);
  const { typed, currentIndex, errors, isComplete, wpm, accuracy, elapsedSeconds, handleKey, reset, errorKeyMap } = useTyping(lesson.content);

  const activeChar = lesson.content[currentIndex];
  const activeFinger = useMemo(() => activeChar ? getFingerForKey(activeChar) : undefined, [activeChar]);
  const isShiftRequired = useMemo(() => activeChar ? isShiftChar(activeChar) : false, [activeChar]);

  // Play sound on each keypress
  useEffect(() => {
    if (currentIndex === 0 || currentIndex === prevIndex.current) return;
    const wasCorrect = typed[currentIndex - 1] === lesson.content[currentIndex - 1];
    if (wasCorrect) playCorrect(); else playError();
    prevIndex.current = currentIndex;
  }, [currentIndex]);

  const onKey = useCallback((key: string) => {
    handleKey(key);
  }, [handleKey]);

  useKeyboard(onKey, !isComplete);

  const effectiveMinAccuracy = getAccuracyThreshold(lesson.minAccuracy, difficulty);

  useEffect(() => {
    if (!isComplete) return;
    const passed = accuracy >= effectiveMinAccuracy && (!lesson.minWPM || wpm >= lesson.minWPM);
    if (passed) playLessonComplete(); else playExamFail();
    addTime(elapsedSeconds);
    if (lesson.isExam && passed) {
      if (lesson.moduleId === 0) {
        // Final Sınavı — sertifika ekranına geç
        completeFinalExam();
        return;
      }
      passExam(lesson.id);
    }
    completeLesson({
      lessonId: lesson.id,
      wpm,
      accuracy,
      timeSpent: elapsedSeconds,
      errors,
      passed,
      errorKeyMap,
    });
  }, [isComplete]);

  const progress = (currentIndex / lesson.content.length) * 100;
  const moduleNum = lesson.moduleId > 0 ? `Modül ${lesson.moduleId}` : 'Final';
  const lessonLabel = lesson.isExam ? 'Sınav' : `Ders ${lesson.id}`;

  return (
    <div className="flex flex-col h-screen text-white p-4 gap-3 screen-bg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-400">{moduleNum} &rsaquo; {lessonLabel}</span>
          <h1 className="text-lg font-bold">{lesson.title}</h1>
          <p className="text-sm text-gray-400">{lesson.description}</p>
        </div>
        <div className="flex gap-2 text-sm">
          {effectiveMinAccuracy && (
            <span className="bg-blue-900/50 border border-blue-600 text-blue-300 px-2 py-1 rounded-md">
              Min: %{effectiveMinAccuracy} doğruluk
            </span>
          )}
          {lesson.minWPM && (
            <span className="bg-purple-900/50 border border-purple-600 text-purple-300 px-2 py-1 rounded-md">
              Min: {lesson.minWPM} WPM
            </span>
          )}
          <button
            onClick={() => setScreen('menu')}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded-md text-sm transition-colors"
          >
            ← Menü
          </button>
        </div>
      </div>

      {/* Typing area */}
      <TypingArea content={lesson.content} typed={typed} currentIndex={currentIndex} />

      {/* Stats */}
      <StatsPanel wpm={wpm} accuracy={accuracy} elapsedSeconds={elapsedSeconds} errors={errors} progress={progress} />

      {/* Keyboard */}
      <div className="flex justify-center">
        <Keyboard
          activeKey={activeChar}
          lastKey={typed[typed.length - 1]}
          wasCorrect={typed.length === 0 || typed[typed.length - 1] === lesson.content[typed.length - 1]}
        />
      </div>

      {/* Hand guide */}
      <HandGuide activeFinger={activeFinger} isShiftRequired={isShiftRequired} />

      {/* Reset button */}
      {!isComplete && (
        <div className="flex justify-center">
          <button
            onClick={reset}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Yeniden Başla
          </button>
        </div>
      )}
    </div>
  );
}
