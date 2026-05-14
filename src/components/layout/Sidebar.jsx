import React from 'react';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';

export function Sidebar({ activePage, setActivePage }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Stok & Lokasi', icon: Package },
    { id: 'pos', label: 'Kasir (POS)', icon: ShoppingCart },
    { id: 'reports', label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <div className="h-screen w-72 bg-slate-950 text-white flex flex-col fixed left-0 top-0 border-r border-slate-800 transition-all duration-300">
      <div className="p-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-tosca-400 to-tosca-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-tosca-500/20">
            <Package size={22} />
          </div>
          Rumaisha
        </h1>
        <p className="text-xs text-tosca-500 font-bold tracking-widest uppercase mt-2 pl-[3.25rem]">Admin Panel</p>
      </div>

      <nav className="flex-1 px-4 mt-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-semibold group",
                isActive 
                  ? "bg-tosca-500/10 text-tosca-400 border border-tosca-500/20 shadow-[inset_0_0_20px_rgba(20,184,166,0.05)]" 
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={cn("transition-colors", isActive ? "text-tosca-400" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
              </div>
              {isActive && <ChevronRight size={16} className="text-tosca-500" />}
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-tosca-500 to-blue-500 flex items-center justify-center text-sm font-bold shadow-md">
            A
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-sm text-slate-200">Admin Utama</p>
            <p className="text-xs text-slate-500 font-medium">Superadmin</p>
          </div>
        </div>
      </div>
    </div>
  );
}
