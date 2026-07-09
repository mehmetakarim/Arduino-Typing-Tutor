import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Award, BarChart3, Check, Copy, Download, Flame, GraduationCap,
  Lock, Mail, Plus, Presentation, Trash2,
} from 'lucide-react';
import { Spinner } from './Spinner';
import { useProgressStore } from '../store/progressStore';
import { useAuthStore } from '../store/authStore';
import { Button, Tabs } from './ui';
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

const RANK_COLORS = ['#FBBF24', '#CBD5E1', '#FB923C'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-surface border border-border rounded-panel p-4">
      <p className="m-0 text-subtle text-xs font-bold mb-1">{label}</p>
      <p className="m-0 text-primary text-2xl font-black">{value}</p>
      {sub && <p className="m-0 text-subtle text-xs font-semibold mt-0.5">{sub}</p>}
    </div>
  );
}

function WpmBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const color = value >= 40 ? 'var(--accent-lime)' : value >= 25 ? 'var(--accent-amber)' : 'var(--accent-cyan)';
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-bold w-8 text-right" style={{ color }}>{value}</span>
      <div className="w-24 h-1.5 rounded-full bg-elevated">
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
    toast(`Kaydedildi: İndirilenler/${filename}`);
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
          addToast(`${s.studentName} yeni bir ders tamamladı! (${s.completedLessons} ders)`);
        } else if (prev && s.avgWpm > prev.avgWpm) {
          addToast(`${s.studentName} WPM rekorunu kırdı! (${s.avgWpm} WPM)`);
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
    const { error, count } = await supabase
      .from('class_members')
      .delete({ count: 'exact' })
      .eq('class_id', selectedClass.id)
      .eq('profile_id', student.profileId);
    setDeleting(false);
    setDeleteTarget(null);
    if (!error && count && count > 0) {
      addToast(`${student.studentName} sınıftan çıkarıldı`);
      await loadStudents(selectedClass.id);
    } else {
      addToast('Silinemedi — yetki hatası olabilir');
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
    <div className="min-h-screen screen-bg pb-10 relative">
      {/* Toast bildirimleri */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="bg-surface border border-border text-primary text-sm font-bold px-4 py-2.5 rounded-panel animate-toast-in max-w-xs" style={{ boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
            {t.text}
          </div>
        ))}
      </div>

      {/* Üst bar */}
      <header className="bg-surface border-b border-border px-8 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3.5">
          <div
            className="w-[42px] h-[42px] rounded-control flex items-center justify-center"
            style={{ background: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-purple) 35%, transparent)' }}
          >
            <GraduationCap size={20} strokeWidth={2.1} style={{ color: 'var(--accent-purple)' }} />
          </div>
          <div className="flex-1">
            <h1 className="m-0 text-[19px] font-black text-primary">Öğretmen Paneli</h1>
            <p className="m-0 mt-0.5 text-[13px] font-semibold text-secondary">
              {user?.fullName || user?.email}{classes.length > 0 && ` · ${classes.length} sınıf`}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setScreen('profile-select')} className="!text-secondary hover:!text-primary">
            <ArrowLeft size={15} strokeWidth={2.4} />
            Geri
          </Button>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>Çıkış</Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 pt-5">
        {/* Sekmeler */}
        <div className="mb-6">
          <Tabs
            items={[
              { key: 'classes', label: 'Sınıflarım', icon: <Presentation size={15} strokeWidth={2.2} /> },
              { key: 'leaderboard', label: 'Sıralama', icon: <BarChart3 size={15} strokeWidth={2.2} /> },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {/* ── Sınıflar sekmesi ── */}
        {tab === 'classes' && (
          <div className="max-w-2xl">
            <div className="bg-surface border border-border rounded-panel p-5 mb-6">
              <h3 className="m-0 text-primary text-sm font-extrabold mb-3">Yeni Sınıf Oluştur</h3>
              <div className="flex gap-3">
                <input type="text" placeholder="Sınıf adı (ör. 5-A)" value={newClassName}
                  onChange={e => setNewClassName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createClass()}
                  className="flex-1 bg-muted border border-border rounded-control px-4 py-2.5 text-primary text-sm font-bold placeholder:text-subtle outline-none focus:border-accent-cyan" />
                <Button size="sm" onClick={createClass} disabled={!newClassName.trim() || loading}>
                  {loading
                    ? <span className="flex items-center gap-2"><Spinner size={14} />Oluşturuluyor...</span>
                    : <><Plus size={15} strokeWidth={2.6} />Oluştur</>}
                </Button>
              </div>
            </div>

            {classes.length === 0 ? (
              <p className="text-subtle text-sm font-semibold text-center py-8">Henüz sınıf oluşturmadınız.</p>
            ) : (
              <div className="grid gap-3">
                {classes.map(cls => (
                  <div key={cls.id} className="bg-surface border border-border hover:border-accent-purple rounded-panel p-5 flex items-center justify-between transition-colors">
                    <div className="min-w-0">
                      <p className="m-0 text-primary font-extrabold text-[15px]">{cls.name}</p>
                      <div
                        className="mt-2 inline-flex items-center gap-2.5 bg-base rounded-[10px] px-3 py-2"
                        style={{ border: '1px dashed var(--bg-border)' }}
                      >
                        <Lock size={13} strokeWidth={2.2} style={{ color: 'var(--accent-cyan-soft)' }} />
                        <span className="font-mono text-sm font-extrabold tracking-[2px]" style={{ color: 'var(--accent-cyan-soft)' }}>{cls.code}</span>
                        <button onClick={() => copyCode(cls.code)} title="Kopyala"
                          className="bg-transparent border-none cursor-pointer text-subtle hover:text-primary flex items-center transition-colors">
                          {copiedCode === cls.code ? <Check size={14} strokeWidth={2.6} style={{ color: 'var(--accent-lime)' }} /> : <Copy size={14} strokeWidth={2.2} />}
                        </button>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => { setSelectedClass(cls); setTab('leaderboard'); }}>
                      Sıralama →
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard sekmesi ── */}
        {tab === 'leaderboard' && (
          <div>
            {/* Sınıf seçici */}
            <div className="flex gap-2 mb-2 flex-wrap items-center">
              {classes.map(cls => {
                const active = selectedClass?.id === cls.id;
                return (
                  <button key={cls.id} onClick={() => setSelectedClass(cls)}
                    className="px-4 py-1.5 rounded-[10px] text-sm font-extrabold cursor-pointer transition-all"
                    style={active
                      ? { background: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)', color: 'var(--accent-purple)', border: '1px solid var(--accent-purple)' }
                      : { background: 'var(--bg-surface)', color: 'var(--text-muted)', border: '1px solid var(--bg-border)' }}>
                    {cls.name}
                  </button>
                );
              })}
              {selectedClass && (
                <span className="ml-auto flex items-center gap-1.5 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full" style={{ background: live ? 'var(--accent-lime)' : 'var(--bg-border)', animation: live ? 'pulse 2s infinite' : undefined }} />
                  <span style={{ color: live ? 'var(--accent-lime)' : 'var(--text-muted)' }}>{live ? 'Canlı' : 'Bağlanıyor...'}</span>
                </span>
              )}
            </div>
            {selectedClass && students.length > 0 && (
              <p className="m-0 mb-4 text-xs font-semibold text-subtle">Kendi gelişimine odaklan — herkes kendi hızında ilerliyor!</p>
            )}

            {!selectedClass ? (
              <p className="text-subtle text-sm font-semibold text-center py-12">Sıralama görmek için bir sınıf seçin.</p>
            ) : students.length === 0 ? (
              <div className="text-center py-12">
                <p className="m-0 text-secondary text-sm font-semibold mb-1">Bu sınıfta henüz öğrenci yok.</p>
                <p className="m-0 text-subtle text-xs font-semibold">
                  Katılım kodu: <span className="font-mono font-extrabold" style={{ color: 'var(--accent-cyan-soft)' }}>{selectedClass.code}</span>
                </p>
              </div>
            ) : (
              <>
                {/* Özet istatistik kartları */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 mt-2">
                  <StatCard label="Öğrenci" value={students.length} sub="sınıfta kayıtlı" />
                  <StatCard label="Sınıf Ort. WPM" value={classAvgWpm} sub="kelime/dakika" />
                  <StatCard label="Sınıf Ort. Doğruluk" value={`%${classAvgAcc}`} sub="ortalama" />
                  <StatCard label="Toplam Ders" value={totalLessons} sub="tüm öğrenciler" />
                </div>

                {/* Leaderboard tablosu */}
                <div className="bg-surface border border-border rounded-panel overflow-hidden mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-3 text-subtle font-bold w-10">#</th>
                        <th className="text-left px-5 py-3 text-subtle font-bold">Öğrenci</th>
                        <th className="px-5 py-3 text-subtle font-bold text-center">WPM</th>
                        <th className="text-right px-5 py-3 text-subtle font-bold">Doğruluk</th>
                        <th className="text-right px-5 py-3 text-subtle font-bold">Ders</th>
                        <th className="text-right px-5 py-3 text-subtle font-bold">Rozet</th>
                        <th className="text-right px-5 py-3 text-subtle font-bold">Son Aktif</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={s.profileId} className="border-b border-border hover:bg-elevated/40 transition-colors"
                          style={i === 0 ? { background: 'color-mix(in srgb, var(--accent-amber) 4%, transparent)' } : undefined}>
                          <td className="px-5 py-3 text-center">
                            <span className="text-base font-black" style={{ color: i < 3 ? RANK_COLORS[i] : 'var(--text-muted)' }}>{i + 1}</span>
                          </td>
                          <td className="px-5 py-3">
                            <p className="m-0 text-primary font-extrabold">{s.studentName}</p>
                            {s.longestStreak > 0 && (
                              <p className="m-0 mt-0.5 text-subtle text-xs font-semibold flex items-center gap-1">
                                <Flame size={11} strokeWidth={2.4} style={{ color: 'var(--accent-orange)' }} />
                                {s.longestStreak} günlük seri
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex justify-center">
                              <WpmBar value={s.avgWpm} max={maxWpm} />
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="font-mono text-sm font-bold" style={{ color: s.avgAccuracy >= 90 ? 'var(--accent-lime)' : s.avgAccuracy >= 75 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                              %{s.avgAccuracy}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right text-secondary font-bold">{s.completedLessons}</td>
                          <td className="px-5 py-3 text-right">
                            {s.badgeCount > 0 ? (
                              <span className="inline-flex items-center gap-1 text-secondary font-bold">
                                <Award size={13} strokeWidth={2.2} style={{ color: 'var(--accent-purple)' }} />
                                {s.badgeCount}
                              </span>
                            ) : <span className="text-subtle">—</span>}
                          </td>
                          <td className="px-5 py-3 text-right text-subtle text-xs font-semibold">{timeAgo(s.updatedAt)}</td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => { setNoteTarget(s); setNoteContent(''); setDeleteTarget(null); }}
                                className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg text-subtle hover:text-accent-cyan-soft hover:bg-elevated transition-colors"
                                title="Not bırak"
                              >
                                <Mail size={15} strokeWidth={2.2} />
                              </button>
                              <button
                                onClick={() => { setDeleteTarget(s); setNoteTarget(null); }}
                                className="bg-transparent border-none cursor-pointer p-1.5 rounded-lg text-subtle hover:text-accent-red transition-colors"
                                title="Sınıftan çıkar"
                              >
                                <Trash2 size={15} strokeWidth={2.2} />
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
                  <div
                    className="mt-4 rounded-panel p-4"
                    style={{ border: '1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)', background: 'color-mix(in srgb, var(--accent-red) 5%, transparent)' }}
                  >
                    <p className="m-0 text-sm font-extrabold mb-1 flex items-center gap-2" style={{ color: 'var(--accent-red)' }}>
                      <Trash2 size={14} strokeWidth={2.2} />
                      {deleteTarget.studentName} sınıftan çıkarılsın mı?
                    </p>
                    <p className="m-0 text-subtle text-xs font-semibold mb-3">
                      Bu işlem öğrencinin sınıf üyeliğini kaldırır. İlerleme verileri silinmez.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} className="!text-secondary">İptal</Button>
                      <Button variant="destructive" size="sm" disabled={deleting} onClick={() => removeStudent(deleteTarget)}>
                        {deleting ? 'Siliniyor…' : 'Evet, çıkar'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Not yazma kutusu */}
                {noteTarget && (
                  <div
                    className="mt-4 rounded-panel p-4"
                    style={{ border: '1px solid color-mix(in srgb, var(--accent-cyan) 30%, transparent)', background: 'color-mix(in srgb, var(--accent-cyan) 5%, transparent)' }}
                  >
                    <p className="m-0 text-sm font-extrabold mb-2 flex items-center gap-2" style={{ color: 'var(--accent-cyan-soft)' }}>
                      <Mail size={14} strokeWidth={2.2} />
                      {noteTarget.studentName} için not
                    </p>
                    <textarea
                      value={noteContent}
                      onChange={e => setNoteContent(e.target.value.slice(0, 500))}
                      placeholder="Öğrenciye bırakmak istediğin notu yaz… (max 500 karakter)"
                      className="w-full rounded-control bg-muted border border-border text-primary text-sm font-semibold p-3 resize-none outline-none focus:border-accent-cyan transition-colors placeholder:text-subtle"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-subtle text-xs font-semibold">{noteContent.length}/500</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setNoteTarget(null)} className="!text-secondary">İptal</Button>
                        <Button
                          size="sm"
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
                              addToast(`Not gönderildi: ${noteTarget.studentName}`);
                              setNoteTarget(null);
                              setNoteContent('');
                            } else {
                              addToast('Not gönderilemedi, tekrar dene');
                            }
                          }}
                        >
                          {noteSending ? 'Gönderiliyor…' : 'Gönder'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* CSV Rapor İndir */}
                <div className="flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => void downloadCsv(selectedClass.name, students, addToast)}>
                    <Download size={15} strokeWidth={2.2} />
                    CSV Rapor İndir
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
