import { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  Bell, ShoppingCart, Clock, Cross, LogOut, Globe, 
  RotateCcw, ChevronDown, AlertTriangle, X, Menu
} from 'lucide-react';
import { ROLES } from '../../config/auth';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const lowStockProducts = products.filter(p => p.stock < (p.min_stock || 10));
  const isOwner = currentUser?.role === ROLES.OWNER;
  const pharmacyName = settings?.nama_apotek || 'Apotek Mandiri';

  const navLinks = [
    ...(isOwner ? [{ to: '/admin/dashboard', label: 'Dashboard' }] : []),
    { to: '/admin/inventory', label: 'Inventori' },
    { to: '/admin/shifts', label: 'Shift & Kas' },
    ...(isOwner ? [
      { to: '/admin/reports', label: 'Laporan' },
      { to: '/admin/staff', label: 'Karyawan' }
    ] : [])
  ];

  return (
    <div className="top-pill-navbar animate-fade-in">
      <div className="top-pill-navbar-inner">
        {/* Left: Brand Identity */}
        <Link 
          to={isOwner ? "/admin/dashboard" : "/admin/pos"} 
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(15, 23, 42, 0.2)',
            flexShrink: 0
          }}>
            <Cross size={18} color="#ffffff" strokeWidth={2.6} />
          </div>
          <span style={{
            fontSize: '1.025rem',
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap'
          }}>
            {pharmacyName}
          </span>
        </Link>

        {/* Center: Desktop Navigation Pills */}
        <nav className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto' }}>
          {navLinks.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                padding: '7px 18px',
                borderRadius: 9999,
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#0f172a' : '#64748b',
                background: isActive ? '#f1f5f9' : 'transparent',
                border: isActive ? '1px solid #e2e8f0' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions, Kasir CTA & User Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Active Shift Indicator */}
          {activeShift ? (
            <button
              type="button"
              onClick={onCloseShiftModal}
              className="btn btn-sm hide-on-mobile"
              style={{
                borderRadius: 9999,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 12px',
                gap: 6
              }}
              title="Shift kasir aktif. Klik untuk rekapitulasi & tutup shift"
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a' }} />
              <span>{activeShift.shiftName.split(' ')[0]} {activeShift.shiftName.split(' ')[1] || ''}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenShiftModal}
              className="btn btn-sm hide-on-mobile"
              style={{
                borderRadius: 9999,
                background: '#fffbeb',
                border: '1px solid #fed7aa',
                color: '#b45309',
                fontSize: 12,
                fontWeight: 700,
                padding: '6px 12px',
                gap: 6
              }}
              title="Klik untuk membuka sesi shift kasir"
            >
              <Clock size={13} color="#d97706" />
              <span>Buka Shift</span>
            </button>
          )}

          {/* Stock Notification Bell */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: lowStockProducts.length > 0 ? '#fef2f2' : '#f8fafc',
                border: `1.5px solid ${lowStockProducts.length > 0 ? '#fecaca' : '#e2e8f0'}`,
                color: lowStockProducts.length > 0 ? '#dc2626' : '#64748b',
                cursor: 'pointer',
                position: 'relative'
              }}
              title="Peringatan Stok Menipis"
            >
              <Bell size={15} />
              {lowStockProducts.length > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: 9.5,
                  fontWeight: 900,
                  borderRadius: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}>
                  {lowStockProducts.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowNotifications(false)} />
                <div style={{
                  position: 'absolute',
                  top: 46,
                  right: 0,
                  width: 300,
                  background: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  zIndex: 60,
                  overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                      <AlertTriangle size={14} color="#dc2626" />
                      <span>Stok Perlu Restock ({lowStockProducts.length})</span>
                    </div>
                    <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ maxHeight: 240, overflowY: 'auto', padding: 6 }}>
                    {lowStockProducts.length === 0 ? (
                      <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>Semua stok aman</div>
                    ) : (
                      lowStockProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => { setShowNotifications(false); navigate('/admin/inventory'); }}
                          style={{ padding: '8px 10px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontSize: 12 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <span style={{ fontWeight: 600, color: '#1e2432', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: 4 }}>Sisa {p.stock}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Primary Outstanding CTA: KASIR PILL BUTTON (Clean Slate Dark) */}
          <NavLink
            to="/admin/pos"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: isActive 
                ? '#020617' 
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: 9999,
              fontSize: 13,
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 3px 12px rgba(15, 23, 42, 0.25)',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap'
            })}
          >
            <ShoppingCart size={15} color="#ffffff" strokeWidth={2.3} />
            <span>Kasir</span>
          </NavLink>

          {/* User Account Pill Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 9999,
                padding: '4px 10px 4px 4px',
                cursor: 'pointer'
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: isOwner ? '#0f172a' : '#059669',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {currentUser?.avatar || (currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AK')}
              </div>
              <span className="hide-on-mobile" style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                Akun
              </span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>

            {/* Account Dropdown */}
            {showAccountMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setShowAccountMenu(false)} />
                <div style={{
                  position: 'absolute',
                  top: 46,
                  right: 0,
                  width: 240,
                  background: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                  zIndex: 60,
                  overflow: 'hidden',
                  padding: 8
                }}>
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{currentUser?.name}</div>
                    <div style={{ fontSize: 11, color: isOwner ? '#0f172a' : '#059669', fontWeight: 700, marginTop: 2 }}>
                      {isOwner ? '👑 Pemilik Apotek (Owner)' : '💼 Petugas Kasir Shift'}
                    </div>
                  </div>

                  <Link
                    to="/"
                    onClick={() => setShowAccountMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      color: '#475569',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Globe size={14} color="#64748b" />
                    <span>Lihat Toko Publik</span>
                  </Link>

                  {onResetDemo && isOwner && (
                    <button
                      type="button"
                      onClick={() => { setShowAccountMenu(false); onResetDemo(); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        color: '#d97706',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <RotateCcw size={14} />
                      <span>Reset Demo Default</span>
                    </button>
                  )}

                  <div style={{ height: 1, background: '#f1f5f9', margin: '6px 0' }} />

                  <button
                    type="button"
                    onClick={() => { setShowAccountMenu(false); onLogout(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12.5,
                      color: '#dc2626',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={14} />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="show-on-mobile"
            onClick={() => setShowMobileNav(!showMobileNav)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#334155'
            }}
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {showMobileNav && (
        <div style={{
          marginTop: 10,
          background: '#ffffff',
          borderRadius: 20,
          padding: 14,
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }} className="show-on-mobile">
          {navLinks.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setShowMobileNav(false)}
              style={({ isActive }) => ({
                padding: '10px 14px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: isActive ? 800 : 600,
                color: isActive ? '#0f172a' : '#475569',
                background: isActive ? '#f1f5f9' : '#ffffff',
                textDecoration: 'none'
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
