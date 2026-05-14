export const mockProducts = [
  { id: 1, name: 'Paracetamol 500mg', category: 'Analgesik', price: 5000, stock: 150, location: 'Rak A-01' },
  { id: 2, name: 'Amoxicillin 500mg', category: 'Antibiotik', price: 12000, stock: 8, location: 'Rak A-02' },
  { id: 3, name: 'Vitamin C 1000mg', category: 'Vitamin', price: 25000, stock: 45, location: 'Rak B-01' },
  { id: 4, name: 'Antasida Doen', category: 'Obat Maag', price: 8000, stock: 120, location: 'Rak C-01' },
  { id: 5, name: 'OBH Combi Plus', category: 'Obat Batuk', price: 18000, stock: 25, location: 'Rak C-02' },
  { id: 6, name: 'Ibuprofen 400mg', category: 'Analgesik', price: 7500, stock: 60, location: 'Rak A-01' },
  { id: 7, name: 'Cetirizine 10mg', category: 'Antihistamin', price: 15000, stock: 5, location: 'Rak D-01' },
  { id: 8, name: 'Omeprazole 20mg', category: 'Obat Maag', price: 22000, stock: 30, location: 'Rak C-01' },
  { id: 9, name: 'Neurobion Forte', category: 'Vitamin', price: 35000, stock: 15, location: 'Rak B-02' },
  { id: 10, name: 'Salep 88', category: 'Anti Jamur', price: 14000, stock: 50, location: 'Rak E-01' },
];

export const mockTransactions = [
  { id: 'TRX-001', date: new Date().toISOString(), total: 45000, items: 3 },
  { id: 'TRX-002', date: new Date(Date.now() - 86400000).toISOString(), total: 120000, items: 5 },
  { id: 'TRX-003', date: new Date(Date.now() - 172800000).toISOString(), total: 25000, items: 1 },
];
