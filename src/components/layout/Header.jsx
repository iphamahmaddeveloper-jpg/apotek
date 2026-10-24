import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Search, Globe, AlertTriangle, X, Clock, LogOut, RotateCcw } from 'lucide-react';
import { formatHeaderDate } from '../../utils';
import { ROLES } from '../../config/auth';
import { PWAInstallButton } from '../pwa/InstallPrompt';

export function Header({ 
  settings, 
  products = [], 
  currentUser, 
  activeShift, 
  onOpenShiftModal, 
  onCloseShiftModal, 
  onLogout,
  onResetDemo 
}) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const todayStr = formatHeaderDate(new Date(), settings?.timezone || 'Asia/Makassar');
  const lowStockProducts = products.filter(p => p.stock < (p.min_stock || 10));
  const isOwner = currentUser?.role === ROLES.OWNER;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/admin/inventory?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  return (
    <header className="top-header">
      {/* Date chip */}
      <div style={{
        fontSize: 12.5, fontWeight: 600, color: '#8e95a3',
        background: '#f8f9fc', border: '1px solid #e8eaf0',
        padding: '5px 12px', borderRadius: 8, whiteSpace: 'nowrap'
      }}>
        {todayStr}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Search */}
      <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: 200 }}>
        <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={15} />
        <input
          className="form-input"
          placeholder="Cari obat cepat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: 34, height: 36, fontSize: 13, borderRadius: 8 }}
        />
      </form>

      {/* Active Shift Quick Status */}
      {activeShift ? (
        <button
          type="button"
          onClick={onCloseShiftModal}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6, borderRadius: 8, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#15803d' }}
          title="Klik untuk rekapitulasi / tutup shift"
        >
          <Clock size={13} color="#16a34a" />
          <span style={{ fontWeight: 700 }}>{activeShift.shiftName}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpenShiftModal}
          className="btn btn-secondary btn-sm"
          style={{ gap: 6, borderRadius: 8, background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}
          title="Klik untuk mulai shift kasir"
        >
          <Clock size={13} color="#d97706" />
          <span style={{ fontWeight: 700 }}>Buka Shift</span>
        </button>
      )}

      {/* Vertical separator */}
      <div style={{ width: 1, height: 22, background: '#e8eaf0' }} />

      {/* To Storefront */}
      <Link to="/" style={{ textDecoration: 'none' }} className="hide-on-mobile">
        <button className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
          <Globe size={14} />
          <span>Toko Publik</span>
        </button>
      </Link>

      {/* Reset Demo Button */}
      {onResetDemo && (
        <button
          type="button"
          onClick={onResetDemo}
          className="btn btn-secondary btn-sm hide-on-mobile"
          style={{ gap: 6, color: '#dc2626', borderColor: '#fee2e2', background: '#fef2f2' }}
          title="Kembalikan semua data ke kondisi default demo"
        >
          <RotateCcw size={13} />
          <span>Reset Demo</span>
        </button>
      )}

      {/* PWA Install Button */}
      <div className="hide-on-mobile">
        <PWAInstallButton />
      </div>

      {/* Notification Bell */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setShowNotifications(!showNotifications)}
          style={{
            width: 36, height: 36, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: lowStockProducts.length > 0 ? '#fff7ed' : '#f8f9fc',
            border: `1.5px solid ${lowStockProducts.length > 0 ? '#fed7aa' : '#e8eaf0'}`,
            color: lowStockProducts.length > 0 ? '#d97706' : '#8e95a3',
            cursor: 'pointer', transition: 'all 0.15s ease', position: 'relative'
          }}
          title="Notifikasi Stok"
        >
          <Bell size={16} />
          {lowStockProducts.length > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              minWidth: 16, height: 16, padding: '0 4px',
              background: '#ef4444', color: '#ffffff',
              fontSize: 10, fontWeight: 800, borderRadius: 99,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #ffffff', lineHeight: 1
            }}>
              {lowStockProducts.length}
            </span>
          )}
        </button>

        {showNotifications && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => setShowNotifications(false)}
            />
            <div className="notification-dropdown" style={{ zIndex: 50 }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderBottom: '1px solid #f0f1f6', background: '#fafbfd'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={15} color="#d97706" />
                  <span style={{ fontSize: '0.8375rem', fontWeight: 700, color: '#1e2432' }}>
                    Peringatan Stok Menipis
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="badge badge-amber">{lowStockProducts.length} Obat</span>
                  <button className="modal-close" onClick={() => setShowNotifications(false)} style={{ width: 24, height: 24, borderRadius: 6 }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Items */}
              <div style={{ maxHeight: 220, overflowY: 'auto', padding: '6px 8px' }}>
                {lowStockProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: 13 }}>
                    Semua stok obat aman
                  </div>
                ) : (
                  lowStockProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setShowNotifications(false); navigate('/admin/inventory'); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
                        transition: 'background 0.12s', fontSize: 13
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f9fc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                        {p.name}
                      </span>
                      <span className="badge badge-red">Sisa {p.stock}</span>
                    </div>
                  ))
                )}
              </div>

              {lowStockProducts.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f1f6' }}>
                  <button
                    onClick={() => { setShowNotifications(false); navigate('/admin/inventory'); }}
                    style={{
                      width: '100%', textAlign: 'center', fontSize: 12.5, fontWeight: 700,
                      color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0'
                    }}
                  >
                    Buka Halaman Inventaris →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Vertical separator */}
      <div style={{ width: 1, height: 22, background: '#e8eaf0' }} />

      {/* User Profile & Role Chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 10,
          padding: '4px 10px 4px 6px'
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 7,
            background: isOwner ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : '#16a34a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 800
          }}>
            {currentUser?.avatar || (isOwner ? 'OW' : 'KA')}
          </div>
          <div>
            <div style={{
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: '#1e293b',
              lineHeight: 1.2,
              maxWidth: 130,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {currentUser?.name || 'Apoteker'}
            </div>
            <div style={{
              fontSize: 10,
              fontWeight: 800,
              color: isOwner ? '#4f46e5' : '#15803d',
              textTransform: 'uppercase'
            }}>
              {isOwner ? '👑 OWNER' : '💼 KARYAWAN'}
            </div>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="btn btn-secondary btn-sm"
          style={{ width: 34, height: 34, padding: 0, borderRadius: 9, color: '#dc2626' }}
          title="Keluar / Ganti Akun"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
