import { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, 
  CreditCard, Banknote, QrCode, AlertCircle, X, Clock, Barcode,
  Sparkles, UserCheck, Tag, Star, ChevronDown, Check, Eye
} from 'lucide-react';
import { formatRupiah } from '../utils';
import { ROLES } from '../config/auth';
import { useToast } from '../context/ToastContext';
import { ThermalReceipt } from '../components/pos/ThermalReceipt';

export function POS({ 
  products = [], 
  members = [],
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
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'

  // Member & Diskon states
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0); // Rp
  const [showAllCatalog, setShowAllCatalog] = useState(false);

  const searchInputRef = useRef(null);
  const barcodeInputRef = useRef(null);
  const isOwner = currentUser?.role === ROLES.OWNER;
  const dispatchCheckout = onTransactionComplete || onCheckout || (() => {});

  const allCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['Semua', ...cats];
  }, [products]);

  // Fast-Moving Obat (Top 6 untuk tampilan awal bersih agar tidak padat)
  const fastMovingProducts = useMemo(() => {
    return products.slice(0, 6);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q && activeCategory === 'Semua' && !showAllCatalog) {
      // Default: Hanya tampilkan obat cepat jual jika user belum mencari
      return fastMovingProducts;
    }

    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q) || (p.location || '').toLowerCase().includes(q);
      const matchCat = activeCategory === 'Semua' || p.category === activeCategory;
      return matchSearch && matchCat && p.stock > 0;
    });
  }, [products, searchTerm, activeCategory, showAllCatalog, fastMovingProducts]);

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
    toast.success(`+1 ${product.name} masuk keranjang.`);
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
  const clearCart = () => {
    setCart([]);
    setDiscountAmount(0);
    setSelectedMember(null);
  };

  // Subtotal & Total dengan diskon
  const subtotal = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);
  const total = Math.max(0, subtotal - discountAmount);
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

  // Handle scan barcode enter
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    const matched = products.find(p => p.barcode === code || p.id === Number(code));
    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      toast.warning(`Obat dengan barcode ${code} tidak ditemukan.`);
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F4' && cart.length > 0 && !isCheckoutOpen) {
        e.preventDefault();
        handleOpenCheckout();
      }
      if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setIsMemberModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isCheckoutOpen]);

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

    // Nomor faktur berformat apotek nyata: OB11223
    const invoiceNo = `OB${Math.floor(10000 + Math.random() * 90000)}`;

    const trx = {
      id: invoiceNo,
      invoice_no: invoiceNo,
      date: new Date().toISOString(),
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        qty: i.qty,
        unit: i.unit || 'Strip',
        price: i.price,
        buy_price: i.buy_price || 0,
        subtotal: i.price * i.qty,
        hpp_subtotal: (i.buy_price || 0) * i.qty
      })),
      subtotal,
      discount: discountAmount,
      total,
      total_hpp: totalHpp,
      profit,
      payment: paid,
      change,
      payment_method: paymentMethod,
      cashier: currentUser?.name || 'Kasir Apotek',
      shiftName: activeShift?.shiftName || 'Shift Mandiri',
      shiftId: activeShift?.id || null,
      customer: selectedMember ? `${selectedMember.name} (Member)` : 'Pelanggan Umum',
      memberId: selectedMember?.id || null,
      is_void: false
    };

    dispatchCheckout(trx);
    setLastCompletedTrx(trx);
    setIsCheckoutOpen(false);
    setIsSuccessOpen(true);
    setCart([]);
    setPaymentAmount('');
    setDiscountAmount(0);
    setSelectedMember(null);
    toast.success(`Faktur ${invoiceNo} berhasil dicetak (${paymentMethod})!`);
  };

  const handleNewTransaction = () => {
    setIsSuccessOpen(false);
    setLastCompletedTrx(null);
    setMobileTab('catalog');
  };

  // Generate QRIS Data URI
  const qrisUrl = useMemo(() => {
    const merchant = encodeURIComponent(settings?.nama_apotek || 'Apotek Mandiri');
    const qrisData = `00020101021226680016ID.CO.QRIS.WWW01189360091100200998877520459125303360540${total}5802ID5922${merchant}6007JAKARTA6304`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(qrisData)}`;
  }, [total, settings]);

  return (
    <div className="pos-grid-container animate-fade-in" style={{ position: 'relative' }}>
      {/* Mobile Tab Switcher (Katalog vs Keranjang) */}
      <div className="show-on-mobile" style={{
        display: 'none',
        background: '#f1f5f9',
        padding: 4,
        borderRadius: 14,
        gap: 4,
        width: '100%',
        marginBottom: 8
      }}>
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: mobileTab === 'catalog' ? 800 : 600,
            background: mobileTab === 'catalog' ? '#ffffff' : 'transparent',
            color: mobileTab === 'catalog' ? '#047857' : '#64748b',
            border: 'none',
            cursor: 'pointer',
            boxShadow: mobileTab === 'catalog' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
          }}
        >
          📦 Cari Obat
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          style={{
            flex: 1,
            padding: '9px 12px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: mobileTab === 'cart' ? 800 : 600,
            background: mobileTab === 'cart' ? '#ffffff' : 'transparent',
            color: mobileTab === 'cart' ? '#047857' : '#64748b',
            border: 'none',
            cursor: 'pointer',
            boxShadow: mobileTab === 'cart' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          🛒 Keranjang {cart.length > 0 && (
            <span style={{
              background: '#059669',
              color: '#ffffff',
              borderRadius: 9999,
              padding: '1px 8px',
              fontSize: 11,
              fontWeight: 800
            }}>
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Left: Product Catalog & Clean Search */}
      <div 
        className={mobileTab === 'cart' ? 'hide-on-mobile' : ''} 
        style={{ display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden', flex: 1 }}
      >
        {/* Header & Shift Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 className="section-title">Kasir (POS) Apotek</h2>
            <p className="section-subtitle">Ketik nama obat atau scan barcode untuk transaksi cepat kasir</p>
          </div>

          {/* Shift Indicator Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeShift ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                padding: '6px 12px',
                borderRadius: 10
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>
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
                  style={{ height: 26, fontSize: 11, padding: '0 10px', borderRadius: 6, background: '#059669' }}
                >
                  Buka Shift
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search Box + Barcode Scanner Input */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#059669' }} />
            <input
              ref={searchInputRef}
              className="form-input"
              placeholder="Ketik nama obat atau rak (tekan F2)..."
              style={{ paddingLeft: 36, paddingRight: 32, height: 42, fontSize: 13.5, fontWeight: 600, borderRadius: 10 }}
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setShowAllCatalog(true); }}
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <form onSubmit={handleBarcodeSubmit} style={{ display: 'flex', gap: 6, flex: 1, minWidth: 170 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Barcode size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                ref={barcodeInputRef}
                className="form-input"
                placeholder="Scan Barcode Enter..."
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                style={{ paddingLeft: 32, height: 42, fontSize: 13, borderRadius: 10 }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ height: 42, borderRadius: 10, fontSize: 12, fontWeight: 700 }}
              title="Masukkan barcode"
            >
              + Masuk
            </button>
          </form>
        </div>

        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, flexShrink: 0 }}>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setShowAllCatalog(true); }}
              className={`btn btn-sm ${activeCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                borderRadius: 9999,
                fontSize: 12,
                whiteSpace: 'nowrap',
                background: activeCategory === cat ? 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' : '#ffffff',
                borderColor: activeCategory === cat ? '#059669' : '#e2e8f0'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product List / Fast-Moving Recommendations */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {/* Petunjuk ramah agar kasir tidak pusing dengan katalog padat */}
          {!searchTerm && activeCategory === 'Semua' && !showAllCatalog && (
            <div style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 14,
              padding: '12px 16px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#475569' }}>
                <Sparkles size={16} color="#059669" />
                <span>Menampilkan <strong>Obat Fast-Moving</strong> agar layar kasir tetap lapang & cepat.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllCatalog(true)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#059669',
                  cursor: 'pointer'
                }}
              >
                Lihat Seluruh Katalog ({products.length})
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: '#9ca3af' }}>
              <ShoppingCart size={32} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, color: '#475569' }}>Tidak ada obat ditemukan</div>
              <div style={{ fontSize: 12 }}>Coba ubah kata kunci pencarian nama atau scan barcode</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
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
                      borderRadius: 14,
                      border: '1.5px solid #e8eaf0',
                      transition: 'all 0.15s ease',
                      background: '#ffffff'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#059669';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8eaf0';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '1px 6px', borderRadius: 4 }}>
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
                        📍 {product.location || 'Rak Utama'} &bull; Satuan: <strong>{product.unit || 'Strip'}</strong>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#047857' }}>
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
      <div 
        className={`card ${mobileTab === 'catalog' ? 'hide-on-mobile' : ''}`} 
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}
      >
        {/* Cart Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f1f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div className="icon-box-sm" style={{ background: '#ecfdf5' }}>
              <ShoppingCart size={15} color="#059669" />
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

        {/* Member Selector Bar */}
        <div style={{
          padding: '8px 14px',
          background: selectedMember ? '#ecfdf5' : '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <Star size={14} color={selectedMember ? '#059669' : '#94a3b8'} />
            <span style={{ fontWeight: 600, color: selectedMember ? '#047857' : '#64748b' }}>
              {selectedMember ? `${selectedMember.name} (${selectedMember.points.toLocaleString()} Poin)` : 'Pelanggan Umum'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMemberModalOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 11.5,
              fontWeight: 700,
              color: '#059669',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {selectedMember ? 'Ganti Member' : '+ Pilih Member'}
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
          {cart.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 16px' }}>
              <div className="empty-state-icon"><ShoppingCart size={22} color="#059669" /></div>
              <h4>Keranjang kosong</h4>
              <p>Klik obat atau scan barcode di sebelah kiri untuk transaksi</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cart.map(item => (
                <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #e8eaf0', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#1e2432', margin: 0, lineHeight: 1.3 }}>
                        {item.name}
                      </p>
                      <span style={{ fontSize: 10.5, color: '#64748b' }}>Satuan: {item.unit || 'Strip'}</span>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 6px', flexShrink: 0 }}>
                      <X size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1.5px solid #e8eaf0', borderRadius: 8 }}>
                      <button onClick={() => updateQty(item.id, -1)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16, fontWeight: 700 }}>-</button>
                      <span style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1e2432', minWidth: 28, textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#059669', fontSize: 16, fontWeight: 700 }}>+</button>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.875rem', fontWeight: 800, color: '#047857', margin: 0 }}>{formatRupiah(item.price * item.qty)}</p>
                      <p style={{ fontSize: 10.5, color: '#9ca3af', margin: 0 }}>{formatRupiah(item.price)} × {item.qty}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Total & Checkout Action */}
        <div style={{ padding: 14, borderTop: '1px solid #f0f1f6', background: '#fafbfc' }}>
          {/* Diskon Section */}
          <div style={{ marginBottom: 10, background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Tag size={13} color="#059669" /> Diskon Potongan (Rp)
              </span>
              {discountAmount > 0 && (
                <button 
                  type="button" 
                  onClick={() => setDiscountAmount(0)}
                  style={{ background: 'none', border: 'none', fontSize: 11, color: '#dc2626', cursor: 'pointer' }}
                >
                  Hapus Diskon
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setDiscountAmount(10000)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: discountAmount === 10000 ? '#ecfdf5' : '#f1f5f9',
                  border: `1px solid ${discountAmount === 10000 ? '#059669' : '#cbd5e1'}`,
                  color: discountAmount === 10000 ? '#047857' : '#475569',
                  cursor: 'pointer'
                }}
              >
                Diskon Member Rp 10.000
              </button>
              <button
                type="button"
                onClick={() => setDiscountAmount(5000)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  background: discountAmount === 5000 ? '#ecfdf5' : '#f1f5f9',
                  border: `1px solid ${discountAmount === 5000 ? '#059669' : '#cbd5e1'}`,
                  color: discountAmount === 5000 ? '#047857' : '#475569',
                  cursor: 'pointer'
                }}
              >
                Rp 5.000
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b', marginBottom: 3 }}>
              <span>Subtotal</span><span>{formatRupiah(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', fontWeight: 700, marginBottom: 3 }}>
                <span>Diskon</span><span>-{formatRupiah(discountAmount)}</span>
              </div>
            )}

            {/* HPP Modal (Owner Only) */}
            {isOwner && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>
                <span>Estimasi HPP (Owner)</span><span>{formatRupiah(totalHpp)}</span>
              </div>
            )}

            <div style={{ height: 1, background: '#f0f1f6', margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1e2432' }}>Total Tagihan</span>
              <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#047857', letterSpacing: '-0.03em' }}>{formatRupiah(total)}</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
          >
            <CheckCircle size={17} /> 
            <span>Proses Pembayaran</span>
            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.25)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
              F4
            </span>
          </button>
        </div>
      </div>

      {/* Floating mobile cart bar when viewing catalog with items in cart */}
      {mobileTab === 'catalog' && cart.length > 0 && (
        <div 
          className="show-on-mobile" 
          style={{
            display: 'none',
            position: 'fixed',
            bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            left: 12,
            right: 12,
            zIndex: 40,
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            color: '#ffffff',
            borderRadius: 18,
            padding: '12px 18px',
            boxShadow: '0 8px 24px rgba(5, 150, 105, 0.4)',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
          onClick={() => setMobileTab('cart')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.25)',
              width: 32,
              height: 32,
              borderRadius: 9,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 13
            }}>
              {cart.reduce((s, i) => s + i.qty, 0)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>Keranjang Kasir</p>
              <p style={{ margin: 0, fontSize: 11, opacity: 0.9 }}>{cart.length} jenis obat &bull; {selectedMember ? selectedMember.name : 'Umum'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 900 }}>{formatRupiah(total)}</span>
            <span style={{ fontSize: 12, fontWeight: 800, background: '#ffffff', color: '#047857', padding: '6px 14px', borderRadius: 9999 }}>
              Lihat & Bayar &rarr;
            </span>
          </div>
        </div>
      )}

      {/* MODAL: Pilih Member Apotek */}
      {isMemberModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Pilih Member / Pelanggan Apotek</h3>
              <button className="modal-close" onClick={() => setIsMemberModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div 
                onClick={() => { setSelectedMember(null); setIsMemberModalOpen(false); }}
                style={{
                  border: '1.5px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  background: !selectedMember ? '#ecfdf5' : '#ffffff'
                }}
              >
                <div style={{ fontWeight: 700, color: '#1e293b' }}>Pelanggan Umum (Tanpa Member)</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Transaksi normal tanpa poin dan potongan khusus</div>
              </div>

              {members.map(m => (
                <div
                  key={m.id}
                  onClick={() => { 
                    setSelectedMember(m); 
                    if (m.discountEligible) setDiscountAmount(10000);
                    setIsMemberModalOpen(false); 
                  }}
                  style={{
                    border: `1.5px solid ${selectedMember?.id === m.id ? '#059669' : '#e2e8f0'}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    background: selectedMember?.id === m.id ? '#ecfdf5' : '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>No HP: {m.phone} &bull; {m.address}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: 9999 }}>
                      ⭐ {m.points.toLocaleString()} Poin
                    </span>
                    {m.discountEligible && (
                      <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, marginTop: 2 }}>
                        Bisa Diskon Rp 10.000
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                      border: `1.5px solid ${paymentMethod === 'Tunai' ? '#059669' : '#e2e8f0'}`,
                      background: paymentMethod === 'Tunai' ? '#ecfdf5' : '#ffffff',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: paymentMethod === 'Tunai' ? '#047857' : '#475569',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Pelanggan</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{selectedMember ? `${selectedMember.name} (Member)` : 'Pelanggan Umum'}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#059669', marginBottom: 4 }}>
                    <span>Potongan Diskon</span>
                    <span style={{ fontWeight: 700 }}>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
                <div style={{ height: 1, background: '#e8eaf0', margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800 }}>
                  <span style={{ color: '#374151' }}>Total Tagihan</span>
                  <span style={{ color: '#047857' }}>{formatRupiah(total)}</span>
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
                          style={{
                            fontSize: 11,
                            borderRadius: 6,
                            background: paymentAmount === String(a) ? '#ecfdf5' : '#f8f9fc',
                            borderColor: paymentAmount === String(a) ? '#059669' : '#e8eaf0',
                            color: paymentAmount === String(a) ? '#047857' : '#374151'
                          }}
                          onClick={() => { setPaymentAmount(String(a)); setPayError(''); }}
                        >
                          {a === total ? `Uang Pas (${formatRupiah(a)})` : formatRupiah(a)}
                        </button>
                      ))}
                    </div>
                  )}

                  {paymentAmount && !isNaN(parseInt(paymentAmount, 10)) && parseInt(paymentAmount, 10) >= total && (
                    <div style={{
                      background: '#f0fdf4',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>Kembalian Kasir:</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#15803d' }}>
                        {formatRupiah(parseInt(paymentAmount, 10) - total)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '10px 0' }}>
                  <img src={qrisUrl} alt="QRIS Apotek" style={{ width: 170, height: 170, borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', margin: 0 }}>
                    Minta pelanggan memindai QRIS di atas dengan BCA, Mandiri, BRI, GoPay, atau OVO.
                  </p>
                </div>
              )}

              {payError && (
                <div className="alert-error" style={{ fontSize: 12 }}>
                  <AlertCircle size={14} />
                  <span>{payError}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsCheckoutOpen(false)}>
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  style={{ flex: 2, borderRadius: 10, background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
                  onClick={handleConfirmPayment}
                >
                  <CheckCircle size={16} /> Selesaikan Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Success */}
      {isSuccessOpen && lastCompletedTrx && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <CheckCircle size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
              Pembayaran Berhasil!
            </h3>
            <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 16px' }}>
              Faktur <strong>{lastCompletedTrx.invoice_no || lastCompletedTrx.id}</strong> telah tercatat di sistem.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, marginBottom: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748b' }}>Total Tagihan</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>{formatRupiah(lastCompletedTrx.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                <span style={{ color: '#64748b' }}>Metode Bayar</span>
                <span style={{ fontWeight: 700, color: '#047857' }}>{lastCompletedTrx.payment_method}</span>
              </div>
              {lastCompletedTrx.payment_method === 'Tunai' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <span style={{ color: '#64748b' }}>Kembalian Kasir</span>
                  <span style={{ fontWeight: 800, color: '#15803d' }}>{formatRupiah(lastCompletedTrx.change || 0)}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: '100%', borderRadius: 10 }}
                onClick={() => setIsThermalReceiptOpen(true)}
              >
                🖨️ Cetak Struk Pasien (Thermal 58mm/80mm)
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: 10, background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)' }}
                onClick={handleNewTransaction}
              >
                + Transaksi Baru (Kasir Siap)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Print Dialog */}
      {isThermalReceiptOpen && lastCompletedTrx && (
        <ThermalReceipt
          transaction={lastCompletedTrx}
          settings={settings}
          onClose={() => setIsThermalReceiptOpen(false)}
        />
      )}
    </div>
  );
}
