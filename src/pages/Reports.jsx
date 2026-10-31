import { useState, useMemo } from 'react';
import { 
  Calendar, Download, FileText, TrendingUp, ShoppingBag, Truck, 
  DollarSign, CheckCircle, AlertTriangle, XCircle, Search, 
  RotateCcw, User, Clock, ArrowRight, ShieldAlert, CheckCheck
} from 'lucide-react';
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
import { ROLES } from '../config/auth';

const PERIOD_OPTIONS = [
  { id: 'Daily',   label: 'Harian (Hari Ini)' },
  { id: 'Weekly',  label: 'Mingguan (7 Hari)' },
  { id: 'Monthly', label: 'Bulanan (Bulan Ini)' },
  { id: 'Yearly',  label: 'Tahunan (Tahun Ini)' },
  { id: 'All',     label: 'Semua Periode' }
];

export function Reports({ 
  transactions = [], 
  incomingGoods = [], 
  products = [], 
  stockOpnames = [], 
  currentUser, 
  onVoidTransaction, 
  settings 
}) {
  const [filter, setFilter] = useState('Daily');
  const [reportView, setReportView] = useState('sales'); // 'sales' | 'purchases' | 'stock_opname'
  const [voidSearchTerm, setVoidSearchTerm] = useState('');
  const [selectedTrxToVoid, setSelectedTrxToVoid] = useState(null);
  const [voidReason, setVoidReason] = useState('Pasien ingin ganti obat');
  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);
  const [soRackFilter, setSoRackFilter] = useState('ALL');

  const tz = settings?.timezone || 'Asia/Makassar';
  const isOwner = currentUser?.role === ROLES.OWNER;

  // Filter transaksi berdasarkan periode
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

  // Transaksi aktif vs transaksi dibatalkan (void)
  const activeTransactions = useMemo(() => filteredTransactions.filter(t => !t.is_void), [filteredTransactions]);
  const voidTransactions = useMemo(() => filteredTransactions.filter(t => t.is_void), [filteredTransactions]);

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

  // Total omzet & HPP (Hanya menghitung transaksi aktif)
  const totalRevenue = useMemo(() => activeTransactions.reduce((s, t) => s + (t.total || 0), 0), [activeTransactions]);
  const totalHPP = useMemo(() => activeTransactions.reduce((s, t) => {
    if (t.total_hpp !== undefined) return s + t.total_hpp;
    if (Array.isArray(t.items)) return s + t.items.reduce((ss, i) => ss + ((i.buy_price || 0) * (i.qty || 1)), 0);
    return s;
  }, 0), [activeTransactions]);
  
  const totalProfit = totalRevenue - totalHPP;
  const marginPct = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const totalIncomingPurchases = useMemo(() => filteredIncomingGoods.reduce((s, g) => s + (g.total_amount || 0), 0), [filteredIncomingGoods]);

  // Laporan Stok Opname
  const allRacks = useMemo(() => {
    const racks = Array.from(new Set(products.map(p => p.location).filter(Boolean)));
    return ['ALL', ...racks];
  }, [products]);

  const filteredStockOpnames = useMemo(() => {
    return stockOpnames.filter(so => {
      const matchRack = soRackFilter === 'ALL' || so.rack === soRackFilter;
      return matchRack;
    });
  }, [stockOpnames, soRackFilter]);

  // Buka Modal Batal Faktur
  const handleOpenVoidModal = (trx) => {
    setSelectedTrxToVoid(trx);
    setVoidReason('Pasien ingin ganti obat');
    setIsVoidModalOpen(true);
  };

  // Cari Faktur dari input search
  const handleSearchAndOpenVoid = (e) => {
    e.preventDefault();
    const query = voidSearchTerm.trim().toUpperCase();
    if (!query) return;

    const found = transactions.find(t => 
      (t.id && t.id.toUpperCase() === query) || 
      (t.invoice_no && t.invoice_no.toUpperCase() === query)
    );

    if (!found) {
      alert(`Faktur "${voidSearchTerm}" tidak ditemukan di database apotek.`);
      return;
    }
    handleOpenVoidModal(found);
  };

  const handleConfirmVoid = () => {
    if (!selectedTrxToVoid) return;
    if (onVoidTransaction) {
      onVoidTransaction(selectedTrxToVoid.id, voidReason);
    }
    setIsVoidModalOpen(false);
    setSelectedTrxToVoid(null);
    setVoidSearchTerm('');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      const apotekName = settings?.nama_apotek || 'Apotek Mandiri';
      const apotekAddress = settings?.alamat || 'Sistem Manajemen Apotek Modern';
      const periodeLabel = PERIOD_OPTIONS.find(p => p.id === filter)?.label || filter;

      doc.setFontSize(16); doc.setTextColor(5, 150, 105);
      doc.text(apotekName, 14, 16);
      doc.setFontSize(8.5); doc.setTextColor(100);
      doc.text(apotekAddress, 14, 22);
      doc.text(`Laporan Rekap Penjualan Obat & Status Faktur (${periodeLabel})`, 14, 27);
      doc.text(`Zona Waktu: ${tz} | Dicetak: ${new Date().toLocaleString('id-ID', { timeZone: tz })}`, 14, 32);

      const tableRows = filteredTransactions.map(trx => {
        const itemsStr = Array.isArray(trx.items) ? trx.items.map(i => `${i.name} (${i.qty} ${i.unit || 'x'})`).join(', ') : '1 item';
        const statusStr = trx.is_void ? 'BATAL (VOID)' : 'LUNAS';
        return [
          trx.invoice_no || trx.id,
          formatDateTime(trx.date, tz),
          trx.cashier || 'Kasir',
          trx.shiftName || 'Shift Kasir',
          itemsStr,
          trx.payment_method || 'Tunai',
          formatRupiah(trx.total || 0),
          statusStr
        ];
      });

      autoTable(doc, {
        head: [['No Faktur', 'Waktu', 'Kasir', 'Jadwal Shift', 'Obat Terjual', 'Bayar', 'Total (Rp)', 'Status']],
        body: tableRows,
        startY: 38,
        theme: 'grid',
        headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        foot: [['', '', '', 'TOTAL OMZET AKTIF', '', '', formatRupiah(totalRevenue), `${activeTransactions.length} Faktur Lunas`]],
        footStyles: { fillColor: [236, 253, 245], textColor: [4, 120, 87], fontStyle: 'bold', fontSize: 8 },
      });
      doc.save(`Laporan_Penjualan_${apotekName.replace(/\s+/g, '_')}_${filter}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
      alert('Terjadi kendala teknis saat menyusun berkas PDF.');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title">Laporan Penjualan & Pembatalan Faktur</h2>
          <p className="section-subtitle">
            Rekap transaksi kasir, pembatalan/void faktur jika pasien ganti obat, pembelian PBF, dan laporan stok opname
          </p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={handleExportPDF}
          style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', borderRadius: 10, gap: 6 }}
        >
          <Download size={15} /> Cetak Rekap PDF
        </button>
      </div>

      {/* Metric Cards Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <div className="stat-card" style={{ border: '1.5px solid #a7f3d0', background: '#fcfdfd' }}>
          <div className="icon-box" style={{ background: '#ecfdf5', color: '#059669' }}>
            <ShoppingBag size={18} />
          </div>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 2px' }}>
            Total Omzet Penjualan
          </p>
          <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            {formatRupiah(totalRevenue)}
          </p>
          <p style={{ fontSize: 12, color: '#059669', margin: '4px 0 0', fontWeight: 600 }}>
            {activeTransactions.length} faktur berhasil &bull; {voidTransactions.length} dibatalkan
          </p>
        </div>

        {isOwner && (
          <>
            <div className="stat-card">
              <div className="icon-box" style={{ background: '#f8fafc', color: '#475569' }}>
                <DollarSign size={18} />
              </div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 2px' }}>
                Total HPP Modal Pokok
              </p>
              <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
                {formatRupiah(totalHPP)}
              </p>
              <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
                Nilai modal obat terjual
              </p>
            </div>

            <div className="stat-card" style={{ border: '1.5px solid #a7f3d0', background: '#fcfdfd' }}>
              <div className="icon-box" style={{ background: '#ecfdf5', color: '#047857' }}>
                <TrendingUp size={18} />
              </div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 2px' }}>
                Keuntungan Bersih (Owner)
              </p>
              <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.025em', margin: 0 }}>
                {formatRupiah(totalProfit)}
              </p>
              <p style={{ fontSize: 12, color: '#059669', margin: '4px 0 0', fontWeight: 600 }}>
                Margin laba: +{marginPct}% dari omzet
              </p>
            </div>
          </>
        )}

        <div className="stat-card">
          <div className="icon-box" style={{ background: '#f0fdf4', color: '#059669' }}>
            <Truck size={18} />
          </div>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '12px 0 2px' }}>
            Pengadaan Obat Masuk (PBF)
          </p>
          <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.025em', margin: 0 }}>
            {formatRupiah(totalIncomingPurchases)}
          </p>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0', fontWeight: 500 }}>
            {filteredIncomingGoods.length} faktur supplier dicatat
          </p>
        </div>
      </div>

      {/* QUICK VOID / PEMBATALAN FAKTUR TOOLBAR */}
      <div style={{
        background: '#ffffff',
        border: '1.5px solid #fed7aa',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 14,
        boxShadow: '0 4px 16px rgba(234, 88, 12, 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
            <RotateCcw size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: '#9a3412' }}>
              Batalkan / Retur Faktur Penjualan (Hapus Transaksi)
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#7c2d12' }}>
              Masukkan nomor faktur (misal: <strong>OB11223</strong>) jika pasien/pembeli ingin ganti obat setelah struk dicetak. Stok akan otomatis dikembalikan ke rak.
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchAndOpenVoid} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', maxWidth: 420 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input 
              className="form-input"
              placeholder="Ketik No Faktur (cth: OB11223)..."
              value={voidSearchTerm}
              onChange={e => setVoidSearchTerm(e.target.value)}
              style={{ paddingLeft: 32, height: 38, fontSize: 13, fontWeight: 600 }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-secondary" 
            style={{ height: 38, borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: '#c2410c', borderColor: '#fed7aa', background: '#fff7ed' }}
          >
            Cari & Batalkan
          </button>
        </form>
      </div>

      {/* Main Layout: Sidebar Filter & Data View */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16 }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* View Selector */}
          <div className="card" style={{ padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Pilihan Laporan
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { id: 'sales', label: '1. Penjualan Obat', icon: ShoppingBag, color: '#059669' },
                { id: 'purchases', label: '2. Pembelian Obat (PBF)', icon: Truck, color: '#0284c7' },
                { id: 'stock_opname', label: '3. Laporan Stok Opname', icon: FileText, color: '#d97706' },
              ].map(v => {
                const Icon = v.icon;
                const isActive = reportView === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setReportView(v.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '9px 12px',
                      borderRadius: 10,
                      cursor: 'pointer',
                      background: isActive ? '#ecfdf5' : 'transparent',
                      border: `1.5px solid ${isActive ? '#a7f3d0' : 'transparent'}`,
                      color: isActive ? '#047857' : '#475569',
                      fontSize: 12.5,
                      fontWeight: isActive ? 800 : 600,
                      textAlign: 'left'
                    }}
                  >
                    <Icon size={14} color={isActive ? '#047857' : '#94a3b8'} />
                    <span>{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period Filter */}
          <div className="card" style={{ padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>
              Rentang Waktu
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: filter === opt.id ? '#f0fdf4' : 'transparent',
                    border: `1.5px solid ${filter === opt.id ? '#bbf7d0' : 'transparent'}`,
                    color: filter === opt.id ? '#15803d' : '#64748b',
                    fontSize: 12,
                    fontWeight: filter === opt.id ? 800 : 500,
                    textAlign: 'left'
                  }}
                >
                  <span>{opt.label}</span>
                  {filter === opt.id && <CheckCircle size={13} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tab Tables */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {/* VIEW 1: PENJUALAN OBAT & DETAIL FAKTUR */}
          {reportView === 'sales' && (
            <div>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Daftar Penjualan Obat & Nomor Faktur
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                    Menampilkan nama kasir, shift kerja, no faktur, dan tombol pembatalan faktur jika pasien batal/ganti obat
                  </p>
                </div>
                <span className="badge badge-green" style={{ fontSize: 11.5, padding: '4px 10px' }}>
                  {filteredTransactions.length} Total Faktur
                </span>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 18 }}>No Faktur</th>
                      <th>Tanggal & Jam</th>
                      <th>Nama Kasir & Shift</th>
                      <th>Pelanggan</th>
                      <th>Item Obat Terjual</th>
                      <th>Pembayaran</th>
                      <th className="text-right">Total Tagihan</th>
                      <th className="text-center" style={{ paddingRight: 18 }}>Status & Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                          Belum ada transaksi penjualan pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map(trx => {
                        const invoiceCode = trx.invoice_no || trx.id;
                        return (
                          <tr key={trx.id} style={trx.is_void ? { background: '#fef2f2', opacity: 0.85 } : {}}>
                            <td style={{ paddingLeft: 18 }}>
                              <span style={{
                                fontWeight: 800,
                                fontSize: 12.5,
                                color: trx.is_void ? '#991b1b' : '#047857',
                                background: trx.is_void ? '#fee2e2' : '#ecfdf5',
                                padding: '3px 8px',
                                borderRadius: 6,
                                display: 'inline-block'
                              }}>
                                {invoiceCode}
                              </span>
                            </td>
                            <td style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                              {formatDateTime(trx.date, tz)}
                            </td>
                            <td>
                              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                                {trx.cashier || 'Kasir Apotek'}
                              </div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                {trx.shiftName || 'Shift Mandiri'}
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
                                {trx.customer || 'Pelanggan Umum'}
                              </span>
                            </td>
                            <td>
                              {Array.isArray(trx.items) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {trx.items.map((it, idx) => (
                                    <div key={idx} style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{it.name}</span>
                                      <span className="badge badge-gray" style={{ fontSize: 10 }}>×{it.qty} {it.unit || ''}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span style={{ fontSize: 12 }}>{trx.items || 1} item</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: 6,
                                background: (trx.payment_method || 'Tunai').toLowerCase() === 'tunai' ? '#ecfdf5' : '#f0f9ff',
                                color: (trx.payment_method || 'Tunai').toLowerCase() === 'tunai' ? '#047857' : '#0369a1'
                              }}>
                                {trx.payment_method || 'Tunai'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: trx.is_void ? '#9ca3af' : '#0f172a',
                                textDecoration: trx.is_void ? 'line-through' : 'none'
                              }}>
                                {formatRupiah(trx.total || 0)}
                              </span>
                              {trx.discount > 0 && (
                                <div style={{ fontSize: 10.5, color: '#059669', fontWeight: 600 }}>
                                  Diskon -{formatRupiah(trx.discount)}
                                </div>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', paddingRight: 18 }}>
                              {trx.is_void ? (
                                <div>
                                  <span style={{
                                    fontSize: 10.5,
                                    fontWeight: 800,
                                    background: '#fee2e2',
                                    color: '#b91c1c',
                                    padding: '3px 8px',
                                    borderRadius: 6
                                  }}>
                                    BATAL (VOID)
                                  </span>
                                  {trx.void_reason && (
                                    <div style={{ fontSize: 10, color: '#7f1d1d', marginTop: 2 }}>
                                      {trx.void_reason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleOpenVoidModal(trx)}
                                  className="btn btn-secondary btn-sm"
                                  style={{
                                    fontSize: 11,
                                    height: 28,
                                    borderRadius: 6,
                                    color: '#b91c1c',
                                    borderColor: '#fca5a5',
                                    background: '#fff5f5'
                                  }}
                                  title="Batalkan faktur ini dan kembalikan stok obat ke rak"
                                >
                                  <RotateCcw size={12} />
                                  <span>Batal / Void</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 2: PEMBELIAN OBAT (FAKTUR MASUK PBF) */}
          {reportView === 'purchases' && (
            <div>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Faktur Pembelian Obat dari Supplier / PBF
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                    Riwayat penerimaan barang masuk dari PT. BINAYA, Kimia Farma, Enseval, dll.
                  </p>
                </div>
                <span className="badge badge-blue">
                  Total Belanja: {formatRupiah(totalIncomingPurchases)}
                </span>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 18 }}>No Faktur PBF</th>
                      <th>Tanggal Masuk</th>
                      <th>Supplier / PBF</th>
                      <th>Obat Diterima</th>
                      <th>Metode Bayar</th>
                      <th className="text-right">Total Nominal</th>
                      <th className="text-center" style={{ paddingRight: 18 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncomingGoods.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                          Belum ada data faktur pembelian obat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredIncomingGoods.map(g => (
                        <tr key={g.id}>
                          <td style={{ paddingLeft: 18, fontWeight: 700, color: '#0f172a' }}>
                            {g.invoice_number}
                          </td>
                          <td style={{ fontSize: 12, color: '#64748b' }}>
                            {formatDateTime(g.date, tz).split(',')[0]}
                          </td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>
                            {g.supplier_name}
                          </td>
                          <td>
                            {Array.isArray(g.items) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {g.items.map((it, idx) => (
                                  <div key={idx} style={{ fontSize: 12 }}>
                                    {it.productName} ({it.qty} {it.unit || 'unit'}) &bull; ED: {it.exp_date || '-'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span>{g.notes || '-'}</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${g.payment_term === 'HUTANG' ? 'badge-amber' : 'badge-green'}`}>
                              {g.payment_term || 'TUNAI'} {g.due_date ? `(Tempo: ${g.due_date})` : ''}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                            {formatRupiah(g.total_amount || 0)}
                          </td>
                          <td style={{ textAlign: 'center', paddingRight: 18 }}>
                            <span className="badge badge-green">
                              ✓ {g.status || 'VERIFIED'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW 3: LAPORAN STOK OPNAME (LAP SO) */}
          {reportView === 'stock_opname' && (
            <div>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Laporan Hasil Stok Opname (Lap SO)
                  </h3>
                  <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                    Rekonsiliasi perbandingan stok sistem vs fisik lemari rak apotek, melihat selisih minus dan kelebihan barang
                  </p>
                </div>

                {/* Filter Rak */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Filter Posisi Rak:</span>
                  <select 
                    className="form-input form-select" 
                    value={soRackFilter} 
                    onChange={e => setSoRackFilter(e.target.value)}
                    style={{ height: 34, fontSize: 12, width: 140 }}
                  >
                    <option value="ALL">Semua Rak / Lemari</option>
                    {allRacks.filter(r => r !== 'ALL').map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 18 }}>Kode SO</th>
                      <th>Tanggal Pelaksanaan</th>
                      <th>Petugas Pemeriksa</th>
                      <th>Nama Obat & Rak</th>
                      <th className="text-center">Stok Sistem</th>
                      <th className="text-center">Stok Fisik</th>
                      <th className="text-center">Selisih Fisik</th>
                      <th className="text-right">Kerugian / Selisih (Rp)</th>
                      <th className="text-center" style={{ paddingRight: 18 }}>Status Rekonsiliasi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockOpnames.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                          Belum ada riwayat stok opname tercatat pada filter rak ini. Lakukan cek fisik di menu Inventaris.
                        </td>
                      </tr>
                    ) : (
                      filteredStockOpnames.map(so => {
                        const isMinus = (so.difference || 0) < 0;
                        const isPlus = (so.difference || 0) > 0;
                        return (
                          <tr key={so.id}>
                            <td style={{ paddingLeft: 18, fontWeight: 700, color: '#059669', fontSize: 12 }}>
                              {so.id}
                            </td>
                            <td style={{ fontSize: 12, color: '#475569' }}>
                              {formatDateTime(so.date, tz).split(',')[0]}
                            </td>
                            <td>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                                {so.officer || 'Apoteker'}
                              </span>
                            </td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{so.productName}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>📍 {so.rack || 'Rak Utama'}</div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 600 }}>
                              {so.systemStock}
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 800, color: '#047857' }}>
                              {so.physicalStock}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isMinus ? (
                                <span style={{ color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                                  {so.difference} (Minus)
                                </span>
                              ) : isPlus ? (
                                <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                                  +{so.difference} (Surplus)
                                </span>
                              ) : (
                                <span style={{ color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                                  ✓ Sesuai (0)
                                </span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 800, color: isMinus ? '#b91c1c' : '#0f172a' }}>
                              {so.differenceValue !== undefined ? formatRupiah(so.differenceValue) : '-'}
                            </td>
                            <td style={{ textAlign: 'center', paddingRight: 18 }}>
                              <span className="badge badge-green" style={{ fontSize: 11 }}>
                                {so.status === 'ADJUSTED' ? '✓ Stok Diselaraskan' : '✓ Terverifikasi'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL KONFIRMASI PEMBATALAN FAKTUR / VOID */}
      {isVoidModalOpen && selectedTrxToVoid && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c' }}>
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0, color: '#991b1b' }}>
                    Konfirmasi Pembatalan Faktur (Void)
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>
                    Faktur No: <strong>{selectedTrxToVoid.invoice_no || selectedTrxToVoid.id}</strong>
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={() => setIsVoidModalOpen(false)}>&times;</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: 12, fontSize: 12.5, color: '#9a3412' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 700 }}>⚠️ Efek Pembatalan Penjualan:</p>
                <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5 }}>
                  <li>Stok obat pada faktur ini otomatis <strong>dikembalikan ke inventori rak</strong>.</li>
                  <li>Nominal penjualan sebesar <strong>{formatRupiah(selectedTrxToVoid.total || 0)}</strong> dikeluarkan dari omzet kasir.</li>
                  <li>Uang tunai atau saldo dikembalikan kepada pasien/pembeli.</li>
                </ul>
              </div>

              {/* Detail Obat yang Dibatalkan */}
              <div>
                <label className="form-label">Obat yang Dikembalikan ke Rak Apotek:</label>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {Array.isArray(selectedTrxToVoid.items) ? (
                    selectedTrxToVoid.items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>{it.name}</span>
                        <span style={{ fontWeight: 800, color: '#059669' }}>+{it.qty} {it.unit || 'unit'} kembali ke rak</span>
                      </div>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>

              {/* Alasan Pembatalan */}
              <div>
                <label className="form-label">Alasan Pembatalan / Retur Pasien <span style={{ color: '#dc2626' }}>*</span></label>
                <select
                  className="form-input form-select"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  style={{ height: 42, fontSize: 13, fontWeight: 600 }}
                >
                  <option value="Pasien ingin ganti obat">Pasien ingin ganti obat lain</option>
                  <option value="Salah input kuantitas/resep di kasir">Salah input kuantitas/resep di kasir</option>
                  <option value="Pasien batal membeli">Pasien batal membeli (uang dikembalikan)</option>
                  <option value="Struk salah cetak">Struk salah cetak / transaksi dobel</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => setIsVoidModalOpen(false)}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger btn-lg" 
                  style={{ flex: 2, borderRadius: 10, gap: 6, background: '#dc2626', borderColor: '#b91c1c' }}
                  onClick={handleConfirmVoid}
                >
                  <CheckCheck size={16} /> Ya, Batalkan Faktur Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
