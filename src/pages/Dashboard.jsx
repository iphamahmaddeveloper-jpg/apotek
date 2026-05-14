import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Activity, DollarSign, Package, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { cn } from '../utils';

export function Dashboard({ products, transactions }) {
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  const todayTransactions = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(t => t.date.startsWith(today));
  }, [transactions]);

  const totalSalesToday = useMemo(() => {
    return todayTransactions.reduce((acc, curr) => acc + curr.total, 0);
  }, [todayTransactions]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock < 10);
  }, [products]);

  // Mock data for the chart
  const weeklySales = [
    { day: 'Sen', amount: 1200000, height: '40%' },
    { day: 'Sel', amount: 1500000, height: '55%' },
    { day: 'Rab', amount: 900000, height: '30%' },
    { day: 'Kam', amount: 1800000, height: '70%' },
    { day: 'Jum', amount: 2100000, height: '85%' },
    { day: 'Sab', amount: 2500000, height: '100%' },
    { day: 'Min', amount: 2000000, height: '80%' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Overview Dashboard</h2>
          <p className="text-slate-500 mt-1">Pantau performa penjualan dan stok apotek hari ini.</p>
        </div>
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-semibold text-slate-700 pr-2">Sistem Aktif</span>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-tosca-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pendapatan Hari Ini</CardTitle>
            <div className="p-2.5 bg-tosca-100 rounded-xl text-tosca-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-slate-900">{formatRupiah(totalSalesToday)}</div>
            <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
              <ArrowUpRight size={16} /> +20.1% dari kemarin
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Transaksi Harian</CardTitle>
            <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600">
              <Activity className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-slate-900">{todayTransactions.length}</div>
            <p className="text-sm text-slate-500 mt-2 font-medium">Transaksi berhasil diproses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-slate-50 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Produk</CardTitle>
            <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600">
              <Package className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-slate-900">{products.length}</div>
            <p className="text-sm text-slate-500 mt-2 font-medium">Item aktif di inventaris</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-orange-700 uppercase tracking-wider">Stok Menipis</CardTitle>
            <div className="p-2.5 bg-orange-200/50 rounded-xl text-orange-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-black text-orange-700">{lowStockProducts.length}</div>
            <p className="text-sm text-orange-600 mt-2 font-medium">Butuh restock segera</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Tren Penjualan Mingguan</CardTitle>
                <p className="text-sm text-slate-500 mt-1">Estimasi pendapatan 7 hari terakhir</p>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-slate-500 border border-slate-100">
                <TrendingUp size={20} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end pt-6">
            {/* Custom CSS Bar Chart */}
            <div className="h-64 w-full flex items-end justify-between gap-2 px-2 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="w-full h-px bg-slate-400"></div>
                <div className="w-full h-px bg-slate-400"></div>
                <div className="w-full h-px bg-slate-400"></div>
                <div className="w-full h-px bg-slate-400"></div>
                <div className="w-full h-px bg-slate-400"></div>
              </div>
              
              {weeklySales.map((item, i) => (
                <div key={i} className="relative flex flex-col items-center flex-1 group h-full justify-end z-10">
                  {/* Tooltip */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg">
                    {formatRupiah(item.amount)}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full max-w-[3rem] bg-tosca-500 rounded-t-lg transition-all duration-500 group-hover:bg-tosca-400 relative overflow-hidden"
                    style={{ height: item.height }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  {/* Label */}
                  <span className="text-xs font-semibold text-slate-500 mt-3">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-xl">
              <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                <AlertTriangle size={18} />
              </div>
              Perhatian Stok Obat
            </CardTitle>
            <p className="text-sm text-slate-500 mt-1">Daftar obat dengan stok kurang dari 10 pcs.</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Obat</TableHead>
                  <TableHead className="w-24 text-center">Sisa</TableHead>
                  <TableHead className="text-right">Lokasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.slice(0, 6).map(product => (
                  <TableRow key={product.id} className="group cursor-default">
                    <TableCell className="font-bold text-slate-800 group-hover:text-tosca-600 transition-colors">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm",
                        product.stock <= 3 
                          ? "bg-red-100 text-red-700 ring-1 ring-inset ring-red-600/20" 
                          : "bg-orange-100 text-orange-700 ring-1 ring-inset ring-orange-600/20"
                      )}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-500 font-medium">
                      {product.location}
                    </TableCell>
                  </TableRow>
                ))}
                {lowStockProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-48 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                          <Package size={24} />
                        </div>
                        <p className="font-medium text-slate-600">Semua stok aman</p>
                        <p className="text-xs">Tidak ada peringatan stok saat ini.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
