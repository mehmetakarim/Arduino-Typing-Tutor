import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, ChevronRight, Target, Zap } from 'lucide-react';
import { Button, Chip } from './ui';
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
    <div className="flex flex-col h-screen overflow-hidden text-primary screen-bg" style={{ padding: '14px 28px 10px' }}>
      {/* Header */}
      <div className="flex items-start gap-4 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-extrabold text-subtle">
            <span>{moduleNum}</span>
            <ChevronRight size={12} strokeWidth={3} />
            <span style={{ color: 'var(--accent-cyan)' }}>{lessonLabel}</span>
          </div>
          <div className="flex items-baseline gap-3 mt-0.5 flex-wrap">
            <h1 className="m-0 text-[21px] font-black tracking-tight">{lesson.title}</h1>
            <span className="text-[13.5px] font-semibold text-secondary truncate">{lesson.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {effectiveMinAccuracy && (
            <Chip size="sm" color="var(--accent-lime)">
              <Target size={13} strokeWidth={2.4} />
              Min %{effectiveMinAccuracy} doğruluk
            </Chip>
          )}
          {lesson.minWPM && (
            <Chip size="sm" color="var(--accent-amber)">
              <Zap size={13} strokeWidth={2.4} />
              Min {lesson.minWPM} WPM
            </Chip>
          )}
          <Button variant="secondary" size="sm" onClick={() => setScreen('menu')}>
            <ArrowLeft size={15} strokeWidth={2.6} />
            Menü
          </Button>
        </div>
      </div>

      {/* Typing area */}
      <div className="flex-shrink-0 mt-3">
        <TypingArea content={lesson.content} typed={typed} currentIndex={currentIndex} />
      </div>

      {/* Stats */}
      <div className="flex-shrink-0 mt-2.5">
        <StatsPanel wpm={wpm} accuracy={accuracy} elapsedSeconds={elapsedSeconds} errors={errors} progress={progress} />
      </div>

      {/* Keyboard — kalan alanda ortalanır */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <Keyboard
          activeKey={activeChar}
          lastKey={typed[typed.length - 1]}
          wasCorrect={typed.length === 0 || typed[typed.length - 1] === lesson.content[typed.length - 1]}
          errorKeyMap={errorKeyMap}
        />
      </div>

      {/* Hand guide + reset */}
      <div className="flex-shrink-0">
        <HandGuide activeFinger={activeFinger} isShiftRequired={isShiftRequired} />
        {!isComplete && (
          <div className="flex justify-center">
            <button
              onClick={reset}
              className="bg-transparent border-none cursor-pointer text-xs font-bold text-subtle hover:text-secondary transition-colors underline underline-offset-[3px]"
            >
              Yeniden Başla
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
