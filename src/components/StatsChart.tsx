import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { LessonStats } from '../types';
import lessonsData from '../data/lessons.json';

interface StatsChartProps {
  lessonStats: LessonStats[];
  errorKeys: Record<string, number>;
}

export function StatsChart({ lessonStats, errorKeys }: StatsChartProps) {
  const completed = [...lessonStats]
    .filter(s => s.completedAt)
    .sort((a, b) => a.lessonId - b.lessonId)
    .slice(-15);

  const trendData = completed.map(s => {
    const lesson = lessonsData.find(l => l.id === s.lessonId);
    return {
      name: lesson ? `D${s.lessonId}` : `#${s.lessonId}`,
      WPM: s.bestWPM,
      Doğruluk: s.bestAccuracy,
    };
  });

  const topErrors = Object.entries(errorKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({
      key: key === ' ' ? '⎵' : key,
      Hata: count,
    }));

  if (trendData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        Henüz yeterli veri yok — ders tamamladıkça grafikler burada görünecek.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* WPM & Accuracy trend */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          WPM & Doğruluk Gelişimi
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#F9FAFB' }}
            />
            <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: 12 }} />
            <Line
              type="monotone" dataKey="WPM"
              stroke="#60A5FA" strokeWidth={2}
              dot={{ fill: '#60A5FA', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone" dataKey="Doğruluk"
              stroke="#34D399" strokeWidth={2}
              dot={{ fill: '#34D399', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Error key bar chart */}
      {topErrors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            En Çok Hata Yapılan Tuşlar
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={topErrors}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="key" tick={{ fill: '#9CA3AF', fontSize: 13, fontFamily: 'monospace' }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F9FAFB' }}
              />
              <Bar dataKey="Hata" fill="#F87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
