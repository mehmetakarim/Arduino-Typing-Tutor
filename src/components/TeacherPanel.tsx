import { useState, useEffect } from 'react';
import { useProgressStore } from '../store/progressStore';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface ClassInfo {
  id: string;
  name: string;
  code: string;
}

interface StudentStat {
  profileId: string;
  studentName: string;
  avgWpm: number;
  avgAccuracy: number;
  completedLessons: number;
}

export function TeacherPanel() {
  const { setScreen } = useProgressStore();
  const { user, signOut } = useAuthStore();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }
  const [selectedClass, setSelectedClass] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentStat[]>([]);
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'classes' | 'students'>('classes');

  useEffect(() => {
    if (user) loadClasses();
  }, [user]);

  useEffect(() => {
    if (selectedClass) loadStudents(selectedClass.id);
  }, [selectedClass]);

  async function loadClasses() {
    if (!user) return;
    const { data } = await supabase
      .from('classes')
      .select('id, name, code')
      .eq('teacher_id', user.id)
      .order('name');
    if (data) setClasses(data);
  }

  async function loadStudents(classId: string) {
    const { data } = await supabase
      .from('class_leaderboard')
      .select('*')
      .eq('class_id', classId)
      .order('avg_wpm', { ascending: false });
    if (data) {
      setStudents(data.map((r: Record<string, unknown>) => ({
        profileId: r.profile_id as string,
        studentName: r.student_name as string,
        avgWpm: Math.round((r.avg_wpm as number) ?? 0),
        avgAccuracy: Math.round((r.avg_accuracy as number) ?? 0),
        completedLessons: (r.completed_lessons as number) ?? 0,
      })));
    }
  }

  async function createClass() {
    if (!newClassName.trim() || !user) return;
    setLoading(true);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
      .from('classes')
      .insert({ teacher_id: user.id, name: newClassName.trim(), code })
      .select()
      .single();
    setLoading(false);
    if (!error && data) {
      setNewClassName('');
      setClasses(prev => [...prev, data]);
    }
  }

  async function handleSignOut() {
    await signOut();
    setScreen('profile-select');
  }

  return (
    <div className="min-h-screen screen-bg p-6">
      {/* Üst bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Öğretmen Paneli</h1>
          <p className="text-gray-400 text-sm mt-0.5">{user?.fullName || user?.email}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setScreen('profile-select')}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            style={{ backgroundColor: '#242425' }}
          >
            ← Geri
          </button>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
            style={{ backgroundColor: '#242425' }}
          >
            Çıkış
          </button>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 mb-6">
        {(['classes', 'students'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              backgroundColor: tab === t ? '#6366F1' : '#1A1A1B',
              color: tab === t ? 'white' : '#9CA3AF',
              border: tab === t ? 'none' : '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {t === 'classes' ? '📚 Sınıflarım' : '👨‍🎓 Öğrenciler'}
          </button>
        ))}
      </div>

      {/* Sınıflar sekmesi */}
      {tab === 'classes' && (
        <div className="max-w-2xl">
          {/* Yeni sınıf oluştur */}
          <div
            className="rounded-2xl border border-white/10 p-5 mb-6"
            style={{ backgroundColor: '#1A1A1B' }}
          >
            <h3 className="text-white font-semibold mb-3">Yeni Sınıf Oluştur</h3>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Sınıf adı (ör. 5-A)"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createClass()}
                className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 outline-none focus:border-indigo-500 text-sm"
              />
              <button
                onClick={createClass}
                disabled={!newClassName.trim() || loading}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-40 transition-colors"
              >
                Oluştur
              </button>
            </div>
          </div>

          {/* Sınıf listesi */}
          {classes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">Henüz sınıf oluşturmadınız.</p>
          ) : (
            <div className="grid gap-3">
              {classes.map(cls => (
                <button
                  key={cls.id}
                  onClick={() => { setSelectedClass(cls); setTab('students'); }}
                  className="flex items-center justify-between p-5 rounded-2xl border border-white/10 hover:border-indigo-500/40 transition-all text-left"
                  style={{ backgroundColor: '#1A1A1B' }}
                >
                  <div>
                    <p className="text-white font-medium">{cls.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-gray-500 text-xs">Katılım kodu:</span>
                    <button
                      onClick={e => { e.stopPropagation(); copyCode(cls.code); }}
                      className="font-mono text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded transition-colors"
                      title="Kopyala"
                    >
                      {cls.code} {copiedCode === cls.code ? '✓' : '📋'}
                    </button>
                  </div>
                  </div>
                  <span className="text-gray-600 text-lg">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Öğrenciler sekmesi */}
      {tab === 'students' && (
        <div className="max-w-3xl">
          {/* Sınıf seç */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className="px-4 py-1.5 rounded-lg text-sm transition-all"
                style={{
                  backgroundColor: selectedClass?.id === cls.id ? '#6366F120' : '#1A1A1B',
                  color: selectedClass?.id === cls.id ? '#A5B4FC' : '#9CA3AF',
                  border: selectedClass?.id === cls.id ? '1px solid #6366F1' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {cls.name}
              </button>
            ))}
          </div>

          {!selectedClass ? (
            <p className="text-gray-500 text-sm text-center py-8">Bir sınıf seçin.</p>
          ) : students.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm mb-2">Bu sınıfta henüz öğrenci yok.</p>
              <p className="text-gray-600 text-xs">Öğrenciler katılım kodu ile <span className="font-mono text-indigo-400">{selectedClass.code}</span> katılabilir.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 overflow-hidden" style={{ backgroundColor: '#1A1A1B' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">#</th>
                    <th className="text-left px-5 py-3 text-gray-500 font-medium">Öğrenci</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Ort. WPM</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Doğruluk</th>
                    <th className="text-right px-5 py-3 text-gray-500 font-medium">Ders</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.profileId} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3 text-gray-600">{i + 1}</td>
                      <td className="px-5 py-3 text-white font-medium">{s.studentName}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-green-400 font-mono">{s.avgWpm}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-blue-400 font-mono">%{s.avgAccuracy}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-gray-300">{s.completedLessons}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
