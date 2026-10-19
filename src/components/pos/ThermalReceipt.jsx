import { Printer, X } from 'lucide-react';
import { formatRupiah, formatDateTime } from '../../utils';

export function ThermalReceipt({ trx, settings, activeShift, onClose, onPrint }) {
  if (!trx) return null;

  const tz = settings?.timezone || 'Asia/Jakarta';
  const apotekName = settings?.nama_apotek || 'Apotek Medika Sejahtera';
  const alamat = settings?.alamat || 'Jl. Kesehatan Raya No. 88, Kemang, Jakarta Selatan';
  const telp = settings?.nomor_telepon || settings?.nomor_wa || '021-7890-1234';
  const sipa = settings?.sipa || 'SIPA: 446/089/SIPA/DINKES-DKI/2024';
  const apoteker = settings?.apoteker || 'apt. Hendra Pratama, S.Farm.';

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className="modal-overlay no-print">
      <div className="modal-box" style={{ maxWidth: 420, padding: 0, overflow: 'hidden', background: '#e2e8f0' }}>
        {/* Header Actions */}
        <div style={{
          padding: '12px 18px',
          background: '#1e293b',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} color="#38bdf8" />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
              Preview Struk Kasir Termal 58mm
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Paper Container Preview */}
        <div style={{ padding: '20px 16px', maxHeight: '72vh', overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div
            id="thermal-receipt-preview"
            style={{
              width: '280px',
              background: '#ffffff',
              boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
              padding: '16px 14px 24px',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: '11px',
              lineHeight: 1.3,
              color: '#000000',
              borderBottom: '4px dashed #94a3b8'
            }}
          >
            {/* Header Apotek */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                {apotekName}
              </div>
              <div style={{ fontSize: '10px', marginTop: 2, color: '#333333' }}>
                {alamat}
              </div>
              <div style={{ fontSize: '10px', color: '#333333' }}>
                Telp: {telp}
              </div>
              <div style={{ fontSize: '9.5px', marginTop: 2, color: '#444444' }}>
                {sipa}
              </div>
              <div style={{ fontSize: '9.5px', color: '#444444' }}>
                Apoteker: {apoteker}
              </div>
            </div>

            {/* Double Divider */}
            <div style={{ borderTop: '1.5px dashed #000000', margin: '6px 0' }} />

            {/* Metadata Trx */}
            <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No. Nota :</span>
                <span style={{ fontWeight: 700 }}>{trx.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tanggal  :</span>
                <span>{formatDateTime(trx.date, tz)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kasir    :</span>
                <span style={{ fontWeight: 700 }}>{trx.cashier || 'Kasir'}</span>
              </div>
              {activeShift && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Shift    :</span>
                  <span>{activeShift.shiftName.split(' ')[0]}</span>
                </div>
              )}
            </div>

            {/* Dotted Divider */}
            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '6px 0' }}>
              {trx.items?.map((item, idx) => (
                <div key={idx}>
                  <div style={{ fontWeight: 700, fontSize: '10.5px' }}>{item.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>{item.qty} x {formatRupiah(item.price)}</span>
                    <span style={{ fontWeight: 700 }}>{formatRupiah(item.subtotal || item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Dotted Divider */}
            <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

            {/* Calculation Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: '10.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{formatRupiah(trx.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Diskon</span>
                <span>Rp 0</span>
              </div>

              <div style={{ borderTop: '1.5px solid #000000', margin: '4px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 900 }}>
                <span>TOTAL</span>
                <span>{formatRupiah(trx.total)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span>Bayar ({trx.payment_method || 'TUNAI'})</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(trx.payment || trx.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kembalian</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(trx.change || 0)}</span>
              </div>
            </div>

            {/* Double Divider */}
            <div style={{ borderTop: '1.5px dashed #000000', margin: '8px 0' }} />

            {/* Footer Greets */}
            <div style={{ textAlign: 'center', fontSize: '9.5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontWeight: 800 }}>TERIMA KASIH ATAS KUNJUNGAN ANDA</div>
              <div style={{ fontWeight: 700, fontStyle: 'italic' }}>SEMOGA LEKAS SEMBUH</div>
              <div style={{ fontSize: '8.5px', color: '#444444', marginTop: 4 }}>
                Barang / obat yang sudah dibeli tidak dapat ditukar/dikembalikan
              </div>
              <div style={{ fontSize: '8.5px', color: '#444444' }}>
                Simpan struk ini sebagai bukti pembayaran yang sah
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons in Modal Footer */}
        <div style={{
          padding: '12px 16px',
          background: '#ffffff',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          gap: 10
        }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1, borderRadius: 8 }}
            onClick={onClose}
          >
            Tutup
          </button>
          <button
            className="btn btn-primary"
            style={{ flex: 2, borderRadius: 8, gap: 7 }}
            onClick={handlePrint}
          >
            <Printer size={16} /> Cetak Struk (Thermal 58mm)
          </button>
        </div>
      </div>

      {/* Hidden print area for window.print() */}
      <div id="thermal-receipt-print-area">
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase' }}>
            {apotekName}
          </div>
          <div style={{ fontSize: '9px' }}>{alamat}</div>
          <div style={{ fontSize: '9px' }}>Telp: {telp}</div>
          <div style={{ fontSize: '8.5px' }}>{sipa}</div>
          <div style={{ fontSize: '8.5px' }}>Apoteker: {apoteker}</div>
        </div>

        <div style={{ borderTop: '1px dashed #000000', margin: '4px 0' }} />

        <div style={{ fontSize: '9.5px' }}>
          <div>No. Nota : {trx.id}</div>
          <div>Tanggal  : {formatDateTime(trx.date, tz)}</div>
          <div>Kasir    : {trx.cashier || 'Kasir'}</div>
          {activeShift && <div>Shift    : {activeShift.shiftName.split(' ')[0]}</div>}
        </div>

        <div style={{ borderTop: '1px dashed #000000', margin: '4px 0' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '4px 0' }}>
          {trx.items?.map((item, idx) => (
            <div key={idx}>
              <div style={{ fontWeight: 700, fontSize: '9.5px' }}>{item.name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <span>{item.qty} x {formatRupiah(item.price)}</span>
                <span style={{ fontWeight: 700 }}>{formatRupiah(item.subtotal || item.price * item.qty)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed #000000', margin: '4px 0' }} />

        <div style={{ fontSize: '9.5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span>
            <span>{formatRupiah(trx.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Diskon</span>
            <span>Rp 0</span>
          </div>
          <div style={{ borderTop: '1px solid #000000', margin: '3px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900 }}>
            <span>TOTAL</span>
            <span>{formatRupiah(trx.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Bayar ({trx.payment_method || 'TUNAI'})</span>
            <span>{formatRupiah(trx.payment || trx.total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Kembalian</span>
            <span>{formatRupiah(trx.change || 0)}</span>
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #000000', margin: '6px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '8.5px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontWeight: 800 }}>TERIMA KASIH</div>
          <div style={{ fontStyle: 'italic' }}>SEMOGA LEKAS SEMBUH</div>
          <div>Obat dibeli tdk dpt ditukar/kembali</div>
        </div>
      </div>
    </div>
  );
}
