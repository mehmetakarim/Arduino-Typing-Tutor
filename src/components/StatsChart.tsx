import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import { LessonStats } from '../types';
import lessonsData from '../data/lessons.json';

interface StatsChartProps {
  lessonStats: LessonStats[];
  errorKeys: Record<string, number>;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export function StatsChart({ lessonStats, errorKeys }: StatsChartProps) {
  // Gerçek zaman serisine göre sırala — completedAt varsa onu, yoksa sona koy
  const completed = [...lessonStats]
    .filter(s => s.completedAt)
    .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime())
    .slice(-20);

  // 3-ders kayan ortalama
  const trendData = completed.map((s, i) => {
    const window = completed.slice(Math.max(0, i - 2), i + 1);
    const rollingAvg = Math.round(window.reduce((sum, x) => sum + x.bestWPM, 0) / window.length);
    const lesson = lessonsData.find(l => l.id === s.lessonId);
    return {
      name: shortDate(s.completedAt!),
      label: lesson ? `D${s.lessonId}` : `#${s.lessonId}`,
      WPM: s.bestWPM,
      Ortalama: rollingAvg,
      Doğruluk: s.bestAccuracy,
    };
  });

  // Günlük aktivite: her gün kaç ders tamamlandı
  const dailyMap: Record<string, number> = {};
  completed.forEach(s => {
    const k = dayKey(s.completedAt!);
    dailyMap[k] = (dailyMap[k] ?? 0) + 1;
  });
  const dailyData = Object.entries(dailyMap).map(([day, count]) => ({ day, Ders: count }));

  // En çok hata yapılan tuşlar
  const topErrors = Object.entries(errorKeys)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([key, count]) => ({
      key: key === ' ' ? '⎵' : key,
      Hata: count,
    }));

  const avgWpm = trendData.length
    ? Math.round(trendData.reduce((s, x) => s + x.WPM, 0) / trendData.length)
    : 0;

  if (trendData.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 text-sm">
        Henüz yeterli veri yok — ders tamamladıkça grafikler burada görünecek.
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' },
    labelStyle: { color: '#F9FAFB', fontSize: 12 },
    itemStyle: { fontSize: 12 },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* WPM zaman serisi + kayan ortalama */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            WPM Gelişimi (Zaman Serisi)
          </h3>
          <span className="text-xs text-gray-500">Ort. {avgWpm} WPM</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <Tooltip {...tooltipStyle} labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ''} />
            <Legend wrapperStyle={{ color: '#9CA3AF', fontSize: 12 }} />
            <ReferenceLine y={avgWpm} stroke="#6B7280" strokeDasharray="4 4" />
            <Line
              type="monotone" dataKey="WPM"
              stroke="#60A5FA" strokeWidth={2}
              dot={{ fill: '#60A5FA', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone" dataKey="Ortalama"
              stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Doğruluk zaman serisi */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
          Doğruluk Gelişimi
        </h3>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} unit="%" />
            <Tooltip {...tooltipStyle} />
            <ReferenceLine y={90} stroke="#34D399" strokeDasharray="4 4" label={{ value: '%90', fill: '#34D39988', fontSize: 10 }} />
            <Line
              type="monotone" dataKey="Doğruluk"
              stroke="#34D399" strokeWidth={2}
              dot={{ fill: '#34D399', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Günlük aktivite */}
      {dailyData.length > 1 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">
            Günlük Ders Aktivitesi
          </h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} allowDecimals={false} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="Ders" fill="#818CF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* En çok hata yapılan tuşlar */}
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
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="Hata" fill="#F87171" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
