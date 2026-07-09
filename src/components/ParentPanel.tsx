import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, GraduationCap, Info, Lock, Trash2, Users } from 'lucide-react';
import { useProfileStore } from '../store/profileStore';
import { useProgressStore } from '../store/progressStore';
import { useAuthStore } from '../store/authStore';
import { loadProfileProgressFromFS } from '../utils/storage';
import { Spinner } from './Spinner';
import { Button, Modal, Toggle } from './ui';
import { supabase } from '../lib/supabase';
import { UserProgress } from '../types';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const CHART_TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--bg-border)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--text-primary)',
  fontFamily: 'Nunito, sans-serif',
};

function getWeeklySummary(stats: UserProgress) {
  const now = Date.now();
  const DAY = 86400000;
  const thisWeekStart = now - 7 * DAY;
  const lastWeekStart = now - 14 * DAY;

  const thisWeek = stats.lessonStats.filter(s => s.completedAt && new Date(s.completedAt).getTime() >= thisWeekStart);
  const lastWeek = stats.lessonStats.filter(s => s.completedAt && new Date(s.completedAt).getTime() >= lastWeekStart && new Date(s.completedAt).getTime() < thisWeekStart);

  const avgWpm = (arr: typeof thisWeek) =>
    arr.length ? Math.round(arr.reduce((s, x) => s + x.bestWPM, 0) / arr.length) : 0;

  const thisWpm = avgWpm(thisWeek);
  const lastWpm = avgWpm(lastWeek);
  const wpmDelta = lastWpm > 0 ? thisWpm - lastWpm : null;

  // Haftanın 7 günü için günlük ders sayısı
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(thisWeekStart + i * DAY);
    const label = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const dayEnd = dayStart + DAY;
    const count = thisWeek.filter(s => {
      const t = new Date(s.completedAt!).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    return { label, count };
  });

  return { thisWeek: thisWeek.length, lastWeek: lastWeek.length, thisWpm, lastWpm, wpmDelta, days };
}

type View = 'pin' | 'dashboard' | 'settings';

export function ParentPanel() {
  const { profiles, parentSettings, updateParentSettings, verifyPin, deleteProfile } = useProfileStore();
  const { setScreen } = useProgressStore();
  const { user } = useAuthStore();
  const [view, setView] = useState<View>(parentSettings.pinEnabled ? 'pin' : 'dashboard');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [profileStats, setProfileStats] = useState<Record<string, UserProgress>>({});
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinEnabled, setPinEnabled] = useState(parentSettings.pinEnabled);
  const [confirmDeleteProfile, setConfirmDeleteProfile] = useState<string | null>(null);

  // Sınıfa katılma
  const [classCode, setClassCode] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState(profiles[0]?.id ?? '');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function handleJoinClass() {
    if (!classCode.trim() || !selectedProfileId || !user) return;
    setJoinLoading(true);
    setJoinMsg(null);

    const { data: cls } = await supabase
      .from('classes')
      .select('id, name')
      .eq('code', classCode.trim().toUpperCase())
      .single();

    if (!cls) {
      setJoinMsg({ type: 'err', text: 'Sınıf kodu bulunamadı.' });
      setJoinLoading(false);
      return;
    }

    const profile = profiles.find(p => p.id === selectedProfileId);
    const { error } = await supabase.from('class_members').insert(
      { class_id: cls.id, profile_id: selectedProfileId, owner_id: user.id, student_name: profile?.name ?? 'Öğrenci' },
    );

    setJoinLoading(false);
    // 23505 = unique_violation (zaten üye)
    if (!error || (error as { code?: string }).code === '23505') {
      setJoinMsg({ type: 'ok', text: `"${cls.name}" sınıfına katıldı!` });
      setClassCode('');
    } else {
      setJoinMsg({ type: 'err', text: 'Katılım başarısız, tekrar dene.' });
    }
  }

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
        <div className="w-80 bg-surface border border-border rounded-card p-8 text-center">
          <div
            className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent-cyan) 12%, transparent)', border: '2px solid var(--accent-cyan)' }}
          >
            <Lock size={24} strokeWidth={2.2} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <h2 className="text-primary text-xl font-black mb-2">Ebeveyn Paneli</h2>
          <p className="text-secondary text-sm font-semibold mb-6">4 haneli PIN gir</p>
          <input
            type="password"
            maxLength={4}
            value={pin}
            onChange={e => { setPin(e.target.value); setPinError(false); }}
            onKeyDown={e => e.key === 'Enter' && handlePinSubmit()}
            placeholder="••••"
            autoFocus
            className="w-full text-center text-2xl tracking-widest bg-muted border border-border rounded-control px-4 py-3 text-primary outline-none focus:border-accent-cyan mb-3"
          />
          {pinError && <p className="text-accent-red text-sm font-bold mb-3">Hatalı PIN</p>}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handlePinSubmit}>Gir</Button>
            <Button variant="secondary" onClick={() => setScreen('menu')}>İptal</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen screen-bg pb-10">
      {/* Header */}
      <header className="bg-surface border-b border-border px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3.5">
          <div className="w-[42px] h-[42px] rounded-control bg-elevated border border-border flex items-center justify-center">
            <Users size={20} strokeWidth={2.1} className="text-secondary" />
          </div>
          <div className="flex-1">
            <h1 className="m-0 text-[19px] font-black text-primary">Ebeveyn Paneli</h1>
            <p className="m-0 mt-0.5 text-[13px] font-semibold text-secondary">
              Çocuklarınızın ilerlemesini takip edin · {profiles.length} profil
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setView('settings')}>
            <Lock size={15} strokeWidth={2.2} />
            PIN Ayarları
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setScreen('menu')} className="!text-secondary hover:!text-primary">
            <ArrowLeft size={15} strokeWidth={2.4} />
            Kapat
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 pt-6">
        {/* Profil kartları */}
        {!statsLoaded ? (
          <div className="text-center text-secondary font-semibold py-20">İstatistikler yükleniyor...</div>
        ) : profiles.length === 0 ? (
          <div className="text-center text-secondary font-semibold py-20">Henüz profil yok.</div>
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
                <div key={profile.id} className="bg-surface border border-border rounded-panel p-5">
                  <div className="flex items-center gap-3.5 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                      style={{ background: `color-mix(in srgb, ${profile.color} 15%, transparent)`, border: `2px solid ${profile.color}`, color: profile.color }}
                    >
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="m-0 text-[15.5px] font-extrabold text-primary">{profile.name}</h3>
                      <p className="m-0 mt-0.5 text-xs font-semibold text-subtle">{stats.badges.length} rozet · {stats.currentStreak} gün seri</p>
                    </div>
                    {confirmDeleteProfile === profile.id ? (
                      <div className="flex gap-2 items-center">
                        <span className="text-accent-red text-xs font-bold">Emin misin?</span>
                        <Button variant="destructive" size="sm" onClick={async () => { await deleteProfile(profile.id); setConfirmDeleteProfile(null); }}>Sil</Button>
                        <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteProfile(null)}>İptal</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteProfile(profile.id)}
                        title="Profili sil"
                        className="w-9 h-9 rounded-[10px] bg-transparent border border-border text-subtle hover:text-accent-red hover:border-accent-red cursor-pointer flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={15} strokeWidth={2.1} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Tamamlanan Ders', value: completedCount, color: 'var(--accent-lime)' },
                      { label: 'Ort. WPM', value: avgWpm, color: 'var(--accent-cyan-soft)' },
                      { label: 'Ort. Doğruluk', value: `%${avgAcc}`, color: 'var(--accent-amber)' },
                      { label: 'Toplam Süre', value: hours > 0 ? `${hours}s ${mins}d` : `${mins}d`, color: 'var(--accent-purple)' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-muted rounded-control p-3">
                        <p className="m-0 text-xs font-bold text-subtle mb-1">{label}</p>
                        <p className="m-0 font-black text-lg" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Haftalık Özet */}
        {statsLoaded && profiles.length > 0 && (
          <div className="mt-6">
            <h2 className="flex items-center gap-2 text-xs font-black text-subtle uppercase tracking-[1.5px] mb-3">
              <Calendar size={14} strokeWidth={2.4} />
              Bu Haftanın Özeti
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profiles.map(profile => {
                const stats = profileStats[profile.id];
                if (!stats) return null;
                const w = getWeeklySummary(stats);
                const hasActivity = w.thisWeek > 0;

                return (
                  <div key={profile.id} className="bg-surface border border-border rounded-panel p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                        style={{ background: `color-mix(in srgb, ${profile.color} 15%, transparent)`, border: `2px solid ${profile.color}`, color: profile.color }}
                      >
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-primary font-extrabold text-sm">{profile.name}</span>
                    </div>

                    {!hasActivity ? (
                      <p className="m-0 text-subtle text-sm font-semibold text-center py-3">Bu hafta henüz ders yapılmadı</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="bg-muted rounded-control p-2.5 text-center">
                            <p className="m-0 font-black text-xl" style={{ color: 'var(--accent-lime)' }}>{w.thisWeek}</p>
                            <p className="m-0 text-xs font-bold text-subtle">ders</p>
                          </div>
                          <div className="bg-muted rounded-control p-2.5 text-center">
                            <p className="m-0 font-black text-xl" style={{ color: 'var(--accent-cyan-soft)' }}>{w.thisWpm}</p>
                            <p className="m-0 text-xs font-bold text-subtle">ort. WPM</p>
                          </div>
                          <div className="bg-muted rounded-control p-2.5 text-center">
                            {w.wpmDelta !== null ? (
                              <>
                                <p className="m-0 font-black text-xl" style={{ color: w.wpmDelta > 0 ? 'var(--accent-lime)' : w.wpmDelta < 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
                                  {w.wpmDelta > 0 ? '+' : ''}{w.wpmDelta}
                                </p>
                                <p className="m-0 text-xs font-bold text-subtle">WPM farkı</p>
                              </>
                            ) : (
                              <>
                                <p className="m-0 text-subtle font-black text-xl">—</p>
                                <p className="m-0 text-xs font-bold text-subtle">önceki hafta yok</p>
                              </>
                            )}
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={60}>
                          <BarChart data={w.days} barSize={14}>
                            <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={CHART_TOOLTIP_STYLE}
                              formatter={(v) => [`${v} ders`, '']}
                            />
                            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                              {w.days.map((d, i) => (
                                <Cell key={i} fill={d.count > 0 ? profile.color : 'var(--bg-border)'} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Karşılaştırma grafikleri */}
        {statsLoaded && profiles.length > 1 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-panel p-5">
              <p className="m-0 text-secondary text-sm font-extrabold mb-4">Ortalama WPM Karşılaştırması</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={profiles.map(p => ({
                  name: p.name,
                  wpm: profileStats[p.id]?.lessonStats.length
                    ? Math.round(profileStats[p.id].lessonStats.reduce((s, l) => s + l.bestWPM, 0) / profileStats[p.id].lessonStats.length)
                    : 0,
                  color: p.color,
                }))} barSize={32}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v) => [`${v} WPM`, 'Hız']}
                  />
                  <Bar dataKey="wpm" radius={[6, 6, 0, 0]}>
                    {profiles.map((p) => <Cell key={p.id} fill={p.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-surface border border-border rounded-panel p-5">
              <p className="m-0 text-secondary text-sm font-extrabold mb-4">Yetenek Profili</p>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={[
                  { subject: 'Hız',      ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.lessonStats.reduce((s,l)=>s+l.bestWPM,0)||0) / Math.max(1, profileStats[p.id]?.lessonStats.length||1))])) },
                  { subject: 'Doğruluk', ...Object.fromEntries(profiles.map(p => [p.name, Math.round((profileStats[p.id]?.lessonStats.reduce((s,l)=>s+l.bestAccuracy,0)||0) / Math.max(1, profileStats[p.id]?.lessonStats.length||1))])) },
                  { subject: 'Dersler',  ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.completedLessons.length||0) * 1.5)])) },
                  { subject: 'Seri',     ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.longestStreak||0) * 10)])) },
                  { subject: 'Rozetler', ...Object.fromEntries(profiles.map(p => [p.name, Math.min(100, (profileStats[p.id]?.badges.length||0) * 12)])) },
                ]}>
                  <PolarGrid stroke="var(--bg-border)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                  {profiles.map(p => (
                    <Radar key={p.id} name={p.name} dataKey={p.name} stroke={p.color} fill={p.color} fillOpacity={0.15} />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {profiles.map(p => (
                  <span key={p.id} className="flex items-center gap-1.5 text-xs font-bold text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sınıfa Katıl — sadece giriş yapılmışsa */}
        {user && statsLoaded && (
          <div className="mt-6 bg-surface border border-border rounded-panel p-5">
            <h3 className="m-0 flex items-center gap-2.5 text-primary text-[14.5px] font-extrabold mb-2">
              <GraduationCap size={18} strokeWidth={2.1} style={{ color: 'var(--accent-cyan-soft)' }} />
              Öğretmen Sınıfına Katıl
            </h3>
            <p className="m-0 text-xs font-semibold text-secondary mb-3">Öğretmeninizden aldığınız sınıf kodunu girin.</p>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <select
                value={selectedProfileId}
                onChange={e => setSelectedProfileId(e.target.value)}
                className="bg-muted border border-border rounded-[10px] px-3 py-2.5 text-primary text-sm font-bold outline-none focus:border-accent-cyan"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Örn. AB3XQ9"
                value={classCode}
                onChange={e => { setClassCode(e.target.value); setJoinMsg(null); }}
                onKeyDown={e => e.key === 'Enter' && handleJoinClass()}
                className="flex-1 bg-muted border border-border rounded-[10px] px-4 py-2.5 font-mono text-sm font-bold tracking-[2px] uppercase text-primary placeholder:text-subtle placeholder:normal-case placeholder:tracking-normal outline-none focus:border-accent-cyan"
              />
              <Button size="sm" onClick={handleJoinClass} disabled={!classCode.trim() || joinLoading}>
                {joinLoading
                  ? <span className="flex items-center gap-2"><Spinner size={14} /> Katılıyor...</span>
                  : 'Katıl'}
              </Button>
            </div>
            {joinMsg && (
              <p
                className="m-0 mt-3 text-xs font-bold px-3 py-2 rounded-lg"
                style={joinMsg.type === 'ok'
                  ? { color: 'var(--accent-lime)', background: 'color-mix(in srgb, var(--accent-lime) 10%, transparent)' }
                  : { color: 'var(--accent-red)', background: 'color-mix(in srgb, var(--accent-red) 10%, transparent)' }}
              >
                {joinMsg.text}
              </p>
            )}
          </div>
        )}

        {/* İpucu */}
        {statsLoaded && profiles.length > 0 && (
          <div
            className="mt-5 rounded-panel px-[18px] py-4 flex gap-3 items-start"
            style={{ background: 'color-mix(in srgb, var(--accent-cyan) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-cyan) 25%, transparent)' }}
          >
            <Info size={18} strokeWidth={2.2} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-cyan-soft)' }} />
            <p className="m-0 text-[13px] font-semibold text-secondary leading-normal">
              Günde 15-20 dakikalık kısa, düzenli pratikler uzun oturumlardan daha etkilidir. Çocuğunuzu seriyi bozmamaya teşvik edin.
            </p>
          </div>
        )}
      </div>

      {/* PIN Ayarları modalı */}
      <Modal open={view === 'settings'} onClose={() => setView('dashboard')} title="PIN Ayarları" width={400}
        icon={<Lock size={18} strokeWidth={2.2} style={{ color: 'var(--accent-cyan-soft)' }} />}>
        <div className="flex items-center justify-between py-3 border-b border-border mb-4">
          <span className="text-[14.5px] font-bold text-primary">PIN korumasını etkinleştir</span>
          <Toggle checked={pinEnabled} onChange={setPinEnabled} aria-label="PIN koruması" />
        </div>
        {pinEnabled && (
          <div className="mb-5">
            <p className="m-0 text-secondary text-sm font-bold mb-2">Yeni PIN (4 hane)</p>
            <input
              type="password"
              maxLength={4}
              value={newPin}
              onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full text-center text-2xl tracking-widest bg-muted border border-border rounded-control px-4 py-3 text-primary outline-none focus:border-accent-cyan"
            />
            <p className="m-0 text-subtle text-xs font-semibold mt-1.5">Boş bırakırsan mevcut PIN korunur</p>
          </div>
        )}
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleSaveSettings}>Kaydet</Button>
          <Button variant="secondary" onClick={() => setView('dashboard')}>İptal</Button>
        </div>
      </Modal>
    </div>
  );
}
