import { useProgressStore } from './store/progressStore';
import { useProfileStore } from './store/profileStore';
import { MainMenu } from './components/MainMenu';
import { LessonView } from './components/LessonView';
import { ResultScreen } from './components/ResultScreen';
import { Certificate } from './components/Certificate';
import { ProfileSelect } from './components/ProfileSelect';
import { ParentPanel } from './components/ParentPanel';
import lessonsData from './data/lessons.json';
import { Lesson } from './types';

export default function App() {
  const { screen, activeLessonId } = useProgressStore();
  const { activeProfile } = useProfileStore();

  const activeLesson = activeLessonId
    ? (lessonsData.find(l => l.id === activeLessonId) as Lesson | undefined)
    : null;

  // Profil seçilmemişse profil ekranını göster
  if (!activeProfile && screen !== 'parent-panel') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <ProfileSelect />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {screen === 'profile-select' && <ProfileSelect />}
      {screen === 'menu' && <MainMenu />}
      {(screen === 'lesson' || screen === 'exam' || screen === 'finalExam') && activeLesson && (
        <LessonView lesson={activeLesson} />
      )}
      {screen === 'result' && <ResultScreen />}
      {screen === 'certificate' && <Certificate />}
      {screen === 'parent-panel' && <ParentPanel />}
    </div>
  );
}
