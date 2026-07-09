import { useState } from 'react';
import { GraduationCap, Users, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../lib/supabase';
import { Spinner } from './Spinner';
import { Button } from './ui';

type Mode = 'login' | 'register' | 'forgot' | 'set-password';

interface AuthScreenProps {
  onClose: () => void;
  initialMode?: Mode;
}

const INPUT_CLASS =
  'w-full bg-muted border border-border rounded-control px-4 py-3 text-primary text-sm font-bold placeholder:text-subtle outline-none focus:border-accent-cyan';

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
    <div
      className="fixed inset-0 z-50 grid place-items-center animate-fade-in"
      style={{ background: 'rgba(5,9,18,.78)', backdropFilter: 'blur(6px)' }}
    >
      <div className="w-full max-w-sm bg-surface border border-border rounded-3xl p-7 animate-pop-in">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="m-0 text-primary text-xl font-black">
            {mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Hesap Oluştur' : mode === 'forgot' ? 'Şifremi Unuttum' : 'Şifremi Değiştir'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-[9px] bg-elevated border border-border text-secondary hover:text-primary cursor-pointer flex items-center justify-center transition-colors"
          >
            <X size={14} strokeWidth={2.6} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Rol seçimi — sadece kayıt modunda */}
          {mode === 'register' && (
            <div>
              <p className="m-0 text-xs font-black tracking-wider uppercase text-subtle mb-2">Hesap türü</p>
              <div className="grid grid-cols-2 gap-2">
                {([['parent', Users, 'Ebeveyn'], ['teacher', GraduationCap, 'Öğretmen']] as const).map(([r, Icon, label]) => {
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className="flex items-center justify-center gap-2 px-4 py-3 rounded-control text-sm font-extrabold cursor-pointer transition-all"
                      style={{
                        border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--bg-border)'}`,
                        background: active ? 'color-mix(in srgb, var(--accent-cyan) 10%, transparent)' : 'var(--bg-elevated)',
                        color: active ? 'var(--accent-cyan-soft)' : 'var(--text-secondary)',
                      }}
                    >
                      <Icon size={16} strokeWidth={2.2} /> {label}
                    </button>
                  );
                })}
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
              className={INPUT_CLASS}
            />
          )}

          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={INPUT_CLASS}
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
                className={INPUT_CLASS}
              />
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="bg-transparent border-none cursor-pointer text-xs font-bold text-right transition-colors -mt-2 p-0"
                  style={{ color: 'var(--accent-cyan-soft)' }}
                >
                  Şifremi unuttum
                </button>
              )}
            </>
          )}

          {error && (
            <p
              className="m-0 text-xs font-bold rounded-lg px-3 py-2"
              style={{ color: 'var(--accent-red)', background: 'color-mix(in srgb, var(--accent-red) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-red) 25%, transparent)' }}
            >
              {error}
            </p>
          )}

          {success && (
            <p
              className="m-0 text-xs font-bold rounded-lg px-3 py-2"
              style={{ color: 'var(--accent-lime)', background: 'color-mix(in srgb, var(--accent-lime) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-lime) 25%, transparent)' }}
            >
              {success}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={16} /> Lütfen bekle...
              </span>
            ) : mode === 'login' ? 'Giriş Yap' : mode === 'register' ? 'Hesap Oluştur' : mode === 'forgot' ? 'Sıfırlama Bağlantısı Gönder' : 'Şifremi Güncelle'}
          </Button>
        </form>

        {/* Mod değiştir */}
        <p className="m-0 text-center text-subtle text-xs font-bold mt-5">
          {mode === 'forgot' || mode === 'set-password' ? (
            <button
              onClick={() => switchMode('login')}
              className="bg-transparent border-none cursor-pointer font-bold transition-colors"
              style={{ color: 'var(--accent-cyan-soft)' }}
            >
              ← Giriş ekranına dön
            </button>
          ) : (
            <>
              {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
              {' '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="bg-transparent border-none cursor-pointer font-bold transition-colors"
                style={{ color: 'var(--accent-cyan-soft)' }}
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
