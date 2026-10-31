import { Link } from 'react-router-dom';
import { Pill, PhoneCall } from 'lucide-react';
import { Button } from '../ui/Button';

export function StorefrontHeader({ settings }) {
  const waNumber = settings?.nomor_wa || '6281234567890';
  const cleanWa = waNumber.replace(/[^0-9]/g, '');

  return (
    <header className="sticky top-0 z-50 w-full glass-effect transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl shadow-soft group-hover:shadow-md transition-all">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                {settings?.nama_apotek || 'Apotek Medika Sejahtera'}
              </h1>
              <p className="text-xs text-indigo-600 font-bold tracking-widest uppercase mt-0.5">
                {settings?.tagline || 'Mitra Kesehatan Terpercaya'}
              </p>
            </div>
          </Link>
          
          <nav className="hidden md:flex gap-8 items-center">
            <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Beranda</Link>
            <a href="#products" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Katalog Obat</a>
            <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Tentang Kami</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <a 
              href={`https://wa.me/${cleanWa}?text=Halo%20Apotek,%20saya%20ingin%20konsultasi%20obat`} 
              target="_blank" 
              rel="noreferrer"
            >
              <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all">
                <PhoneCall size={14} />
                <span>Konsultasi Resep</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
