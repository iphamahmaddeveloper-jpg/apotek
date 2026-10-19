import { useState, useMemo } from 'react';
import { 
  Search, Plus, Truck, Boxes, BarChart2, PackagePlus, 
  AlertCircle, Trash2, CheckCircle
} from 'lucide-react';
import { formatRupiah, formatDateTime, getLocalDateString } from '../utils';
import { useSearchParams } from 'react-router-dom';
import { ROLES } from '../config/auth';
import { useToast } from '../context/ToastContext';

function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <select className="form-input form-select" value={value} onChange={onChange} required>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}

export function Inventory({ 
  products = [], 
  onAddProduct, 
  onEditProduct, 
  incomingGoods = [], 
  onAddIncomingGoods, 
  settings, 
  currentUser 
}) {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('inventory');
  const tz = settings?.timezone || 'Asia/Jakarta';

  const isOwner = currentUser?.role === ROLES.OWNER;

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isIncomingModalOpen, setIsIncomingModalOpen] = useState(false);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [quickStockAmt, setQuickStockAmt] = useState('');
  const [formError, setFormError] = useState('');

  // Form state
  const [pf, setPf] = useState({ 
    name: '', category: '', buy_price: '', price: '', stock: '', 
    min_stock: '10', location: '', supplier: '' 
  });
  
  const [incoming, setIncoming] = useState({
    invoice_number: '', supplier_name: '', custom_supplier: '', date: '', notes: '',
    items: [{ productId: '', qty: '20', buy_price: '', exp_date: '' }]
  });

  // Derived lists
  const allCategories = useMemo(() => {
    const base = settings?.kategori || ['Analgesik','Vitamin & Suplemen','Antibiotik','Obat Bebas','Sirup & Cairan','P3K & Perawatan','Obat Maag','Obat Batuk','Antihistamin','Anti Jamur'];
    return Array.from(new Set([...base, ...products.map(p => p.category).filter(Boolean)]));
  }, [settings, products]);

  const allLocations = useMemo(() => {
    const base = settings?.lokasi_rak || ['Rak A-01','Rak A-02','Rak B-01','Rak B-02','Rak C-01','Rak C-02','Rak D-01','Rak E-01','Lemari Pendingin','Gudang Utama','Rak Kasir'];
    return Array.from(new Set([...base, ...products.map(p => p.location).filter(Boolean)]));
  }, [settings, products]);

  const allSuppliers = useMemo(() => {
    const base = settings?.suppliers || ['PT Kimia Farma Trading & Distribution','PT Enseval Putera Megatrading Tbk','PT Mensa Bina Sukses (MBS)','PT Anugrah Argon Medica (AAM)','PT Dos Ni Roha (DNR)','PT Penta Valent','PT Parit Padang Global'];
    return Array.from(new Set([...base, ...products.map(p => p.supplier).filter(Boolean), ...incomingGoods.map(g => g.supplier_name).filter(Boolean)]));
  }, [settings, products, incomingGoods]);

  const openAdd = () => {
    if (!isOwner) {
      toast.warning('Hanya Owner yang berwenang mendaftarkan obat baru ke sistem.');
      return;
    }
    setPf({ name: '', category: allCategories[0] || '', buy_price: '', price: '', stock: '', min_stock: '10', location: allLocations[0] || '', supplier: allSuppliers[0] || '' });
    setIsEditMode(false); setEditingProduct(null); setFormError(''); setIsProductModalOpen(true);
  };

  const openEdit = (p) => {
    if (!isOwner) {
      toast.warning('Hanya Owner yang berwenang mengubah harga dan data master obat.');
      return;
    }
    setEditingProduct(p);
    setPf({ name: p.name, category: p.category, buy_price: String(p.buy_price || ''), price: String(p.price), stock: String(p.stock), min_stock: String(p.min_stock || 10), location: p.location, supplier: p.supplier || allSuppliers[0] || '' });
    setIsEditMode(true); setFormError(''); setIsProductModalOpen(true);
  };

  const openQuickStock = (p) => { 
    setQuickStockProduct(p); 
    setQuickStockAmt(''); 
    setFormError(''); 
    setIsQuickStockOpen(true); 
  };

  const openIncoming = () => {
    setIncoming({
      invoice_number: `SJ-${Date.now().toString().slice(-5)}`,
      supplier_name: allSuppliers[0] || '', 
      custom_supplier: '',
      date: getLocalDateString(new Date(), tz), 
      notes: '',
      items: [{ productId: String(products[0]?.id || ''), qty: '20', buy_price: String(products[0]?.buy_price || 0), exp_date: '' }]
    });
    setFormError(''); 
    setIsIncomingModalOpen(true);
  };

  const closeAll = () => {
    setIsProductModalOpen(false); 
    setIsIncomingModalOpen(false); 
    setIsQuickStockOpen(false);
    setEditingProduct(null); 
    setQuickStockProduct(null); 
    setFormError('');
  };

  const handleSaveProduct = (e) => {
    e.preventDefault(); setFormError('');
    if (!pf.name.trim()) return setFormError('Nama obat tidak boleh kosong.');
    const bp = parseInt(pf.buy_price, 10), price = parseInt(pf.price, 10), stock = parseInt(pf.stock, 10);
    if (isNaN(bp) || bp < 0) return setFormError('Harga beli (HPP) tidak valid.');
    if (isNaN(price) || price < 0) return setFormError('Harga jual tidak valid.');
    if (isNaN(stock) || stock < 0) return setFormError('Jumlah stok tidak valid.');
    const data = { name: pf.name.trim(), category: pf.category, buy_price: bp, price, stock, min_stock: parseInt(pf.min_stock, 10) || 10, location: pf.location, supplier: pf.supplier };
    isEditMode ? onEditProduct({ ...data, id: editingProduct.id }) : onAddProduct({ ...data, id: Date.now() });
    closeAll();
  };

  // Skenario B: Quick Stock menambah stok saat kurir datang, langsung siap dijual di kasir
  const handleQuickStock = (e) => {
    e.preventDefault(); setFormError('');
    const amt = parseInt(quickStockAmt, 10);
    if (isNaN(amt) || amt <= 0) return setFormError('Jumlah unit harus lebih dari 0.');
    
    onEditProduct({ 
      ...quickStockProduct, 
      stock: quickStockProduct.stock + amt 
    });
    
    toast.success(`Stok ${quickStockProduct.name} bertambah +${amt} unit dan LANGSUNG SIAP DIJUAL di kasir!`);
    closeAll();
  };

  const handleIncomingItemChange = (idx, field, val) => {
    setIncoming(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: val };
      if (field === 'productId') {
        const prod = products.find(p => p.id === Number(val));
        if (prod?.buy_price) items[idx].buy_price = String(prod.buy_price);
      }
      return { ...prev, items };
    });
  };

  const incomingTotal = useMemo(() => 
    incoming.items.reduce((s, i) => s + (parseInt(i.qty, 10) || 0) * (parseInt(i.buy_price, 10) || 0), 0), 
    [incoming.items]
  );

  const incomingTotalUnits = useMemo(() => 
    incoming.items.reduce((s, i) => s + (parseInt(i.qty, 10) || 0), 0), 
    [incoming.items]
  );

  // Skenario B: Simpan Penerimaan Barang Kurir (Stok Bertambah Otomatis & Terproteksi dari Karyawan)
  const handleSaveIncoming = (e) => {
    e.preventDefault(); setFormError('');
    if (!incoming.invoice_number.trim()) return setFormError('Nomor faktur / surat jalan wajib diisi.');
    const supplier = incoming.supplier_name === 'OTHER' ? incoming.custom_supplier.trim() : incoming.supplier_name;
    if (!supplier) return setFormError('Nama PT / Distributor wajib dipilih.');
    
    for (let i = 0; i < incoming.items.length; i++) {
      const it = incoming.items[i];
      if (!it.productId) return setFormError(`Baris #${i+1}: Pilih obat terlebih dahulu.`);
      if (isNaN(parseInt(it.qty, 10)) || parseInt(it.qty, 10) <= 0) return setFormError(`Baris #${i+1}: Jumlah unit harus lebih dari 0.`);
      if (isOwner && (isNaN(parseInt(it.buy_price, 10)) || parseInt(it.buy_price, 10) < 0)) {
        return setFormError(`Baris #${i+1}: Harga beli tidak valid.`);
      }
    }

    const receiverName = currentUser?.name || 'Petugas Apotek';

    const newData = {
      id: `IN-${Date.now().toString().slice(-6)}`, 
      invoice_number: incoming.invoice_number.trim(),
      supplier_name: supplier, 
      date: new Date(incoming.date).toISOString(),
      notes: incoming.notes.trim() ? `${incoming.notes.trim()} (Diterima oleh: ${receiverName})` : `Diterima oleh: ${receiverName}`,
      total_amount: isOwner ? incomingTotal : 0,
      receivedBy: receiverName,
      status: isOwner ? 'VERIFIED' : 'PENDING_OWNER_VERIFICATION',
      items: incoming.items.map(it => {
        const prod = products.find(p => p.id === Number(it.productId));
        const q = parseInt(it.qty, 10);
        // Jika karyawan menginput, gunakan buy_price obat yang tersimpan di sistem tanpa diekspos ke karyawan
        const bp = isOwner ? parseInt(it.buy_price, 10) : (prod?.buy_price || 0);
        return { 
          productId: Number(it.productId), 
          productName: prod?.name || 'Obat', 
          qty: q, 
          buy_price: bp, 
          subtotal: q * bp, 
          exp_date: it.exp_date || '' 
        };
      })
    };

    if (onAddIncomingGoods) onAddIncomingGoods(newData);
    toast.success(`Barang datang berhasil diterima! ${incomingTotalUnits} unit obat otomatis BERTAMBAH dan LANGSUNG SIAP DIJUAL di kasir.`);
    closeAll();
  };

  const filteredProducts = useMemo(() => products.filter(p => {
    const q = searchTerm.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || (p.supplier || '').toLowerCase().includes(q);
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    return matchSearch && matchCat;
  }), [products, searchTerm, categoryFilter]);

  const totalAsset = useMemo(() => products.reduce((s, p) => s + (p.buy_price || 0) * (p.stock || 0), 0), [products]);
  const totalPotential = useMemo(() => products.reduce((s, p) => s + (p.price || 0) * (p.stock || 0), 0), [products]);
  const totalUnits = useMemo(() => products.reduce((s, p) => s + (p.stock || 0), 0), [products]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title">Inventaris & Barang Masuk</h2>
          <p className="section-subtitle">
            {isOwner 
              ? 'Kelola data obat, HPP modal, lokasi rak, dan verifikasi faktur tagihan PBF distributor' 
              : 'Katalog obat apotek, cek lokasi rak, dan input penerimaan barang kurir agar langsung bisa dijual'
            }
          </p>
        </div>

        {/* Action Buttons Header */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Tombol Terima Barang Kurir: BISA DIAKSES OLEH OWNER MAUPUN KARYAWAN */}
          <button 
            className="btn btn-success" 
            onClick={openIncoming}
            style={{ borderRadius: 9, gap: 7 }}
            title={isOwner ? "Input faktur tagihan lengkap distributor" : "Input barang kurir yang datang agar langsung bisa dijual di kasir"}
          >
            <Truck size={15} /> 
            <span>{isOwner ? 'Input Faktur Masuk (PT)' : '📦 Terima Barang Kurir (+ Stok Fisik)'}</span>
          </button>

          {/* Tombol Tambah Obat Baru: HANYA OWNER */}
          {isOwner && (
            <button 
              className="btn btn-primary" 
              onClick={openAdd}
              style={{ borderRadius: 9, gap: 7 }}
            >
              <Plus size={15} /> 
              <span>Tambah Obat Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Skenario B Explanation Banner for Staff */}
      {!isOwner && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
          border: '1.5px solid #a7f3d0',
          borderRadius: 12,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div className="icon-box-sm" style={{ background: '#dcfce7', flexShrink: 0 }}>
            <CheckCircle size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.4 }}>
            <strong>Alur Penerimaan Barang Kurir (Skenario B Aktif):</strong> Ketika kurir PBF mengantar obat saat Owner tidak ada di toko, Anda bisa langsung klik tombol hijau <strong>"Terima Barang Kurir"</strong> di atas atau tombol <strong>"+ Stok"</strong> di tabel. Stok seketika bertambah dan obat <strong>langsung bisa dijual di kasir saat itu juga</strong> tanpa perlu menunggu Owner datang.
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { key: 'inventory', label: 'Katalog Obat', count: products.length, icon: Boxes },
          { key: 'incoming',  label: isOwner ? 'Faktur Masuk PT' : 'Riwayat Barang Diterima', count: incomingGoods.length, icon: Truck },
          { key: 'opname',   label: isOwner ? 'Stok Opname & Aset' : 'Cek Fisik & Stok Menipis', count: null, icon: BarChart2 },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} className={`tab-item ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
              <Icon size={15} />
              {tab.label}
              {tab.count !== null && <span className="tab-count">{tab.count}</span>}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Inventory Catalog */}
      {activeTab === 'inventory' && (
        <div className="card">
          {/* Table toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f1f6', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 360 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input className="form-input" placeholder="Cari nama obat, nomor rak, atau PT..." style={{ paddingLeft: 32, height: 38 }}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <select className="form-input form-select" style={{ width: 180, height: 38 }}
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">Semua Kategori</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <span style={{ fontSize: 12.5, color: '#9ca3af', fontWeight: 500, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {filteredProducts.length} obat terdaftar
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Nama Obat</th>
                  <th>Kategori</th>
                  <th>Supplier (PT/PBF)</th>
                  <th className="text-right">Harga Beli (HPP)</th>
                  <th className="text-right">Harga Jual</th>
                  <th className="text-center">Margin</th>
                  <th className="text-center">Stok</th>
                  <th>Lokasi Rak</th>
                  <th className="text-right" style={{ paddingRight: 20 }}>Aksi Operasional</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => {
                  const margin = p.price - (p.buy_price || 0);
                  const marginPct = p.price > 0 ? ((margin / p.price) * 100).toFixed(0) : 0;
                  const isLow = p.stock < (p.min_stock || 10);

                  return (
                    <tr key={p.id}>
                      <td style={{ paddingLeft: 20, fontWeight: 700, color: '#1e2432' }}>{p.name}</td>
                      <td><span className="badge badge-gray">{p.category}</span></td>
                      <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={p.supplier}>{p.supplier || '-'}</td>
                      
                      {/* HARGA BELI HPP: HANYA OWNER BISA LIHAT */}
                      <td style={{ textAlign: 'right', color: '#6b7280' }}>
                        {isOwner ? (
                          formatRupiah(p.buy_price || 0)
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11.5 }} title="Informasi rahasia Owner">
                            Rp •••••• (Owner)
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e2432' }}>{formatRupiah(p.price)}</td>
                      
                      {/* MARGIN LABA: HANYA OWNER BISA LIHAT */}
                      <td style={{ textAlign: 'center' }}>
                        {isOwner ? (
                          <span className="badge badge-green">+{marginPct}%</span>
                        ) : (
                          <span className="badge badge-gray">—</span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${isLow ? 'badge-red' : 'badge-indigo'}`}>{p.stock}</span>
                      </td>

                      <td style={{ fontSize: 12.5, color: '#475569', fontWeight: 600 }}>
                        📍 {p.location}
                      </td>

                      {/* AKSI OPERASIONAL: BISA TAMBAH STOK KAPAN SAJA */}
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => openQuickStock(p)} 
                            style={{ gap: 5, borderRadius: 7 }}
                            title="Tambah stok fisik barang kurir agar langsung bisa dijual"
                          >
                            <PackagePlus size={14} color="#059669" />
                            <span style={{ fontWeight: 700 }}>+ Stok</span>
                          </button>

                          {isOwner && (
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <div className="empty-state-icon"><Search size={22} /></div>
                        <h4>Obat tidak ditemukan</h4>
                        <p>Coba kata kunci lain atau ubah filter kategori</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Incoming Goods History */}
      {activeTab === 'incoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {incomingGoods.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><Truck size={22} /></div>
                <h4>Belum ada catatan penerimaan barang</h4>
                <p>Gunakan tombol "Terima Barang Kurir" di atas untuk mencatat obat fisik yang baru datang dari distributor</p>
              </div>
            </div>
          ) : (
            incomingGoods.map(inv => (
              <div key={inv.id} className="card">
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="icon-box" style={{ background: '#f0fdf4' }}><Truck size={17} color="#16a34a" /></div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#1e2432', fontSize: '0.925rem' }}>{inv.invoice_number}</span>
                        <span className="badge badge-green">Stok Masuk Kasir</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#8e95a3', margin: 0, marginTop: 2 }}>
                        {inv.supplier_name} &bull; {formatDateTime(inv.date, tz)}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      {isOwner ? 'Total Nilai Faktur' : 'Status Tagihan'}
                    </p>
                    <p style={{ fontSize: '1.05rem', fontWeight: 800, color: isOwner ? '#16a34a' : '#6366f1', margin: 0 }}>
                      {isOwner ? formatRupiah(inv.total_amount) : 'Diverifikasi Owner'}
                    </p>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 20 }}>Obat Diterima</th>
                        <th className="text-center">Jumlah Masuk</th>
                        <th className="text-right">Harga Beli (HPP)</th>
                        <th className="text-right">Subtotal</th>
                        <th style={{ paddingRight: 20 }}>Tgl Expired</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ paddingLeft: 20, fontWeight: 600, color: '#1e2432' }}>{it.productName}</td>
                          <td style={{ textAlign: 'center' }}><span className="badge badge-green">+{it.qty} unit</span></td>
                          
                          <td style={{ textAlign: 'right', color: '#6b7280' }}>
                            {isOwner ? formatRupiah(it.buy_price) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Rp ••••••</span>}
                          </td>

                          <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e2432' }}>
                            {isOwner ? formatRupiah(it.subtotal) : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Rp ••••••</span>}
                          </td>

                          <td style={{ paddingRight: 20, fontSize: 12.5, color: '#8e95a3' }}>{it.exp_date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {inv.notes && (
                    <div style={{ padding: '10px 20px', background: '#fafbfd', fontSize: 12.5, color: '#6b7280', borderTop: '1px solid #f0f1f6' }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>Catatan Penerima: </span>{inv.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Stock Opname & Physical Verification */}
      {activeTab === 'opname' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {isOwner ? (
              [
                { label: 'Nilai Aset Stok (HPP Modal)', value: formatRupiah(totalAsset), sub: 'Harga Beli × Jumlah Unit stok' },
                { label: 'Estimasi Nilai Jual Stok', value: formatRupiah(totalPotential), sub: `Potensi laba: ${formatRupiah(totalPotential - totalAsset)}` },
                { label: 'Total Kuantitas Fisik', value: `${totalUnits} Unit`, sub: `${products.length} varian obat terdaftar` },
              ].map((c, i) => (
                <div key={i} className="stat-card">
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: '#8e95a3', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{c.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e2432', letterSpacing: '-0.03em', margin: '6px 0 4px' }}>{c.value}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontWeight: 500 }}>{c.sub}</p>
                </div>
              ))
            ) : (
              [
                { label: 'Total Kuantitas Fisik', value: `${totalUnits} Unit`, sub: 'Total seluruh tablet, botol, & strip' },
                { label: 'Varian Obat Terdaftar', value: `${products.length} Item`, sub: 'Katalog aktif apotek' },
                { label: 'Obat Stok Menipis', value: `${products.filter(p => p.stock < (p.min_stock || 10)).length} Item`, sub: 'Perlu restock dari PBF distributor' },
              ].map((c, i) => (
                <div key={i} className="stat-card">
                  <p style={{ fontSize: 11.5, fontWeight: 600, color: '#8e95a3', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{c.label}</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e2432', letterSpacing: '-0.03em', margin: '6px 0 4px' }}>{c.value}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, fontWeight: 500 }}>{c.sub}</p>
                </div>
              ))
            )}
          </div>

          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f1f6' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e2432', margin: 0 }}>Lembar Cek Fisik & Stok Opname</h3>
              <p style={{ fontSize: 12.5, color: '#9ca3af', margin: '3px 0 0' }}>Rekonsiliasi stok sistem dengan fisik di rak apotek</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: 20 }}>Nama Obat</th>
                    <th>Lokasi Rak</th>
                    <th className="text-right">HPP Modal/unit</th>
                    <th className="text-center">Stok Sistem</th>
                    <th className="text-right">Nilai Aset</th>
                    <th className="text-right" style={{ paddingRight: 20 }}>Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td style={{ paddingLeft: 20, fontWeight: 600, color: '#1e2432' }}>{p.name}</td>
                      <td><span className="badge badge-gray">{p.location}</span></td>
                      <td style={{ textAlign: 'right', color: '#6b7280' }}>
                        {isOwner ? (
                          formatRupiah(p.buy_price || 0)
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11.5 }}>Rp ••••••</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}><span className="badge badge-indigo">{p.stock} pcs</span></td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#1e2432' }}>
                        {isOwner ? (
                          formatRupiah((p.buy_price || 0) * (p.stock || 0))
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 11.5 }}>Rp ••••••</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: 20 }}>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => openQuickStock(p)} 
                          style={{ gap: 4, borderRadius: 6, fontSize: 11.5 }}
                        >
                          <PackagePlus size={13} color="#059669" />
                          <span>+ Tambah Stok</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Product (Owner Only) */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Edit Data Obat' : 'Tambah Obat Baru ke Katalog'}</h3>
              <button className="modal-close" onClick={closeAll}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {formError && <div className="alert-error"><AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />{formError}</div>}

                <div>
                  <label className="form-label">Nama Obat *</label>
                  <input className="form-input" placeholder="Contoh: Paracetamol 500mg" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} required />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <SelectInput label="Kategori *" value={pf.category} onChange={e => setPf({...pf, category: e.target.value})} options={allCategories} />
                  <SelectInput label="Lokasi Rak *" value={pf.location} onChange={e => setPf({...pf, location: e.target.value})} options={allLocations} />
                </div>

                <SelectInput label="Supplier Default (PT / PBF)" value={pf.supplier} onChange={e => setPf({...pf, supplier: e.target.value})} options={allSuppliers} />

                <div style={{ background: '#f8f9fc', border: '1px solid #e8eaf0', borderRadius: 10, padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="form-label">Harga Beli / HPP (Rp) *</label>
                    <input className="form-input" type="number" min="0" placeholder="0" value={pf.buy_price} onChange={e => setPf({...pf, buy_price: e.target.value})} required />
                    <p className="form-hint">Harga modal beli apotek ke PBF</p>
                  </div>
                  <div>
                    <label className="form-label">Harga Jual Konsumen (Rp) *</label>
                    <input className="form-input" type="number" min="0" placeholder="0" value={pf.price} onChange={e => setPf({...pf, price: e.target.value})} required />
                    <p className="form-hint">Harga resmi di kasir POS</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="form-label">Stok {isEditMode ? 'Saat Ini' : 'Awal'} *</label>
                    <input className="form-input" type="number" min="0" placeholder="0" value={pf.stock} onChange={e => setPf({...pf, stock: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Batas Stok Minimum *</label>
                    <input className="form-input" type="number" min="1" placeholder="10" value={pf.min_stock} onChange={e => setPf({...pf, min_stock: e.target.value})} required />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 4, borderTop: '1px solid #f0f1f6' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeAll}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan Data Obat</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Quick Add Stock (Skenario B: Tambah Stok Instan) */}
      {isQuickStockOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div className="icon-box-sm" style={{ background: '#ecfdf5' }}>
                  <PackagePlus size={16} color="#059669" />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>Tambah Stok Cepat (+ Fisik)</h3>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Input barang datang dari kurir agar langsung bisa dijual</p>
                </div>
              </div>
              <button className="modal-close" onClick={closeAll}>&times;</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleQuickStock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && <div className="alert-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{formError}</div>}
                
                <div style={{ background: '#f8f9fc', border: '1px solid #e8eaf0', borderRadius: 10, padding: 14 }}>
                  <p style={{ fontSize: 11.5, color: '#8e95a3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Nama Obat</p>
                  <p style={{ fontWeight: 800, color: '#1e2432', fontSize: '0.95rem', margin: '0 0 4px' }}>{quickStockProduct?.name}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                    <span>Lokasi: <strong>{quickStockProduct?.location}</strong></span>
                    <span>Stok saat ini: <strong style={{ color: '#4f46e5' }}>{quickStockProduct?.stock} unit</strong></span>
                  </div>
                </div>

                <div>
                  <label className="form-label">Jumlah Unit Diterima dari Kurir *</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    min="1" 
                    placeholder="Contoh: 20 atau 50" 
                    value={quickStockAmt} 
                    onChange={e => setQuickStockAmt(e.target.value)} 
                    style={{ fontSize: '1.1rem', fontWeight: 800, height: 46 }}
                    autoFocus 
                    required 
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {[10, 20, 50, 100].map(n => (
                      <button 
                        key={n} 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => setQuickStockAmt(String(n))}
                        style={{ fontSize: 11.5 }}
                      >
                        +{n}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#15803d' }}>
                  ⚡ <strong>Siap Jual:</strong> Begitu tombol ditekan, stok di kasir bertambah dan kasir bisa langsung melayani transaksi tanpa menunggu Owner.
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f0f1f6', paddingTop: 6 }}>
                  <button type="button" className="btn btn-secondary" onClick={closeAll}>Batal</button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ borderRadius: 9 }}>
                    <CheckCircle size={16} /> Tambah & Langsung Jual
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Incoming Goods (Skenario B: Kurir Datang Bawa Faktur / Surat Jalan) */}
      {isIncomingModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal-box" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-box-sm" style={{ background: '#f0fdf4' }}>
                  <Truck size={17} color="#16a34a" />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                    {isOwner ? 'Input Faktur Masuk PBF Distributor' : 'Penerimaan Barang Fisik dari Kurir PBF'}
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>
                    {isOwner 
                      ? 'Catat tagihan dan stok masuk distributor secara lengkap' 
                      : 'Input jumlah obat fisik yang tiba agar langsung bertambah di kasir & bisa dijual'
                    }
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={closeAll}>&times;</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSaveIncoming} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && <div className="alert-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{formError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="form-label">No. Surat Jalan / No. Faktur *</label>
                    <input className="form-input" placeholder="Contoh: SJ-ENS-8821" value={incoming.invoice_number} onChange={e => setIncoming({...incoming, invoice_number: e.target.value})} required autoFocus />
                  </div>
                  <div>
                    <label className="form-label">Tanggal Barang Diterima *</label>
                    <input className="form-input" type="date" value={incoming.date} onChange={e => setIncoming({...incoming, date: e.target.value})} required />
                  </div>
                </div>

                <div>
                  <label className="form-label">Distributor / PT PBF Pengirim *</label>
                  <select className="form-input form-select" value={incoming.supplier_name} onChange={e => setIncoming({...incoming, supplier_name: e.target.value})} required>
                    {allSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="OTHER">+ Input Nama Distributor Lainnya...</option>
                  </select>
                </div>

                {incoming.supplier_name === 'OTHER' && (
                  <div>
                    <label className="form-label">Nama PT / Distributor Baru *</label>
                    <input className="form-input" placeholder="Ketik nama distributor baru..." value={incoming.custom_supplier} onChange={e => setIncoming({...incoming, custom_supplier: e.target.value})} required />
                  </div>
                )}

                {/* Items to receive */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Daftar Obat yang Tiba dari Kurir</label>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => setIncoming(prev => ({ ...prev, items: [...prev.items, { productId: String(products[0]?.id || ''), qty: '10', buy_price: String(products[0]?.buy_price || 0), exp_date: '' }] }))}>
                      <Plus size={13} /> Tambah Obat Lain
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
                    {incoming.items.map((item, idx) => {
                      const sub = (parseInt(item.qty, 10) || 0) * (parseInt(item.buy_price, 10) || 0);

                      return (
                        <div key={idx} style={{ background: '#f8f9fc', border: '1px solid #e8eaf0', borderRadius: 10, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#4f46e5' }}>Item Obat #{idx + 1}</span>
                            {incoming.items.length > 1 && (
                              <button type="button" className="btn btn-danger btn-sm" style={{ height: 22, padding: '0 6px' }} onClick={() => setIncoming(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}>
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1.5fr 1fr' : '1.5fr 1fr', gap: 10, marginBottom: 8 }}>
                            <div>
                              <label className="form-label" style={{ fontSize: 11 }}>Pilih Obat</label>
                              <select className="form-input form-select" style={{ height: 36, fontSize: 12.5 }} value={item.productId} onChange={e => handleIncomingItemChange(idx, 'productId', e.target.value)}>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name} (stok skrg: {p.stock})</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="form-label" style={{ fontSize: 11 }}>Tgl Kedaluwarsa (Exp)</label>
                              <input className="form-input" type="date" style={{ height: 36, fontSize: 12 }} value={item.exp_date} onChange={e => handleIncomingItemChange(idx, 'exp_date', e.target.value)} />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr 1fr 1fr' : '1fr', gap: 10 }}>
                            <div>
                              <label className="form-label" style={{ fontSize: 11 }}>Jumlah Fisik yang Tiba (Unit) *</label>
                              <input className="form-input" type="number" min="1" placeholder="Contoh: 20" style={{ height: 36, fontSize: 13, fontWeight: 700 }} value={item.qty} onChange={e => handleIncomingItemChange(idx, 'qty', e.target.value)} required />
                            </div>

                            {/* HANYA OWNER BISA MELIHAT/MENGUBAH HARGA BELI */}
                            {isOwner && (
                              <>
                                <div>
                                  <label className="form-label" style={{ fontSize: 11 }}>Harga Beli HPP (Rp) *</label>
                                  <input className="form-input" type="number" min="0" style={{ height: 36, fontSize: 12.5 }} value={item.buy_price} onChange={e => handleIncomingItemChange(idx, 'buy_price', e.target.value)} required />
                                </div>
                                <div>
                                  <label className="form-label" style={{ fontSize: 11 }}>Subtotal</label>
                                  <div style={{ height: 36, display: 'flex', alignItems: 'center', fontWeight: 700, color: '#1e2432', fontSize: 12.5 }}>
                                    {formatRupiah(sub)}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary Card */}
                {isOwner ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                    <div>
                      <p style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d', margin: 0 }}>Total Nilai Faktur PBF</p>
                      <p style={{ fontSize: 11, color: '#16a34a', margin: 0 }}>Stok obat bertambah otomatis dan siap dijual</p>
                    </div>
                    <p style={{ fontSize: '1.2rem', fontWeight: 900, color: '#15803d', margin: 0 }}>{formatRupiah(incomingTotal)}</p>
                  </div>
                ) : (
                  <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#15803d' }}>
                        Total Obat Masuk: +{incomingTotalUnits} Unit
                      </span>
                      <span className="badge badge-green">Langsung Aktif di Kasir</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#166534', marginTop: 4 }}>
                      Obat langsung bisa dijual ke pembeli saat ini juga. Tagihan faktur tempo akan diverifikasi oleh Owner.
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label">Catatan Tambahan (Kondisi Kardus / Nama Kurir)</label>
                  <input className="form-input" placeholder="Contoh: Dus segel rapi, kurir Mas Doni" value={incoming.notes} onChange={e => setIncoming({...incoming, notes: e.target.value})} style={{ height: 36, fontSize: 12.5 }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f0f1f6', paddingTop: 6 }}>
                  <button type="button" className="btn btn-secondary" onClick={closeAll}>Batal</button>
                  <button type="submit" className="btn btn-success btn-lg" style={{ borderRadius: 10 }}>
                    <CheckCircle size={16} /> {isOwner ? 'Simpan Faktur & Tambah Stok' : 'Terima Barang & Buka Stok Kasir'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
