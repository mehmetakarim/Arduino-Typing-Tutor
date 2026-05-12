import { useState } from 'react';
import { useProfileStore, PROFILE_COLORS } from '../store/profileStore';
import { useProgressStore } from '../store/progressStore';
import { Profile } from '../types';

export function ProfileSelect() {
  const { profiles, setActiveProfile, addProfile, deleteProfile } = useProfileStore();
  const { setScreen } = useProgressStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PROFILE_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function handleSelect(profile: Profile) {
    setLoading(true);
    await setActiveProfile(profile);
    setScreen('menu');
  }

  async function handleAdd() {
    if (!newName.trim()) return;
    setLoading(true);
    const profile = await addProfile(newName, selectedColor);
    await setActiveProfile(profile);
    setScreen('menu');
  }

  async function handleDelete(id: string) {
    await deleteProfile(id);
    setConfirmDelete(null);
  }

  return (
    <div className="min-h-screen screen-bg flex flex-col items-center justify-center p-8">
      {/* Başlık */}
      <div className="mb-10 text-center">
        <div className="text-5xl mb-3">⌨️</div>
        <h1 className="text-3xl font-bold text-white">Arduino Typing Tutor</h1>
        <p className="text-gray-400 mt-2">Profil seç veya yeni profil oluştur</p>
      </div>

      {/* Profil kartları */}
      <div className="flex flex-wrap justify-center gap-4 max-w-2xl mb-8">
        {profiles.map(profile => (
          <div key={profile.id} className="relative group">
            <button
              onClick={() => handleSelect(profile)}
              disabled={loading}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 hover:border-white/30 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#1A1A1B', minWidth: 140 }}
            >
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: profile.color }}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-white font-medium text-sm">{profile.name}</span>
            </button>

            {/* Sil butonu */}
            {confirmDelete === profile.id ? (
              <div className="absolute -top-2 -right-2 flex gap-1">
                <button
                  onClick={() => handleDelete(profile.id)}
                  className="w-6 h-6 bg-red-500 hover:bg-red-400 text-white text-xs rounded-full flex items-center justify-center"
                  title="Onayla"
                >✓</button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="w-6 h-6 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded-full flex items-center justify-center"
                  title="İptal"
                >✕</button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(profile.id)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 hover:bg-red-500 text-gray-400 hover:text-white text-xs rounded-full items-center justify-center hidden group-hover:flex transition-colors"
                title="Profili sil"
              >✕</button>
            )}
          </div>
        ))}

        {/* Yeni profil kartı */}
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-dashed border-white/20 hover:border-white/40 transition-all duration-200 hover:scale-105"
            style={{ backgroundColor: '#1A1A1B', minWidth: 140 }}
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-500 flex items-center justify-center text-3xl text-gray-500">
              +
            </div>
            <span className="text-gray-400 text-sm">Yeni Profil</span>
          </button>
        )}
      </div>

      {/* Yeni profil formu */}
      {showAdd && (
        <div
          className="w-full max-w-sm rounded-2xl border border-white/10 p-6"
          style={{ backgroundColor: '#1A1A1B' }}
        >
          <h3 className="text-white font-semibold mb-4">Yeni Profil Oluştur</h3>

          <input
            type="text"
            placeholder="İsim gir..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            maxLength={20}
            autoFocus
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-indigo-500 mb-4"
          />

          {/* Renk seçici */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {PROFILE_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: color,
                  outline: selectedColor === color ? `3px solid white` : 'none',
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={!newName.trim() || loading}
              className="flex-1 py-2.5 rounded-xl font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ backgroundColor: selectedColor }}
            >
              Oluştur
            </button>
            <button
              onClick={() => { setShowAdd(false); setNewName(''); }}
              className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white transition-colors"
              style={{ backgroundColor: '#242425' }}
            >
              İptal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
