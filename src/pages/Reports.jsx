import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Calendar, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function Reports({ transactions }) {
  const [filter, setFilter] = useState('Daily');

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  const filteredTransactions = useMemo(() => {
    const today = new Date();
    return transactions.filter(t => {
      const txDate = new Date(t.date);
      if (filter === 'Daily') {
        return txDate.toDateString() === today.toDateString();
      } else if (filter === 'Weekly') {
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= weekAgo;
      } else if (filter === 'Monthly') {
        return txDate.getMonth() === today.getMonth() && txDate.getFullYear() === today.getFullYear();
      } else if (filter === 'Yearly') {
        return txDate.getFullYear() === today.getFullYear();
      }
      return true;
    });
  }, [transactions, filter]);

  const totalRevenue = filteredTransactions.reduce((acc, t) => acc + t.total, 0);

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(20, 184, 166); // Tosca color
      doc.text("Apotek Rumaisha Husada", 14, 22);
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text("Laporan Penjualan Transaksi Resmi", 14, 30);
      
      const periodeMap = {
        'Daily': 'Harian',
        'Weekly': 'Mingguan',
        'Monthly': 'Bulanan',
        'Yearly': 'Tahunan'
      };
      doc.text(`Periode: ${periodeMap[filter]}`, 14, 38);

      // Table Data
      const tableColumn = ["ID Transaksi", "Tanggal & Waktu", "Jumlah Item", "Total Nominal"];
      const tableRows = [];

      filteredTransactions.forEach(trx => {
        const dateObj = new Date(trx.date);
        const dateStr = `${dateObj.toLocaleDateString('id-ID')} - ${dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}`;
        const totalItems = Array.isArray(trx.items) ? trx.items.reduce((acc, item) => acc + item.qty, 0) : trx.items;
        const rowData = [
          trx.id,
          dateStr,
          totalItems.toString(),
          formatRupiah(trx.total)
        ];
        tableRows.push(rowData);
      });

      // Generate Table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 48,
        theme: 'grid',
        headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        foot: [["", "", "Total Pendapatan", formatRupiah(totalRevenue)]],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 11 }
      });

      doc.save(`Laporan_Penjualan_${periodeMap[filter]}_Apotek.pdf`);
    } catch (error) {
      console.error("Gagal melakukan export PDF:", error);
      alert("Maaf, terjadi kesalahan saat mengekspor PDF.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Laporan Penjualan</h2>
          <p className="text-slate-500 mt-1">Rekapitulasi riwayat transaksi dan ekspor data finansial.</p>
        </div>
        <Button className="gap-2 shadow-sm whitespace-nowrap" onClick={handleExportPDF}>
          <Download size={18} /> Ekspor PDF Laporan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1 bg-white/50 backdrop-blur-sm shadow-sm border-slate-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Filter Periode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(opt => (
              <button
                key={opt}
                onClick={() => setFilter(opt)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-300 ${
                  filter === opt 
                    ? 'bg-tosca-50 text-tosca-700 font-bold border border-tosca-200 shadow-sm' 
                    : 'text-slate-600 hover:bg-white hover:text-slate-900 hover:shadow-sm border border-transparent'
                }`}
              >
                <span>
                  {opt === 'Daily' ? 'Harian (Hari ini)' :
                   opt === 'Weekly' ? 'Mingguan (7 Hari)' :
                   opt === 'Monthly' ? 'Bulanan (Bulan ini)' : 'Tahunan (Tahun ini)'}
                </span>
                {filter === opt && <CheckCircle2 size={16} className="text-tosca-500" />}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-0 shadow-soft">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 bg-white rounded-t-2xl">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
              Data Transaksi {
                filter === 'Daily' ? 'Harian' :
                filter === 'Weekly' ? 'Mingguan' :
                filter === 'Monthly' ? 'Bulanan' : 'Tahunan'
              }
            </CardTitle>
            <div className="text-left sm:text-right bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pendapatan Periode</p>
              <p className="text-2xl font-black text-tosca-600">{formatRupiah(totalRevenue)}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0">
            <Table className="border-0">
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="pl-6">ID Transaksi</TableHead>
                  <TableHead>Tanggal & Waktu</TableHead>
                  <TableHead className="text-center">Jumlah Item</TableHead>
                  <TableHead className="text-right pr-6">Total Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((trx) => {
                  const dateObj = new Date(trx.date);
                  return (
                    <TableRow key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-bold text-tosca-600 pl-6">{trx.id}</TableCell>
                      <TableCell className="text-slate-600 font-medium">
                        {dateObj.toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})} <span className="text-slate-400 mx-1">•</span> {dateObj.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center bg-slate-100 text-slate-700 min-w-[2rem] px-2 h-8 rounded-lg font-bold">
                          {Array.isArray(trx.items) ? trx.items.reduce((acc, item) => acc + item.qty, 0) : trx.items}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-black text-slate-900 pr-6">{formatRupiah(trx.total)}</TableCell>
                    </TableRow>
                  )
                })}
                {filteredTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-16 text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                          <FileText size={32} className="text-slate-300" />
                        </div>
                        <p className="text-lg font-semibold text-slate-700">Tidak ada transaksi</p>
                        <p className="text-sm">Belum ada transaksi yang tercatat untuk periode ini.</p>
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
