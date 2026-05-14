import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag, ShieldCheck, Clock, Truck, Pill, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function Storefront({ products }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Hanya tampilkan produk yang ready stock
  const availableProducts = useMemo(() => {
    return products.filter(product => product.stock > 0);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter(product => {
      const matchSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'All' || product.category === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [availableProducts, searchTerm, categoryFilter]);

  const categories = useMemo(() => {
    return ['All', ...new Set(products.map(p => p.category))];
  }, [products]);

  const getProductImage = (category) => {
    const images = {
      'Analgesik': 'https://images.unsplash.com/photo-1584308666744-24d5e4b2d3dc?auto=format&fit=crop&w=400&q=80',
      'Vitamin & Suplemen': 'https://images.unsplash.com/photo-1550572017-edb9b4f9811b?auto=format&fit=crop&w=400&q=80',
      'Antibiotik': 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=400&q=80',
      'Obat Bebas': 'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=400&q=80',
      'Sirup & Cairan': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=400&q=80',
      'P3K & Perawatan': 'https://images.unsplash.com/photo-1583324113626-70df0f4deaab?auto=format&fit=crop&w=400&q=80'
    };
    return images[category] || 'https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=400&q=80';
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  const handleOrderWhatsApp = (product) => {
    const phoneNumber = "6281234567890"; // Ganti dengan nomor WhatsApp Apotek yang sebenarnya
    const message = `Halo Apotek Rumaisha Husada, saya ingin memesan obat berikut:%0A%0A*Nama Obat:* ${product.name}%0A*Kategori:* ${product.category}%0A*Harga:* ${formatRupiah(product.price)}%0A%0AMohon info ketersediaan dan cara pembayarannya. Terima kasih!`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white pb-20 pt-32 lg:pt-40 lg:pb-28">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-tosca-200 to-tosca-500 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-8">
            {/* Left Content */}
            <div className="flex-1 text-center lg:text-left animate-slide-in-bottom">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tosca-50 text-tosca-600 text-sm font-semibold mb-6 ring-1 ring-tosca-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tosca-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tosca-500"></span>
                </span>
                #1 Apotek Terpercaya di Barru
              </span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
                Kesehatan Anda Adalah <span className="text-transparent bg-clip-text bg-gradient-to-r from-tosca-500 to-tosca-700">Prioritas Kami</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 mb-12 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Dapatkan obat-obatan berkualitas, asli, dan terjamin dengan layanan cepat dan ramah dari Apotek Rumaisha Husada.
              </p>
              
              <Button 
                size="lg" 
                className="px-8 py-4 rounded-full text-lg shadow-lg hover:shadow-tosca-500/25 transition-all gap-2"
                onClick={() => document.getElementById('products').scrollIntoView({ behavior: 'smooth' })}
              >
                Lihat Katalog Obat <ArrowRight size={20} />
              </Button>
            </div>

            {/* Right Image */}
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative animate-fade-in mt-8 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-tosca-200 to-emerald-100 rounded-[3rem] transform rotate-3 scale-105 opacity-50 blur-xl"></div>
              <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white group">
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none"></div>
                <img 
                  src="https://images.unsplash.com/photo-1631549916768-4119b2e5f926?auto=format&fit=crop&w=800&q=80" 
                  alt="Layanan Apoteker Profesional" 
                  className="w-full h-[400px] lg:h-[520px] object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
                />
              </div>
              
              {/* Floating Badge 1 */}
              <div className="absolute -left-4 md:-left-8 top-1/4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-tosca-100 text-tosca-600 rounded-full flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Terverifikasi</p>
                    <p className="font-black text-slate-900 text-sm">BPOM 100% Asli</p>
                  </div>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute -right-4 md:-right-8 bottom-1/4 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Layanan Cepat</p>
                    <p className="font-black text-slate-900 text-sm">Buka 08:00 - 22:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-50 relative -mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-soft hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-tosca-50 flex items-center justify-center mb-6 text-tosca-600 ring-1 ring-tosca-100">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Produk Asli & Aman</h3>
              <p className="text-slate-600 leading-relaxed">Semua obat terdaftar BPOM dan terjamin keasliannya dari distributor resmi.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-soft hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-tosca-50 flex items-center justify-center mb-6 text-tosca-600 ring-1 ring-tosca-100">
                <Clock size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Pelayanan Cepat</h3>
              <p className="text-slate-600 leading-relaxed">Respon tanggap & konsultasi langsung dengan apoteker profesional kami.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-soft hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-tosca-50 flex items-center justify-center mb-6 text-tosca-600 ring-1 ring-tosca-100">
                <Truck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Bisa Delivery</h3>
              <p className="text-slate-600 leading-relaxed">Pesan dari rumah, kami antar dengan aman dan cepat sampai ke tangan Anda.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">Katalog Obat <span className="text-tosca-500">Tersedia</span></h2>
              <p className="mt-3 text-slate-500 text-lg">Temukan {availableProducts.length} produk kesehatan terbaik untuk Anda hari ini.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64 group shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within:text-tosca-500 transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-tosca-500/20 focus:border-tosca-500 text-sm transition-all"
                  placeholder="Cari obat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="w-full sm:w-48 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-tosca-500 focus:ring-2 focus:ring-tosca-500/20 text-slate-700 shadow-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'Semua Kategori' : cat}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm animate-fade-in">
              <div className="mx-auto w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Search className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Produk tidak ditemukan</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8">Maaf, kami tidak dapat menemukan obat yang cocok dengan pencarian Anda. Silakan coba kata kunci lain.</p>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setSearchTerm('')}
              >
                Tampilkan Semua Produk
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full animate-slide-in-bottom"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Dynamic Image with Gradient Overlay */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden group">
                    <img 
                      src={getProductImage(product.category)} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 z-20">
                      <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-tosca-700 shadow-sm border border-tosca-100">
                        {product.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-tosca-600 transition-colors line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-slate-500">Tersedia: <span className="font-semibold text-slate-700">{product.stock} pcs</span></p>
                    </div>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <p className="text-2xl font-black text-slate-900 mb-4">{formatRupiah(product.price)}</p>
                      <Button 
                        className="w-full flex justify-center gap-2"
                        onClick={() => handleOrderWhatsApp(product)}
                      >
                        Pesan via WhatsApp
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-tosca-600 py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1587854692152-cbe660dbde88?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Butuh Konsultasi Obat?</h2>
          <p className="text-tosca-100 text-lg mb-8 max-w-2xl mx-auto">Apoteker kami siap membantu Anda memilih obat yang tepat untuk keluhan Anda.</p>
          <Button size="lg" className="bg-white text-tosca-700 hover:bg-slate-50 rounded-full shadow-lg">
            Hubungi Apoteker
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <h4 className="text-white text-2xl font-black mb-6 flex items-center gap-3">
              <div className="bg-tosca-500 p-2 rounded-lg">
                <Pill className="h-6 w-6 text-white" />
              </div>
              Apotek Rumaisha Husada
            </h4>
            <p className="mb-6 text-sm leading-relaxed max-w-md text-slate-400">
              Mitra kesehatan keluarga Anda di Kabupaten Barru. Menyediakan obat-obatan lengkap, terjamin, dan pelayanan kefarmasian profesional.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-tosca-500 hover:text-white transition-colors cursor-pointer">IG</div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-tosca-500 hover:text-white transition-colors cursor-pointer">FB</div>
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-tosca-500 hover:text-white transition-colors cursor-pointer">WA</div>
            </div>
          </div>
          <div>
            <h4 className="text-white text-lg font-bold mb-6">Jam Operasional</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex flex-col gap-1"><span className="text-slate-500">Senin - Jumat</span> <span className="text-white font-medium">08:00 - 22:00</span></li>
              <li className="flex flex-col gap-1"><span className="text-slate-500">Sabtu - Minggu</span> <span className="text-white font-medium">09:00 - 21:00</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white text-lg font-bold mb-6">Kontak Kami</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <span className="text-tosca-500 mt-1">📍</span> 
                <span>Jl. A. P. Pettarani,<br/>Barru, Sulawesi Selatan</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-tosca-500">📞</span> 
                <span>0812-3456-7890</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-tosca-500">✉️</span> 
                <span>info@rumaishahusada.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Apotek Rumaisha Husada. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
