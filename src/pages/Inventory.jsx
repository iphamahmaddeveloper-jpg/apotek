import { useState, useMemo, useEffect } from 'react';
import { 
  Search, Plus, Truck, Boxes, BarChart2, PackagePlus, 
  AlertCircle, Trash2, CheckCircle, Eye, EyeOff, Info, X,
  Barcode, Calendar, FileText, CheckCheck, RotateCcw, Building2,
  Clock, DollarSign, ArrowUpRight, ShieldCheck, Tag
} from 'lucide-react';
import { formatRupiah, formatDateTime, getLocalDateString } from '../utils';
import { useSearchParams } from 'react-router-dom';
import { ROLES } from '../config/auth';
import { useToast } from '../context/ToastContext';

export function Inventory({ 
  products = [], 
  onAddProduct, 
  onEditProduct, 
  incomingGoods = [], 
  onAddIncomingGoods,
  stockOpnames = [],
  onSaveStockOpname,
  settings, 
  currentUser 
}) {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'inventory'); // 'inventory' | 'incoming' | 'opname'

  // Tab 1 (Katalog Obat) state
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [filterStockStatus, setFilterStockStatus] = useState('ALL'); // 'ALL' | 'LOW'
  const [showFinancialColumns, setShowFinancialColumns] = useState(false);

  // Tab 2 (Pembelian PBF) state
  const [incomingSearch, setIncomingSearch] = useState('');
  const [incomingSupplierFilter, setIncomingSupplierFilter] = useState('ALL');
  const [incomingPaymentFilter, setIncomingPaymentFilter] = useState('ALL'); // 'ALL' | 'HUTANG' | 'TUNAI'

  // Tab 3 (Stok Opname) state
  const [opnameSubTab, setOpnameSubTab] = useState('active_so'); // 'active_so' | 'so_history'
  const [opnameRackFilter, setOpnameRackFilter] = useState('ALL');
  const [opnameStatusFilter, setOpnameStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'DONE' | 'DIFF'
  const [opnameSearch, setOpnameSearch] = useState('');
  const [physicalCounts, setPhysicalCounts] = useState({}); // { [productId]: number }
  const [opnameNotes, setOpnameNotes] = useState({}); // { [productId]: string }

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isIncomingModalOpen, setIsIncomingModalOpen] = useState(false);
  const [isQuickStockOpen, setIsQuickStockOpen] = useState(false);
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [quickStockAmt, setQuickStockAmt] = useState('');
  const [formError, setFormError] = useState('');

  const tz = settings?.timezone || 'Asia/Makassar';
  const isOwner = currentUser?.role === ROLES.OWNER;

  // Form state Obat Baru
  const [pf, setPf] = useState({ 
    name: '', barcode: '', category: '', buy_price: '', price: '', stock: '', 
    min_stock: '10', unit: 'Strip', location: '', supplier: '', batch_no: '', exp_date: '' 
  });
  
  // Form Faktur Pembelian Masuk PBF
  const [incoming, setIncoming] = useState({
    invoice_number: '', 
    supplier_name: 'PT. BINAYA FARMA UTAMA', 
    custom_supplier: '', 
    date: getLocalDateString(), 
    payment_term: 'HUTANG', // 'HUTANG' | 'TUNAI'
    due_date: '',
    status: 'VERIFIED',
    notes: '',
    items: [
      { productId: '', barcode: '', qty: '10', unit: 'Strip', buy_price: '', batch_no: '', exp_date: '' }
    ]
  });

  // Sinkronisasi tab dari URL
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['inventory', 'incoming', 'opname'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
    const base = settings?.suppliers || [
      'PT. BINAYA FARMA UTAMA',
      'PT Kimia Farma Trading & Distribution',
      'PT Enseval Putera Megatrading Tbk',
      'PT Mensa Bina Sukses (MBS)',
      'PT Anugrah Argon Medica (AAM)',
      'PT Dos Ni Roha (DNR)',
      'PT Penta Valent',
      'PT Parit Padang Global'
    ];
    return Array.from(new Set([...base, ...products.map(p => p.supplier).filter(Boolean), ...incomingGoods.map(g => g.supplier_name).filter(Boolean)]));
  }, [settings, products, incomingGoods]);

  // Stats Tab 1: Katalog
  const lowStockCount = useMemo(() => products.filter(p => p.stock < (p.min_stock || 10)).length, [products]);
  const totalUnits = useMemo(() => products.reduce((s, p) => s + (p.stock || 0), 0), [products]);

  // Stats Tab 2: Pembelian PBF
  const totalIncomingPurchases = useMemo(() => incomingGoods.reduce((s, g) => s + (g.total_amount || 0), 0), [incomingGoods]);
  const hutangGoods = useMemo(() => incomingGoods.filter(g => g.payment_term === 'HUTANG'), [incomingGoods]);
  const totalHutangAmount = useMemo(() => hutangGoods.reduce((s, g) => s + (g.total_amount || 0), 0), [hutangGoods]);
  const lunasGoods = useMemo(() => incomingGoods.filter(g => g.payment_term !== 'HUTANG'), [incomingGoods]);
  const totalLunasAmount = useMemo(() => lunasGoods.reduce((s, g) => s + (g.total_amount || 0), 0), [lunasGoods]);

  // Stats Tab 3: Stok Opname
  const opnameCheckedCount = useMemo(() => {
    return Object.keys(physicalCounts).filter(k => physicalCounts[k] !== undefined && physicalCounts[k] !== '').length;
  }, [physicalCounts]);

  const discrepancyCount = useMemo(() => {
    return Object.keys(physicalCounts).filter(k => {
      const p = products.find(prod => prod.id === Number(k));
      return p && physicalCounts[k] !== undefined && physicalCounts[k] !== '' && (parseInt(physicalCounts[k], 10) !== p.stock);
    }).length;
  }, [physicalCounts, products]);

  // Filter List Tab 1
  const filteredProducts = useMemo(() => products.filter(p => {
    const q = searchTerm.toLowerCase().trim();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.location || '').toLowerCase().includes(q) || (p.barcode || '').includes(q) || (p.supplier || '').toLowerCase().includes(q);
    const matchCat = categoryFilter === 'All' || p.category === categoryFilter;
    const matchStock = filterStockStatus === 'ALL' || (filterStockStatus === 'LOW' && p.stock < (p.min_stock || 10));
    return matchSearch && matchCat && matchStock;
  }), [products, searchTerm, categoryFilter, filterStockStatus]);

  // Filter List Tab 2: Faktur Masuk PBF
  const filteredIncomingGoods = useMemo(() => incomingGoods.filter(g => {
    const q = incomingSearch.toLowerCase().trim();
    const matchSearch = !q || (g.invoice_number || '').toLowerCase().includes(q) || (g.supplier_name || '').toLowerCase().includes(q);
    const matchSupplier = incomingSupplierFilter === 'ALL' || g.supplier_name === incomingSupplierFilter;
    const matchPayment = incomingPaymentFilter === 'ALL' || g.payment_term === incomingPaymentFilter;
    return matchSearch && matchSupplier && matchPayment;
  }), [incomingGoods, incomingSearch, incomingSupplierFilter, incomingPaymentFilter]);

  // Filter List Tab 3: Stok Opname
  const opnameFilteredProducts = useMemo(() => {
    return products.filter(p => {
      const q = opnameSearch.toLowerCase().trim();
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.barcode || '').includes(q) || (p.location || '').toLowerCase().includes(q);
      const matchRack = opnameRackFilter === 'ALL' || p.location === opnameRackFilter;
      
      const counted = physicalCounts[p.id];
      const hasCounted = counted !== undefined && counted !== '';
      const diff = hasCounted ? (parseInt(counted, 10) - p.stock) : 0;

      let matchStatus = true;
      if (opnameStatusFilter === 'PENDING') matchStatus = !hasCounted;
      if (opnameStatusFilter === 'DONE') matchStatus = hasCounted;
      if (opnameStatusFilter === 'DIFF') matchStatus = hasCounted && diff !== 0;

      return matchSearch && matchRack && matchStatus;
    });
  }, [products, opnameSearch, opnameRackFilter, opnameStatusFilter, physicalCounts]);

  const openAdd = () => {
    if (!isOwner) {
      toast.warning('Hanya Owner yang berwenang mendaftarkan obat baru ke sistem.');
      return;
    }
    setPf({ 
      name: '', barcode: '', category: allCategories[0] || '', buy_price: '', price: '', 
      stock: '', min_stock: '10', unit: 'Strip', location: allLocations[0] || '', supplier: allSuppliers[0] || '',
      batch_no: '', exp_date: ''
    });
    setIsEditMode(false); setEditingProduct(null); setFormError(''); setIsProductModalOpen(true);
  };

  const openEdit = (p) => {
    if (!isOwner) {
      toast.warning('Hanya Owner yang berwenang mengubah harga dan data master obat.');
      return;
    }
    setEditingProduct(p);
    setPf({ 
      name: p.name, barcode: p.barcode || '', category: p.category, 
      buy_price: String(p.buy_price || ''), price: String(p.price), stock: String(p.stock), 
      min_stock: String(p.min_stock || 10), unit: p.unit || 'Strip', location: p.location, 
      supplier: p.supplier || allSuppliers[0] || '', batch_no: p.batch_no || '', exp_date: p.exp_date || ''
    });
    setIsEditMode(true); setFormError(''); setIsProductModalOpen(true);
  };

  const openQuickStock = (p) => { 
    setQuickStockProduct(p); 
    setQuickStockAmt(''); 
    setFormError(''); 
    setIsQuickStockOpen(true); 
  };

  const openIncoming = () => {
    const firstProd = products[0];
    const defaultDueDate = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    setIncoming({
      invoice_number: `FAK-BINAYA-${Date.now().toString().slice(-4)}`,
      supplier_name: allSuppliers[0] || 'PT. BINAYA FARMA UTAMA', 
      custom_supplier: '', 
      date: getLocalDateString(), 
      payment_term: 'HUTANG',
      due_date: defaultDueDate,
      status: 'VERIFIED',
      notes: '',
      items: [
        { 
          productId: String(firstProd?.id || ''), 
          barcode: firstProd?.barcode || '', 
          qty: '20', 
          unit: firstProd?.unit || 'Strip', 
          buy_price: String(firstProd?.buy_price || 0), 
          batch_no: '', 
          exp_date: '' 
        }
      ]
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

  // Simpan Obat Baru / Edit
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!pf.name.trim()) { setFormError('Nama obat tidak boleh kosong.'); return; }
    const buy = parseInt(pf.buy_price, 10);
    const sell = parseInt(pf.price, 10);
    const stk = parseInt(pf.stock, 10);
    const minStk = parseInt(pf.min_stock, 10);

    if (isNaN(sell) || sell <= 0) { setFormError('Harga jual harus berupa angka lebih dari 0.'); return; }
    if (isNaN(stk) || stk < 0) { setFormError('Jumlah stok tidak boleh negatif.'); return; }

    const prodData = {
      name: pf.name.trim(),
      barcode: pf.barcode.trim(),
      category: pf.category || allCategories[0],
      buy_price: isNaN(buy) ? 0 : buy,
      price: sell,
      stock: stk,
      min_stock: isNaN(minStk) ? 10 : minStk,
      unit: pf.unit || 'Strip',
      location: pf.location || allLocations[0],
      supplier: pf.supplier || allSuppliers[0],
      batch_no: pf.batch_no.trim(),
      exp_date: pf.exp_date
    };

    if (isEditMode && editingProduct) {
      onEditProduct({ ...editingProduct, ...prodData });
      toast.success(`Data obat ${prodData.name} berhasil diperbarui.`);
    } else {
      onAddProduct({ id: Date.now(), ...prodData });
      toast.success(`Obat ${prodData.name} berhasil ditambahkan ke katalog.`);
    }
    closeAll();
  };

  // Input Cepat Tambah Stok Kasir
  const handleSaveQuickStock = (e) => {
    e.preventDefault();
    const amt = parseInt(quickStockAmt, 10);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Jumlah unit masuk harus angka lebih dari 0.');
      return;
    }

    const updated = {
      ...quickStockProduct,
      stock: (quickStockProduct.stock || 0) + amt
    };

    onEditProduct(updated);
    toast.success(`Stok ${quickStockProduct.name} berhasil ditambah +${amt} unit! Kasir langsung bisa menjual.`);
    closeAll();
  };

  const handleIncomingItemChange = (idx, field, value) => {
    setIncoming(prev => {
      const newItems = [...prev.items];
      newItems[idx] = { ...newItems[idx], [field]: value };
      if (field === 'productId') {
        const p = products.find(prod => prod.id === Number(value));
        if (p) {
          newItems[idx].buy_price = String(p.buy_price || 0);
          newItems[idx].unit = p.unit || 'Strip';
          newItems[idx].barcode = p.barcode || '';
        }
      }
      return { ...prev, items: newItems };
    });
  };

  // Simpan Faktur Masuk PBF (Pembelian Obat)
  const handleSaveIncoming = (e) => {
    e.preventDefault();
    if (!incoming.invoice_number.trim()) {
      setFormError('Nomor faktur / surat jalan tidak boleh kosong.');
      return;
    }

    const supplierFinal = incoming.supplier_name === 'OTHER' ? incoming.custom_supplier.trim() : incoming.supplier_name;
    if (!supplierFinal) {
      setFormError('Nama distributor / PBF wajib diisi.');
      return;
    }

    let incomingTotal = 0;
    let incomingTotalUnits = 0;
    for (const it of incoming.items) {
      const q = parseInt(it.qty, 10);
      const bp = parseInt(it.buy_price, 10) || 0;
      if (isNaN(q) || q <= 0) {
        setFormError('Setiap obat wajib memiliki jumlah masuk minimal 1 unit.');
        return;
      }
      incomingTotal += q * bp;
      incomingTotalUnits += q;
    }

    const receiverName = currentUser?.name || 'Petugas Apotek';
    const newData = {
      id: `IN-${Date.now().toString().slice(-6)}`,
      invoice_number: incoming.invoice_number.trim(),
      supplier_name: supplierFinal,
      date: incoming.date ? new Date(incoming.date).toISOString() : new Date().toISOString(),
      payment_term: incoming.payment_term,
      due_date: incoming.payment_term === 'HUTANG' ? incoming.due_date : null,
      notes: incoming.notes.trim() ? `${incoming.notes.trim()} (Diterima oleh: ${receiverName})` : `Diterima oleh: ${receiverName}`,
      total_amount: isOwner ? incomingTotal : 0,
      receivedBy: receiverName,
      status: incoming.status || 'VERIFIED',
      items: incoming.items.map(it => {
        const prod = products.find(p => p.id === Number(it.productId));
        const q = parseInt(it.qty, 10);
        const bp = isOwner ? parseInt(it.buy_price, 10) : (prod?.buy_price || 0);
        return { 
          productId: Number(it.productId), 
          productName: prod?.name || 'Obat', 
          qty: q, 
          unit: it.unit || prod?.unit || 'Strip',
          buy_price: bp, 
          subtotal: q * bp, 
          batch_no: it.batch_no || prod?.batch_no || '',
          exp_date: it.exp_date || prod?.exp_date || '' 
        };
      })
    };

    if (onAddIncomingGoods) onAddIncomingGoods(newData);
    toast.success(`Faktur ${newData.invoice_number} berhasil disimpan! ${incomingTotalUnits} unit obat langsung bertambah di inventori.`);
    closeAll();
  };

  // Simpan Satu Baris Cek Fisik / Stok Opname
  const handleSaveOpnameItem = (product, shouldAdjust = false) => {
    const countedVal = physicalCounts[product.id];
    const physical = (countedVal !== undefined && countedVal !== '') ? parseInt(countedVal, 10) : product.stock;
    const diff = physical - product.stock;
    const diffVal = diff * (product.buy_price || 0);
    const notes = opnameNotes[product.id] || (diff === 0 ? 'Stok fisik cocok' : (diff < 0 ? 'Selisih minus' : 'Surplus fisik'));

    const record = {
      id: `SO-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      officer: currentUser?.name || 'Petugas Apotek',
      rack: product.location || 'Rak Utama',
      productId: product.id,
      productName: product.name,
      unit: product.unit || 'Strip',
      systemStock: product.stock,
      physicalStock: physical,
      difference: diff,
      differenceValue: diffVal,
      notes,
      status: shouldAdjust ? 'ADJUSTED' : 'VERIFIED'
    };

    if (onSaveStockOpname) {
      onSaveStockOpname(record, shouldAdjust);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ── HEADER DINAMIS SESUAI FITUR AKTIF ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title">
            {activeTab === 'inventory' && 'Katalog & Stok Obat Apotek'}
            {activeTab === 'incoming' && 'Pembelian Obat & Faktur Masuk (PBF)'}
            {activeTab === 'opname' && 'Stok Opname & Audit Fisik Lemari Rak'}
          </h2>
          <p className="section-subtitle">
            {activeTab === 'inventory' && 'Data master obat, sisa stok unit fisik di apotek, posisi rak, dan harga jual kasir'}
            {activeTab === 'incoming' && 'Penerimaan faktur dari distributor PBF (PT. BINAYA dll), tagihan hutang tempo, dan verifikasi barang masuk'}
            {activeTab === 'opname' && 'Audit perbandingan stok sistem komputer vs hitungan fisik lemari rak apotek, serta arsip Lap SO'}
          </p>
        </div>

        {/* Action Button Khusus Fitur Aktif */}
        <div>
          {activeTab === 'inventory' && isOwner && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={openAdd}
              style={{ background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)', borderRadius: 10, gap: 6 }}
            >
              <Plus size={16} />
              <span>+ Daftarkan Obat Baru</span>
            </button>
          )}

          {activeTab === 'incoming' && (
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={openIncoming}
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: 10, gap: 6 }}
            >
              <Truck size={16} />
              <span>+ Input Faktur Pembelian PBF</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 3 FITUR UTAMA INVENTORI (SWITCHER BESAR, JELAS, DAN KONTRAS) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 12,
        background: '#f8fafc',
        padding: 8,
        borderRadius: 18,
        border: '1.5px solid #e2e8f0'
      }}>
        {/* FITUR 1: KATALOG OBAT */}
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 14,
            background: activeTab === 'inventory' ? '#ffffff' : 'transparent',
            border: activeTab === 'inventory' ? '2px solid #059669' : '2px solid transparent',
            boxShadow: activeTab === 'inventory' ? '0 4px 14px rgba(5, 150, 105, 0.15)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: activeTab === 'inventory' ? '#ecfdf5' : '#f1f5f9',
            color: activeTab === 'inventory' ? '#059669' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Boxes size={22} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: activeTab === 'inventory' ? '#0f172a' : '#475569' }}>
              1. Katalog & Stok Obat
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              Master obat, posisi rak & harga jual ({products.length} obat)
            </div>
          </div>
        </button>

        {/* FITUR 2: PEMBELIAN OBAT PBF */}
        <button
          type="button"
          onClick={() => setActiveTab('incoming')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 14,
            background: activeTab === 'incoming' ? '#ffffff' : 'transparent',
            border: activeTab === 'incoming' ? '2px solid #0284c7' : '2px solid transparent',
            boxShadow: activeTab === 'incoming' ? '0 4px 14px rgba(2, 132, 199, 0.15)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: activeTab === 'incoming' ? '#f0f9ff' : '#f1f5f9',
            color: activeTab === 'incoming' ? '#0284c7' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Truck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: activeTab === 'incoming' ? '#0f172a' : '#475569' }}>
              2. Pembelian Obat (PBF)
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              Faktur PT. BINAYA, hutang tempo ({incomingGoods.length} faktur)
            </div>
          </div>
        </button>

        {/* FITUR 3: STOK OPNAME */}
        <button
          type="button"
          onClick={() => setActiveTab('opname')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            borderRadius: 14,
            background: activeTab === 'opname' ? '#ffffff' : 'transparent',
            border: activeTab === 'opname' ? '2px solid #d97706' : '2px solid transparent',
            boxShadow: activeTab === 'opname' ? '0 4px 14px rgba(217, 119, 6, 0.15)' : 'none',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: activeTab === 'opname' ? '#fffbeb' : '#f1f5f9',
            color: activeTab === 'opname' ? '#d97706' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BarChart2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: activeTab === 'opname' ? '#0f172a' : '#475569' }}>
              3. Stok Opname & Cek Fisik
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              Audit fisik per lemari rak vs sistem & Lap SO
            </div>
          </div>
        </button>
      </div>

      {/* ── KARTU METRIK SPESIFIK SESUAI FITUR YANG DIPILIH ── */}
      {activeTab === 'inventory' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div className="stat-card" style={{ border: '1.5px solid #a7f3d0', background: '#fcfdfd' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#047857', textTransform: 'uppercase', margin: 0 }}>Total Varian Obat</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px' }}>{products.length} Varian</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Tersimpan di database katalog apotek</p>
          </div>
          <div className="stat-card">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', margin: 0 }}>Total Kuantitas Fisik</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px' }}>{totalUnits} Unit</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Total strip, botol, & tablet di rak</p>
          </div>
          <div className="stat-card">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', margin: 0 }}>Obat Stok Menipis (&lt;10)</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626', margin: '4px 0 2px' }}>{lowStockCount} Obat</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Segera buat pesanan ke distributor PBF</p>
          </div>
        </div>
      )}

      {activeTab === 'incoming' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div className="stat-card" style={{ border: '1.5px solid #bae6fd', background: '#fcfdfd' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', margin: 0 }}>Total Belanja Faktur PBF</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0369a1', margin: '4px 0 2px' }}>{formatRupiah(totalIncomingPurchases)}</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Akumulasi faktur pengadaan obat</p>
          </div>
          <div className="stat-card" style={{ border: '1.5px solid #fed7aa' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', margin: 0 }}>Hutang Faktur Tempo</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#b45309', margin: '4px 0 2px' }}>{formatRupiah(totalHutangAmount)}</p>
            <p style={{ fontSize: 11.5, color: '#b45309', margin: 0 }}>{hutangGoods.length} faktur tempo belum jatuh tempo</p>
          </div>
          <div className="stat-card">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#047857', textTransform: 'uppercase', margin: 0 }}>Faktur Lunas Langsung</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', margin: '4px 0 2px' }}>{formatRupiah(totalLunasAmount)}</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>{lunasGoods.length} faktur dibayar tunai</p>
          </div>
        </div>
      )}

      {activeTab === 'opname' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div className="stat-card" style={{ border: '1.5px solid #fde68a', background: '#fcfdfd' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', margin: 0 }}>Total Obat di Rak</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '4px 0 2px' }}>{products.length} Item</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Target penghitungan fisik lemari rak</p>
          </div>
          <div className="stat-card">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#047857', textTransform: 'uppercase', margin: 0 }}>Sudah Dihitung Fisik</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#047857', margin: '4px 0 2px' }}>{opnameCheckedCount} Obat</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Diinput oleh petugas pemeriksa</p>
          </div>
          <div className="stat-card">
            <p style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', margin: 0 }}>Temuan Selisih / Minus</p>
            <p style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626', margin: '4px 0 2px' }}>{discrepancyCount} Obat</p>
            <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Stok fisik tidak sama dengan komputer</p>
          </div>
        </div>
      )}

      {/* ── KONTEN TAB 1: KATALOG & STOK OBAT APOTEK ── */}
      {activeTab === 'inventory' && (
        <div className="card">
          {/* Table toolbar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f1f6', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 320 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              <input className="form-input" placeholder="Cari nama obat, barcode, atau rak..." style={{ paddingLeft: 32, height: 38 }}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {/* Quick Status Filters */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                type="button"
                className={`btn btn-sm ${filterStockStatus === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStockStatus('ALL')}
                style={{ height: 38, borderRadius: 8, fontSize: 12 }}
              >
                Semua ({products.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterStockStatus === 'LOW' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setFilterStockStatus(filterStockStatus === 'LOW' ? 'ALL' : 'LOW')}
                style={{ height: 38, borderRadius: 8, fontSize: 12, gap: 5 }}
                title="Tampilkan hanya obat yang stoknya menipis"
              >
                <AlertCircle size={13} />
                <span>Stok Menipis ({lowStockCount})</span>
              </button>
            </div>

            {/* Category Filter */}
            <select className="form-input form-select" style={{ width: 170, height: 38, fontSize: 12.5 }}
              value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="All">Semua Kategori</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Owner Toggle for HPP/Margin */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowFinancialColumns(!showFinancialColumns)}
                className="btn btn-secondary btn-sm"
                style={{ height: 38, gap: 6, borderRadius: 8, fontSize: 12, whiteSpace: 'nowrap' }}
                title={showFinancialColumns ? "Sembunyikan kolom finansial HPP" : "Buka kolom HPP modal & margin keuntungan"}
              >
                {showFinancialColumns ? <EyeOff size={14} color="#059669" /> : <Eye size={14} />}
                <span>{showFinancialColumns ? 'Mode Ringkas' : 'Detail HPP & Modal'}</span>
              </button>
            )}

            <span style={{ fontSize: 12.5, color: '#9ca3af', fontWeight: 500, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {filteredProducts.length} obat ditampilkan
            </span>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>Nama & Kategori Obat</th>
                  <th>Lokasi Rak</th>
                  <th className="text-center">Sisa Stok</th>
                  <th className="text-right">Harga Jual Kasir</th>
                  {isOwner && showFinancialColumns && (
                    <>
                      <th className="text-right">HPP Modal (Beli)</th>
                      <th className="text-right">Margin Keuntungan</th>
                      <th>Supplier Distributor</th>
                    </>
                  )}
                  <th className="text-right" style={{ paddingRight: 20 }}>Aksi Cepat</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={isOwner && showFinancialColumns ? 8 : 5} style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
                      Tidak ada obat yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLow = p.stock < (p.min_stock || 10);
                    const margin = p.price - (p.buy_price || 0);
                    const marginPct = p.price > 0 ? Math.round((margin / p.price) * 100) : 0;

                    return (
                      <tr key={p.id}>
                        <td style={{ paddingLeft: 20 }}>
                          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.875rem' }}>{p.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>{p.category}</span>
                            {p.barcode && <span style={{ fontSize: 10, color: '#94a3b8' }}>&bull; Barcode: {p.barcode}</span>}
                            <span className="badge badge-gray" style={{ fontSize: 10 }}>{p.unit || 'Strip'}</span>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '3px 8px', borderRadius: 6 }}>
                            📍 {p.location || 'Rak Utama'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span className={`badge ${isLow ? 'badge-red' : 'badge-green'}`} style={{ fontWeight: 800, fontSize: 12 }}>
                            {p.stock} {p.unit || 'pcs'}
                          </span>
                        </td>

                        <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857', fontSize: 13 }}>
                          {formatRupiah(p.price)}
                        </td>

                        {isOwner && showFinancialColumns && (
                          <>
                            <td style={{ textAlign: 'right', color: '#475569', fontSize: 12.5 }}>
                              {formatRupiah(p.buy_price || 0)}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: margin >= 0 ? '#15803d' : '#dc2626' }}>
                                +{formatRupiah(margin)} ({marginPct}%)
                              </span>
                            </td>
                            <td style={{ fontSize: 11.5, color: '#64748b' }}>
                              {p.supplier || '-'}
                            </td>
                          </>
                        )}

                        <td style={{ textAlign: 'right', paddingRight: 20 }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => openQuickStock(p)}
                              style={{ gap: 4, borderRadius: 6, fontSize: 11.5 }}
                              title="Tambah stok unit obat fisik yang baru tiba"
                            >
                              <PackagePlus size={13} color="#059669" />
                              <span>+ Stok</span>
                            </button>
                            {isOwner && (
                              <button 
                                className="btn btn-outline btn-sm" 
                                onClick={() => openEdit(p)}
                                style={{ borderRadius: 6, fontSize: 11.5 }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
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

      {/* ── KONTEN TAB 2: PEMBELIAN OBAT & FAKTUR MASUK PBF ── */}
      {activeTab === 'incoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Toolbar Khusus Pembelian PBF */}
          <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 220 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input 
                  className="form-input" 
                  placeholder="Cari No. Faktur atau Supplier PBF..." 
                  value={incomingSearch} 
                  onChange={e => setIncomingSearch(e.target.value)}
                  style={{ paddingLeft: 32, height: 38, fontSize: 12.5 }}
                />
              </div>

              {/* Filter Status Bayar */}
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'ALL', label: 'Semua Status' },
                  { id: 'HUTANG', label: '⏳ Hutang Tempo' },
                  { id: 'TUNAI', label: '💵 Lunas Tunai' }
                ].map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setIncomingPaymentFilter(b.id)}
                    className={`btn btn-sm ${incomingPaymentFilter === b.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ height: 38, borderRadius: 8, fontSize: 11.5 }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={openIncoming}
              style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', borderRadius: 8, height: 38, gap: 6 }}
            >
              <Truck size={15} />
              <span>+ Input Faktur Pembelian PBF Baru</span>
            </button>
          </div>

          {filteredIncomingGoods.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}><Truck size={24} /></div>
                <h4>Belum Ada Catatan Faktur Pembelian</h4>
                <p>Klik tombol "+ Input Faktur Pembelian PBF Baru" di atas untuk mencatat faktur masuk dari PT. BINAYA, Kimia Farma, dll.</p>
              </div>
            </div>
          ) : (
            filteredIncomingGoods.map(inv => (
              <div key={inv.id} className="card" style={{ border: inv.payment_term === 'HUTANG' ? '1.5px solid #fed7aa' : '1px solid #e2e8f0' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f1f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="icon-box" style={{ background: inv.payment_term === 'HUTANG' ? '#fffbeb' : '#f0f9ff', color: inv.payment_term === 'HUTANG' ? '#d97706' : '#0284c7' }}>
                      <Building2 size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{inv.invoice_number}</span>
                        <span className={`badge ${inv.payment_term === 'HUTANG' ? 'badge-amber' : 'badge-green'}`} style={{ fontWeight: 800 }}>
                          {inv.payment_term === 'HUTANG' ? '⏳ HUTANG TEMPO' : '✓ LUNAS TUNAI'}
                        </span>
                        <span className="badge badge-green">Stok Masuk Kasir</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0' }}>
                        Supplier PBF: <strong>{inv.supplier_name}</strong> &bull; Masuk: {formatDateTime(inv.date, tz).split(',')[0]}
                        {inv.due_date && <span style={{ color: '#b45309', fontWeight: 700 }}> &bull; Jatuh Tempo: {inv.due_date}</span>}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                      Total Tagihan Faktur
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0369a1', margin: 0 }}>
                      {formatRupiah(inv.total_amount)}
                    </p>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ paddingLeft: 20 }}>Rincian Obat Diterima</th>
                        <th className="text-center">Kuantitas Masuk</th>
                        <th className="text-right">Harga Beli Satuan (HPP)</th>
                        <th className="text-right">Subtotal</th>
                        <th>No. Batch (NB)</th>
                        <th style={{ paddingRight: 20 }}>Tgl Expired (ED)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inv.items.map((it, idx) => (
                        <tr key={idx}>
                          <td style={{ paddingLeft: 20, fontWeight: 700, color: '#0f172a' }}>{it.productName}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="badge badge-blue" style={{ fontWeight: 800 }}>+{it.qty} {it.unit || 'Strip'}</span>
                          </td>
                          <td style={{ textAlign: 'right', color: '#475569' }}>
                            {formatRupiah(it.buy_price)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>
                            {formatRupiah(it.subtotal)}
                          </td>
                          <td>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{it.batch_no || '-'}</span>
                          </td>
                          <td style={{ paddingRight: 20, fontSize: 12, color: '#64748b' }}>
                            {it.exp_date || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {inv.notes && (
                    <div style={{ padding: '10px 20px', background: '#fafbfd', fontSize: 12, color: '#64748b', borderTop: '1px solid #f0f1f6' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Catatan Faktur: </span>{inv.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── KONTEN TAB 3: STOK OPNAME & CEK FISIK LEMARI RAK ── */}
      {activeTab === 'opname' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Sub-Tabs: Input SO Aktif vs Riwayat SO */}
          <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
            <button
              type="button"
              onClick={() => setOpnameSubTab('active_so')}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: opnameSubTab === 'active_so' ? 800 : 600,
                background: opnameSubTab === 'active_so' ? '#fffbeb' : 'transparent',
                color: opnameSubTab === 'active_so' ? '#b45309' : '#64748b',
                border: opnameSubTab === 'active_so' ? '1.5px solid #fde68a' : 'none',
                cursor: 'pointer'
              }}
            >
              📋 Cek Fisik Lemari Rak & Input SO
            </button>
            <button
              type="button"
              onClick={() => setOpnameSubTab('so_history')}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: opnameSubTab === 'so_history' ? 800 : 600,
                background: opnameSubTab === 'so_history' ? '#fffbeb' : 'transparent',
                color: opnameSubTab === 'so_history' ? '#b45309' : '#64748b',
                border: opnameSubTab === 'so_history' ? '1.5px solid #fde68a' : 'none',
                cursor: 'pointer'
              }}
            >
              📈 Laporan Hasil SO (Lap SO) ({stockOpnames.length})
            </button>
          </div>

          {opnameSubTab === 'active_so' && (
            <div className="card">
              {/* Filter Bar Cek Fisik */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {/* Search Barcode / Nama */}
                <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 300 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                  <input 
                    className="form-input" 
                    placeholder="Scan barcode atau cari nama obat..." 
                    style={{ paddingLeft: 32, height: 38 }}
                    value={opnameSearch}
                    onChange={e => setOpnameSearch(e.target.value)}
                  />
                </div>

                {/* Filter Rak Lemari */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>Posisi Rak:</span>
                  <select 
                    className="form-input form-select" 
                    value={opnameRackFilter} 
                    onChange={e => setOpnameRackFilter(e.target.value)}
                    style={{ height: 38, fontSize: 12.5, width: 140 }}
                  >
                    <option value="ALL">Semua Rak</option>
                    {allLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>

                {/* Filter Status SO */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'PENDING', label: '🔴 Belum di-SO' },
                    { id: 'DONE', label: '🟢 Sudah di-SO' },
                    { id: 'DIFF', label: '⚠️ Selisih' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setOpnameStatusFilter(st.id)}
                      className={`btn btn-sm ${opnameStatusFilter === st.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ height: 38, borderRadius: 8, fontSize: 11.5 }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>

                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
                  {opnameFilteredProducts.length} obat siap dihitung
                </span>
              </div>

              {/* Tabel Cek Fisik */}
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 20 }}>Nama Obat & Barcode</th>
                      <th>Posisi Rak</th>
                      <th className="text-center">Stok Sistem</th>
                      <th className="text-center" style={{ width: 150 }}>Hitung Fisik Rak</th>
                      <th className="text-center">Selisih (+/-)</th>
                      <th className="text-right">Nilai Selisih (Rp)</th>
                      <th className="text-right" style={{ paddingRight: 20 }}>Aksi SO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {opnameFilteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                          Tidak ada obat yang cocok dengan filter rak ini.
                        </td>
                      </tr>
                    ) : (
                      opnameFilteredProducts.map(p => {
                        const countedStr = physicalCounts[p.id];
                        const hasCounted = countedStr !== undefined && countedStr !== '';
                        const physicalVal = hasCounted ? parseInt(countedStr, 10) : p.stock;
                        const diff = hasCounted ? (physicalVal - p.stock) : 0;
                        const diffVal = diff * (p.buy_price || 0);

                        return (
                          <tr key={p.id} style={hasCounted && diff !== 0 ? { background: '#fffbeb' } : {}}>
                            <td style={{ paddingLeft: 20 }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>
                                Satuan: <strong>{p.unit || 'Strip'}</strong> {p.barcode ? `&bull; ${p.barcode}` : ''}
                              </div>
                            </td>

                            <td>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '3px 8px', borderRadius: 6 }}>
                                📍 {p.location || 'Rak Utama'}
                              </span>
                            </td>

                            <td style={{ textAlign: 'center', fontWeight: 800, fontSize: 13, color: '#0f172a' }}>
                              {p.stock} {p.unit || 'pcs'}
                            </td>

                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <input
                                  type="number"
                                  min="0"
                                  className="form-input"
                                  placeholder={String(p.stock)}
                                  value={physicalCounts[p.id] !== undefined ? physicalCounts[p.id] : ''}
                                  onChange={e => setPhysicalCounts({ ...physicalCounts, [p.id]: e.target.value })}
                                  style={{
                                    width: 80,
                                    height: 36,
                                    textAlign: 'center',
                                    fontSize: 14,
                                    fontWeight: 800,
                                    borderColor: hasCounted ? (diff === 0 ? '#10b981' : '#f59e0b') : '#cbd5e1'
                                  }}
                                />
                                <span style={{ fontSize: 11, color: '#64748b' }}>{p.unit || 'pcs'}</span>
                              </div>
                            </td>

                            <td style={{ textAlign: 'center' }}>
                              {!hasCounted ? (
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>Belum Dicek</span>
                              ) : diff < 0 ? (
                                <span style={{ color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                                  {diff} (Minus)
                                </span>
                              ) : diff > 0 ? (
                                <span style={{ color: '#0369a1', background: '#e0f2fe', padding: '2px 8px', borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                                  +{diff} (Surplus)
                                </span>
                              ) : (
                                <span style={{ color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                                  ✓ Cocok (0)
                                </span>
                              )}
                            </td>

                            <td style={{ textAlign: 'right', fontWeight: 800, color: diff < 0 ? '#b91c1c' : '#0f172a' }}>
                              {hasCounted ? formatRupiah(diffVal) : '-'}
                            </td>

                            <td style={{ textAlign: 'right', paddingRight: 20 }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleSaveOpnameItem(p, false)}
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontSize: 11, height: 30, borderRadius: 6 }}
                                  title="Simpan catatan tanpa mengubah stok sistem"
                                >
                                  Catat
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveOpnameItem(p, true)}
                                  className="btn btn-primary btn-sm"
                                  style={{ fontSize: 11, height: 30, borderRadius: 6, background: '#059669' }}
                                  title="Sesuaikan stok sistem apotek ke stok fisik yang dihitung"
                                >
                                  Sinkron Stok
                                </button>
                              </div>
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

          {/* Subtab: Lap SO History */}
          {opnameSubTab === 'so_history' && (
            <div className="card">
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Laporan Riwayat Hasil Stok Opname (Lap SO)
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>
                  Arsip catatan cek fisik obat apotek untuk audit dan perbandingan minus/kehilangan
                </p>
              </div>

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: 20 }}>ID SO</th>
                      <th>Waktu Pemeriksaan</th>
                      <th>Petugas Pelaksana</th>
                      <th>Obat & Rak</th>
                      <th className="text-center">Sistem</th>
                      <th className="text-center">Fisik</th>
                      <th className="text-center">Selisih</th>
                      <th className="text-right">Kerugian (Rp)</th>
                      <th className="text-center" style={{ paddingRight: 20 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockOpnames.map(so => (
                      <tr key={so.id}>
                        <td style={{ paddingLeft: 20, fontWeight: 700, color: '#059669', fontSize: 12 }}>{so.id}</td>
                        <td style={{ fontSize: 12, color: '#475569' }}>{formatDateTime(so.date, tz)}</td>
                        <td style={{ fontWeight: 600 }}>{so.officer}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{so.productName}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>📍 {so.rack}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{so.systemStock}</td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#047857' }}>{so.physicalStock}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: (so.difference || 0) < 0 ? '#b91c1c' : '#047857' }}>
                            {so.difference}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: (so.differenceValue || 0) < 0 ? '#b91c1c' : '#0f172a' }}>
                          {formatRupiah(so.differenceValue || 0)}
                        </td>
                        <td style={{ textAlign: 'center', paddingRight: 20 }}>
                          <span className="badge badge-green">
                            {so.status === 'ADJUSTED' ? '✓ Stok Diselaraskan' : '✓ Terverifikasi'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Tambah / Edit Obat (Owner Only) */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal-box" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 className="modal-title">{isEditMode ? 'Edit Data Obat' : 'Tambah Obat Baru ke Katalog'}</h3>
              <button className="modal-close" onClick={closeAll}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && <div className="alert-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{formError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Nama Obat & Dosis *</label>
                    <input className="form-input" placeholder="Contoh: Paracetamol 500mg" value={pf.name} onChange={e => setPf({...pf, name: e.target.value})} required autoFocus />
                  </div>
                  <div>
                    <label className="form-label">Satuan Jual *</label>
                    <select className="form-input form-select" value={pf.unit} onChange={e => setPf({...pf, unit: e.target.value})}>
                      <option value="Strip">Strip</option>
                      <option value="Tablet">Tablet / Kapsul</option>
                      <option value="Box">Box / Dus</option>
                      <option value="Botol">Botol (Sirup)</option>
                      <option value="Tube">Tube (Salep)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Barcode / Kode Barcode</label>
                    <input className="form-input" placeholder="Scan barcode..." value={pf.barcode} onChange={e => setPf({...pf, barcode: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Kategori Obat *</label>
                    <select className="form-input form-select" value={pf.category} onChange={e => setPf({...pf, category: e.target.value})}>
                      {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Harga Beli HPP Modal (Rp)</label>
                    <input className="form-input" type="number" placeholder="Contoh: 3500" value={pf.buy_price} onChange={e => setPf({...pf, buy_price: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Harga Jual Kasir (Rp) *</label>
                    <input className="form-input" type="number" placeholder="Contoh: 5000" value={pf.price} onChange={e => setPf({...pf, price: e.target.value})} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Jumlah Stok Awal *</label>
                    <input className="form-input" type="number" value={pf.stock} onChange={e => setPf({...pf, stock: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-label">Posisi Rak / Lemari *</label>
                    <select className="form-input form-select" value={pf.location} onChange={e => setPf({...pf, location: e.target.value})}>
                      {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">No Batch (NB)</label>
                    <input className="form-input" placeholder="Contoh: PCT-2026A" value={pf.batch_no} onChange={e => setPf({...pf, batch_no: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">Expired Date (ED)</label>
                    <input className="form-input" type="date" value={pf.exp_date} onChange={e => setPf({...pf, exp_date: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #f0f1f6', paddingTop: 10 }}>
                  <button type="button" className="btn btn-secondary" onClick={closeAll}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ background: '#059669' }}>
                    {isEditMode ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Input Faktur Masuk PBF (Lengkap 10 Kebutuhan User) */}
      {isIncomingModalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal-box" style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="icon-box-sm" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                  <Truck size={17} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>
                    Input Faktur Pembelian Obat (PBF)
                  </h3>
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>
                    Catat barang masuk dari supplier PT. BINAYA, Kimia Farma, dll. lengkap dengan satuan & tempo
                  </p>
                </div>
              </div>
              <button className="modal-close" onClick={closeAll}>&times;</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSaveIncoming} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && <div className="alert-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{formError}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">1. Nomor Faktur PBF *</label>
                    <input 
                      className="form-input" 
                      placeholder="Contoh: FAK-BINAYA-7721" 
                      value={incoming.invoice_number} 
                      onChange={e => setIncoming({...incoming, invoice_number: e.target.value})} 
                      required 
                      autoFocus 
                    />
                  </div>
                  <div>
                    <label className="form-label">2. Tanggal Masuk Faktur *</label>
                    <input 
                      className="form-input" 
                      type="date" 
                      value={incoming.date} 
                      onChange={e => setIncoming({...incoming, date: e.target.value})} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">3. Supplier / PT Distributor PBF *</label>
                  <select 
                    className="form-input form-select" 
                    value={incoming.supplier_name} 
                    onChange={e => setIncoming({...incoming, supplier_name: e.target.value})} 
                    required
                  >
                    {allSuppliers.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="OTHER">+ Ketik Nama Supplier Lainnya...</option>
                  </select>
                </div>

                {incoming.supplier_name === 'OTHER' && (
                  <div>
                    <label className="form-label">Ketik Nama PT Distributor Baru *</label>
                    <input 
                      className="form-input" 
                      placeholder="Contoh: PT. BINAYA FARMA UTAMA" 
                      value={incoming.custom_supplier} 
                      onChange={e => setIncoming({...incoming, custom_supplier: e.target.value})} 
                      required 
                    />
                  </div>
                )}

                {/* Metode Pembayaran: Tunai vs Hutang (Tempo) */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
                  <label className="form-label" style={{ marginBottom: 6 }}>4. Status Pembayaran ke Supplier</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setIncoming({...incoming, payment_term: 'TUNAI'})}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        border: `1.5px solid ${incoming.payment_term === 'TUNAI' ? '#059669' : '#cbd5e1'}`,
                        background: incoming.payment_term === 'TUNAI' ? '#ecfdf5' : '#ffffff',
                        color: incoming.payment_term === 'TUNAI' ? '#047857' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      💵 Tunai (Lunas Langsung)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIncoming({...incoming, payment_term: 'HUTANG'})}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        border: `1.5px solid ${incoming.payment_term === 'HUTANG' ? '#d97706' : '#cbd5e1'}`,
                        background: incoming.payment_term === 'HUTANG' ? '#fffbeb' : '#ffffff',
                        color: incoming.payment_term === 'HUTANG' ? '#b45309' : '#475569',
                        cursor: 'pointer'
                      }}
                    >
                      ⏳ Hutang (Faktur Tempo PBF)
                    </button>
                  </div>

                  {incoming.payment_term === 'HUTANG' && (
                    <div style={{ marginTop: 10 }}>
                      <label className="form-label" style={{ fontSize: 11.5, color: '#b45309' }}>
                        Tanggal Jatuh Tempo Pembayaran Hutang *
                      </label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={incoming.due_date} 
                        onChange={e => setIncoming({...incoming, due_date: e.target.value})} 
                        required 
                      />
                    </div>
                  )}
                </div>

                {/* Items to receive */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>5. Rincian Obat yang Masuk</label>
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm" 
                      onClick={() => setIncoming(prev => ({ 
                        ...prev, 
                        items: [
                          ...prev.items, 
                          { productId: String(products[0]?.id || ''), barcode: products[0]?.barcode || '', qty: '10', unit: products[0]?.unit || 'Strip', buy_price: String(products[0]?.buy_price || 0), batch_no: '', exp_date: '' }
                        ] 
                      }))}
                    >
                      <Plus size={13} /> + Tambah Baris Obat
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto', paddingRight: 4 }}>
                    {incoming.items.map((item, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#047857' }}>Baris #{idx + 1}</span>
                          {incoming.items.length > 1 && (
                            <button type="button" className="btn btn-danger btn-sm" style={{ height: 22, padding: '0 6px' }} onClick={() => setIncoming(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}>
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div>
                            <label className="form-label" style={{ fontSize: 11 }}>Pilih Obat</label>
                            <select 
                              className="form-input form-select" 
                              style={{ height: 36, fontSize: 12 }} 
                              value={item.productId} 
                              onChange={e => handleIncomingItemChange(idx, 'productId', e.target.value)}
                            >
                              {products.map(p => <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: 11 }}>Jumlah Masuk</label>
                            <input 
                              type="number" 
                              min="1" 
                              className="form-input" 
                              style={{ height: 36, fontSize: 12, fontWeight: 700 }} 
                              value={item.qty} 
                              onChange={e => handleIncomingItemChange(idx, 'qty', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: 11 }}>Satuan</label>
                            <select 
                              className="form-input form-select" 
                              style={{ height: 36, fontSize: 12 }} 
                              value={item.unit} 
                              onChange={e => handleIncomingItemChange(idx, 'unit', e.target.value)}
                            >
                              <option value="Tablet">Tablet</option>
                              <option value="Strip">Strip</option>
                              <option value="Box">Box</option>
                              <option value="Botol">Botol</option>
                              <option value="Tube">Tube</option>
                            </select>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <div>
                            <label className="form-label" style={{ fontSize: 11 }}>Harga Beli (Rp)</label>
                            <input 
                              type="number" 
                              className="form-input" 
                              style={{ height: 36, fontSize: 12 }} 
                              value={item.buy_price} 
                              onChange={e => handleIncomingItemChange(idx, 'buy_price', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: 11 }}>No. Batch (NB)</label>
                            <input 
                              className="form-input" 
                              placeholder="Batch ID"
                              style={{ height: 36, fontSize: 12 }} 
                              value={item.batch_no} 
                              onChange={e => handleIncomingItemChange(idx, 'batch_no', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: 11 }}>Expired (ED)</label>
                            <input 
                              type="date" 
                              className="form-input" 
                              style={{ height: 36, fontSize: 12 }} 
                              value={item.exp_date} 
                              onChange={e => handleIncomingItemChange(idx, 'exp_date', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pilihan Verifikasi / Simpan */}
                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #f0f1f6', paddingTop: 10 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeAll}>
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg" 
                    style={{ flex: 2, borderRadius: 10, background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' }}
                  >
                    <CheckCircle size={16} /> Simpan & Verifikasi Masuk Kasir
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Input Cepat Tambah Stok */}
      {isQuickStockOpen && quickStockProduct && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeAll()}>
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Tambah Stok Obat Fisik</h3>
              <button className="modal-close" onClick={closeAll}>&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveQuickStock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && <div className="alert-error"><AlertCircle size={14} style={{ flexShrink: 0 }} />{formError}</div>}
                
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{quickStockProduct.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    📍 {quickStockProduct.location || 'Rak Utama'} &bull; Stok saat ini: <strong>{quickStockProduct.stock} {quickStockProduct.unit || 'Strip'}</strong>
                  </div>
                </div>

                <div>
                  <label className="form-label">Jumlah Unit Tambahan yang Tiba *</label>
                  <input 
                    type="number"
                    min="1"
                    className="form-input"
                    value={quickStockAmt}
                    onChange={e => setQuickStockAmt(e.target.value)}
                    placeholder="Contoh: 10 atau 20"
                    style={{ fontSize: '1.15rem', fontWeight: 800, height: 46 }}
                    autoFocus
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #f0f1f6', paddingTop: 8 }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeAll}>Batal</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 2, background: '#059669', borderRadius: 8 }}>
                    + Tambah Stok Sekarang
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
