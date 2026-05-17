import { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner } from './Spinner';
import { useProgressStore } from '../store/progressStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { downloadDir, join } from '@tauri-apps/api/path';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { addTeacherNote } from '../utils/storage';

function isTauri() { return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window; }

interface ClassInfo { id: string; name: string; code: string; }

interface StudentStat {
  profileId: string;
  studentName: string;
  avgWpm: number;
  avgAccuracy: number;
  completedLessons: number;
  badgeCount: number;
  longestStreak: number;
  updatedAt: string | null;
}

interface Toast { id: number; text: string; }

const MEDALS = ['🥇', '🥈', '🥉'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-4" style={{ backgroundColor: '#1A1A1B' }}>
      <p className="text-gray-500 text-xs mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-gray-600 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function WpmBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = value >= 40 ? '#10B981' : value >= 25 ? '#F59E0B' : '#6366F1';
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm w-8 text-right" style={{ color }}>{value}</span>
      <div className="w-24 h-1.5 rounded-full bg-white/5">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m}d önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s önce`;
  return `${Math.floor(h / 24)}g önce`;
}

async function downloadCsv(className: string, students: StudentStat[], toast: (msg: string) => void) {
  const rows = [
    ['Sıra', 'Öğrenci', 'Ort. WPM', 'Doğruluk (%)', 'Tamamlanan Ders', 'Rozet', 'En Uzun Seri', 'Son Güncelleme'],
    ...students.map((s, i) => [
      i + 1, s.studentName, s.avgWpm, s.avgAccuracy,
      s.completedLessons, s.badgeCount, s.longestStreak,
      s.updatedAt ? new Date(s.updatedAt).toLocaleString('tr-TR') : '-',
    ]),
  ];
  const csv = rows.map(r => r.join(',')).join('\n');
  const filename = `${className}-rapor-${new Date().toISOString().slice(0, 10)}.csv`;

  if (isTauri()) {
    // Tauri: İndirilenler klasörüne yaz
    const dir = await downloadDir();
    const filePath = await join(dir, filename);
    await writeTextFile(filePath, '﻿' + csv); // BOM — Excel Türkçe uyumu
    toast(`📥 Kaydedildi: İndirilenler/${filename}`);
  } else {
    // Tarayıcı fallback
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}

export function TeacherPanel() {
  const { setScreen } = useProgressStore();
  const { user, signOut } = useAuthStore();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'classes' | 'leaderboard'>('classes');
  const [live, setLive] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [noteTarget, setNoteTarget] = useState<StudentStat | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [noteSending, setNoteSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudentStat | null>(null);
  const [deleting, setDeleting] = useState(false);
  const toastId = useRef(0);
  const prevStudents = useRef<StudentStat[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const addToast = useCallback((text: string) => {
    const id = ++toastId.current;
    setToasts(t => [...t, { id, text }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  useEffect(() => { if (user) loadClasses(); }, [user]);

  useEffect(() => {
    if (!selectedClass) return;
    loadStudents(selectedClass.id);
    subscribeRealtime(selectedClass.id);
    return () => { channelRef.current?.unsubscribe(); setLive(false); };
  }, [selectedClass]);

  async function loadClasses() {
    if (!user) return;
    const { data } = await supabase.from('classes').select('id, name, code').eq('teacher_id', user.id).order('name');
    if (data) setClasses(data);
  }

  async function loadStudents(classId: string) {
    const { data } = await supabase
      .from('class_leaderboard')
      .select('*')
      .eq('class_id', classId)
      .order('avg_wpm', { ascending: false });
    if (!data) return;
    const parsed: StudentStat[] = data.map((r: Record<string, unknown>) => ({
      profileId: r.profile_id as string,
      studentName: r.student_name as string,
      avgWpm: Math.round((r.avg_wpm as number) ?? 0),
      avgAccuracy: Math.round((r.avg_accuracy as number) ?? 0),
      completedLessons: (r.completed_lessons as number) ?? 0,
      badgeCount: (r.badge_count as number) ?? 0,
      longestStreak: (r.longest_streak as number) ?? 0,
      updatedAt: r.updated_at as string | null,
    }));

    // Değişen öğrencileri bul → bildirim
    if (prevStudents.current.length > 0) {
      parsed.forEach(s => {
        const prev = prevStudents.current.find(p => p.profileId === s.profileId);
        if (prev && s.completedLessons > prev.completedLessons) {
          addToast(`📚 ${s.studentName} yeni bir ders tamamladı! (${s.completedLessons} ders)`);
        } else if (prev && s.avgWpm > prev.avgWpm) {
          addToast(`⚡ ${s.studentName} WPM rekorunu kırdı! (${s.avgWpm} WPM)`);
        }
      });
    }
    prevStudents.current = parsed;
    setStudents(parsed);
  }

  function subscribeRealtime(classId: string) {
    channelRef.current?.unsubscribe();
    const ch = supabase.channel(`leaderboard-${classId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'progress' },
        () => loadStudents(classId))
      .subscribe(status => setLive(status === 'SUBSCRIBED'));
    channelRef.current = ch;
  }

  async function createClass() {
    if (!newClassName.trim() || !user) return;
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from('classes').insert({ teacher_id: user.id, name: newClassName.trim(), code })
      .select().single();
    setLoading(false);
    if (!error && data) { setNewClassName(''); setClasses(prev => [...prev, data]); }
  }

  async function removeStudent(student: StudentStat) {
    if (!selectedClass) return;
    setDeleting(true);
    const { error } = await supabase
      .from('class_members')
      .delete()
      .eq('class_id', selectedClass.id)
      .eq('profile_id', student.profileId);
    setDeleting(false);
    setDeleteTarget(null);
    if (!error) {
      addToast(`🗑️ ${student.studentName} sınıftan çıkarıldı`);
      await loadStudents(selectedClass.id);
    } else {
      addToast('❌ Silinemedi, tekrar dene');
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function handleSignOut() { await signOut(); setScreen('profile-select'); }

  // Özet istatistikler
  const classAvgWpm = students.length ? Math.round(students.reduce((s, x) => s + x.avgWpm, 0) / students.length) : 0;
  const classAvgAcc = students.length ? Math.round(students.reduce((s, x) => s + x.avgAccuracy, 0) / students.length) : 0;
  const totalLessons = students.reduce((s, x) => s + x.completedLessons, 0);
  const maxWpm = Math.max(...students.map(s => s.avgWpm), 1);

  return (
    <div className="min-h-screen screen-bg p-6 relative">
      {/* Toast bildirimleri */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl animate-slide-up max-w-xs">
            {t.text}
          </div>
        ))}
      </div>

      {/* Üst bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Öğretmen Paneli</h1>
          <p className="text-gray-400 text-sm mt-0.5">{user?.fullName || user?.email}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setScreen('profile-select')} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ backgroundColor: '#242425' }}>← Geri</button>
          <button onClick={handleSignOut} className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ backgroundColor: '#242425' }}>Çıkış</button>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {(['classes', 'leaderboard'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t ? '#6366F1' : '#1A1A1B', color: tab === t ? 'white' : '#9CA3AF', border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
            {t === 'classes' ? '📚 Sınıflarım' : '🏆 Leaderboard'}
          </button>
        ))}
      </div>

      {/* ── Sınıflar sekmesi ── */}
      {tab === 'classes' && (
        <div className="max-w-2xl">
          <div className="rounded-2xl border border-white/10 p-5 mb-6" style={{ backgroundColor: '#1A1A1B' }}>
            <h3 className="text-white font-semibold mb-3">Yeni Sınıf Oluştur</h3>
            <div className="flex gap-3">
              <input type="text" placeholder="Sınıf adı (ör. 5-A)" value={newClassName}
                onChange={e => setNewClassName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createClass()}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 text-sm" />
              <button onClick={createClass} disabled={!newClassName.trim() || loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-40 transition-colors">
                {loading ? <span className="flex items-center gap-2"><Spinner size={14} />Oluşturuluyor...</span> : 'Oluştur'}
              </button>
            </div>
          </div>

          {classes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Henüz sınıf oluşturmadınız.</p>
          ) : (
            <div className="grid gap-3">
              {classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-5 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all" style={{ backgroundColor: '#1A1A1B' }}>
                  <div>
                    <p className="text-white font-medium">{cls.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-500 text-xs">Katılım kodu:</span>
                      <button onClick={() => copyCode(cls.code)}
                        className="font-mono text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors" title="Kopyala">
                        {cls.code} {copiedCode === cls.code ? '✓' : '📋'}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedClass(cls); setTab('leaderboard'); }}
                    className="px-4 py-1.5 rounded-lg text-xs font-medium text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-colors">
                    Leaderboard →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Leaderboard sekmesi ── */}
      {tab === 'leaderboard' && (
        <div className="max-w-4xl">
          {/* Sınıf seçici */}
          <div className="flex gap-2 mb-5 flex-wrap items-center">
            {classes.map(cls => (
              <button key={cls.id} onClick={() => setSelectedClass(cls)}
                className="px-4 py-1.5 rounded-lg text-sm transition-all"
                style={{ backgroundColor: selectedClass?.id === cls.id ? '#6366F120' : '#1A1A1B', color: selectedClass?.id === cls.id ? '#A5B4FC' : '#9CA3AF', border: selectedClass?.id === cls.id ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.08)' }}>
                {cls.name}
              </button>
            ))}
            {selectedClass && (
              <span className="ml-auto flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${live ? 'bg-green-400' : 'bg-gray-600'}`} style={live ? { animation: 'pulse 2s infinite' } : {}} />
                <span className={live ? 'text-green-400' : 'text-gray-500'}>{live ? 'Canlı' : 'Bağlanıyor...'}</span>
              </span>
            )}
          </div>

          {!selectedClass ? (
            <p className="text-gray-500 text-sm text-center py-12">Leaderboard görmek için bir sınıf seçin.</p>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-1">Bu sınıfta henüz öğrenci yok.</p>
              <p className="text-gray-600 text-xs">Katılım kodu: <span className="font-mono text-indigo-400">{selectedClass.code}</span></p>
            </div>
          ) : (
            <>
              {/* Özet istatistik kartları */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard label="Öğrenci" value={students.length} sub="sınıfta kayıtlı" />
                <StatCard label="Sınıf Ort. WPM" value={classAvgWpm} sub="kelime/dakika" />
                <StatCard label="Sınıf Ort. Doğruluk" value={`%${classAvgAcc}`} sub="ortalama" />
                <StatCard label="Toplam Ders" value={totalLessons} sub="tüm öğrenciler" />
              </div>

              {/* Leaderboard tablosu */}
              <div className="rounded-2xl border border-white/10 overflow-hidden mb-4" style={{ backgroundColor: '#1A1A1B' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-5 py-3 text-gray-500 font-medium w-10">#</th>
                      <th className="text-left px-5 py-3 text-gray-500 font-medium">Öğrenci</th>
                      <th className="px-5 py-3 text-gray-500 font-medium text-center">WPM</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">Doğruluk</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">Ders</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">Rozet</th>
                      <th className="text-right px-5 py-3 text-gray-500 font-medium">Son Aktif</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.profileId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3 text-center">
                          {i < 3 ? <span className="text-base">{MEDALS[i]}</span> : <span className="text-gray-600">{i + 1}</span>}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-white font-medium">{s.studentName}</p>
                          {s.longestStreak > 0 && (
                            <p className="text-gray-600 text-xs">🔥 {s.longestStreak} günlük seri</p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center">
                            <WpmBar value={s.avgWpm} max={maxWpm} />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className={`font-mono text-sm ${s.avgAccuracy >= 90 ? 'text-green-400' : s.avgAccuracy >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                            %{s.avgAccuracy}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-300">{s.completedLessons}</td>
                        <td className="px-5 py-3 text-right text-gray-400">{s.badgeCount > 0 ? `🏅 ${s.badgeCount}` : '—'}</td>
                        <td className="px-5 py-3 text-right text-gray-600 text-xs">{timeAgo(s.updatedAt)}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setNoteTarget(s); setNoteContent(''); setDeleteTarget(null); }}
                              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                              title="Not bırak"
                            >
                              📝
                            </button>
                            <button
                              onClick={() => { setDeleteTarget(s); setNoteTarget(null); }}
                              className="text-xs text-red-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
                              title="Sınıftan çıkar"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Öğrenci silme onay kutusu */}
              {deleteTarget && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                  <p className="text-red-300 text-sm font-semibold mb-1">
                    🗑️ {deleteTarget.studentName} sınıftan çıkarılsın mı?
                  </p>
                  <p className="text-gray-500 text-xs mb-3">
                    Bu işlem öğrencinin sınıf üyeliğini kaldırır. İlerleme verileri silinmez.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setDeleteTarget(null)}
                      className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      disabled={deleting}
                      onClick={() => removeStudent(deleteTarget)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-600 disabled:opacity-40 text-white transition-colors"
                    >
                      {deleting ? 'Siliniyor…' : 'Evet, çıkar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Not yazma modalı */}
              {noteTarget && (
                <div className="mt-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
                  <p className="text-indigo-300 text-sm font-semibold mb-2">
                    📝 {noteTarget.studentName} için not
                  </p>
                  <textarea
                    value={noteContent}
                    onChange={e => setNoteContent(e.target.value.slice(0, 500))}
                    placeholder="Öğrenciye bırakmak istediğin notu yaz… (max 500 karakter)"
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm p-3 resize-none outline-none focus:border-indigo-500/50 transition-colors"
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600 text-xs">{noteContent.length}/500</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNoteTarget(null)}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        disabled={!noteContent.trim() || noteSending}
                        onClick={async () => {
                          if (!user || !selectedClass || !noteContent.trim()) return;
                          setNoteSending(true);
                          const ok = await addTeacherNote(
                            user.id,
                            selectedClass.id,
                            noteTarget.profileId,
                            noteTarget.studentName,
                            noteContent,
                          );
                          setNoteSending(false);
                          if (ok) {
                            addToast(`✅ Not gönderildi: ${noteTarget.studentName}`);
                            setNoteTarget(null);
                            setNoteContent('');
                          } else {
                            addToast('❌ Not gönderilemedi, tekrar dene');
                          }
                        }}
                        className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
                      >
                        {noteSending ? 'Gönderiliyor…' : 'Gönder'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* CSV Rapor İndir */}
              <div className="flex justify-end">
                <button
                  onClick={() => void downloadCsv(selectedClass.name, students, addToast)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                  style={{ backgroundColor: '#1A1A1B' }}
                >
                  📊 CSV Rapor İndir
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
