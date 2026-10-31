import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Store, KeyRound, AlertCircle, Cross, Eye, EyeOff, ShieldCheck, ShieldAlert } from 'lucide-react';
import { DEFAULT_USERS, ROLES, USER_STATUS } from '../config/auth';
import { useToast } from '../context/ToastContext';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SEC = 60;

export function Login({ onLoginSuccess, settings, users = [] }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Rate limiting / Brute force protection
  const [failedAttempts, setFailedAttempts] = useState(() => {
    const saved = sessionStorage.getItem('login_failed_attempts');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [lockoutTimer, setLockoutTimer] = useState(() => {
    const lockedUntil = sessionStorage.getItem('login_locked_until');
    if (!lockedUntil) return 0;
    const remaining = Math.ceil((parseInt(lockedUntil, 10) - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  });

  const pharmacyName = settings?.nama_apotek || 'Apotek Medika Sejahtera';
  const userList = users && users.length > 0 ? users : DEFAULT_USERS;

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer(prev => {
        if (prev <= 1) {
          sessionStorage.removeItem('login_locked_until');
          sessionStorage.removeItem('login_failed_attempts');
          setFailedAttempts(0);
          setError('');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (lockoutTimer > 0) {
      setError(`Akses diblokir sementara karena terlalu banyak percobaan gagal. Silakan tunggu ${lockoutTimer} detik.`);
      return;
    }

    const trimmedUser = username.trim().toLowerCase();
    const matchedUser = userList.find(
      u => u.username.toLowerCase() === trimmedUser && u.password === password
    );

    if (matchedUser) {
      if (matchedUser.status === USER_STATUS.INACTIVE) {
        setError('Akun ini telah dinonaktifkan oleh Owner (Karyawan Keluar / Resign). Akses login ditolak.');
        toast.error('Akun telah dinonaktifkan oleh Owner');
        return;
      }

      // Reset brute force counter upon success
      sessionStorage.removeItem('login_failed_attempts');
      sessionStorage.removeItem('login_locked_until');
      setFailedAttempts(0);

      // Safe user session without storing password
      const { password: _, ...safeUser } = matchedUser;
      onLoginSuccess(safeUser);
      toast.success(`Selamat datang, ${matchedUser.name}!`);

      if (matchedUser.role === ROLES.OWNER) {
        navigate('/admin/dashboard');
      } else {
        navigate('/admin/pos');
      }
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      sessionStorage.setItem('login_failed_attempts', String(nextAttempts));

      if (nextAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = Date.now() + (LOCKOUT_DURATION_SEC * 1000);
        sessionStorage.setItem('login_locked_until', String(lockUntil));
        setLockoutTimer(LOCKOUT_DURATION_SEC);
        setError(`Terlalu banyak percobaan login yang gagal. Akses diblokir selama ${LOCKOUT_DURATION_SEC} detik demi keamanan data apotek.`);
        toast.error('Akses diblokir sementara');
      } else {
        const sisa = MAX_FAILED_ATTEMPTS - nextAttempts;
        setError(`Username atau kata sandi tidak cocok. Sisa percobaan: ${sisa} kali sebelum diblokir.`);
        toast.error('Kredensial login tidak valid');
      }
    }
  };

  const handleFillDemo = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e2e8f0 100%)',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.25)'
          }}>
            <Cross size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1e2432' }}>{pharmacyName}</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Portal Khusus Staf & Owner</div>
          </div>
        </div>

        <Link to="/" style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary btn-sm" style={{ gap: 7, borderRadius: 8 }}>
            <Store size={14} />
            <span>Ke Toko Publik</span>
          </button>
        </Link>
      </div>

      {/* Main Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
          border: '1px solid #e2e8f0',
          overflow: 'hidden'
        }}>
          {/* Header Card */}
          <div style={{
            padding: '28px 28px 20px',
            textAlign: 'center',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#eef2ff',
              border: '2px solid #e0e7ff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <Lock size={26} color="#4f46e5" />
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
              Portal Petugas Apotek
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Masukkan username dan kata sandi terdaftar untuk mengakses sistem
            </p>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {/* Lockout Banner */}
            {lockoutTimer > 0 && (
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: '#991b1b',
                fontSize: 12.5
              }}>
                <ShieldAlert size={20} color="#dc2626" style={{ flexShrink: 0 }} />
                <div>
                  <strong>Akses Terkunci Sementara ({lockoutTimer}s)</strong>
                  <div style={{ fontSize: 11.5, marginTop: 2 }}>Terlalu banyak percobaan sandi salah. Tunggu hitungan mundur selesai.</div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && lockoutTimer <= 0 && (
              <div className="alert-error" style={{ fontSize: 12, marginBottom: 16 }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Username Petugas / Owner *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ketik username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={lockoutTimer > 0}
                  required
                  autoFocus
                  style={{ height: 42, fontSize: 13 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Kata Sandi *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ketik kata sandi"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={lockoutTimer > 0}
                    required
                    style={{ height: 42, fontSize: 13, paddingRight: 40 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      padding: 4
                    }}
                    title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={lockoutTimer > 0}
                style={{ width: '100%', borderRadius: 10, height: 44, marginTop: 6 }}
              >
                <KeyRound size={16} /> Masuk ke Sistem Apotek
              </button>
            </form>

            {/* Demo / Testing Autofill Hint (Fills input only, still validates credentials) */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px', textAlign: 'center' }}>
                Akun Terdaftar (Uji Coba Demo)
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleFillDemo('owner', 'owner123')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6 }}
                >
                  👑 Isi Akun Owner
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('siti', 'siti123')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6 }}
                >
                  💼 Isi Akun Kasir (Siti)
                </button>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div style={{
            padding: '12px 28px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            fontSize: 11.5,
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}>
            <ShieldCheck size={14} color="#16a34a" />
            <span>Dilindungi pembatasan percobaan login & verifikasi hak akses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
