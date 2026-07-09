import { useState } from 'react';
import { GraduationCap, LogIn, Plus, Trash2, Users } from 'lucide-react';
import { useProfileStore, PROFILE_COLORS } from '../store/profileStore';
import { Spinner } from './Spinner';
import { useProgressStore } from '../store/progressStore';
import { useAuthStore } from '../store/authStore';
import { AuthScreen } from './AuthScreen';
import { Button, Modal } from './ui';
import { Profile } from '../types';

/* ── Robot avatar seti — Arduino bileşen karakterleri ─────────────────
   profile.emoji alanında "av:<id>" olarak saklanır; eski emoji kayıtları
   olduğu gibi gösterilmeye devam eder (geriye dönük uyum). */
const FACE = 'rgba(6,13,26,.78)';
const METAL = '#94A3B8';

function RobotAvatar({ id, color, size = 58 }: { id: string; color: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 64 64', fill: 'none' as const };
  switch (id) {
    case 'led': return (
      <svg {...common}>
        <path d="M20 30a12 12 0 0 1 24 0v10a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4z" fill={color} />
        <rect x="25" y="46" width="3.5" height="10" rx="1.5" fill={METAL} /><rect x="35.5" y="46" width="3.5" height="10" rx="1.5" fill={METAL} />
        <circle cx="27" cy="30" r="3" fill={FACE} /><circle cx="37" cy="30" r="3" fill={FACE} />
        <path d="M27.5 37c2 2 7 2 9 0" stroke={FACE} strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="26" cy="22" r="3" fill="#FFFFFF" opacity=".5" />
      </svg>);
    case 'chip': return (
      <svg {...common}>
        <rect x="14" y="16" width="36" height="32" rx="8" fill={color} />
        <rect x="18" y="8" width="4" height="10" rx="2" fill={METAL} /><rect x="30" y="8" width="4" height="10" rx="2" fill={METAL} /><rect x="42" y="8" width="4" height="10" rx="2" fill={METAL} />
        <rect x="18" y="46" width="4" height="10" rx="2" fill={METAL} /><rect x="30" y="46" width="4" height="10" rx="2" fill={METAL} /><rect x="42" y="46" width="4" height="10" rx="2" fill={METAL} />
        <circle cx="26" cy="29" r="3.2" fill={FACE} /><circle cx="38" cy="29" r="3.2" fill={FACE} />
        <path d="M26.5 37c2.2 2.4 8.8 2.4 11 0" stroke={FACE} strokeWidth="2.4" strokeLinecap="round" />
      </svg>);
    case 'motor': return (
      <svg {...common}>
        <circle cx="32" cy="34" r="17" fill={color} />
        <rect x="29.5" y="8" width="5" height="12" rx="2.5" fill={METAL} />
        <path d="M15 25l-5-4M49 25l5-4M15 43l-5 4M49 43l5 4" stroke={METAL} strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="26" cy="31" r="3" fill={FACE} /><circle cx="38" cy="31" r="3" fill={FACE} />
        <path d="M27 39c2 2 8 2 10 0" stroke={FACE} strokeWidth="2.4" strokeLinecap="round" />
      </svg>);
    case 'buzzer': return (
      <svg {...common}>
        <rect x="16" y="20" width="32" height="28" rx="10" fill={color} />
        <path d="M50 26c3 3 3 11 0 14M54 22c5 5 5 15 0 20" stroke={color} strokeWidth="3" strokeLinecap="round" opacity=".55" />
        <circle cx="27" cy="31" r="3" fill={FACE} /><circle cx="37" cy="31" r="3" fill={FACE} />
        <path d="M27.5 38c2 2 7 2 9 0" stroke={FACE} strokeWidth="2.4" strokeLinecap="round" />
      </svg>);
    case 'battery': return (
      <svg {...common}>
        <rect x="18" y="16" width="28" height="38" rx="8" fill={color} />
        <rect x="26" y="9" width="12" height="8" rx="3" fill={METAL} />
        <path d="M33 26l-5 8h4l-2 7 6-9h-4z" fill="#FDE68A" />
        <circle cx="26" cy="42" r="2.6" fill={FACE} /><circle cx="38" cy="42" r="2.6" fill={FACE} />
      </svg>);
    case 'sensor': return (
      <svg {...common}>
        <circle cx="32" cy="32" r="18" fill={color} />
        <circle cx="32" cy="32" r="11" fill="none" stroke={FACE} strokeWidth="2.4" opacity=".5" />
        <circle cx="27" cy="30" r="3" fill={FACE} /><circle cx="37" cy="30" r="3" fill={FACE} />
        <path d="M27.5 37c2 2 7 2 9 0" stroke={FACE} strokeWidth="2.4" strokeLinecap="round" />
        <rect x="29.5" y="50" width="5" height="8" rx="2.5" fill={METAL} />
      </svg>);
    default: return null;
  }
}

const ROBOT_IDS = ['led', 'chip', 'motor', 'buzzer', 'battery', 'sensor'];

function ProfileAvatar({ profile, size = 58 }: { profile: Profile; size?: number }) {
  if (profile.emoji?.startsWith('av:')) {
    return <RobotAvatar id={profile.emoji.slice(3)} color={profile.color} size={size} />;
  }
  if (profile.emoji) {
    return <span style={{ fontSize: size * 0.6 }}>{profile.emoji}</span>;
  }
  return <span className="font-black text-white" style={{ fontSize: size * 0.45 }}>{profile.name.charAt(0).toUpperCase()}</span>;
}

/* Maskot: Volti — göz kırpan robot */
function Volti() {
  return (
    <svg width="92" height="84" viewBox="0 0 100 92" fill="none" className="animate-floaty">
      <rect x="22" y="26" width="56" height="46" rx="14" fill="var(--bg-elevated)" stroke="var(--accent-cyan)" strokeWidth="2.5" />
      <rect x="30" y="12" width="5" height="16" rx="2.5" fill="var(--accent-cyan)" />
      <rect x="65" y="12" width="5" height="16" rx="2.5" fill="var(--accent-cyan)" />
      <circle cx="32.5" cy="10" r="4" fill="var(--accent-lime)" />
      <circle cx="67.5" cy="10" r="4" fill="var(--accent-lime)" />
      <g style={{ animation: 'blink 4s ease-in-out infinite', transformOrigin: '50px 46px' }}>
        <circle cx="39" cy="46" r="6" fill="var(--accent-cyan-soft)" />
        <circle cx="61" cy="46" r="6" fill="var(--accent-cyan-soft)" />
      </g>
      <path d="M40 58c3.5 4 16.5 4 20 0" stroke="var(--accent-cyan-soft)" strokeWidth="3" strokeLinecap="round" />
      <rect x="12" y="40" width="10" height="5" rx="2.5" fill="var(--accent-cyan)" opacity=".6" />
      <rect x="78" y="40" width="10" height="5" rx="2.5" fill="var(--accent-cyan)" opacity=".6" />
      <rect x="12" y="52" width="10" height="5" rx="2.5" fill="var(--accent-cyan)" opacity=".6" />
      <rect x="78" y="52" width="10" height="5" rx="2.5" fill="var(--accent-cyan)" opacity=".6" />
      <rect x="42" y="72" width="16" height="8" rx="4" fill="var(--bg-border)" />
    </svg>
  );
}

export function ProfileSelect() {
  const { profiles, setActiveProfile, addProfile, deleteProfile } = useProfileStore();
  const { setScreen } = useProgressStore();

  const { user, signOut } = useAuthStore();
  const [showAuth, setShowAuth] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0]);
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [loading, setLoading] = useState<string | null>(null); // seçilen profil id'si
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleSelect(profile: Profile) {
    setLoading(profile.id);
    await setActiveProfile(profile);
    setScreen('menu');
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading('new');
    const profile = await addProfile(newName, selectedColor, selectedEmoji);
    await setActiveProfile(profile);
    setScreen('menu');
  }

  async function handleDelete(id: string) {
    await deleteProfile(id);
    setConfirmDelete(null);
  }

  const deleteTarget = profiles.find(p => p.id === confirmDelete);

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: 'radial-gradient(1200px 600px at 50% -10%, color-mix(in srgb, var(--accent-cyan) 6%, var(--bg-base)) 0%, var(--bg-base) 60%)' }}
    >
      {showAuth && <AuthScreen onClose={async () => {
        setShowAuth(false);
        const { user } = useAuthStore.getState();
        if (user?.role === 'teacher') {
          setScreen('teacher-panel');
        } else if (user) {
          // Ebeveyn: Supabase'den profilleri çek ve store'u güncelle
          await useProfileStore.getState().reloadProfilesFromCloud();
        }
      }} />}

      {/* Üst bar: giriş/çıkış */}
      <div className="flex justify-end items-center gap-2.5 px-7 py-[18px]">
        {user ? (
          <>
            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-secondary">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent-lime)' }} />
              {user.fullName || user.email}
            </span>
            {user.role === 'teacher' && (
              <button
                onClick={() => setScreen('teacher-panel')}
                className="inline-flex items-center gap-2 text-[13.5px] font-extrabold px-4 py-2.5 rounded-control cursor-pointer transition-colors"
                style={{ background: 'color-mix(in srgb, var(--accent-purple) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-purple) 40%, transparent)', color: 'var(--accent-purple)' }}
              >
                <GraduationCap size={15} strokeWidth={2.2} />
                Öğretmen Paneli
              </button>
            )}
            {user.role === 'parent' && (
              <button
                onClick={() => setScreen('parent-panel')}
                className="inline-flex items-center gap-2 text-[13.5px] font-extrabold px-4 py-2.5 rounded-control cursor-pointer transition-colors bg-elevated border border-border text-secondary hover:text-primary"
              >
                <Users size={15} strokeWidth={2.2} />
                Ebeveyn Paneli
              </button>
            )}
            <Button variant="secondary" size="sm" onClick={() => signOut()}>Çıkış</Button>
          </>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowAuth(true)}>
            <LogIn size={15} strokeWidth={2.2} />
            Ebeveyn / Öğretmen Girişi
          </Button>
        )}
      </div>

      {/* Orta */}
      <div className="flex-1 flex flex-col items-center justify-center pb-16 px-6">
        <Volti />
        <h1 className="m-0 mt-3.5 text-[34px] font-black tracking-tight text-primary">Kim kodluyor?</h1>
        <p className="m-0 mt-2 text-[15.5px] font-semibold text-secondary">Profilini seç veya yeni bir tane oluştur</p>

        {/* Profil kartları */}
        <div className="flex flex-wrap justify-center gap-[22px] mt-10 max-w-4xl">
          {profiles.map(profile => (
            <div key={profile.id} className="relative group">
              <button
                onClick={() => handleSelect(profile)}
                disabled={loading !== null}
                className="w-[170px] bg-surface rounded-3xl pt-[22px] pb-[18px] px-4 text-center cursor-pointer transition-all duration-150 hover:-translate-y-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ border: '2px solid var(--bg-border)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = profile.color;
                  e.currentTarget.style.boxShadow = `0 0 28px ${profile.color}40`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--bg-border)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  className="w-24 h-24 mx-auto rounded-full flex items-center justify-center"
                  style={{ background: `color-mix(in srgb, ${profile.color} 10%, transparent)`, border: `3px solid ${profile.color}` }}
                >
                  {loading === profile.id ? <Spinner size={24} color="#fff" /> : <ProfileAvatar profile={profile} />}
                </div>
                <div className="text-[17px] font-black mt-3.5 text-primary">{profile.name}</div>
              </button>

              {/* Sil butonu — giriş yapılmışsa gizle (silme sadece Ebeveyn Paneli'nden) */}
              {!user && (
                <button
                  onClick={() => setConfirmDelete(profile.id)}
                  title="Profili sil"
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-elevated border border-border text-subtle hover:text-accent-red hover:border-accent-red cursor-pointer items-center justify-center hidden group-hover:flex transition-colors"
                >
                  <Trash2 size={14} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}

          {/* Yeni profil kartı */}
          <button
            onClick={() => setShowAdd(true)}
            className="w-[170px] bg-transparent rounded-3xl pt-[22px] pb-[18px] px-4 flex flex-col items-center justify-center cursor-pointer transition-all duration-150"
            style={{ border: '2px dashed var(--bg-border)' }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
              e.currentTarget.style.background = 'color-mix(in srgb, var(--accent-cyan) 4%, transparent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--bg-border)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ border: '2px dashed var(--bg-border)' }}>
              <Plus size={34} strokeWidth={2.4} className="text-subtle" />
            </div>
            <div className="text-[17px] font-black mt-3.5 text-secondary">Yeni Profil</div>
          </button>
        </div>
      </div>

      {/* Yeni profil modalı */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setNewName(''); }} title="Yeni Profil Oluştur" width={460}>
        <label className="block text-xs font-black tracking-wider uppercase text-subtle mb-2">İsim</label>
        <input
          type="text"
          placeholder="Adını yaz..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          maxLength={20}
          autoFocus
          className="w-full bg-muted border border-border rounded-control px-4 py-3 text-[15px] font-bold text-primary placeholder:text-subtle outline-none focus:border-accent-cyan"
        />

        <label className="block text-xs font-black tracking-wider uppercase text-subtle mt-[18px] mb-2">Avatarını Seç</label>
        <div className="grid grid-cols-7 gap-2">
          <button
            onClick={() => setSelectedEmoji('')}
            title="Baş harf"
            className="aspect-square rounded-[14px] bg-muted flex items-center justify-center cursor-pointer text-base font-black"
            style={{ border: `2px solid ${selectedEmoji === '' ? 'var(--accent-cyan)' : 'transparent'}`, color: selectedEmoji === '' ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
          >
            {newName.trim().charAt(0).toUpperCase() || 'A'}
          </button>
          {ROBOT_IDS.map(id => (
            <button
              key={id}
              onClick={() => setSelectedEmoji(`av:${id}`)}
              className="aspect-square rounded-[14px] bg-muted flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              style={{ border: `2px solid ${selectedEmoji === `av:${id}` ? 'var(--accent-cyan)' : 'transparent'}` }}
            >
              <RobotAvatar id={id} color={selectedColor} size={40} />
            </button>
          ))}
        </div>

        <label className="block text-xs font-black tracking-wider uppercase text-subtle mt-[18px] mb-2">Rengini Seç</label>
        <div className="flex gap-2.5 flex-wrap">
          {PROFILE_COLORS.map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className="w-[34px] h-[34px] rounded-full cursor-pointer transition-transform hover:scale-110"
              style={{
                background: color,
                border: '3px solid transparent',
                outline: selectedColor === color ? `3px solid color-mix(in srgb, ${color} 60%, white)` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>

        <Button
          className="w-full mt-6"
          onClick={handleAdd}
          disabled={!newName.trim() || loading !== null}
        >
          {loading === 'new' ? <Spinner size={18} color="#fff" /> : 'Profili Oluştur'}
        </Button>
      </Modal>

      {/* Silme onayı */}
      <Modal open={!!deleteTarget} onClose={() => setConfirmDelete(null)} width={420} accent="color-mix(in srgb, var(--accent-red) 40%, transparent)">
        {deleteTarget && (
          <div className="text-center">
            <div
              className="w-[60px] h-[60px] mx-auto mb-3.5 rounded-full flex items-center justify-center"
              style={{ background: 'color-mix(in srgb, var(--accent-red) 12%, transparent)', border: '2px solid var(--accent-red)' }}
            >
              <Trash2 size={26} strokeWidth={2.2} style={{ color: 'var(--accent-red)' }} />
            </div>
            <h2 className="m-0 mb-2 text-xl font-black text-primary">"{deleteTarget.name}" profili silinsin mi?</h2>
            <p className="m-0 mb-[22px] text-sm font-semibold text-secondary">
              Tüm ilerleme, rozetler ve istatistikler kalıcı olarak silinir. Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-2.5 justify-center">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Vazgeç</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteTarget.id)}>Evet, Sil</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
