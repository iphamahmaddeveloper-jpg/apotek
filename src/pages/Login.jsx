import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, Store, KeyRound, AlertCircle, Cross } from 'lucide-react';
import { DEFAULT_USERS, ROLES, USER_STATUS } from '../config/auth';
import { useToast } from '../context/ToastContext';

export function Login({ onLoginSuccess, settings, users = [] }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const pharmacyName = settings?.nama_apotek || 'Apotek Medika Sejahtera';
  const userList = users && users.length > 0 ? users : DEFAULT_USERS;
  const activeUsers = userList.filter(u => u.status !== USER_STATUS.INACTIVE);

  const handleQuickLogin = (user) => {
    if (user.status === USER_STATUS.INACTIVE) {
      setError(`Akun ${user.name} berstatus Nonaktif (Resign / Keluar).`);
      toast.error('Akun telah dinonaktifkan oleh Owner');
      return;
    }
    onLoginSuccess(user);
    toast.success(`Selamat datang, ${user.name}! Masuk sebagai ${user.roleTitle || user.role}`);
    if (user.role === ROLES.OWNER) {
      navigate('/admin/dashboard');
    } else {
      navigate('/admin/pos');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim().toLowerCase();
    const matchedUser = userList.find(
      u => u.username.toLowerCase() === trimmedUser && u.password === password
    );

    if (matchedUser) {
      if (matchedUser.status === USER_STATUS.INACTIVE) {
        setError('Akun ini telah dinonaktifkan oleh Owner (Karyawan Keluar / Resign). Akses login ditolak.');
        toast.error('Akun dinonaktifkan');
        return;
      }

      onLoginSuccess(matchedUser);
      toast.success(`Login berhasil sebagai ${matchedUser.name}`);
      if (matchedUser.role === ROLES.OWNER) {
        navigate('/admin/dashboard');
      } else {
        navigate('/admin/pos');
      }
    } else {
      setError('Username atau kata sandi tidak cocok. Silakan gunakan kredensial yang terdaftar atau pilih tombol akses cepat.');
      toast.error('Kredensial login tidak valid');
    }
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
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Portal Login Petugas & Owner</div>
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
          maxWidth: 490,
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
              Masuk dengan akun terdaftar untuk mengelola apotek dan melayani kasir
            </p>
          </div>

          <div style={{ padding: '24px 28px' }}>
            {/* Quick Login Options */}
            <div style={{
              fontSize: 11.5,
              fontWeight: 700,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 12
            }}>
              Akses Cepat (Akun Terdaftar)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 2 }}>
              {activeUsers.map(user => {
                const isSuper = user.role === ROLES.OWNER;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    style={{
                      border: `1.5px solid ${isSuper ? '#c7d2fe' : '#bbf7d0'}`,
                      borderRadius: 12,
                      padding: '12px 14px',
                      background: isSuper ? '#f5f7ff' : '#f0fdf4',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = isSuper ? '#4f46e5' : '#16a34a';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isSuper ? '#c7d2fe' : '#bbf7d0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: isSuper ? '#4f46e5' : '#16a34a',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0
                    }}>
                      {isSuper ? '👑' : '💼'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e2432' }}>
                          {user.name}
                        </span>
                        <span className={`badge ${isSuper ? 'badge-indigo' : 'badge-green'}`} style={{ fontSize: 9.5, padding: '1px 5px' }}>
                          {isSuper ? 'OWNER' : 'KARYAWAN'}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: isSuper ? '#4f46e5' : '#15803d', fontWeight: 600 }}>
                        {user.roleTitle || (isSuper ? 'Akses Penuh Finansial & HPP' : 'Akses Kasir Shift & Cek Rak')}
                      </div>
                    </div>
                    <ArrowRight size={15} color={isSuper ? '#4f46e5' : '#16a34a'} />
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div style={{ margin: '20px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 11.5, color: '#94a3b8', fontWeight: 600 }}>atau login manual</span>
              <div style={{ height: 1, flex: 1, background: '#e2e8f0' }} />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Username</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Ketik username Anda"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ height: 42, fontSize: 13 }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Kata Sandi</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Ketik kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ height: 42, fontSize: 13 }}
                />
              </div>

              {error && (
                <div className="alert-error" style={{ fontSize: 12 }}>
                  <AlertCircle size={15} />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', borderRadius: 10, height: 44, marginTop: 4 }}
              >
                <KeyRound size={16} /> Masuk ke Sistem Apotek
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div style={{
            padding: '14px 28px',
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            fontSize: 11.5,
            color: '#64748b',
            textAlign: 'center'
          }}>
            🛡️ Dilengkapi enkripsi sesi dan pembatasan akses hak karyawan secara ketat.
          </div>
        </div>
      </div>
    </div>
  );
}
