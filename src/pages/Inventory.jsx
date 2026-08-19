import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Filter, PackagePlus } from 'lucide-react';

export function Inventory({ products, onAddProduct, onEditProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);
  const [addStockAmount, setAddStockAmount] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    location: ''
  });

  const handleOpenAdd = () => {
    setFormData({ name: '', category: '', price: '', stock: '', location: '' });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price,
      stock: product.stock,
      location: product.location
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAddStock = (product) => {
    setSelectedProductForStock(product);
    setAddStockAmount('');
    setIsAddStockModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsAddStockModalOpen(false);
    setEditingProduct(null);
    setSelectedProductForStock(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: parseInt(formData.price),
      stock: parseInt(formData.stock)
    };

    if (isEditModalOpen && editingProduct) {
      onEditProduct({ ...productData, id: editingProduct.id });
    } else {
      onAddProduct({ ...productData, id: Date.now() }); // Generate a temporary ID
    }
    handleCloseModal();
  };

  const handleSubmitAddStock = (e) => {
    e.preventDefault();
    if (selectedProductForStock && addStockAmount) {
      const amount = parseInt(addStockAmount);
      onEditProduct({
        ...selectedProductForStock,
        stock: selectedProductForStock.stock + amount
      });
      handleCloseModal();
    }
  };

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Manajemen Stok</h2>
          <p className="text-slate-500 mt-1">Kelola data obat, harga, dan lokasi rak secara real-time.</p>
        </div>
        <Button className="gap-2 shadow-sm" onClick={handleOpenAdd}>
          <Plus size={18} /> Tambah Obat Baru
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama obat..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Obat</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead>Lokasi Rak</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatRupiah(product.price)}</TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      product.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-tosca-100 text-tosca-800'
                    }`}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-600">{product.location}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-tosca-600 px-2" onClick={() => handleOpenAddStock(product)} title="Tambah Stok">
                        <PackagePlus size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-primary-600 px-2" onClick={() => handleOpenEdit(product)}>Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Tidak ada obat yang ditemukan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isAddModalOpen || isEditModalOpen} 
        onClose={handleCloseModal}
        title={isEditModalOpen ? "Edit Data Obat" : "Tambah Obat Baru"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nama Obat</label>
            <Input 
              required
              placeholder="Masukkan nama obat" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Kategori</label>
            <select 
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-tosca-500 focus:ring-4 focus:ring-tosca-500/10"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="" disabled>Pilih kategori obat...</option>
              <option value="Analgesik">Analgesik</option>
              <option value="Vitamin & Suplemen">Vitamin & Suplemen</option>
              <option value="Antibiotik">Antibiotik</option>
              <option value="Obat Bebas">Obat Bebas</option>
              <option value="Sirup & Cairan">Sirup & Cairan</option>
              <option value="P3K & Perawatan">P3K & Perawatan</option>
              <option value="Lainnya">Lainnya...</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Harga Jual (Rp)</label>
              <Input 
                required
                type="number"
                placeholder="0" 
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Stok Awal</label>
              <Input 
                required
                type="number"
                placeholder="0" 
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Lokasi Rak</label>
            <select 
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-tosca-500 focus:ring-4 focus:ring-tosca-500/10"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            >
              <option value="" disabled>Pilih lokasi rak...</option>
              <option value="Rak A-01">Rak A-01</option>
              <option value="Rak B-02">Rak B-02</option>
              <option value="Rak C-03">Rak C-03</option>
              <option value="Lemari Pendingin">Lemari Pendingin</option>
              <option value="Gudang Utama">Gudang Utama</option>
              <option value="Rak Kasir">Rak Kasir</option>
              <option value="Lainnya">Lainnya...</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit">Simpan Data</Button>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={isAddStockModalOpen} 
        onClose={handleCloseModal}
        title="Tambah Stok Obat"
      >
        <form onSubmit={handleSubmitAddStock} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg mb-4 border border-slate-100">
            <p className="text-sm text-slate-500">Menambah stok untuk obat:</p>
            <p className="font-semibold text-slate-900">{selectedProductForStock?.name}</p>
            <p className="text-sm mt-1">Stok saat ini: <span className="font-bold text-tosca-600">{selectedProductForStock?.stock}</span></p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Jumlah Stok yang Ditambahkan</label>
            <Input 
              required
              type="number"
              min="1"
              placeholder="Masukkan jumlah stok baru" 
              value={addStockAmount}
              onChange={e => setAddStockAmount(e.target.value)}
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button type="submit">Tambah Stok</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
