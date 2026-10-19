export const mockProducts = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Analgesik', buy_price: 3500, price: 5000, stock: 150, min_stock: 20, location: 'Rak A-01', supplier: 'PT Kimia Farma Trading & Distribution' },
  { id: 2, name: 'Amoxicillin 500mg', category: 'Antibiotik', buy_price: 8500, price: 12000, stock: 8, min_stock: 15, location: 'Rak A-02', supplier: 'PT Enseval Putera Megatrading Tbk' },
  { id: 3, name: 'Vitamin C 1000mg', category: 'Vitamin & Suplemen', buy_price: 18000, price: 25000, stock: 45, min_stock: 10, location: 'Rak B-01', supplier: 'PT Mensa Bina Sukses (MBS)' },
  { id: 4, name: 'Antasida Doen', category: 'Obat Maag', buy_price: 5500, price: 8000, stock: 120, min_stock: 25, location: 'Rak C-01', supplier: 'PT Kimia Farma Trading & Distribution' },
  { id: 5, name: 'OBH Combi Plus', category: 'Obat Batuk', buy_price: 13500, price: 18000, stock: 25, min_stock: 10, location: 'Rak C-02', supplier: 'PT Anugrah Argon Medica (AAM)' },
  { id: 6, name: 'Ibuprofen 400mg', category: 'Analgesik', buy_price: 5200, price: 7500, stock: 60, min_stock: 15, location: 'Rak A-01', supplier: 'PT Dos Ni Roha (DNR)' },
  { id: 7, name: 'Cetirizine 10mg', category: 'Antihistamin', buy_price: 10500, price: 15000, stock: 5, min_stock: 10, location: 'Rak D-01', supplier: 'PT Penta Valent' },
  { id: 8, name: 'Omeprazole 20mg', category: 'Obat Maag', buy_price: 16000, price: 22000, stock: 30, min_stock: 10, location: 'Rak C-01', supplier: 'PT Enseval Putera Megatrading Tbk' },
  { id: 9, name: 'Neurobion Forte', category: 'Vitamin & Suplemen', buy_price: 26000, price: 35000, stock: 15, min_stock: 10, location: 'Rak B-02', supplier: 'PT Parit Padang Global' },
  { id: 10, name: 'Salep 88', category: 'Anti Jamur', buy_price: 9800, price: 14000, stock: 50, min_stock: 15, location: 'Rak E-01', supplier: 'PT Mensa Bina Sukses (MBS)' },
];

const now = Date.now();
const oneDay = 86400000;

export const mockTransactions = [
  // Transaksi Hari Ini
  {
    id: 'TRX-948101',
    date: new Date(now - 1000 * 60 * 35).toISOString(),
    total: 35000,
    total_hpp: 24500,
    profit: 10500,
    payment_method: 'Tunai',
    cashier: 'Apoteker 1',
    items: [
      { id: 1, name: 'Paracetamol 500mg', price: 5000, buy_price: 3500, qty: 2, subtotal: 10000, hpp_subtotal: 7000 },
      { id: 3, name: 'Vitamin C 1000mg', price: 25000, buy_price: 18000, qty: 1, subtotal: 25000, hpp_subtotal: 18000 }
    ]
  },
  {
    id: 'TRX-948102',
    date: new Date(now - 1000 * 60 * 120).toISOString(),
    total: 48000,
    total_hpp: 35000,
    profit: 13000,
    payment_method: 'QRIS',
    cashier: 'Apoteker 1',
    items: [
      { id: 5, name: 'OBH Combi Plus', price: 18000, buy_price: 13500, qty: 1, subtotal: 18000, hpp_subtotal: 13500 },
      { id: 7, name: 'Cetirizine 10mg', price: 15000, buy_price: 10500, qty: 2, subtotal: 30000, hpp_subtotal: 21000 }
    ]
  },
  {
    id: 'TRX-948103',
    date: new Date(now - 1000 * 60 * 240).toISOString(),
    total: 54000,
    total_hpp: 39500,
    profit: 14500,
    payment_method: 'Tunai',
    cashier: 'Apoteker 2',
    items: [
      { id: 8, name: 'Omeprazole 20mg', price: 22000, buy_price: 16000, qty: 1, subtotal: 22000, hpp_subtotal: 16000 },
      { id: 4, name: 'Antasida Doen', price: 8000, buy_price: 5500, qty: 4, subtotal: 32000, hpp_subtotal: 22000 }
    ]
  },
  // Transaksi 1 hari lalu (Kemarin)
  {
    id: 'TRX-947820',
    date: new Date(now - oneDay * 1).toISOString(),
    total: 145000,
    total_hpp: 102000,
    profit: 43000,
    payment_method: 'QRIS',
    cashier: 'Apoteker 1',
    items: [
      { id: 2, name: 'Amoxicillin 500mg', price: 12000, buy_price: 8500, qty: 3, subtotal: 36000, hpp_subtotal: 25500 },
      { id: 8, name: 'Omeprazole 20mg', price: 22000, buy_price: 16000, qty: 3, subtotal: 66000, hpp_subtotal: 48000 },
      { id: 9, name: 'Neurobion Forte', price: 35000, buy_price: 26000, qty: 1, subtotal: 35000, hpp_subtotal: 26000 },
      { id: 1, name: 'Paracetamol 500mg', price: 5000, buy_price: 3500, qty: 2, subtotal: 10000, hpp_subtotal: 7000 }
    ]
  },
  // Transaksi 2 hari lalu
  {
    id: 'TRX-946510',
    date: new Date(now - oneDay * 2).toISOString(),
    total: 198000,
    total_hpp: 141000,
    profit: 57000,
    payment_method: 'Tunai',
    cashier: 'Apoteker 2',
    items: [
      { id: 3, name: 'Vitamin C 1000mg', price: 25000, buy_price: 18000, qty: 4, subtotal: 100000, hpp_subtotal: 72000 },
      { id: 5, name: 'OBH Combi Plus', price: 18000, buy_price: 13500, qty: 3, subtotal: 54000, hpp_subtotal: 40500 },
      { id: 6, name: 'Ibuprofen 400mg', price: 7500, buy_price: 5200, qty: 4, subtotal: 30000, hpp_subtotal: 20800 },
      { id: 10, name: 'Salep 88', price: 14000, buy_price: 9800, qty: 1, subtotal: 14000, hpp_subtotal: 9800 }
    ]
  },
  // Transaksi 3 hari lalu
  {
    id: 'TRX-945230',
    date: new Date(now - oneDay * 3).toISOString(),
    total: 165000,
    total_hpp: 118000,
    profit: 47000,
    payment_method: 'QRIS',
    cashier: 'Apoteker 1',
    items: [
      { id: 9, name: 'Neurobion Forte', price: 35000, buy_price: 26000, qty: 3, subtotal: 105000, hpp_subtotal: 78000 },
      { id: 2, name: 'Amoxicillin 500mg', price: 12000, buy_price: 8500, qty: 5, subtotal: 60000, hpp_subtotal: 42500 }
    ]
  },
  // Transaksi 4 hari lalu
  {
    id: 'TRX-944112',
    date: new Date(now - oneDay * 4).toISOString(),
    total: 120000,
    total_hpp: 84000,
    profit: 36000,
    payment_method: 'Tunai',
    cashier: 'Apoteker 2',
    items: [
      { id: 1, name: 'Paracetamol 500mg', price: 5000, buy_price: 3500, qty: 6, subtotal: 30000, hpp_subtotal: 21000 },
      { id: 4, name: 'Antasida Doen', price: 8000, buy_price: 5500, qty: 5, subtotal: 40000, hpp_subtotal: 27500 },
      { id: 3, name: 'Vitamin C 1000mg', price: 25000, buy_price: 18000, qty: 2, subtotal: 50000, hpp_subtotal: 36000 }
    ]
  },
  // Transaksi 5 hari lalu
  {
    id: 'TRX-943009',
    date: new Date(now - oneDay * 5).toISOString(),
    total: 210000,
    total_hpp: 151000,
    profit: 59000,
    payment_method: 'Transfer',
    cashier: 'Apoteker 1',
    items: [
      { id: 8, name: 'Omeprazole 20mg', price: 22000, buy_price: 16000, qty: 5, subtotal: 110000, hpp_subtotal: 80000 },
      { id: 5, name: 'OBH Combi Plus', price: 18000, buy_price: 13500, qty: 4, subtotal: 72000, hpp_subtotal: 54000 },
      { id: 10, name: 'Salep 88', price: 14000, buy_price: 9800, qty: 2, subtotal: 28000, hpp_subtotal: 19600 }
    ]
  },
  // Transaksi 6 hari lalu
  {
    id: 'TRX-942180',
    date: new Date(now - oneDay * 6).toISOString(),
    total: 175000,
    total_hpp: 124000,
    profit: 51000,
    payment_method: 'Tunai',
    cashier: 'Apoteker 2',
    items: [
      { id: 3, name: 'Vitamin C 1000mg', price: 25000, buy_price: 18000, qty: 3, subtotal: 75000, hpp_subtotal: 54000 },
      { id: 7, name: 'Cetirizine 10mg', price: 15000, buy_price: 10500, qty: 4, subtotal: 60000, hpp_subtotal: 42000 },
      { id: 6, name: 'Ibuprofen 400mg', price: 7500, buy_price: 5200, qty: 4, subtotal: 30000, hpp_subtotal: 20800 },
      { id: 1, name: 'Paracetamol 500mg', price: 5000, buy_price: 3500, qty: 2, subtotal: 10000, hpp_subtotal: 7000 }
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
    notes: 'Pengiriman batch awal bulan - kondisi baik',
    items: [
      { productId: 1, productName: 'Paracetamol 500mg', qty: 100, buy_price: 3500, subtotal: 350000, exp_date: '2028-12-31' }
    ]
  },
  {
    id: 'IN-20260302-02',
    invoice_number: 'INV-ENS-45210',
    supplier_name: 'PT Enseval Putera Megatrading Tbk',
    date: new Date(now - oneDay * 2).toISOString(),
    total_amount: 425000,
    notes: 'Restock antibiotik & maag - faktur tempo 30 hari',
    items: [
      { productId: 2, productName: 'Amoxicillin 500mg', qty: 50, buy_price: 8500, subtotal: 425000, exp_date: '2027-10-15' }
    ]
  },
  {
    id: 'IN-20260303-03',
    invoice_number: 'MBS-PO-77123',
    supplier_name: 'PT Mensa Bina Sukses (MBS)',
    date: new Date().toISOString(),
    total_amount: 900000,
    notes: 'Penerimaan suplemen vitamin C - kemasan segel aman',
    items: [
      { productId: 3, productName: 'Vitamin C 1000mg', qty: 50, buy_price: 18000, subtotal: 900000, exp_date: '2028-06-20' }
    ]
  }
];
