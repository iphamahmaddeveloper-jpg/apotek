import { useState, useMemo } from 'react';
import { 
  Clock, Banknote, AlertTriangle, 
  CheckCircle2, Printer, FileText, Search
} from 'lucide-react';
import { formatRupiah, formatDateTime } from '../utils';

export function ShiftHistory({ shifts = [], activeShift, currentUser: _currentUser, onOpenShiftModal, onCloseShiftModal, settings }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedShift, setSelectedShift] = useState(null);
  const tz = settings?.timezone || 'Asia/Makassar';

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const matchSearch = s.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'ALL' || s.status === filterStatus;
      
      return matchSearch && matchStatus;
    });
  }, [shifts, searchTerm, filterStatus]);

  // Overall Shift Stats
  const stats = useMemo(() => {
    const total = shifts.length;
    const closed = shifts.filter(s => s.status === 'CLOSED');
    const totalCash = closed.reduce((acc, s) => acc + (s.cashSalesTotal || 0), 0);
    const withDiff = closed.filter(s => (s.difference || 0) !== 0);
    return { total, totalCash, diffCount: withDiff.length };
  }, [shifts]);

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 36 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title">Riwayat Shift & Rekonsiliasi Kasir</h2>
          <p className="section-subtitle">
            Catatan serah terima kasir, modal kas awal laci, omzet tunai per shift, dan selisih uang
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {activeShift ? (
            <button 
              className="btn btn-danger"
              onClick={onCloseShiftModal}
              style={{ gap: 7, borderRadius: 9 }}
            >
              <Clock size={15} />
              <span>Tutup Shift Aktif ({activeShift.shiftName})</span>
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={onOpenShiftModal}
              style={{ gap: 7, borderRadius: 9 }}
            >
              <Clock size={15} />
              <span>Buka Shift Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Banner if any */}
      {activeShift && (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
          border: '1.5px solid #a7f3d0',
          borderRadius: 14,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#059669',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#065f46' }}>
                  {activeShift.shiftName} (Sedang Berlangsung)
                </span>
                <span className="badge badge-green">LIVE SHIFT</span>
              </div>
              <div style={{ fontSize: 12, color: '#047857', marginTop: 2 }}>
                Kasir Bertugas: <strong>{activeShift.userName}</strong> • Dibuka: {formatDateTime(activeShift.startTime, tz)} • Modal Awal: <strong>{formatRupiah(activeShift.initialCash)}</strong>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-success btn-sm"
            onClick={onCloseShiftModal}
            style={{ borderRadius: 8, gap: 6 }}
          >
            <CheckCircle2 size={14} />
            <span>Tutup & Rekapitulasi Kasir</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status Kasir Saat Ini</span>
            <div className="icon-box-sm" style={{ background: activeShift ? '#ecfdf5' : '#fef2f2' }}>
              <Clock size={16} color={activeShift ? '#059669' : '#dc2626'} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e2432' }}>
              {activeShift ? 'Shift Aktif Berjalan' : 'Tidak Ada Shift Aktif'}
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
              {activeShift ? `Petugas: ${activeShift.userName}` : 'Silakan buka shift di kasir'}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Shift Tersimpan</span>
            <div className="icon-box-sm" style={{ background: '#eef2ff' }}>
              <FileText size={16} color="#4f46e5" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e2432' }}>
              {stats.total} Sesi Shift
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
              Rekam jejak kasir apotek
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Akumulasi Kas Masuk</span>
            <div className="icon-box-sm" style={{ background: '#f0fdf4' }}>
              <Banknote size={16} color="#16a34a" />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
              {formatRupiah(stats.totalCash)}
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
              Uang tunai tercatat di laci
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Disiplin Kas / Selisih</span>
            <div className="icon-box-sm" style={{ background: stats.diffCount > 0 ? '#fff7ed' : '#f0fdf4' }}>
              <AlertTriangle size={16} color={stats.diffCount > 0 ? '#ea580c' : '#16a34a'} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: stats.diffCount > 0 ? '#ea580c' : '#16a34a' }}>
              {stats.diffCount === 0 ? '100% Klop / Pas' : `${stats.diffCount} Ada Selisih`}
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>
              {stats.diffCount === 0 ? 'Semua uang fisik seimbang' : 'Perlu evaluasi Owner'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Table Filter Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f0f1f6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap'
        }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              className="form-input"
              placeholder="Cari kasir atau shift..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {['ALL', 'CLOSED', 'OPEN'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ borderRadius: 8, fontSize: 12 }}
              >
                {st === 'ALL' ? 'Semua Status' : st === 'CLOSED' ? 'Tutup Shift' : 'Shift Berjalan'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: 700, fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 18px' }}>ID & Nama Shift</th>
                <th style={{ padding: '12px 18px' }}>Petugas Kasir</th>
                <th style={{ padding: '12px 18px' }}>Waktu Mulai - Selesai</th>
                <th style={{ padding: '12px 18px' }}>Modal Awal</th>
                <th style={{ padding: '12px 18px' }}>Omzet Tunai</th>
                <th style={{ padding: '12px 18px' }}>Ekspektasi Kas</th>
                <th style={{ padding: '12px 18px' }}>Uang Fisik Aktual</th>
                <th style={{ padding: '12px 18px' }}>Status Selisih</th>
                <th style={{ padding: '12px 18px', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                    Belum ada riwayat shift yang sesuai dengan filter
                  </td>
                </tr>
              ) : (
                filteredShifts.map(s => {
                  const diff = s.difference || 0;
                  const isClosed = s.status === 'CLOSED';

                  return (
                    <tr 
                      key={s.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.12s ease' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 800, color: '#1e2432' }}>{s.shiftName}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{s.id}</div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, background: '#e0e7ff', color: '#4f46e5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11
                          }}>
                            {s.userName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.userName}</div>
                            <div style={{ fontSize: 10.5, color: '#64748b' }}>{s.role || 'Kasir'}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ color: '#334155', fontWeight: 600 }}>{formatDateTime(s.startTime, tz)}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          s/d {s.endTime ? formatDateTime(s.endTime, tz) : '(Sedang Berjalan)'}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#475569' }}>
                        {formatRupiah(s.initialCash || 0)}
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#16a34a' }}>
                        +{formatRupiah(s.cashSalesTotal || 0)}
                        <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 500 }}>{s.totalTransactions || 0} trx</div>
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 700, color: '#1e293b' }}>
                        {formatRupiah(s.expectedCash || (s.initialCash + (s.cashSalesTotal || 0)))}
                      </td>

                      <td style={{ padding: '14px 18px', fontWeight: 800, color: isClosed ? '#0f172a' : '#94a3b8' }}>
                        {isClosed ? formatRupiah(s.actualCash) : '—'}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {!isClosed ? (
                          <span className="badge badge-amber">Aktif</span>
                        ) : diff === 0 ? (
                          <span className="badge badge-green">Pas (Klop)</span>
                        ) : diff > 0 ? (
                          <span className="badge badge-indigo">Lebih +{formatRupiah(diff)}</span>
                        ) : (
                          <span className="badge badge-red">Minus {formatRupiah(diff)}</span>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ borderRadius: 6, fontSize: 11.5, gap: 4 }}
                          onClick={() => setSelectedShift(s)}
                        >
                          <FileText size={13} />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Shift Detail / Slip Serah Terima */}
      {selectedShift && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-box-sm" style={{ background: '#eef2ff' }}>
                  <FileText size={16} color="#4f46e5" />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                    Slip Rekapitulasi Shift Kasir
                  </h3>
                  <div style={{ fontSize: 11.5, color: '#64748b' }}>{selectedShift.id}</div>
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelectedShift(null)}>&times;</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Apotek Branding on Receipt */}
              <div style={{
                textAlign: 'center',
                padding: '12px 14px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12
              }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {settings?.nama_apotek || 'Apotek Medika Sejahtera'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {settings?.alamat || 'Jl. Kesehatan Raya No. 88, Kemang, Jakarta Selatan'}
                </div>
                <div style={{ height: 1, background: '#cbd5e1', margin: '8px 0', borderStyle: 'dashed' }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4f46e5' }}>
                  LAPORAN SERAH TERIMA KASIR ({selectedShift.shiftName})
                </div>
              </div>

              {/* Shift Key Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Petugas Kasir</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{selectedShift.userName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Waktu Buka Shift</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{formatDateTime(selectedShift.startTime, tz)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Waktu Tutup Shift</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>
                    {selectedShift.endTime ? formatDateTime(selectedShift.endTime, tz) : 'Sedang Aktif'}
                  </span>
                </div>
              </div>

              <div style={{ height: 1, background: '#e2e8f0' }} />

              {/* Financial Balance Breakdown */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>1. Modal Kas Awal di Laci</span>
                  <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatRupiah(selectedShift.initialCash || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>2. Penjualan Tunai ({selectedShift.totalTransactions || 0} Trx)</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>+{formatRupiah(selectedShift.cashSalesTotal || 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>3. Penjualan QRIS / Non-Tunai</span>
                  <span style={{ fontWeight: 700, color: '#6366f1' }}>{formatRupiah(selectedShift.nonCashSalesTotal || 0)}</span>
                </div>

                <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800 }}>
                  <span style={{ color: '#0f172a' }}>Ekspektasi Uang Tunai di Laci</span>
                  <span style={{ color: '#0f172a' }}>
                    {formatRupiah(selectedShift.expectedCash || ((selectedShift.initialCash || 0) + (selectedShift.cashSalesTotal || 0)))}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800 }}>
                  <span style={{ color: '#0369a1' }}>Uang Fisik Dihitung Kasir</span>
                  <span style={{ color: '#0369a1' }}>
                    {selectedShift.actualCash !== null ? formatRupiah(selectedShift.actualCash) : 'Belum Ditutup'}
                  </span>
                </div>

                <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#64748b' }}>Selisih Kas</span>
                  <span style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: (selectedShift.difference || 0) === 0 ? '#16a34a' : (selectedShift.difference || 0) > 0 ? '#4f46e5' : '#dc2626'
                  }}>
                    {(selectedShift.difference || 0) === 0 
                      ? 'Rp 0 (Klop / Seimbang)' 
                      : (selectedShift.difference || 0) > 0 
                      ? `+${formatRupiah(selectedShift.difference)} (Lebih)`
                      : `${formatRupiah(selectedShift.difference)} (Minus)`
                    }
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedShift.notes && (
                <div style={{ fontSize: 12, color: '#475569', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: 8, padding: '10px 12px' }}>
                  <strong>Catatan Kasir:</strong> {selectedShift.notes}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, borderRadius: 9 }}
                  onClick={() => setSelectedShift(null)}
                >
                  Tutup
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, borderRadius: 9, gap: 6 }}
                  onClick={() => handlePrintSlip(selectedShift)}
                >
                  <Printer size={15} /> Cetak Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
