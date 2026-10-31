export const mockProducts = [
  { id: 1, name: 'Paracetamol 500mg', barcode: '8991001001', category: 'Analgesik', buy_price: 3500, price: 5000, stock: 150, min_stock: 20, unit: 'Strip', location: 'Rak A-01', supplier: 'PT Kimia Farma Trading & Distribution', batch_no: 'PCT-202601', exp_date: '2028-12-31' },
  { id: 2, name: 'Amoxicillin 500mg', barcode: '8991001002', category: 'Antibiotik', buy_price: 8500, price: 12000, stock: 8, min_stock: 15, unit: 'Strip', location: 'Rak A-02', supplier: 'PT Enseval Putera Megatrading Tbk', batch_no: 'AMX-202511', exp_date: '2027-10-15' },
  { id: 3, name: 'Vitamin C 1000mg', barcode: '8991001003', category: 'Vitamin & Suplemen', buy_price: 18000, price: 25000, stock: 45, min_stock: 10, unit: 'Botol', location: 'Rak B-01', supplier: 'PT Mensa Bina Sukses (MBS)', batch_no: 'VTC-202603', exp_date: '2028-06-20' },
  { id: 4, name: 'Antasida Doen', barcode: '8991001004', category: 'Obat Maag', buy_price: 5500, price: 8000, stock: 120, min_stock: 25, unit: 'Strip', location: 'Rak C-01', supplier: 'PT Kimia Farma Trading & Distribution', batch_no: 'ATD-202509', exp_date: '2027-08-30' },
  { id: 5, name: 'OBH Combi Plus', barcode: '8991001005', category: 'Obat Batuk', buy_price: 13500, price: 18000, stock: 25, min_stock: 10, unit: 'Botol', location: 'Rak C-02', supplier: 'PT Anugrah Argon Medica (AAM)', batch_no: 'OBH-202602', exp_date: '2028-04-10' },
  { id: 6, name: 'Ibuprofen 400mg', barcode: '8991001006', category: 'Analgesik', buy_price: 5200, price: 7500, stock: 60, min_stock: 15, unit: 'Strip', location: 'Rak A-01', supplier: 'PT Dos Ni Roha (DNR)', batch_no: 'IBP-202604', exp_date: '2028-01-25' },
  { id: 7, name: 'Cetirizine 10mg', barcode: '8991001007', category: 'Antihistamin', buy_price: 10500, price: 15000, stock: 5, min_stock: 10, unit: 'Strip', location: 'Rak D-01', supplier: 'PT Penta Valent', batch_no: 'CTZ-202512', exp_date: '2027-05-18' },
  { id: 8, name: 'Omeprazole 20mg', barcode: '8991001008', category: 'Obat Maag', buy_price: 16000, price: 22000, stock: 30, min_stock: 10, unit: 'Strip', location: 'Rak C-01', supplier: 'PT Enseval Putera Megatrading Tbk', batch_no: 'OMZ-202601', exp_date: '2027-11-30' },
  { id: 9, name: 'Neurobion Forte', barcode: '8991001009', category: 'Vitamin & Suplemen', buy_price: 26000, price: 35000, stock: 15, min_stock: 10, unit: 'Strip', location: 'Rak B-02', supplier: 'PT Parit Padang Global', batch_no: 'NRB-202605', exp_date: '2028-09-12' },
  { id: 10, name: 'Salep 88', barcode: '8991001010', category: 'Anti Jamur', buy_price: 9800, price: 14000, stock: 50, min_stock: 15, unit: 'Tube', location: 'Rak E-01', supplier: 'PT Mensa Bina Sukses (MBS)', batch_no: 'S88-202508', exp_date: '2027-04-15' },
];

export const mockMembers = [
  { id: 'MBR-001', name: 'Ibu Rahmawati', phone: '081234567890', points: 12500, discountEligible: true, address: 'Jl. Merpati No. 12' },
  { id: 'MBR-002', name: 'Pak Bambang Setyawan', phone: '085298765432', points: 4500, discountEligible: false, address: 'Komp. Graha Indah B3' },
  { id: 'MBR-003', name: 'Nadia Putri', phone: '087811223344', points: 18000, discountEligible: true, address: 'Jl. Melati Blok C No. 5' },
  { id: 'MBR-004', name: 'Rizky Aditya', phone: '082199887766', points: 8200, discountEligible: false, address: 'Jl. Diponegoro No. 89' },
];

const now = Date.now();
const oneDay = 86400000;

export const mockTransactions = [
  // Transaksi Hari Ini
  {
    id: 'OB11223',
    invoice_no: 'OB11223',
    date: new Date(now - 1000 * 60 * 35).toISOString(),
    total: 35000,
    total_hpp: 24500,
    profit: 10500,
    payment_method: 'Tunai',
    cashier: 'Siti Rahma, S.Farm',
    shiftName: 'Shift 1 (Pagi - Siang)',
    customer: 'Pelanggan Umum',
    memberId: null,
    discount: 0,
    is_void: false,
    items: [
      { id: 1, name: 'Paracetamol 500mg', price: 5000, buy_price: 3500, qty: 2, subtotal: 10000, hpp_subtotal: 7000, unit: 'Strip' },
      { id: 3, name: 'Vitamin C 1000mg', price: 25000, buy_price: 18000, qty: 1, subtotal: 25000, hpp_subtotal: 18000, unit: 'Botol' }
    ]
  },
  {
    id: 'OB11224',
    invoice_no: 'OB11224',
    date: new Date(now - 1000 * 60 * 120).toISOString(),
    total: 38000,
    total_hpp: 35000,
    profit: 3000,
    payment_method: 'QRIS',
    cashier: 'Siti Rahma, S.Farm',
    shiftName: 'Shift 1 (Pagi - Siang)',
    customer: 'Nadia Putri (Member)',
    memberId: 'MBR-003',
    discount: 10000,
    is_void: false,
    items: [
      { id: 5, name: 'OBH Combi Plus', price: 18000, buy_price: 13500, qty: 1, subtotal: 18000, hpp_subtotal: 13500, unit: 'Botol' },
      { id: 7, name: 'Cetirizine 10mg', price: 15000, buy_price: 10500, qty: 2, subtotal: 30000, hpp_subtotal: 21000, unit: 'Strip' }
    ]
  },
  {
    id: 'OB11225',
    invoice_no: 'OB11225',
    date: new Date(now - 1000 * 60 * 240).toISOString(),
    total: 54000,
    total_hpp: 39500,
    profit: 14500,
    payment_method: 'Tunai',
    cashier: 'Budi Santoso',
    shiftName: 'Shift 1 (Pagi - Siang)',
    customer: 'Pelanggan Umum',
    memberId: null,
    discount: 0,
    is_void: false,
    items: [
      { id: 8, name: 'Omeprazole 20mg', price: 22000, buy_price: 16000, qty: 1, subtotal: 22000, hpp_subtotal: 16000, unit: 'Strip' },
      { id: 4, name: 'Antasida Doen', price: 8000, buy_price: 5500, qty: 4, subtotal: 32000, hpp_subtotal: 22000, unit: 'Strip' }
    ]
  },
  // Transaksi 1 hari lalu (Kemarin)
  {
    id: 'OB11220',
    invoice_no: 'OB11220',
    date: new Date(now - oneDay * 1).toISOString(),
    total: 145000,
    total_hpp: 102000,
    profit: 43000,
    payment_method: 'QRIS',
    cashier: 'Siti Rahma, S.Farm',
    shiftName: 'Shift 2 (Siang - Malam)',
    customer: 'Ibu Rahmawati (Member)',
    memberId: 'MBR-001',
    discount: 0,
    is_void: false,
    items: [
      { id: 2, name: 'Amoxicillin 500mg', price: 12000, buy_price: 8500, qty: 3, subtotal: 36000, hpp_subtotal: 25500, unit: 'Strip' },
      { id: 8, name: 'Omeprazole 20mg', price: 22000, buy_price: 16000, qty: 3, subtotal: 66000, hpp_subtotal: 48000, unit: 'Strip' },
      { id: 9, name: 'Neurobion Forte', price: 35000, buy_price: 26000, qty: 1, subtotal: 35000, hpp_subtotal: 26000, unit: 'Strip' },
      { id: 1, name: 'Paracetamol 500mg', price: 5000, buy_price: 3500, qty: 2, subtotal: 10000, hpp_subtotal: 7000, unit: 'Strip' }
    ]
  },
  // Transaksi 2 hari lalu
  {
    id: 'OB11210',
    invoice_no: 'OB11210',
    date: new Date(now - oneDay * 2).toISOString(),
    total: 198000,
    total_hpp: 141000,
    profit: 57000,
    payment_method: 'Tunai',
    cashier: 'Budi Santoso',
    shiftName: 'Shift 1 (Pagi - Siang)',
    customer: 'Pelanggan Umum',
    memberId: null,
    discount: 0,
    is_void: false,
    items: [
      { id: 3, name: 'Vitamin C 1000mg', price: 25000, buy_price: 18000, qty: 4, subtotal: 100000, hpp_subtotal: 72000, unit: 'Botol' },
      { id: 5, name: 'OBH Combi Plus', price: 18000, buy_price: 13500, qty: 3, subtotal: 54000, hpp_subtotal: 40500, unit: 'Botol' },
      { id: 6, name: 'Ibuprofen 400mg', price: 7500, buy_price: 5200, qty: 4, subtotal: 30000, hpp_subtotal: 20800, unit: 'Strip' },
      { id: 10, name: 'Salep 88', price: 14000, buy_price: 9800, qty: 1, subtotal: 14000, hpp_subtotal: 9800, unit: 'Tube' }
    ]
  }
];

export const mockIncomingGoods = [
  {
    id: 'IN-20260301-01',
    invoice_number: 'FAK-KF-99812',
    supplier_name: 'PT Kimia Farma Trading & Distribution',
    date: new Date(now - oneDay * 4).toISOString(),
    total_amount: 350000,
    payment_term: 'HUTANG',
    due_date: new Date(now + oneDay * 26).toISOString().split('T')[0],
    status: 'VERIFIED',
    notes: 'Pengiriman batch awal bulan - kondisi baik',
    items: [
      { productId: 1, productName: 'Paracetamol 500mg', qty: 100, unit: 'Strip', buy_price: 3500, subtotal: 350000, batch_no: 'PCT-202601', exp_date: '2028-12-31' }
    ]
  },
  {
    id: 'IN-20260302-02',
    invoice_number: 'FAK-BINAYA-7721',
    supplier_name: 'PT. BINAYA FARMA UTAMA',
    date: new Date(now - oneDay * 2).toISOString(),
    total_amount: 425000,
    payment_term: 'HUTANG',
    due_date: new Date(now + oneDay * 28).toISOString().split('T')[0],
    status: 'VERIFIED',
    notes: 'Restock antibiotik & maag - faktur tempo 30 hari',
    items: [
      { productId: 2, productName: 'Amoxicillin 500mg', qty: 50, unit: 'Strip', buy_price: 8500, subtotal: 425000, batch_no: 'AMX-202511', exp_date: '2027-10-15' }
    ]
  },
  {
    id: 'IN-20260303-03',
    invoice_number: 'MBS-PO-77123',
    supplier_name: 'PT Mensa Bina Sukses (MBS)',
    date: new Date().toISOString(),
    total_amount: 900000,
    payment_term: 'TUNAI',
    due_date: null,
    status: 'VERIFIED',
    notes: 'Penerimaan suplemen vitamin C - pembayaran lunas tunai',
    items: [
      { productId: 3, productName: 'Vitamin C 1000mg', qty: 50, unit: 'Botol', buy_price: 18000, subtotal: 900000, batch_no: 'VTC-202603', exp_date: '2028-06-20' }
    ]
  }
];

export const mockStockOpnameRecords = [
  {
    id: 'SO-20261030-01',
    date: new Date(now - oneDay * 1).toISOString(),
    officer: 'Siti Rahma, S.Farm',
    rack: 'Rak A-01',
    productId: 1,
    productName: 'Paracetamol 500mg',
    systemStock: 152,
    physicalStock: 150,
    difference: -2,
    differenceValue: -7000,
    notes: '2 tablet rusak/pecah saat cek fisik',
    status: 'ADJUSTED'
  },
  {
    id: 'SO-20261030-02',
    date: new Date(now - oneDay * 1).toISOString(),
    officer: 'Siti Rahma, S.Farm',
    rack: 'Rak A-02',
    productId: 2,
    productName: 'Amoxicillin 500mg',
    systemStock: 8,
    physicalStock: 8,
    difference: 0,
    differenceValue: 0,
    notes: 'Stok fisik cocok sempurna dengan sistem',
    status: 'VERIFIED'
  }
];
