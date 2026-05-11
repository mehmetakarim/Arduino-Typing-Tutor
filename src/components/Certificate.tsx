import { useEffect } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useConfetti } from '../hooks/useConfetti';

function formatDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString('tr-TR');
  return new Date(iso).toLocaleDateString('tr-TR');
}

export function Certificate() {
  const { progress, setScreen } = useProgressStore();
  const finalStat = progress.lessonStats.find(s => s.lessonId === 47);
  const fireConfetti = useConfetti();

  useEffect(() => {
    fireConfetti('certificate');
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="bg-gradient-to-br from-yellow-900/60 to-orange-900/60 border-4 border-yellow-500 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold text-yellow-300 mb-1">Başarı Sertifikası</h1>
        <p className="text-gray-400 text-sm mb-6">Arduino Typing Tutor</p>

        <div className="border-t border-yellow-700/50 pt-6 mb-6">
          <p className="text-gray-300 text-sm mb-2">Bu sertifika şunu onaylar:</p>
          <p className="text-lg font-semibold text-white">10 Parmak Arduino Yazımını Başarıyla Tamamladı</p>
        </div>

        {finalStat && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-2xl font-bold text-green-400">{finalStat.bestWPM}</div>
              <div className="text-xs text-gray-400">En İyi WPM</div>
            </div>
            <div className="bg-black/30 rounded-xl p-3">
              <div className="text-2xl font-bold text-blue-400">{finalStat.bestAccuracy}%</div>
              <div className="text-xs text-gray-400">En İyi Doğruluk</div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-1">Toplam {progress.completedLessons.length} ders tamamlandı</p>
        <p className="text-xs text-gray-600">{formatDate(finalStat?.completedAt)}</p>

        <div className="text-3xl mt-4 mb-2">⭐⭐⭐</div>
      </div>

      <button
        onClick={() => setScreen('menu')}
        className="mt-6 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-semibold transition-colors"
      >
        ← Ana Menü
      </button>
    </div>
  );
}
