import { useProgressStore } from './store/progressStore';
import { MainMenu } from './components/MainMenu';
import { LessonView } from './components/LessonView';
import { ResultScreen } from './components/ResultScreen';
import { Certificate } from './components/Certificate';
import lessonsData from './data/lessons.json';
import { Lesson } from './types';

export default function App() {
  const { screen, activeLessonId } = useProgressStore();

  const activeLesson = activeLessonId
    ? (lessonsData.find(l => l.id === activeLessonId) as Lesson | undefined)
    : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {screen === 'menu' && <MainMenu />}
      {(screen === 'lesson' || screen === 'exam' || screen === 'finalExam') && activeLesson && (
        <LessonView lesson={activeLesson} />
      )}
      {screen === 'result' && <ResultScreen />}
      {screen === 'certificate' && <Certificate />}
    </div>
  );
}
