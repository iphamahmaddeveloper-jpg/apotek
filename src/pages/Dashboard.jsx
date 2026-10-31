import { useState, useMemo } from 'react';
import { 
  ArrowUpRight, ShoppingCart, FileText, Package, AlertCircle, 
  ChevronRight, ArrowRight, Clock, CheckCircle, TrendingUp
} from 'lucide-react';
import { formatRupiah, formatDateTime, isSameDayInTimezone, getLocalDateString } from '../utils';
import { useNavigate } from 'react-router-dom';

export function Dashboard({ products = [], transactions = [], incomingGoods = [], settings }) {
  const navigate = useNavigate();
  const tz = settings?.timezone || 'Asia/Makassar';

  // State tab pembayaran di Card 1: 'ALL' | 'CASH' | 'QRIS'
  const [salesTab, setSalesTab] = useState('ALL');

  // Transaksi Hari Ini
  const todayTransactions = useMemo(() =>
    transactions.filter(t => isSameDayInTimezone(t.date, new Date(), tz)),
    [transactions, tz]
  );

  const totalSalesToday = useMemo(() =>
    todayTransactions.reduce((acc, t) => acc + (t.total || 0), 0),
    [todayTransactions]
  );

  const totalHppToday = useMemo(() =>
    todayTransactions.reduce((acc, t) => {
      if (t.total_hpp !== undefined) return acc + t.total_hpp;
      if (Array.isArray(t.items))
        return acc + t.items.reduce((s, i) => s + ((i.buy_price || 0) * (i.qty || 1)), 0);
      return acc;
    }, 0),
    [todayTransactions]
  );

  const totalProfitToday = totalSalesToday - totalHppToday;

  // Breakdown Pembayaran Hari Ini
  const paymentBreakdown = useMemo(() => {
    let tunai = 0;
    let nonTunai = 0;
    todayTransactions.forEach(t => {
      if ((t.payment_method || 'Tunai').toLowerCase() === 'tunai') {
        tunai += (t.total || 0);
      } else {
        nonTunai += (t.total || 0);
      }
    });
    return { tunai, nonTunai };
  }, [todayTransactions]);

  // Nominal yang ditampilkan di Card 1 sesuai tab
  const displaySalesAmount = useMemo(() => {
    if (salesTab === 'CASH') return paymentBreakdown.tunai;
    if (salesTab === 'QRIS') return paymentBreakdown.nonTunai;
    return totalSalesToday;
  }, [salesTab, totalSalesToday, paymentBreakdown]);

  const avgPerTrx = todayTransactions.length > 0 ? Math.round(totalSalesToday / todayTransactions.length) : 0;

  // Analisis Stok Obat
  const lowStockProducts = useMemo(() => 
    products.filter(p => p.stock < (p.min_stock || 10)), 
    [products]
  );

  const criticalStockProducts = useMemo(() => 
    products.filter(p => p.stock <= 5), 
    [products]
  );

  const safeStockCount = Math.max(0, products.length - lowStockProducts.length);
  const safeStockPct = products.length > 0 ? Math.round((safeStockCount / products.length) * 100) : 100;

  // Kontribusi Penjualan Menurut Kategori Obat
  const categorySales = useMemo(() => {
    const catMap = {};
    const sourceTrxs = todayTransactions.length > 0 ? todayTransactions : transactions;
    sourceTrxs.forEach(t => {
      if (Array.isArray(t.items)) {
        t.items.forEach(it => {
          const prod = products.find(p => p.id === it.id);
          const cat = prod?.category || it.category || 'Obat Bebas';
          catMap[cat] = (catMap[cat] || 0) + (it.price * (it.qty || 1));
        });
      }
    });

    // Fallback jika belum ada transaksi di sistem
    if (Object.keys(catMap).length === 0) {
      catMap['Suplemen & Vitamin'] = 76000;
      catMap['Lainnya'] = 44000;
      catMap['Obat Bebas'] = 39000;
      catMap['Alat Kesehatan'] = 25000;
    }

    const list = Object.entries(catMap).map(([name, amount]) => ({ name, amount }));
    list.sort((a, b) => b.amount - a.amount);
    const top4 = list.slice(0, 4);
    const maxVal = Math.max(...top4.map(i => i.amount), 1);
    return top4.map(item => ({
      ...item,
      pct: Math.min(100, Math.max(14, Math.round((item.amount / maxVal) * 100)))
    }));
  }, [todayTransactions, transactions, products]);

  // 4 Transaksi Terakhir
  const recentTransactions = useMemo(() => {
    return [...transactions].slice(0, 4);
  }, [transactions]);

  // Donut SVG circumference math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeStockPct / 100) * circumference;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* ── BARIS 1: 2 KARTU UTAMA (PENJUALAN & PRIORITAS) ────────────────── */}
      <div className="dashboard-top-grid">
        {/* KARTU 1: Penjualan Hari Ini & Tab Tunai/QRIS */}
        <div className="dashboard-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            {/* Tab Filter Pembayaran Modern */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: 'Penjualan' },
                { id: 'CASH', label: 'Kas tunai' },
                { id: 'QRIS', label: 'Bank / QRIS' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSalesTab(tab.id)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: salesTab === tab.id ? 800 : 600,
                    color: salesTab === tab.id ? '#ffffff' : '#64748b',
                    background: salesTab === tab.id 
                      ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' 
                      : '#f8fafc',
                    border: `1px solid ${salesTab === tab.id ? '#059669' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    boxShadow: salesTab === tab.id ? '0 2px 8px rgba(5, 150, 105, 0.28)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px', fontWeight: 600 }}>
              Penjualan hari ini
            </p>
            <div className="dashboard-big-number">
              {formatRupiah(displaySalesAmount)}
            </div>
            <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '8px 0 0', fontWeight: 500 }}>
              {todayTransactions.length} transaksi &bull; Rata-rata {formatRupiah(avgPerTrx)}
            </p>
          </div>

          {/* Tombol Aksi Cepat Buka Kasir & Laporan */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/admin/pos')}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '7px 20px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(5, 150, 105, 0.3)'
                }}
              >
                Buka kasir
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/reports')}
                style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  border: '1px solid #a7f3d0',
                  borderRadius: 9999,
                  padding: '7px 18px',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Laporan
              </button>
            </div>

            {/* Jump Arrow Button */}
            <button
              type="button"
              onClick={() => navigate('/admin/reports')}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Lihat detail laporan penjualan"
            >
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>

        {/* KARTU 2: Prioritas Apotek & Stok Menipis */}
        <div className="dashboard-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <span style={{
              display: 'inline-block',
              background: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
              borderRadius: 9999,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}>
              PRIORITAS
            </span>

            <p style={{ fontSize: 13, color: '#64748b', margin: '14px 0 6px', fontWeight: 600 }}>
              Stok di bawah minimum
            </p>
            <div style={{ fontSize: '2.3rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.035em', lineHeight: 1.1 }}>
              {lowStockProducts.length} <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#64748b' }}>produk</span>
            </div>
          </div>

          {/* Sub-tiles: Kritis & Pesanan / Faktur Masuk */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
            <div 
              onClick={() => navigate('/admin/inventory')}
              style={{
                background: '#fff7ed',
                borderRadius: 14,
                padding: '10px 14px',
                cursor: 'pointer',
                border: '1px solid #fed7aa'
              }}
            >
              <p style={{ fontSize: 11.5, color: '#9a3412', margin: 0, fontWeight: 600 }}>Stok sangat kritis</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#c2410c', margin: '4px 0 0' }}>
                {criticalStockProducts.length} produk
              </p>
            </div>

            <div 
              onClick={() => navigate('/admin/inventory')}
              style={{
                background: '#ecfdf5',
                borderRadius: 14,
                padding: '10px 14px',
                cursor: 'pointer',
                border: '1px solid #a7f3d0'
              }}
            >
              <p style={{ fontSize: 11.5, color: '#065f46', margin: 0, fontWeight: 600 }}>Faktur masuk PT</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: '#047857', margin: '4px 0 0' }}>
                {incomingGoods.length} Faktur (PO)
              </p>
            </div>
          </div>

          {/* Jump Arrow Button */}
          <button
            type="button"
            onClick={() => navigate('/admin/inventory')}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Buka katalog inventaris obat"
          >
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* ── BARIS 2: 3 KARTU SEIMBANG (PERSEDIAAN, KATEGORI, TRANSAKSI) ──── */}
      <div className="dashboard-bottom-grid">
        {/* KARTU 3: Persediaan & Donut Chart Kesehatan Stok */}
        <div className="dashboard-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Persediaan
              </h3>
              <button 
                type="button" 
                onClick={() => navigate('/admin/inventory')}
                style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 800, color: '#059669', cursor: 'pointer', padding: 0 }}
              >
                Inventori &rarr;
              </button>
            </div>

            {/* Donut Chart Ring */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 14px' }}>
              <div style={{ position: 'relative', width: 110, height: 110 }}>
                <svg width="110" height="110" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#ecfdf5"
                    strokeWidth="9"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="9"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                    {safeStockPct}%
                  </div>
                  <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 700, marginTop: 3 }}>
                    Stok aman
                  </div>
                </div>
              </div>
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', margin: '0 0 16px' }}>
              {safeStockCount} dari {products.length} produk sesuai stok minimum
            </p>
          </div>

          {/* Bottom Summary Rows */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ color: '#64748b' }}>Perlu restock</span>
              <span style={{ fontWeight: 800, color: '#dc2626' }}>{lowStockProducts.length} produk</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
              <span style={{ color: '#64748b' }}>Stok kritis (&le;5 pcs)</span>
              <span style={{ fontWeight: 800, color: '#ea580c' }}>{criticalStockProducts.length} produk</span>
            </div>
          </div>
        </div>

        {/* KARTU 4: Penjualan Menurut Kategori Obat */}
        <div className="dashboard-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Penjualan
              </h3>
              <span style={{ background: '#ecfdf5', color: '#047857', borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Hari ini</span>
            </div>

            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', margin: '2px 0 4px' }}>
              {formatRupiah(totalSalesToday)}
            </div>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 18px', fontWeight: 500 }}>
              Kontribusi menurut kategori
            </p>

            {/* List Kategori dengan Bar Progress Fresh Emerald-Cyan */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categorySales.map((cat, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{cat.name}</span>
                    <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatRupiah(cat.amount)}</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${cat.pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #059669 0%, #06b6d4 100%)',
                      borderRadius: 9999
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KARTU 5: Transaksi Kasir Real-Time */}
        <div className="dashboard-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Transaksi
              </h3>
              <button 
                type="button" 
                onClick={() => navigate('/admin/reports')}
                style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 800, color: '#059669', cursor: 'pointer', padding: 0 }}
              >
                Semua &rarr;
              </button>
            </div>

            {/* List 4 Transaksi Terakhir */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 12.5 }}>
                  Belum ada transaksi kasir hari ini
                </div>
              ) : (
                recentTransactions.map((trx, idx) => {
                  const initials = (trx.cashier || 'PU').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                  const timeStr = formatDateTime(trx.date, tz).split(',')[1] || 'Baru saja';

                  return (
                    <div key={trx.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#ecfdf5',
                          color: '#047857',
                          border: '1px solid #a7f3d0',
                          fontSize: 11,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                            {trx.customer || 'Pelanggan umum'}
                          </p>
                          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
                            {trx.id} &bull; {timeStr.trim()}
                          </p>
                        </div>
                      </div>

                      <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>
                        {formatRupiah(trx.total)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bottom Buka Kasir Button */}
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/pos')}
              style={{
                background: 'none',
                border: 'none',
                color: '#059669',
                fontSize: 12.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>Buka kasir</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
