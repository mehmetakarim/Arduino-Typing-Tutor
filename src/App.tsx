import { useRef } from 'react';
import { useProgressStore } from './store/progressStore';
import { useProfileStore } from './store/profileStore';
import { MainMenu } from './components/MainMenu';
import { LessonView } from './components/LessonView';
import { ResultScreen } from './components/ResultScreen';
import { Certificate } from './components/Certificate';
import { ProfileSelect } from './components/ProfileSelect';
import { ParentPanel } from './components/ParentPanel';
import { TeacherPanel } from './components/TeacherPanel';
import lessonsData from './data/lessons.json';
import { AppScreen, Lesson } from './types';

// Hangi ekranın hangi animasyonla gireceği
const SCREEN_ANIMATION: Record<AppScreen, string> = {
  'profile-select': 'animate-fade-in',
  'menu':           'animate-slide-up',
  'lesson':         'animate-slide-up',
  'exam':           'animate-slide-up',
  'result':         'animate-pop-in',
  'finalExam':      'animate-slide-up',
  'certificate':    'animate-pop-in',
  'parent-panel':   'animate-slide-down',
  'teacher-panel':  'animate-slide-down',
};

function ScreenWrapper({ screen, children }: { screen: AppScreen; children: React.ReactNode }) {
  const keyRef = useRef(0);
  keyRef.current += 1;
  return (
    <div key={screen} className={SCREEN_ANIMATION[screen] ?? 'animate-fade-in'}>
      {children}
    </div>
  );
}

export default function App() {
  const { screen, activeLessonId } = useProgressStore();
  const { activeProfile } = useProfileStore();

  const activeLesson = activeLessonId
    ? (lessonsData.find(l => l.id === activeLessonId) as Lesson | undefined)
    : null;

  if (!activeProfile && screen !== 'parent-panel' && screen !== 'teacher-panel') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="animate-fade-in">
          <ProfileSelect />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <ScreenWrapper screen={screen}>
        {screen === 'profile-select' && <ProfileSelect />}
        {screen === 'menu' && <MainMenu />}
        {(screen === 'lesson' || screen === 'exam' || screen === 'finalExam') && activeLesson && (
          <LessonView lesson={activeLesson} />
        )}
        {screen === 'result' && <ResultScreen />}
        {screen === 'certificate' && <Certificate />}
        {screen === 'parent-panel' && <ParentPanel />}
        {screen === 'teacher-panel' && <TeacherPanel />}
      </ScreenWrapper>
    </div>
  );
}
