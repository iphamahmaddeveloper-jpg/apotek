import { useState } from 'react';
import { Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatRupiah } from '../../utils';
import { SHIFT_TYPES } from '../../config/auth';

export function OpenShiftModal({ isOpen, onClose, onConfirmOpen, currentUser }) {
  const [selectedShiftId, setSelectedShiftId] = useState(SHIFT_TYPES[0].id);
  const [initialCash, setInitialCash] = useState('200000');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentShiftType = SHIFT_TYPES.find(s => s.id === selectedShiftId) || SHIFT_TYPES[0];

  const handleOpen = (e) => {
    e.preventDefault();
    const cash = parseInt(initialCash, 10);
    if (isNaN(cash) || cash < 0) {
      setError('Modal kas awal di laci harus angka yang valid (minimal Rp 0).');
      return;
    }

    const newShift = {
      id: `SHF-${Date.now().toString().slice(-6)}`,
      shiftName: currentShiftType.name,
      userId: currentUser?.id || 'usr-staff',
      userName: currentUser?.name || 'Kasir Apotek',
      role: currentUser?.role || 'STAFF',
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'OPEN',
      initialCash: cash,
      expectedCash: cash,
      actualCash: null,
      difference: null,
      cashSalesTotal: 0,
      nonCashSalesTotal: 0,
      totalTransactions: 0,
      notes: ''
    };

    onConfirmOpen(newShift);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="icon-box-sm" style={{ background: '#ecfdf5' }}>
              <Clock size={16} color="#059669" />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>Buka Shift Kasir Baru</h3>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Catat kas awal laci sebelum melayani transaksi</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleOpen} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* User info */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontSize: 12.5, color: '#64748b' }}>Petugas Kasir</span>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: '#1e293b' }}>{currentUser?.name}</span>
          </div>

          {/* Shift Selection */}
          <div>
            <label className="form-label">Pilih Shift Kerja</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SHIFT_TYPES.map(st => (
                <div
                  key={st.id}
                  onClick={() => setSelectedShiftId(st.id)}
                  style={{
                    border: `1.5px solid ${selectedShiftId === st.id ? '#4f46e5' : '#e2e8f0'}`,
                    background: selectedShiftId === st.id ? '#f5f7ff' : '#ffffff',
                    borderRadius: 10,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e2432' }}>{st.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Jam Operasional: {st.hours}</div>
                  </div>
                  <input
                    type="radio"
                    checked={selectedShiftId === st.id}
                    onChange={() => setSelectedShiftId(st.id)}
                    style={{ accentColor: '#4f46e5' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Initial Cash input */}
          <div>
            <label className="form-label">Modal Kas Awal di Laci (Uang Pecahan Kembalian)</label>
            <input
              className="form-input"
              type="number"
              placeholder="Contoh: 200000"
              value={initialCash}
              onChange={(e) => { setInitialCash(e.target.value); setError(''); }}
              style={{ fontSize: '1rem', fontWeight: 700, height: 44 }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {[100000, 200000, 300000, 500000].map(amt => (
                <button
                  type="button"
                  key={amt}
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInitialCash(String(amt))}
                  style={{ fontSize: 11.5 }}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="alert-error" style={{ fontSize: 12 }}>
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2, borderRadius: 10 }}>
              <CheckCircle2 size={16} /> Mulai Shift Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CloseShiftModal({ isOpen, onClose, activeShift, transactions = [], onConfirmClose, currentUser: _currentUser }) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !activeShift) return null;

  // Calculate live numbers for transactions created during this active shift
  const shiftTransactions = transactions.filter(t => t.shiftId === activeShift.id);
  
  const cashSales = shiftTransactions
    .filter(t => (t.payment_method || 'Tunai').toLowerCase() === 'tunai')
    .reduce((acc, t) => acc + (t.total || 0), 0);

  const nonCashSales = shiftTransactions
    .filter(t => (t.payment_method || 'Tunai').toLowerCase() !== 'tunai')
    .reduce((acc, t) => acc + (t.total || 0), 0);

  const expectedCash = (activeShift.initialCash || 0) + cashSales;
  const countedCash = actualCash !== '' ? parseInt(actualCash, 10) : null;
  const diff = countedCash !== null && !isNaN(countedCash) ? countedCash - expectedCash : null;

  const handleCloseShift = (e) => {
    e.preventDefault();
    if (actualCash === '' || isNaN(parseInt(actualCash, 10))) {
      setError('Harap masukkan jumlah uang tunai fisik yang dihitung di laci.');
      return;
    }

    const finalActual = parseInt(actualCash, 10);
    const finalDiff = finalActual - expectedCash;

    const closedShift = {
      ...activeShift,
      endTime: new Date().toISOString(),
      status: 'CLOSED',
      expectedCash,
      actualCash: finalActual,
      difference: finalDiff,
      cashSalesTotal: cashSales,
      nonCashSalesTotal: nonCashSales,
      totalTransactions: shiftTransactions.length,
      notes: notes.trim()
    };

    onConfirmClose(closedShift);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="icon-box-sm" style={{ background: '#fef2f2' }}>
              <Clock size={16} color="#dc2626" />
            </div>
            <div>
              <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                Tutup Shift & Rekapitulasi Kas
              </h3>
              <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>
                {activeShift.shiftName} • {activeShift.userName}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleCloseShift} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Automatic Calculation Card */}
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
              <span style={{ fontWeight: 700, color: '#1e293b' }}>{formatRupiah(activeShift.initialCash || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>2. Penjualan Tunai ({shiftTransactions.length} Trx)</span>
              <span style={{ fontWeight: 700, color: '#16a34a' }}>+{formatRupiah(cashSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>3. Penjualan QRIS / Non-Tunai</span>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>{formatRupiah(nonCashSales)}</span>
            </div>

            <div style={{ height: 1, background: '#cbd5e1', margin: '4px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, fontWeight: 800 }}>
              <span style={{ color: '#0f172a' }}>Ekspektasi Uang Tunai di Laci</span>
              <span style={{ color: '#0f172a' }}>{formatRupiah(expectedCash)}</span>
            </div>
          </div>

          {/* Actual counted cash */}
          <div>
            <label className="form-label">
              Hitung Uang Tunai Fisik di Laci Kasir (Rp) <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              className="form-input"
              type="number"
              placeholder={`Contoh: ${expectedCash}`}
              value={actualCash}
              onChange={(e) => { setActualCash(e.target.value); setError(''); }}
              style={{ fontSize: '1.05rem', fontWeight: 800, height: 46 }}
              autoFocus
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 6, fontSize: 11.5 }}
              onClick={() => setActualCash(String(expectedCash))}
            >
              Uang Pas Sesuai Sistem ({formatRupiah(expectedCash)})
            </button>
          </div>

          {/* Difference Indicator */}
          {diff !== null && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: 10,
              background: diff === 0 ? '#f0fdf4' : diff > 0 ? '#eff6ff' : '#fff1f2',
              border: `1.5px solid ${diff === 0 ? '#bbf7d0' : diff > 0 ? '#bfdbfe' : '#fecdd3'}`
            }}>
              <div>
                <div style={{
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: diff === 0 ? '#15803d' : diff > 0 ? '#1d4ed8' : '#b91c1c'
                }}>
                  {diff === 0 ? 'Status Kas: PAS / SEIMBANG' : diff > 0 ? 'Status Kas: LEBIH' : 'Status Kas: MINUS / KURANG'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {diff === 0 ? 'Uang fisik di laci cocok dengan catatan transaksi.' : 'Selisih akan tercatat di laporan Owner.'}
                </div>
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 900,
                color: diff === 0 ? '#16a34a' : diff > 0 ? '#2563eb' : '#dc2626'
              }}>
                {diff === 0 ? 'Rp 0' : diff > 0 ? `+${formatRupiah(diff)}` : `${formatRupiah(diff)}`}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="form-label">Catatan Serah Terima (Opsional)</label>
            <input
              className="form-input"
              type="text"
              placeholder="Contoh: Diserahkan ke kasir Budi, uang pecahan lengkap."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ height: 40, fontSize: 12.5 }}
            />
          </div>

          {error && (
            <div className="alert-error" style={{ fontSize: 12 }}>
              <AlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn btn-danger btn-lg" style={{ flex: 2, borderRadius: 10 }}>
              <CheckCircle2 size={16} /> Konfirmasi & Tutup Shift
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
