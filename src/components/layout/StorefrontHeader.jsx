import React from 'react';
import { Pill, LogIn } from 'lucide-react';
import { Button } from '../ui/Button';

export function StorefrontHeader({ setMode }) {
  return (
    <header className="sticky top-0 z-50 w-full glass-effect transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-gradient-to-br from-tosca-400 to-tosca-600 p-2.5 rounded-xl shadow-soft group-hover:shadow-md transition-all">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-none group-hover:text-tosca-600 transition-colors">Rumaisha</h1>
              <p className="text-xs text-tosca-600 font-bold tracking-widest uppercase mt-0.5">Apotek & Husada</p>
            </div>
          </div>
          
          <nav className="hidden md:flex gap-8">
            <a href="#" className="text-sm font-semibold text-slate-600 hover:text-tosca-600 transition-colors">Beranda</a>
            <a href="#products" className="text-sm font-semibold text-slate-600 hover:text-tosca-600 transition-colors">Katalog Obat</a>
            <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-tosca-600 transition-colors">Tentang Kami</a>
          </nav>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setMode('admin')} className="hidden sm:flex gap-2 border-slate-200">
              <LogIn size={18} /> Admin Panel
            </Button>
            <button className="sm:hidden text-slate-600 hover:text-tosca-600 transition-colors" onClick={() => setMode('admin')}>
              <LogIn size={24} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
