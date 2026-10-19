import { useState, useMemo } from 'react';
import { 
  Search, ShoppingCart, Trash2, CheckCircle, 
  AlertCircle, ScanLine, X, Clock, Banknote, QrCode, Printer
} from 'lucide-react';
import { formatRupiah } from '../utils';
import { ROLES } from '../config/auth';
import { useToast } from '../context/ToastContext';
import { ThermalReceipt } from '../components/pos/ThermalReceipt';

export function POS({ 
  products = [], 
  onTransactionComplete, 
  onCheckout, 
  settings, 
  currentUser, 
  activeShift, 
  onOpenShiftModal, 
  onCloseShiftModal 
}) {
  const toast = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [isThermalReceiptOpen, setIsThermalReceiptOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [lastCompletedTrx, setLastCompletedTrx] = useState(null);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [payError, setPayError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); // 'Tunai' or 'QRIS'
  const isOwner = currentUser?.role === ROLES.OWNER;
  const dispatchCheckout = onTransactionComplete || onCheckout || (() => {});

  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['Semua', ...cats];
  }, [products]);

  const filteredProducts = useMemo(() => products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q);
    const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
    return matchSearch && matchCat && p.stock > 0;
  }), [products, searchTerm, activeCategory]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      toast.warning(`Stok ${product.name} telah habis!`);
      return;
    }
    setCart(prev => {
      const found = prev.find(i => i.id === product.id);
      if (found) {
        const newQty = found.qty + 1;
        if (newQty > product.stock) {
          toast.warning(`Stok tidak mencukupi (sisa ${product.stock})`);
          return prev;
        }
        return prev.map(i => i.id === product.id ? { ...i, qty: newQty } : i);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => {
      const prod = products.find(p => p.id === id);
      return prev.map(i => {
        if (i.id !== id) return i;
        const newQty = i.qty + delta;
        if (newQty < 1) return i;
        if (newQty > (prod?.stock || 999)) {
          toast.warning(`Maksimal stok tersedia: ${prod?.stock}`);
          return i;
        }
        return { ...i, qty: newQty };
      }).filter(i => i.qty > 0);
    });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const totalHpp = useMemo(() => cart.reduce((s, i) => s + (i.buy_price || 0) * i.qty, 0), [cart]);
  const profit = total - totalHpp;

  const quickAmounts = useMemo(() => {
    if (total <= 0) return [];
    const amounts = [total, 20000, 50000, 100000, 200000]
      .concat([Math.ceil(total / 10000) * 10000, Math.ceil(total / 50000) * 50000])
      .filter(a => a >= total)
      .sort((a, b) => a - b);
    return Array.from(new Set(amounts)).slice(0, 5);
  }, [total]);

  const handleOpenCheckout = () => {
    if (cart.length === 0) return;
    setPaymentAmount('');
    setPayError('');
    setPaymentMethod('Tunai');
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = () => {
    setPayError('');

    let paid;
    let change;

    if (paymentMethod === 'Tunai') {
      const parsedPaid = parseInt(paymentAmount, 10);
      if (isNaN(parsedPaid) || parsedPaid < total) {
        setPayError(`Jumlah bayar kurang. Minimum: ${formatRupiah(total)}`);
        return;
      }
      paid = parsedPaid;
      change = paid - total;
    } else {
      // QRIS
      paid = total;
      change = 0;
    }

    const trx = {
      id: `TRX-${Date.now().toString().slice(-7)}`,
      date: new Date().toISOString(),
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        price: i.price,
        buy_price: i.buy_price || 0,
        subtotal: i.price * i.qty,
        hpp_subtotal: (i.buy_price || 0) * i.qty
      })),
      total,
      total_hpp: totalHpp,
      profit,
      payment: paid,
      change,
      payment_method: paymentMethod,
      cashier: currentUser?.name || 'Kasir',
      shiftId: activeShift?.id || null
    };

    dispatchCheckout(trx);
    setLastCompletedTrx(trx);
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
    setCart([]);
    setPaymentAmount('');
    toast.success(`Transaksi ${trx.id} berhasil (${paymentMethod})!`);
  };

  const handleNewTransaction = () => {
    setIsSuccessOpen(false);
    setIsThermalReceiptOpen(false);
    setLastCompletedTrx(null);
    setSearchTerm('');
    setActiveCategory('Semua');
  };

  // QRIS Image URL
  const qrisUrl = useMemo(() => {
    const merchant = (settings?.qris?.merchant_name || 'APOTEK_MEDIKA_SEJAHTERA').replace(/\s+/g, '_');
    const qrisData = `00020101021226680016ID.CO.QRIS.WWW01189360091100200998877520459125303360540${total}5802ID5922${merchant}6007JAKARTA6304`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(qrisData)}`;
  }, [total, settings]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16, height: 'calc(100vh - 120px)' }} className="animate-fade-in">
      {/* Left: Product Catalog */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>
        {/* Header & Active Shift Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 className="section-title">Kasir (POS) Apotek</h2>
            <p className="section-subtitle">Pilih obat yang dijual atau scan barcode, lalu proses pembayaran</p>
          </div>

          {/* Shift Indicator Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeShift ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                padding: '6px 12px',
                borderRadius: 10
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>
                  {activeShift.shiftName}
                </span>
                <button
                  onClick={onCloseShiftModal}
                  className="btn btn-secondary btn-sm"
                  style={{ height: 26, fontSize: 11, padding: '0 8px', borderRadius: 6 }}
                >
                  Tutup Shift
                </button>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fffbeb',
                border: '1px solid #fde68a',
                padding: '6px 12px',
                borderRadius: 10
              }}>
                <Clock size={14} color="#d97706" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>
                  Belum Buka Shift
                </span>
                <button
                  onClick={onOpenShiftModal}
                  className="btn btn-primary btn-sm"
                  style={{ height: 26, fontSize: 11, padding: '0 10px', borderRadius: 6 }}
                >
                  Buka Shift
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Shift Warning for Staff if not opened */}
        {!isOwner && !activeShift && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fed7aa',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5, color: '#9a3412', fontWeight: 600 }}>
              <AlertCircle size={16} color="#ea580c" />
              <span>Shift kerja belum dibuka. Transaksi akan dicatat tanpa sesi shift kasir resmi.</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={onOpenShiftModal} style={{ borderRadius: 6, fontSize: 11.5 }}>
              Buka Shift Sekarang
            </button>
          </div>
        )}

        {/* Search + Barcode */}
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              className="form-input"
              placeholder="Cari nama obat (contoh: Paracetamol, Vitamin C)..."
              style={{ paddingLeft: 32, height: 38 }}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ position: 'relative', width: 180 }}>
            <ScanLine size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input
              className="form-input"
              placeholder="Scan barcode..."
              style={{ paddingLeft: 32, height: 38 }}
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const prod = products.find(p => p.barcode === barcodeInput.trim());
                  if (prod) {
                    addToCart(prod);
                    setBarcodeInput('');
                    toast.success(`Menambahkan ${prod.name}`);
                  } else {
                    toast.warning('Obat tidak ditemukan dari barcode ini');
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, flexShrink: 0 }}>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 8, fontSize: 11.5, whiteSpace: 'nowrap' }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {filteredProducts.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
              <ShoppingCart size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, color: '#475569' }}>Tidak ada obat ditemukan</div>
              <div style={{ fontSize: 12 }}>Coba ubah kata kunci pencarian atau filter kategori</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {filteredProducts.map(product => {
                const isLow = product.stock <= (product.min_stock || 10);
                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="card"
                    style={{
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      borderRadius: 12,
                      border: '1.5px solid #e8eaf0',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4f46e5';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8eaf0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', background: '#eef2ff', padding: '1px 6px', borderRadius: 4 }}>
                          {product.category}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isLow ? '#dc2626' : '#16a34a',
                          background: isLow ? '#fef2f2' : '#f0fdf4',
                          padding: '1px 6px',
                          borderRadius: 4
                        }}>
                          Sisa {product.stock}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e2432', lineHeight: 1.3, marginBottom: 4 }}>
                        {product.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#64748b' }}>
                        📍 {product.location || 'Rak Utama'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#4f46e5' }}>
                        {formatRupiah(product.price)}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                        + Tambah
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart & Checkout Summary */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        {/* Cart Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f1f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="icon-box-sm" style={{ background: '#eeefff' }}>
              <ShoppingCart size={15} color="#4f46e5" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>Keranjang Kasir</h3>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{cart.length} item obat</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={clearCart} title="Hapus Keranjang">
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 16px' }}>
              <div className="empty-state-icon"><ShoppingCart size={22} /></div>
              <h4>Keranjang kosong</h4>
              <p>Klik obat di sebelah kiri untuk memasukkan ke keranjang kasir</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cart.map(item => (
                <div key={item.id} style={{ background: '#f8f9fc', border: '1px solid #e8eaf0', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e2432', margin: 0, lineHeight: 1.3, flex: 1 }}>
                      {item.name}
                    </p>
                    <button onClick={() => removeFromCart(item.id)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 6px', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e8eaf0', borderRadius: 8 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16, fontWeight: 700 }}>-</button>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e2432', minWidth: 28, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: 16, fontWeight: 700 }}>+</button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 800, color: '#4f46e5', margin: 0 }}>{formatRupiah(item.price * item.qty)}</p>
                      <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>{formatRupiah(item.price)} × {item.qty}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Total & Checkout Action */}
        <div style={{ padding: 16, borderTop: '1px solid #f0f1f6', background: '#fafbfc' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#8e95a3', fontWeight: 500, marginBottom: 4 }}>
              <span>Subtotal Penjualan</span><span>{formatRupiah(total)}</span>
            </div>

            {/* ONLY OWNER CAN SEE ESTIMASI HPP & PROFIT */}
            {isOwner && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#6366f1', fontWeight: 600, marginBottom: 4 }}>
                <span>Estimasi HPP Modal (Owner)</span><span>{formatRupiah(totalHpp)}</span>
              </div>
            )}

            <div style={{ height: 1, background: '#f0f1f6', margin: '8px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Total Tagihan</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 900, color: '#1e2432', letterSpacing: '-0.03em' }}>{formatRupiah(total)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: 10 }}
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
          >
            <CheckCircle size={17} /> Proses Pembayaran
          </button>
        </div>
      </div>

      {/* MODAL: Checkout */}
      {isCheckoutOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 className="modal-title">Proses Pembayaran Kasir</h3>
              <button className="modal-close" onClick={() => setIsCheckoutOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Payment Method Selector */}
              <div>
                <label className="form-label">Metode Pembayaran</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Tunai')}
                    style={{
                      border: `1.5px solid ${paymentMethod === 'Tunai' ? '#4f46e5' : '#e2e8f0'}`,
                      background: paymentMethod === 'Tunai' ? '#eef2ff' : '#ffffff',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: paymentMethod === 'Tunai' ? '#4f46e5' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <Banknote size={16} />
                    <span>Uang Tunai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setPaymentMethod('QRIS'); setPaymentAmount(String(total)); }}
                    style={{
                      border: `1.5px solid ${paymentMethod === 'QRIS' ? '#059669' : '#e2e8f0'}`,
                      background: paymentMethod === 'QRIS' ? '#ecfdf5' : '#ffffff',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: paymentMethod === 'QRIS' ? '#059669' : '#475569',
                      cursor: 'pointer'
                    }}
                  >
                    <QrCode size={16} />
                    <span>QRIS Resmi</span>
                  </button>
                </div>
              </div>

              {/* Order summary */}
              <div style={{ background: '#f8f9fc', border: '1px solid #e8eaf0', borderRadius: 10, padding: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8, maxHeight: 100, overflowY: 'auto' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#374151' }}>
                      <span style={{ fontWeight: 500 }}>{item.name} ×{item.qty}</span>
                      <span style={{ fontWeight: 700 }}>{formatRupiah(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: '#e8eaf0', marginBottom: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                  <span style={{ color: '#374151' }}>Total Tagihan</span>
                  <span style={{ color: '#1e2432' }}>{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Conditional: Tunai vs QRIS */}
              {paymentMethod === 'Tunai' ? (
                <>
                  <div>
                    <label className="form-label">Uang Diterima dari Pelanggan (Rp)</label>
                    <input
                      className="form-input"
                      type="number"
                      min={total}
                      placeholder={`Minimal: ${formatRupiah(total)}`}
                      value={paymentAmount}
                      onChange={e => { setPaymentAmount(e.target.value); setPayError(''); }}
                      autoFocus
                      style={{ fontSize: '1.05rem', fontWeight: 800, height: 46 }}
                    />
                  </div>

                  {quickAmounts.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {quickAmounts.map(a => (
                        <button
                          key={a}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPaymentAmount(String(a))}
                          style={{ fontSize: 12 }}
                        >
                          {formatRupiah(a)}
                        </button>
                      ))}
                    </div>
                  )}

                  {paymentAmount && !isNaN(parseInt(paymentAmount, 10)) && parseInt(paymentAmount, 10) >= total && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 10,
                      padding: '10px 14px'
                    }}>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#15803d' }}>Kembalian Kasir</span>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#16a34a' }}>
                        {formatRupiah(parseInt(paymentAmount, 10) - total)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* OFFICIAL STAND QRIS DISPLAY */
                <div style={{
                  background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                  border: '2px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
                }}>
                  {/* Top Bar QRIS Official */}
                  <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ background: '#dc2626', color: '#fff', fontWeight: 900, fontSize: 11, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>
                        QRIS
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>GPN / STANDAR NASIONAL</span>
                    </div>
                    <span style={{ fontSize: 10.5, color: '#059669', fontWeight: 700 }}>BCA / MANDIRI / GOPAY</span>
                  </div>

                  {/* Merchant Details */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>
                      {settings?.qris?.merchant_name || 'APOTEK MEDIKA SEJAHTERA'}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                      NMID: {settings?.qris?.nmid || 'ID1020099887711'}
                    </div>
                  </div>

                  {/* Generated QR Code Canvas */}
                  <div style={{
                    background: '#ffffff',
                    padding: '10px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                  }}>
                    <img 
                      src={qrisUrl} 
                      alt="QRIS Apotek" 
                      style={{ width: 170, height: 170, display: 'block' }} 
                    />
                  </div>

                  {/* Nominal Tag */}
                  <div style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    padding: '6px 14px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>Nominal Pembayaran Pas</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#15803d' }}>
                      {formatRupiah(total)}
                    </div>
                  </div>

                  {/* SOP Guide for Cashier */}
                  <div style={{
                    fontSize: 11,
                    color: '#64748b',
                    background: '#f8fafc',
                    borderRadius: 8,
                    padding: '8px 12px',
                    lineHeight: 1.4,
                    width: '100%'
                  }}>
                    <strong>Petunjuk Kasir:</strong> Arahkan layar ke pembeli. Setelah pembeli scan & menunjukkan bukti bayar/notifikasi, klik tombol konfirmasi di bawah.
                  </div>
                </div>
              )}

              {payError && <div className="alert-error">{payError}</div>}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4, borderTop: '1px solid #f0f1f6' }}>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCheckoutOpen(false)}>
                  Batal
                </button>
                <button className="btn btn-primary btn-lg" style={{ flex: 2, borderRadius: 10, height: 44 }} onClick={handleConfirmPayment}>
                  <CheckCircle size={16} /> 
                  {paymentMethod === 'QRIS' ? 'Verifikasi QRIS & Selesai' : 'Konfirmasi & Bayar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Success & Action Options */}
      {isSuccessOpen && lastCompletedTrx && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={28} color="#16a34a" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e2432', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                  Pembayaran Berhasil Diterima
                </h3>
                <p style={{ fontSize: 12.5, color: '#6b7280', margin: 0 }}>
                  ID: <strong>{lastCompletedTrx.id}</strong> • Metode: {lastCompletedTrx.payment_method}
                </p>
              </div>

              {/* Quick Summary Pill */}
              <div style={{
                width: '100%',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: 13
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Total Tagihan</span>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatRupiah(lastCompletedTrx.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b' }}>Diterima ({lastCompletedTrx.payment_method})</span>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{formatRupiah(lastCompletedTrx.payment)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                  <span style={{ color: '#64748b' }}>Kembalian</span>
                  <span style={{ fontWeight: 800, color: '#16a34a' }}>{formatRupiah(lastCompletedTrx.change)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', borderRadius: 10, height: 42, gap: 7 }} 
                  onClick={() => setIsThermalReceiptOpen(true)}
                >
                  <Printer size={16} /> Lihat & Cetak Struk Termal 58mm
                </button>

                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', borderRadius: 10, height: 40 }} 
                  onClick={handleNewTransaction}
                >
                  Transaksi Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Thermal Receipt Viewer */}
      {isThermalReceiptOpen && lastCompletedTrx && (
        <ThermalReceipt 
          trx={lastCompletedTrx}
          settings={settings}
          activeShift={activeShift}
          onClose={() => setIsThermalReceiptOpen(false)}
        />
      )}
    </div>
  );
}
