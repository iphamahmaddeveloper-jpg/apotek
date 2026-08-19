import React from 'react';
import { Bell, Search, Globe } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function Header({ setAppMode }) {
  const today = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <header className="h-20 glass-effect flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
        {today}
      </div>
      
      <div className="flex items-center gap-6">
        <div className="relative w-72 hidden md:block group">
          <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400 group-focus-within:text-tosca-500 transition-colors" />
          <Input placeholder="Cari obat cepat..." className="pl-11 bg-white/50 backdrop-blur-sm border-slate-200/60 shadow-sm" />
        </div>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

        <Button variant="outline" onClick={() => setAppMode('public')} className="hidden sm:flex gap-2 bg-white/50">
          <Globe size={18} /> Ke Halaman Publik
        </Button>
        
        <button className="relative p-2.5 bg-white text-slate-400 hover:text-tosca-600 rounded-xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
