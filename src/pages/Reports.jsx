import { useState, useMemo } from 'react';
import { Calendar, Download, FileText, TrendingUp, ShoppingBag, Truck, Building2, DollarSign, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  formatRupiah,
  formatDateTime,
  isSameDayInTimezone,
  isWithinPastDaysInTimezone,
  isSameMonthInTimezone,
  isSameYearInTimezone
} from '../utils';

const PERIOD_OPTIONS = [
  { id: 'Daily',   label: 'Harian (Hari Ini)' },
  { id: 'Weekly',  label: 'Mingguan (7 Hari)' },
  { id: 'Monthly', label: 'Bulanan (Bulan Ini)' },
  { id: 'Yearly',  label: 'Tahunan (Tahun Ini)' },
];

export function Reports({ transactions = [], incomingGoods = [], settings }) {
  const [filter, setFilter] = useState('Daily');
  const [reportView, setReportView] = useState('sales');
  const tz = settings?.timezone || 'Asia/Makassar';

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (filter === 'Daily')   return isSameDayInTimezone(t.date, now, tz);
      if (filter === 'Weekly')  return isWithinPastDaysInTimezone(t.date, 7, now);
      if (filter === 'Monthly') return isSameMonthInTimezone(t.date, now, tz);
      if (filter === 'Yearly')  return isSameYearInTimezone(t.date, now, tz);
      return true;
    });
  }, [transactions, filter, tz]);

  const filteredIncomingGoods = useMemo(() => {
    const now = new Date();
    return incomingGoods.filter(g => {
      if (filter === 'Daily')   return isSameDayInTimezone(g.date, now, tz);
      if (filter === 'Weekly')  return isWithinPastDaysInTimezone(g.date, 7, now);
      if (filter === 'Monthly') return isSameMonthInTimezone(g.date, now, tz);
      if (filter === 'Yearly')  return isSameYearInTimezone(g.date, now, tz);
      return true;
    });
  }, [incomingGoods, filter, tz]);

  const totalRevenue = useMemo(() => filteredTransactions.reduce((s, t) => s + (t.total || 0), 0), [filteredTransactions]);
  const totalHPP = useMemo(() => filteredTransactions.reduce((s, t) => {
    if (t.total_hpp !== undefined) return s + t.total_hpp;
    if (Array.isArray(t.items)) return s + t.items.reduce((ss, i) => ss + ((i.buy_price || 0) * (i.qty || 1)), 0);
    return s;
  }, 0), [filteredTransactions]);
  const totalProfit = totalRevenue - totalHPP;
  const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const totalIncomingPurchases = useMemo(() => filteredIncomingGoods.reduce((s, g) => s + (g.total_amount || 0), 0), [filteredIncomingGoods]);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const apotekName = settings?.nama_apotek || 'Apotek Medika Sejahtera';
      const apotekAddress = settings?.alamat || 'Jl. Kesehatan Raya No. 88, Kemang, Jakarta Selatan';
      const periodeLabel = PERIOD_OPTIONS.find(p => p.id === filter)?.label || filter;

      // Header
      doc.setFontSize(16); doc.setTextColor(79, 70, 229);
      doc.text(apotekName, 14, 16);
      doc.setFontSize(8.5); doc.setTextColor(100);
      doc.text(apotekAddress, 14, 22);
      doc.text('Laporan Rekapitulasi Finansial & Keuntungan Bersih', 14, 27);
      doc.text(`Periode: ${periodeLabel} (Zona Waktu: ${tz})`, 14, 32);
      doc.text(`Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: tz })}`, 14, 37);

      const tableRows = filteredTransactions.map(trx => {
        const hppVal = trx.total_hpp !== undefined
          ? trx.total_hpp
          : (Array.isArray(trx.items) ? trx.items.reduce((s, i) => s + ((i.buy_price || 0) * (i.qty || 1)), 0) : 0);
        const profitVal = trx.profit !== undefined ? trx.profit : (trx.total - hppVal);
        const itemsStr = Array.isArray(trx.items) ? trx.items.map(i => `${i.name} (${i.qty}x)`).join(', ') : `${trx.items || 1} item`;
        return [trx.id, formatDateTime(trx.date, tz), itemsStr, formatRupiah(hppVal), formatRupiah(trx.total), formatRupiah(profitVal)];
      });

      autoTable(doc, {
        head: [['ID Trx', 'Tanggal & Waktu', 'Item Terjual', 'HPP Modal', 'Total Omzet', 'Laba Bersih']],
        body: tableRows,
        startY: 42,
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7.5, cellPadding: 3 },
        alternateRowStyles: { fillColor: [248, 249, 252] },
        foot: [['', '', 'TOTAL PERIODE', formatRupiah(totalHPP), formatRupiah(totalRevenue), formatRupiah(totalProfit)]],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
      });
      doc.save(`Laporan_${filter}_${apotekName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Terjadi kesalahan saat ekspor PDF.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title">Laporan & Rekap Finansial</h2>
          <p className="section-subtitle">Analisis omzet, HPP, dan keuntungan bersih apotek berdasarkan periode</p>
        </div>
        <button className="btn btn-primary" onClick={handleExportPDF}>
          <Download size={15} /> Ekspor PDF
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          {
            label: 'Total Omzet Penjualan',
            value: formatRupiah(totalRevenue),
            sub: `${filteredTransactions.length} transaksi dicatat`,
            icon: ShoppingBag,
            iconBg: '#eff6ff', iconColor: '#1d4ed8',
          },
          {
            label: 'Total HPP (Modal Pokok)',
            value: formatRupiah(totalHPP),
            sub: 'Harga beli obat yang terjual',
            icon: DollarSign,
            iconBg: '#fff7ed', iconColor: '#d97706',
          },
          {
            label: 'Keuntungan Bersih (Laba)',
            value: formatRupiah(totalProfit),
            sub: `Margin: +${marginPct}% dari omzet`,
            icon: TrendingUp,
            iconBg: '#f0fdf4', iconColor: '#16a34a',
            highlight: true,
          },
          {
            label: 'Belanja Faktur Pengadaan',
            value: formatRupiah(totalIncomingPurchases),
            sub: `${filteredIncomingGoods.length} faktur barang masuk`,
            icon: Truck,
            iconBg: '#faf5ff', iconColor: '#7c3aed',
          },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="stat-card" style={c.highlight ? { border: '1.5px solid #bbf7d0', background: '#fafffe' } : {}}>
              <div className="icon-box" style={{ background: c.iconBg }}>
                <Icon size={18} color={c.iconColor} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#8e95a3', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{c.label}</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: c.highlight ? '#16a34a' : '#1e2432', letterSpacing: '-0.03em', margin: '0 0 4px' }}>{c.value}</p>
                <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0, fontWeight: 500 }}>{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Layout: Sidebar + Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Period filter */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
              Filter Periode
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    background: filter === opt.id ? '#eeefff' : 'transparent',
                    border: `1.5px solid ${filter === opt.id ? '#c7d2fe' : 'transparent'}`,
                    color: filter === opt.id ? '#4f46e5' : '#6b7280',
                    fontSize: 12.5, fontWeight: filter === opt.id ? 700 : 500,
                    fontFamily: 'inherit', transition: 'all 0.12s'
                  }}
                >
                  {opt.label}
                  {filter === opt.id && <CheckCircle size={13} />}
                </button>
              ))}
            </div>
          </div>

          {/* View selector */}
          <div className="card" style={{ padding: 16 }}>
            <p style={{ fontSize: 10.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
              Tampilan Data
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button
                onClick={() => setReportView('sales')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  background: reportView === 'sales' ? '#f0fdf4' : 'transparent',
                  border: `1.5px solid ${reportView === 'sales' ? '#bbf7d0' : 'transparent'}`,
                  color: reportView === 'sales' ? '#15803d' : '#6b7280',
                  fontSize: 12.5, fontWeight: reportView === 'sales' ? 700 : 500,
                  fontFamily: 'inherit', transition: 'all 0.12s'
                }}
              >
                <TrendingUp size={13} /> Penjualan & Laba
              </button>
              <button
                onClick={() => setReportView('purchases')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  background: reportView === 'purchases' ? '#faf5ff' : 'transparent',
                  border: `1.5px solid ${reportView === 'purchases' ? '#e9d5ff' : 'transparent'}`,
                  color: reportView === 'purchases' ? '#7c3aed' : '#6b7280',
                  fontSize: 12.5, fontWeight: reportView === 'purchases' ? 700 : 500,
                  fontFamily: 'inherit', transition: 'all 0.12s'
                }}
              >
                <Truck size={13} /> Barang Masuk PT
              </button>
            </div>
          </div>
        </div>

        {/* Right: Data Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f1f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {reportView === 'sales' ? (
                <>
                  <div className="icon-box-sm" style={{ background: '#f0fdf4' }}><Calendar size={14} color="#16a34a" /></div>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>Rekapitulasi Penjualan & Laba</h3>
                    <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0 }}>Periode: {PERIOD_OPTIONS.find(p => p.id === filter)?.label}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="icon-box-sm" style={{ background: '#faf5ff' }}><Truck size={14} color="#7c3aed" /></div>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>Faktur Pengadaan dari PT/PBF</h3>
                    <p style={{ fontSize: 11.5, color: '#9ca3af', margin: 0 }}>Periode: {PERIOD_OPTIONS.find(p => p.id === filter)?.label}</p>
                  </div>
                </>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10.5, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>
                {reportView === 'sales' ? 'Laba Bersih Periode' : 'Total Belanja PT'}
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 800, color: reportView === 'sales' ? '#16a34a' : '#7c3aed', margin: 0 }}>
                {reportView === 'sales' ? formatRupiah(totalProfit) : formatRupiah(totalIncomingPurchases)}
              </p>
            </div>
          </div>

          {/* Table Content */}
          <div style={{ overflowX: 'auto' }}>
            {reportView === 'sales' ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>ID Transaksi</th>
                    <th>Waktu</th>
                    <th>Item Obat Terjual</th>
                    <th className="text-right">HPP (Modal)</th>
                    <th className="text-right">Total Omzet</th>
                    <th className="text-right" style={{ paddingRight: 20 }}>Laba Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(trx => {
                    const hppVal = trx.total_hpp !== undefined
                      ? trx.total_hpp
                      : (Array.isArray(trx.items) ? trx.items.reduce((s, i) => s + ((i.buy_price || 0) * (i.qty || 1)), 0) : 0);
                    const profitVal = trx.profit !== undefined ? trx.profit : (trx.total - hppVal);
                    return (
                      <tr key={trx.id}>
                        <td style={{ paddingLeft: 20, fontWeight: 700, color: '#4f46e5', fontSize: 12 }}>{trx.id}</td>
                        <td style={{ color: '#6b7280', fontSize: 12 }}>{formatDateTime(trx.date, tz)}</td>
                        <td>
                          {Array.isArray(trx.items) ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {trx.items.map((it, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                                  <span style={{ fontWeight: 500, color: '#374151' }}>{it.name}</span>
                                  <span className="badge badge-gray" style={{ fontSize: 10 }}>×{it.qty}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: '#6b7280' }}>{trx.items || 1} item</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', color: '#6b7280' }}>{formatRupiah(hppVal)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e2432' }}>{formatRupiah(trx.total)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#16a34a', paddingRight: 20 }}>+{formatRupiah(profitVal)}</td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty-state">
                          <div className="empty-state-icon"><FileText size={22} /></div>
                          <h4>Belum ada transaksi</h4>
                          <p>Belum ada transaksi penjualan tercatat untuk periode ini</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>No. Faktur</th>
                    <th>Distributor (PT / PBF)</th>
                    <th>Tanggal Masuk</th>
                    <th>Obat & Kuantitas</th>
                    <th className="text-right" style={{ paddingRight: 20 }}>Total Nilai Faktur</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncomingGoods.map(inv => (
                    <tr key={inv.id}>
                      <td style={{ paddingLeft: 20, fontWeight: 700, color: '#7c3aed', fontSize: 12 }}>{inv.invoice_number}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}>
                          <Building2 size={13} color="#9ca3af" />
                          <span style={{ fontWeight: 600, color: '#374151' }}>{inv.supplier_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#6b7280' }}>{formatDateTime(inv.date, tz)}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {inv.items.map((it, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                              <span style={{ color: '#374151', fontWeight: 500 }}>{it.productName}</span>
                              <span className="badge badge-green" style={{ fontSize: 10 }}>+{it.qty} unit</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#1e2432', paddingRight: 20 }}>{formatRupiah(inv.total_amount)}</td>
                    </tr>
                  ))}
                  {filteredIncomingGoods.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <div className="empty-state-icon"><Truck size={22} /></div>
                          <h4>Belum ada faktur masuk</h4>
                          <p>Belum ada penerimaan faktur dari PT pada periode ini</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
