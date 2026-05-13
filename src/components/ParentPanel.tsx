import { useState, useEffect } from 'react';
import { useProfileStore } from '../store/profileStore';
import { useProgressStore } from '../store/progressStore';
import { loadProfileProgressFromFS } from '../utils/storage';
import { UserProgress } from '../types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

type View = 'pin' | 'dashboard' | 'settings';

export function ParentPanel() {
  const { profiles, parentSettings, updateParentSettings, verifyPin } = useProfileStore();
  const { setScreen } = useProgressStore();
  const [view, setView] = useState<View>(parentSettings.pinEnabled ? 'pin' : 'dashboard');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [profileStats, setProfileStats] = useState<Record<string, UserProgress>>({});
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinEnabled, setPinEnabled] = useState(parentSettings.pinEnabled);

  // PIN yoksa dashboard açılır, istatistikleri hemen yükle
  useEffect(() => {
    if (view === 'dashboard' && !statsLoaded) {
      loadStats();
    }
  }, [view]);

  async function loadStats() {
    const result: Record<string, UserProgress> = {};
    for (const p of profiles) {
      result[p.id] = await loadProfileProgressFromFS(p.id);
    }
    setProfileStats(result);
    setStatsLoaded(true);
  }

  function handlePinSubmit() {
    if (verifyPin(pin)) {
      setView('dashboard');
      loadStats();
    } else {
      setPinError(true);
      setPin('');
    }
  }

  function handleSaveSettings() {
    updateParentSettings({
      pinEnabled,
      pin: pinEnabled && newPin.length === 4 ? newPin : parentSettings.pin,
    });
    setView('dashboard');
  }

  if (view === 'pin') {
    return (
      <div className="min-h-screen screen-bg flex items-center justify-center">
        <div className="w-80 rounded-2xl border border-white/10 p-8 text-center" style={{ backgroundColor: '#1A1A1B' }}>
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-white text-xl font-bold mb-2">Ebeveyn Paneli</h2>
          <p className="text-gray-400 text-sm mb-6">4 haneli PIN gir</p>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            placeholder="••••"
            autoFocus
            className="w-full text-center text-2xl tracking-widest bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 mb-3"
          />
          {pinError && <p className="text-red-400 text-sm mb-3">Hatalı PIN</p>}
          <div className="flex gap-3">
            <button onClick={handlePinSubmit} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold">Gir</button>
            <button onClick={() => setScreen('menu')} className="px-4 py-2.5 text-gray-400 hover:text-white rounded-xl" style={{ backgroundColor: '#242425' }}>İptal</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen screen-bg p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Ebeveyn Paneli</h1>
            <p className="text-gray-400 text-sm mt-1">{profiles.length} profil</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setView('settings')} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-sm transition-colors" style={{ backgroundColor: '#1A1A1B' }}>⚙️ Ayarlar</button>
            <button onClick={() => setScreen('menu')} className="px-4 py-2 rounded-xl text-gray-400 hover:text-white text-sm transition-colors" style={{ backgroundColor: '#1A1A1B' }}>← Geri</button>
          </div>
        </div>

        {/* Profil kartları */}
        {!statsLoaded ? (
          <div className="text-center text-gray-400 py-20">İstatistikler yükleniyor...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center text-gray-400 py-20">Henüz profil yok.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profiles.map(profile => {
              const stats = profileStats[profile.id];
              if (!stats) return null;
              const completedCount = stats.completedLessons.length;
              const avgWpm = stats.lessonStats.length > 0
                ? Math.round(stats.lessonStats.reduce((s, l) => s + l.bestWPM, 0) / stats.lessonStats.length)
                : 0;
              const avgAcc = stats.lessonStats.length > 0
                ? Math.round(stats.lessonStats.reduce((s, l) => s + l.bestAccuracy, 0) / stats.lessonStats.length)
                : 0;
              const hours = Math.floor(stats.totalTimeSpent / 3600);
              const mins = Math.floor((stats.totalTimeSpent % 3600) / 60);

              return (
                <div key={profile.id} className="rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#1A1A1B' }}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white" style={{ backgroundColor: profile.color }}>
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{profile.name}</h3>
                      <p className="text-gray-500 text-xs">{stats.badges.length} rozet · {stats.currentStreak} gün seri</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Tamamlanan Ders', value: completedCount },
                      { label: 'Ort. WPM', value: avgWpm },
                      { label: 'Ort. Doğruluk', value: `%${avgAcc}` },
                      { label: 'Toplam Süre', value: hours > 0 ? `${hours}s ${mins}d` : `${mins}d` },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-xl p-3" style={{ backgroundColor: '#0D0D0E' }}>
                        <p className="text-gray-500 text-xs mb-1">{label}</p>
                        <p className="text-white font-bold text-lg">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Karşılaştırma grafikleri */}
        {statsLoaded && profiles.length > 1 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* WPM Karşılaştırma */}
            <div className="rounded-2xl border border-white/10 p-5" style={{ backgroundColor: '#1A1A1B' }}>
              <p className="text-gray-400 text-sm font-medium mb-4">Ortalama WPM Karşılaştırması</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={profiles.map(p => ({
                  name: p.name,
                  wpm: profileStats[p.id]?.lessonStats.length
                    ? Math.round(profileStats[p.id].lessonStats.reduce((s, l) => s + l.bestWPM, 0) / profileStats[p.id].lessonStats.length)
                    : 0,
                  color: p.color,
                }))} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#242425', border: '1px solid #2E2E2F', borderRadius: 10, color: '#F2F2F2' }}
                    formatter={(v) => [`${v} WPM`, 'Hız']}
                  />
                  <Bar dataKey="wpm" radius={[6, 6, 0, 0]}>
                    {profiles.map((p) => <Cell key={p.id} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar — çok profil yetenek karşılaştırması */}
            <div className="rounded-2xl border border-white/10 p-5" style={{ backgroundColor: '#1A1A1B' }}>
              <p className="text-gray-400 text-sm font-medium mb-4">Yetenek Profili</p>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={[
                  { subject: 'Hız',      ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.lessonStats.reduce((s,l)=>s+l.bestWPM,0)||0) / Math.max(1, profileStats[p.id]?.lessonStats.length||1))])) },
                  { subject: 'Doğruluk', ...Object.fromEntries(profiles.map(p => [p.name, Math.round((profileStats[p.id]?.lessonStats.reduce((s,l)=>s+l.bestAccuracy,0)||0) / Math.max(1, profileStats[p.id]?.lessonStats.length||1))])) },
                  { subject: 'Dersler',  ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.completedLessons.length||0) * 1.5)])) },
                  { subject: 'Seri',     ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.longestStreak||0) * 10)])) },
                  { subject: 'Rozetler', ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.badges.length||0) * 12)])) },
                ]}>
                  <PolarGrid stroke="#2E2E2F" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  {profiles.map(p => (
                    <Radar key={p.id} name={p.name} dataKey={p.name} stroke={p.color} fill={p.color} fillOpacity={0.15} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {profiles.map(p => (
                  <span key={p.id} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PIN Ayarları görünümü */}
        {view === 'settings' && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="w-96 rounded-2xl border border-white/10 p-6" style={{ backgroundColor: '#1A1A1B' }}>
              <h3 className="text-white font-bold text-lg mb-5">PIN Ayarları</h3>
              <label className="flex items-center gap-3 mb-5 cursor-pointer">
                <input type="checkbox" checked={pinEnabled} onChange={e => setPinEnabled(e.target.checked)} className="w-4 h-4 accent-indigo-500" />
                <span className="text-gray-300">PIN korumasını etkinleştir</span>
              </label>
              {pinEnabled && (
                <div className="mb-5">
                  <p className="text-gray-400 text-sm mb-2">Yeni PIN (4 hane)</p>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full text-center text-2xl tracking-widest bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500"
                  />
                  <p className="text-gray-500 text-xs mt-1">Boş bırakırsan mevcut PIN korunur</p>
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={handleSaveSettings} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold">Kaydet</button>
                <button onClick={() => setView('dashboard')} className="px-4 py-2.5 text-gray-400 hover:text-white rounded-xl" style={{ backgroundColor: '#242425' }}>İptal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
