import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Globe } from 'lucide-react';

// ─── PWA Install Banner (auto appears when installable) ───────────────────────
export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem('pwa_banner_dismissed') === '1');

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setDismissed(true);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa_banner_dismissed', '1');
    setDismissed(true);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 'min(400px, calc(100vw - 32px))',
      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
      borderRadius: 16, padding: '14px 18px',
      boxShadow: '0 8px 32px rgba(79,70,229,0.4)',
      display: 'flex', alignItems: 'center', gap: 14,
      color: '#fff', animation: 'slideUp 0.3s ease'
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Download size={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5 }}>Install Aplikasi Apotek</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, opacity: 0.85 }}>Tambahkan ke layar utama HP/Desktop</p>
      </div>
      <button
        onClick={handleInstall}
        style={{ background: '#fff', color: '#4f46e5', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}
      >
        Install
      </button>
      <button onClick={handleDismiss} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
        <X size={14} />
      </button>
    </div>
  );
}

// ─── PWA Install Guide Modal (manual, for iOS & informational) ────────────────
export function PWAInstallGuide({ onClose }) {
  const [activeTab, setActiveTab] = useState('android');

  const tabs = [
    { key: 'android', label: 'Android', icon: Smartphone },
    { key: 'ios', label: 'iPhone / iPad', icon: Globe },
    { key: 'desktop', label: 'Laptop / PC', icon: Monitor },
  ];

  const steps = {
    android: [
      { text: 'Buka aplikasi di browser Chrome di HP Android Anda' },
      { text: 'Ketuk ikon menu ⋮ (titik tiga) di pojok kanan atas browser' },
      { text: 'Pilih "Tambahkan ke layar utama" atau "Install aplikasi"' },
      { text: 'Ketuk "Tambahkan" / "Install" pada konfirmasi yang muncul' },
      { text: 'Ikon aplikasi Apotek Medika Sejahtera muncul di layar utama HP! ✅' },
    ],
    ios: [
      { text: 'Buka aplikasi di browser Safari di iPhone/iPad Anda' },
      { text: 'Ketuk ikon Bagikan/Share (□↑) di bagian bawah layar Safari' },
      { text: 'Gulir ke bawah dan ketuk "Tambahkan ke Layar Utama"' },
      { text: 'Ubah nama aplikasi jika perlu, lalu ketuk "Tambahkan" di pojok kanan atas' },
      { text: 'Ikon aplikasi Apotek muncul di layar utama iPhone/iPad! ✅' },
    ],
    desktop: [
      { text: 'Buka aplikasi di browser Chrome atau Edge di laptop/PC' },
      { text: 'Klik ikon Install (⊕) di sebelah kanan address bar / bilah alamat' },
      { text: 'Klik "Install" pada dialog konfirmasi yang muncul' },
      { text: 'Aplikasi akan terbuka di jendela terpisah layaknya aplikasi desktop!' },
      { text: 'Aplikasi dapat diakses meski koneksi lambat karena data ter-cache otomatis ✅' },
    ],
  };

  const benefits = [
    'Akses lebih cepat — tidak perlu buka browser dulu',
    'Tampil penuh layar tanpa address bar browser',
    'Ikon shortcut langsung di layar utama HP/Desktop',
    'Data ter-cache, tetap bisa diakses walau sinyal lemah',
    'Shortcut langsung ke halaman Kasir & Inventaris',
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
      zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          borderRadius: '20px 20px 0 0',
          position: 'relative'
        }}>
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 14,
            background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8,
            padding: 6, cursor: 'pointer', color: '#fff'
          }}>
            <X size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 800 }}>Install Aplikasi Apotek</h3>
              <p style={{ margin: '3px 0 0', color: 'rgba(255,255,255,0.8)', fontSize: 12.5 }}>
                Pasang di HP atau laptop seperti aplikasi biasa
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {/* Benefits */}
          <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
            <p style={{ margin: '0 0 8px', fontWeight: 700, fontSize: 12.5, color: '#166534' }}>✨ Keuntungan Install:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {benefits.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: '#14532d' }}>
                  <span style={{ color: '#16a34a', fontWeight: 700, flexShrink: 0 }}>✓</span>
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#f5f6fa', borderRadius: 10, padding: 4 }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 6px', border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: activeTab === tab.key ? '#fff' : 'transparent',
                    boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    color: activeTab === tab.key ? '#4f46e5' : '#6b7280',
                    fontWeight: activeTab === tab.key ? 700 : 500,
                    fontSize: 11.5, transition: 'all 0.18s'
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {steps[activeTab].map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i === steps[activeTab].length - 1 ? '#dcfce7' : '#eef2ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: i === steps[activeTab].length - 1 ? '#16a34a' : '#4f46e5' }}>
                    {i + 1}
                  </span>
                </div>
                <div style={{ flex: 1, paddingTop: 5, fontSize: 13, color: '#374151', lineHeight: 1.45 }}>
                  {step.text}
                </div>
              </div>
            ))}
          </div>

          {activeTab === 'ios' && (
            <div style={{ marginTop: 14, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#7c2d12' }}>
              <strong>⚠️ Catatan iPhone/iPad:</strong> Panduan ini hanya tersedia di browser <strong>Safari</strong>. Jika menggunakan Chrome di iOS, fitur install belum didukung oleh Apple.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Floating Install Button (di header/sidebar) ──────────────────────────────
export function PWAInstallButton() {
  const [showGuide, setShowGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => window.matchMedia('(display-mode: standalone)').matches);

  useEffect(() => {
    if (isInstalled) return;
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isInstalled]);

  if (isInstalled) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { setDeferredPrompt(null); setIsInstalled(true); }
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        title="Install sebagai aplikasi di HP/Desktop"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 13px', borderRadius: 9,
          background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
          color: '#fff', border: 'none', cursor: 'pointer',
          fontSize: 12.5, fontWeight: 700,
          boxShadow: '0 2px 10px rgba(79,70,229,0.3)',
          transition: 'all 0.2s'
        }}
      >
        <Download size={13} />
        <span className="hide-on-mobile">Install App</span>
      </button>
      {showGuide && <PWAInstallGuide onClose={() => setShowGuide(false)} />}
    </>
  );
}
