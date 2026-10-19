import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, BarChart3, Cross, 
  Clock, Users, LogOut
} from 'lucide-react';
import { ROLES } from '../../config/auth';
import { PWAInstallButton } from '../pwa/InstallPrompt';

export function Sidebar({ settings, currentUser, activeShift, onLogout }) {
  const isOwner = currentUser?.role === ROLES.OWNER;

  const navSections = [
    {
      title: 'Menu Operasional',
      items: [
        ...(isOwner ? [
          { to: '/admin/dashboard', label: 'Dashboard Utama', icon: LayoutDashboard, desc: 'Ringkasan & performa omzet' }
        ] : []),
        { to: '/admin/pos', label: 'Kasir (POS)', icon: ShoppingCart, desc: 'Transaksi obat & cetak nota', badge: 'Live' },
        { to: '/admin/shifts', label: 'Riwayat Shift & Kas', icon: Clock, desc: 'Rekap modal & selisih uang' }
      ]
    },
    {
      title: 'Inventaris & Logistik',
      items: [
        { 
          to: '/admin/inventory', 
          label: isOwner ? 'Katalog Obat & HPP' : 'Katalog Obat & Rak', 
          icon: Package, 
          desc: isOwner ? 'HPP modal, rak & faktur PT' : 'Cek stok obat & posisi rak' 
        }
      ]
    },
    ...(isOwner ? [
      {
        title: 'Finansial & Owner',
        items: [
          { to: '/admin/reports', label: 'Laporan Penjualan', icon: BarChart3, desc: 'Rekap omzet, HPP & laba bersih' },
          { to: '/admin/staff',   label: 'Kelola Karyawan',   icon: Users,     desc: 'Akun kasir & status resign' }
        ]
      }
    ] : [])
  ];

  // Flat nav items for bottom mobile nav
  const bottomNavItems = [
    ...(isOwner ? [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    { to: '/admin/pos', label: 'Kasir', icon: ShoppingCart },
    { to: '/admin/inventory', label: 'Inventaris', icon: Package },
    ...(isOwner ? [{ to: '/admin/reports', label: 'Laporan', icon: BarChart3 }] : []),
    { to: '/admin/shifts', label: 'Shift', icon: Clock },
    ...(isOwner ? [{ to: '/admin/staff', label: 'Karyawan', icon: Users }] : []),
  ];

  const pharmacyName = settings?.nama_apotek || 'Apotek Medika Sejahtera';

  return (
    <>
      {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
      <aside className="sidebar-root">
        {/* Brand Header */}
        <div style={{ padding: '22px 20px 18px' }}>
          <NavLink to={isOwner ? "/admin/dashboard" : "/admin/pos"} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(79,70,229,0.28)', flexShrink: 0
            }}>
              <Cross size={20} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{
                fontSize: '0.95rem', fontWeight: 800,
                color: '#1e2432', margin: 0, letterSpacing: '-0.02em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {pharmacyName}
              </h1>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '2px 0 0' }}>
                {isOwner ? 'Owner Dashboard' : 'Panel Kasir Shift'}
              </p>
            </div>
          </NavLink>
        </div>

        <div style={{ height: 1, background: '#f0f1f6', margin: '0 20px 14px' }} />

        {/* Nav List with Sections */}
        <nav style={{ flex: 1, padding: '0 14px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
          {navSections.map((sec, secIdx) => (
            <div key={secIdx}>
              <div style={{ padding: '0 8px 6px', fontSize: 10.5, fontWeight: 700, color: '#a0a6b5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {sec.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      style={{ padding: '11px 14px' }}
                    >
                      <Icon size={18} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.2 }}>{item.label}</span>
                          {item.badge && <span className="badge badge-indigo" style={{ fontSize: 10, padding: '1px 7px' }}>{item.badge}</span>}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'currentColor', opacity: 0.55, fontWeight: 400, marginTop: 2 }}>{item.desc}</div>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Live Status Card */}
          <div style={{
            marginTop: 'auto',
            padding: '14px 16px',
            background: 'linear-gradient(180deg, #f8f9fd 0%, #edf1fa 100%)',
            borderRadius: 12,
            border: '1px solid #e2e6f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: activeShift ? '#22c55e' : '#eab308', display: 'inline-block' }} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: activeShift ? '#15803d' : '#854d0e' }}>
                  {activeShift ? 'Shift Aktif' : 'Apotek Buka'}
                </span>
              </div>
              <span style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600 }}>
                {activeShift ? activeShift.shiftName.split(' ')[0] : 'Siap POS'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
              {activeShift 
                ? `Petugas: ${activeShift.userName}. Penjualan tunai tercatat ke rekonsiliasi kas.`
                : 'Silakan buka shift kasir sebelum pergantian petugas.'
              }
            </div>
          </div>

          {/* PWA Install Button (in sidebar, desktop) */}
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
            <PWAInstallButton />
          </div>
        </nav>

        {/* Footer - Profile */}
        <div style={{ padding: '14px 14px 18px' }}>
          <div style={{ height: 1, background: '#f0f1f6', marginBottom: 12 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 11,
            padding: '10px 12px', borderRadius: 10,
            background: '#f8f9fc', border: '1px solid #e8eaf0'
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: isOwner ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : '#16a34a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontSize: 12, fontWeight: 800, flexShrink: 0
            }}>
              {currentUser?.avatar || (isOwner ? 'OW' : 'KA')}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '0.8375rem', fontWeight: 700, color: '#1e2432', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser?.name || 'Apoteker'}
              </p>
              <p style={{ fontSize: 11, color: isOwner ? '#6366f1' : '#15803d', fontWeight: 700, margin: '2px 0 0' }}>
                {isOwner ? 'Owner / Apoteker' : 'Karyawan / Kasir'}
              </p>
            </div>

            <button 
              onClick={onLogout}
              style={{
                background: 'none',
                border: 'none',
                padding: 6,
                cursor: 'pointer',
                color: '#94a3b8',
                borderRadius: 6
              }}
              title="Keluar / Ganti User"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ─────────────────────────────── */}
      <nav className="bottom-nav">
        {bottomNavItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        {/* Logout button at end */}
        <button className="bottom-nav-item" onClick={onLogout} title="Keluar">
          <LogOut size={20} />
          <span>Keluar</span>
        </button>
      </nav>
    </>
  );
}

