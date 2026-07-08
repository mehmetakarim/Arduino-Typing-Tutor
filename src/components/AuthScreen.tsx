import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../lib/supabase';
import { Spinner } from './Spinner';

type Mode = 'login' | 'register' | 'forgot' | 'set-password';

interface AuthScreenProps {
  onClose: () => void;
  initialMode?: Mode;
}

export function AuthScreen({ onClose, initialMode = 'login' }: AuthScreenProps) {
  const { signIn, signUp, resetPassword, updatePassword, loading, error, clearError } = useAuthStore();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [role, setRole] = useState<UserRole>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [success, setSuccess] = useState('');

  function switchMode(m: Mode) {
    setMode(m);
    clearError();
    setSuccess('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'login') {
      const ok = await signIn(email, password);
      if (ok) onClose();
    } else if (mode === 'register') {
      const ok = await signUp(email, password, fullName, role);
      if (ok) {
        setSuccess('Kayıt başarılı! Giriş yapılıyor...');
        setTimeout(onClose, 1200);
      }
    } else if (mode === 'forgot') {
      const ok = await resetPassword(email);
      if (ok) setSuccess('Şifre sıfırlama bağlantısı e-posta adresine gönderildi.');
    } else {
      const ok = await updatePassword(password);
      if (ok) {
        setSuccess('Şifreniz güncellendi! Giriş yapılıyor...');
        setTimeout(onClose, 1500);
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in">
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 p-8 animate-slide-up"
        style={{ backgroundColor: '#1A1A1B' }}
      >
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white text-xl font-bold">
            {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Hesap Oluştur' : mode === 'forgot' ? 'Şifremi Unuttum' : 'Şifremi Değiştir'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Rol seçimi — sadece kayıt modunda */}
          {mode === 'register' && (
            <div>
              <p className="text-gray-400 text-xs mb-2">Hesap türü</p>
              <div className="grid grid-cols-2 gap-2">
                {([['parent', '👪', 'Ebeveyn'], ['teacher', '👨‍🏫', 'Öğretmen']] as const).map(([r, emoji, label]) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all"
                    style={{
                      borderColor: role === r ? '#6366F1' : '#2E2E2F',
                      backgroundColor: role === r ? '#6366F120' : '#242425',
                      color: role === r ? '#A5B4FC' : '#9CA3AF',
                    }}
                  >
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ad Soyad — sadece kayıt */}
          {mode === 'register' && (
            <input
              type="text"
              placeholder="Ad Soyad"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-indigo-500 text-sm"
            />
          )}

          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-indigo-500 text-sm"
          />

          {mode !== 'forgot' && (
            <>
              <input
                type="password"
                placeholder={mode === 'set-password' ? 'Yeni Şifre (en az 6 karakter)' : 'Şifre'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none focus:border-indigo-500 text-sm"
              />
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 text-right transition-colors -mt-2"
                >
                  Şifremi unuttum
                </button>
              )}
            </>
          )}

          {error && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {success && (
            <p className="text-green-400 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={16} /> Lütfen bekle...
              </span>
            ) : mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Hesap Oluştur' : mode === 'forgot' ? 'Sıfırlama Bağlantısı Gönder' : 'Şifremi Güncelle'}
          </button>
        </form>

        {/* Mod değiştir */}
        <p className="text-center text-gray-500 text-xs mt-5">
          {mode === 'forgot' || mode === 'set-password' ? (
            <button onClick={() => switchMode('login')} className="text-indigo-400 hover:text-indigo-300 transition-colors">
              ← Giriş ekranına dön
            </button>
          ) : (
            <>
              {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
              {' '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
