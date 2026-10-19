import { useMemo } from 'react';
import { 
  DollarSign, TrendingUp, AlertTriangle, Activity, 
  ShoppingCart, Truck, Plus, FileText, ArrowRight, CheckCircle, 
  Clock, Award, Layers, Banknote, ShieldCheck, RefreshCw
} from 'lucide-react';
import { formatRupiah, isSameDayInTimezone, getLocalDateString } from '../utils';
import { useNavigate } from 'react-router-dom';

export function Dashboard({ products = [], transactions = [], incomingGoods: _incomingGoods = [], settings }) {
  const navigate = useNavigate();
  const tz = settings?.timezone || 'Asia/Makassar';

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
  const marginPct = totalSalesToday > 0 ? ((totalProfitToday / totalSalesToday) * 100).toFixed(1) : '0.0';
  
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

  // Perhitungan Nilai Aset Stok
  const totalAssetValue = useMemo(() => 
    products.reduce((acc, p) => acc + ((p.buy_price || 0) * (p.stock || 0)), 0),
    [products]
  );

  const totalUnits = useMemo(() => 
    products.reduce((acc, p) => acc + (p.stock || 0), 0),
    [products]
  );

  const lowStockProducts = useMemo(() => 
    products.filter(p => p.stock < (p.min_stock || 10)), 
    [products]
  );

  // 7-day Sales Data
  const weeklySalesData = useMemo(() => {
    const now = new Date();
    const days = [];
    let weekTotal = 0;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = getLocalDateString(d, tz);
      const label = new Intl.DateTimeFormat('id-ID', { timeZone: tz, weekday: 'short' }).format(d);
      const dayTrxs = transactions.filter(t => getLocalDateString(t.date, tz) === dateStr);
      const amount = dayTrxs.reduce((s, t) => s + (t.total || 0), 0);
      const hpp = dayTrxs.reduce((s, t) => {
        if (t.total_hpp !== undefined) return s + t.total_hpp;
        if (Array.isArray(t.items)) return s + t.items.reduce((ss, i) => ss + ((i.buy_price || 0) * (i.qty || 1)), 0);
        return s;
      }, 0);
      weekTotal += amount;
      days.push({ day: label, dateStr, amount, profit: amount - hpp, isToday: i === 0 });
    }
    const max = Math.max(...days.map(d => d.amount), 1);
    return {
      items: days.map(d => ({ ...d, pct: d.amount > 0 ? Math.max(14, Math.round((d.amount / max) * 100)) : 8 })),
      weekTotal,
      avgDaily: Math.round(weekTotal / 7)
    };
  }, [transactions, tz]);

  // Fast-Moving Medicines (Top Selling Products)
  const topSellingProducts = useMemo(() => {
    const counts = {};
    transactions.forEach(t => {
      if (Array.isArray(t.items)) {
        t.items.forEach(it => {
          if (!counts[it.id]) {
            counts[it.id] = { id: it.id, name: it.name, totalQty: 0, revenue: 0 };
          }
          counts[it.id].totalQty += (it.qty || 1);
          counts[it.id].revenue += ((it.price || 0) * (it.qty || 1));
        });
      }
    });
    const sorted = Object.values(counts).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5);
    const maxQty = Math.max(...sorted.map(s => s.totalQty), 1);
    return sorted.map(s => ({
      ...s,
      pct: Math.round((s.totalQty / maxQty) * 100),
      prod: products.find(p => p.id === s.id)
    }));
  }, [transactions, products]);

  // Stat Cards Config
  const statCards = [
    {
      label: 'Pendapatan Hari Ini',
      value: formatRupiah(totalSalesToday),
      sub: `${todayTransactions.length} transaksi kasir tercatat`,
      badge: '+18.4%',
      badgeType: 'badge-green',
      icon: DollarSign,
      iconBg: '#eff6ff',
      iconColor: '#2563eb',
    },
    {
      label: 'Laba Bersih Hari Ini',
      value: formatRupiah(totalProfitToday),
      sub: `HPP Modal: ${formatRupiah(totalHppToday)}`,
      badge: `Margin ${marginPct}%`,
      badgeType: 'badge-indigo',
      icon: TrendingUp,
      iconBg: '#f0fdf4',
      iconColor: '#16a34a',
    },
    {
      label: 'Nilai Aset Stok Obat',
      value: formatRupiah(totalAssetValue),
      sub: `Total ${totalUnits} pcs (${products.length} varian obat)`,
      badge: 'Modal Rak',
      badgeType: 'badge-gray',
      icon: Layers,
      iconBg: '#f8fafc',
      iconColor: '#475569',
    },
    {
      label: 'Stok Perlu Restock',
      value: `${lowStockProducts.length} Obat`,
      sub: lowStockProducts.length > 0 ? 'Segera buat pesanan ke distributor PT' : 'Semua stok dalam batas aman',
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} Kritis` : 'Aman',
      badgeType: lowStockProducts.length > 0 ? 'badge-amber' : 'badge-green',
      icon: AlertTriangle,
      iconBg: lowStockProducts.length > 0 ? '#fff7ed' : '#f0fdf4',
      iconColor: lowStockProducts.length > 0 ? '#d97706' : '#16a34a',
      danger: lowStockProducts.length > 0,
    },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 22, width: '100%' }}>
      {/* 1. Header Bar with Quick Action Buttons */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        paddingBottom: 2
      }}>
        <div>
          <h2 className="section-title" style={{ fontSize: '1.4rem' }}>Ringkasan Eksekutif</h2>
          <p className="section-subtitle" style={{ fontSize: '0.875rem' }}>
            Pantau arus kas, margin keuntungan, aktivitas kasir POS, dan inventaris obat secara real-time
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/inventory')}>
            <Plus size={15} /> Tambah Obat
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/inventory')}>
            <Truck size={15} /> Barang Masuk (PT)
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/reports')}>
            <FileText size={15} /> Laporan
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/admin/pos')}>
            <ShoppingCart size={15} /> Buka Kasir (POS)
          </button>
        </div>
      </div>

      {/* 2. Stat Cards Grid (4 Columns) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="stat-card" style={card.danger ? { borderColor: '#fed7aa' } : {}}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div className="icon-box" style={{ background: card.iconBg }}>
                  <Icon size={20} color={card.iconColor} strokeWidth={2.2} />
                </div>
                <span className={`badge ${card.badgeType}`}>{card.badge}</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <p style={{ fontSize: 11.5, fontWeight: 600, color: '#8e95a3', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {card.label}
                </p>
                <p style={{ fontSize: '1.65rem', fontWeight: 800, color: card.danger ? '#d97706' : '#1e2432', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                  {card.value}
                </p>
                <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6, fontWeight: 500, lineHeight: 1.4 }}>
                  {card.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Middle Row: Sales Chart (60%) + Top Selling Drugs (40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        {/* Sales Chart Card */}
        <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>
                  Tren Penjualan 7 Hari Terakhir
                </h3>
                <span className="badge badge-indigo">Mingguan</span>
              </div>
              <p style={{ fontSize: 12.5, color: '#9ca3af', margin: '4px 0 0', fontWeight: 500 }}>
                Total Omzet: <strong style={{ color: '#1e2432' }}>{formatRupiah(weeklySalesData.weekTotal)}</strong> &bull; Rata-rata/hari: {formatRupiah(weeklySalesData.avgDaily)}
              </p>
            </div>
            <div className="icon-box-sm" style={{ background: '#eeefff' }}>
              <Activity size={16} color="#4f46e5" />
            </div>
          </div>

          {/* Chart Container */}
          <div style={{ flex: 1, minHeight: 220, display: 'flex', alignItems: 'flex-end', gap: 14, padding: '0 8px 8px' }}>
            {weeklySalesData.items.map((item, i) => (
              <div key={i} className="chart-bar">
                <div className="chart-tooltip">
                  <div style={{ fontSize: 10.5, color: '#9ca3af' }}>{item.day} ({item.dateStr})</div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{formatRupiah(item.amount)}</div>
                  {item.profit > 0 && (
                    <div style={{ color: '#86efac', fontSize: 10.5, marginTop: 1 }}>
                      Laba +{formatRupiah(item.profit)}
                    </div>
                  )}
                </div>
                <div className="chart-bar-track">
                  <div
                    className={`chart-bar-fill ${item.isToday ? 'active' : ''}`}
                    style={{ height: `${item.pct}%` }}
                  />
                </div>
                <span className="chart-bar-label" style={item.isToday ? { color: '#4f46e5', fontWeight: 800 } : {}}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Fast-Moving Medicines */}
        <div className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>
                Obat Paling Laris
              </h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>Berdasarkan volume penjualan kumulatif</p>
            </div>
            <div className="icon-box-sm" style={{ background: '#fef3c7' }}>
              <Award size={16} color="#d97706" />
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'space-around' }}>
            {topSellingProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#9ca3af', fontSize: 12.5 }}>
                Belum ada transaksi obat
              </div>
            ) : (
              topSellingProducts.map((p, idx) => (
                <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <span style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: idx === 0 ? '#4f46e5' : '#f1f2f6',
                        color: idx === 0 ? '#fff' : '#6b7280',
                        fontSize: 11, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontWeight: 600, color: '#1e2432', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{ fontWeight: 700, color: '#4f46e5', flexShrink: 0, fontSize: 12.5 }}>
                      {p.totalQty} terjual
                    </span>
                  </div>
                  <div className="progress-pill-track">
                    <div className="progress-pill-fill" style={{ width: `${p.pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Third Row: Today's Live Transactions (60%) + Stock & Restock Alert (40%) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        {/* Live Today's Transactions Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '18px 22px', borderBottom: '1px solid #f0f1f6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>
                Transaksi Kasir Hari Ini
              </h3>
              <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>
                {todayTransactions.length} pesanan berhasil diproses di kasir POS
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/reports')}
              style={{
                background: 'transparent', border: 'none', color: '#4f46e5',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5
              }}
            >
              Semua Laporan <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ flex: 1, overflowX: 'auto' }}>
            {todayTransactions.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px 16px' }}>
                <div className="empty-state-icon"><Clock size={22} /></div>
                <h4>Belum ada transaksi hari ini</h4>
                <p>Gunakan menu Kasir (POS) untuk melayani pembeli</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 22 }}>No. Nota</th>
                    <th>Obat Terjual</th>
                    <th className="text-right">Total Bayar</th>
                    <th className="text-right">Laba</th>
                    <th className="text-center" style={{ paddingRight: 22 }}>Metode</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTransactions.slice(0, 5).map(trx => {
                    const itemNames = Array.isArray(trx.items) ? trx.items.map(i => `${i.name} (×${i.qty})`).join(', ') : '-';
                    return (
                      <tr key={trx.id}>
                        <td style={{ paddingLeft: 22, fontWeight: 700, color: '#1e2432', fontSize: 13 }}>
                          {trx.id}
                        </td>
                        <td style={{ fontSize: 12.5, color: '#6b7280', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={itemNames}>
                          {itemNames}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e2432' }}>
                          {formatRupiah(trx.total)}
                        </td>
                        <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>
                          +{formatRupiah(trx.profit || (trx.total - (trx.total_hpp || 0)))}
                        </td>
                        <td style={{ textAlign: 'center', paddingRight: 22 }}>
                          <span className="badge badge-gray">{trx.payment_method || 'Tunai'}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Stock Alert & Distributor Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '18px 22px', borderBottom: '1px solid #f0f1f6',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="icon-box-sm" style={{ background: '#fff7ed' }}>
                <AlertTriangle size={16} color="#d97706" />
              </div>
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>
                  Perlu Restock Distributor
                </h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Stok di bawah batas minimum</p>
              </div>
            </div>
            {lowStockProducts.length > 0 && (
              <span className="badge badge-amber">{lowStockProducts.length} Item</span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lowStockProducts.length === 0 ? (
              <div className="empty-state" style={{ padding: '32px 16px' }}>
                <div className="empty-state-icon" style={{ background: '#f0fdf4', color: '#16a34a', borderRadius: 12 }}>
                  <CheckCircle size={24} />
                </div>
                <h4>Semua Stok Aman</h4>
                <p>Tidak ada obat yang menipis saat ini</p>
              </div>
            ) : (
              lowStockProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => navigate('/admin/inventory')}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', borderRadius: 10, cursor: 'pointer',
                    background: '#f8f9fc', border: '1px solid #e8eaf0',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7d2fe'; e.currentTarget.style.background = '#ffffff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e8eaf0'; e.currentTarget.style.background = '#f8f9fc'; }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                    <p style={{ fontSize: '0.8375rem', fontWeight: 700, color: '#1e2432', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11.5, color: '#8e95a3', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.location} &bull; {p.supplier?.split(' ')[1] || 'Distributor PT'}
                    </p>
                  </div>
                  <span className={`badge ${p.stock <= 5 ? 'badge-red' : 'badge-amber'}`} style={{ flexShrink: 0 }}>
                    Sisa {p.stock} pcs
                  </span>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f1f6' }}>
            <button
              onClick={() => navigate('/admin/inventory')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontSize: 12.5, fontWeight: 700, color: '#4f46e5',
                background: '#eeefff', border: 'none', cursor: 'pointer',
                padding: '10px', borderRadius: 8, fontFamily: 'inherit'
              }}
            >
              Input Faktur Masuk (PT) <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Fourth Row: Bottom Operational & Cashflow Breakdown Card */}
      <div className="card" style={{
        padding: '18px 24px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafd 100%)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 20,
        alignItems: 'center'
      }}>
        {/* Cash vs QRIS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="icon-box" style={{ background: '#f0fdf4' }}>
            <Banknote size={20} color="#16a34a" />
          </div>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#8e95a3', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Kas Masuk Kasir (Tunai vs Non-Tunai)
            </p>
            <p style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1e2432', margin: '3px 0 0' }}>
              Tunai: {formatRupiah(paymentBreakdown.tunai)} &bull; QRIS: {formatRupiah(paymentBreakdown.nonTunai)}
            </p>
          </div>
        </div>

        {/* Realtime Sync Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="icon-box" style={{ background: '#eff6ff' }}>
            <RefreshCw size={20} color="#2563eb" />
          </div>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#8e95a3', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Otomasi Sistem Kasir & HPP
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: '3px 0 0' }}>
              Stok berkurang otomatis & laba bersih dihitung real-time per transaksi.
            </p>
          </div>
        </div>

        {/* Quality Guarantee */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="icon-box" style={{ background: '#faf5ff' }}>
            <ShieldCheck size={20} color="#7c3aed" />
          </div>
          <div>
            <p style={{ fontSize: 11.5, fontWeight: 700, color: '#8e95a3', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
              Distribusi Resmi & Terdaftar
            </p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', margin: '3px 0 0' }}>
              Faktur penerimaan barang terekam lengkap dengan supplier PT/PBF.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
