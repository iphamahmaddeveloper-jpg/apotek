import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Search, ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle2 } from 'lucide-react';

export function POS({ products, onTransactionComplete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number);
  };

  const searchResults = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const addToCart = (product) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prevCart; // limit by stock
        return prevCart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
    setSearchTerm('');
  };

  const updateQty = (id, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty > 0 && newQty <= item.stock) {
            return { ...item, qty: newQty };
          }
        }
        return item;
      });
    });
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  }, [cart]);

  const printReceipt = (transaction, cartItems) => {
    // Membuka window baru untuk cetak struk
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert("Popup terblokir! Mohon izinkan popup untuk mencetak struk.");
      return;
    }

    const receiptHtml = `
      <html>
        <head>
          <title>Struk Pembayaran - ${transaction.id}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 58mm; /* Lebar standar printer kasir thermal */
              margin: 0 auto; 
              padding: 10px;
              color: black;
              font-size: 12px;
              line-height: 1.4;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed black; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { vertical-align: top; padding: 2px 0; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 16px;">APOTEK RUMAISHA</div>
          <div class="center">Jl. Jenderal Sudirman No. 123<br>Palu, Sulawesi Tengah</div>
          <div class="divider"></div>
          <div>ID : ${transaction.id}</div>
          <div>Tgl: ${new Date().toLocaleString('id-ID')}</div>
          <div class="divider"></div>
          <table>
            ${cartItems.map(item => `
              <tr>
                <td colspan="3" class="bold">${item.name}</td>
              </tr>
              <tr>
                <td style="width: 25%;">${item.qty} x</td>
                <td style="width: 40%;">${formatRupiah(item.price).replace('Rp', '')}</td>
                <td class="right" style="width: 35%;">${formatRupiah(item.price * item.qty).replace('Rp', '')}</td>
              </tr>
            `).join('')}
          </table>
          <div class="divider"></div>
          <table>
            <tr>
              <td class="bold">TOTAL</td>
              <td class="right bold" style="font-size: 14px;">${formatRupiah(transaction.total)}</td>
            </tr>
          </table>
          <div class="divider"></div>
          <div class="center" style="margin-top: 15px;">
            Terima Kasih<br>Semoga Lekas Sembuh
          </div>
          <script>
            window.onload = () => { 
              window.print(); 
              setTimeout(() => { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const newTransaction = {
      id: `TRX-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      total: cartTotal,
      items: cart.map(item => ({...item}))
    };
    
    onTransactionComplete(newTransaction);
    printReceipt(newTransaction, cart);
    setCart([]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)] animate-fade-in pb-8">
      {/* Left side: Product Search */}
      <div className="flex-1 flex flex-col space-y-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Kasir POS</h2>
          <p className="text-slate-500 mt-1">Sistem Point of Sale Apotek Rumaisha</p>
        </div>
        
        <Card className="flex-1 flex flex-col h-full overflow-hidden bg-white/50 backdrop-blur-sm border-0 shadow-none">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Ketik nama obat untuk menambahkan ke keranjang..." 
              className="pl-12 h-14 text-lg bg-white shadow-soft border-slate-100 rounded-2xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="flex-1 overflow-auto bg-transparent pb-4">
            {searchTerm && searchResults.length === 0 && (
              <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">Tidak ada produk ditemukan</p>
                <p className="text-sm">Coba kata kunci lain.</p>
              </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map(product => (
                <button 
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-left hover:border-tosca-500 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-tosca-500 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 bg-tosca-50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                  <p className="font-bold text-slate-900 truncate relative z-10 group-hover:text-tosca-600 transition-colors">{product.name}</p>
                  <p className="text-sm text-slate-500 mb-3 relative z-10">{product.category}</p>
                  <p className="text-lg text-tosca-600 font-black relative z-10">{formatRupiah(product.price)}</p>
                  <div className="mt-3 inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 relative z-10">
                    Sisa: <span className="ml-1 text-slate-900">{product.stock}</span>
                  </div>
                </button>
              ))}
            </div>
            
            {!searchTerm && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                <ShoppingCart size={64} className="mb-4" />
                <p className="text-lg font-medium">Mulai ketik untuk mencari produk</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Right side: Cart */}
      <Card className="w-full lg:w-[28rem] flex flex-col h-full overflow-hidden shadow-xl border-slate-100 rounded-3xl relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-tosca-400 to-emerald-500"></div>
        <CardHeader className="bg-white border-b border-slate-100 pt-8 pb-4 px-6">
          <CardTitle className="flex items-center justify-between text-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-tosca-100 text-tosca-600 rounded-xl">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <span className="font-black text-xl">Keranjang</span>
            </div>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">
              {cart.length} Item
            </span>
          </CardTitle>
        </CardHeader>
        
        <div className="flex-1 overflow-auto p-6 space-y-4 bg-slate-50/50">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <ShoppingCart size={32} className="text-slate-300" />
              </div>
              <p className="font-medium">Keranjang masih kosong</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-zoom-in">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-bold text-slate-900 truncate">{item.name}</h4>
                  <p className="text-sm text-tosca-600 font-semibold">{formatRupiah(item.price)}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="font-black text-slate-900">{formatRupiah(item.price * item.qty)}</p>
                  <div className="flex items-center gap-1 bg-slate-50 rounded-xl border border-slate-200 p-1">
                    <button 
                      onClick={() => updateQty(item.id, -1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-bold w-8 text-center text-slate-800">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.id, 1)}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm rounded-lg transition-all"
                    >
                      <Plus size={14} />
                    </button>
                    <div className="w-px h-4 bg-slate-200 mx-1"></div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between items-center text-slate-500 text-sm">
              <span>Subtotal</span>
              <span className="font-medium text-slate-700">{formatRupiah(cartTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500 text-sm">
              <span>Pajak (0%)</span>
              <span className="font-medium text-slate-700">Rp 0</span>
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="text-slate-900 font-bold">Total Bayar</span>
              <span className="text-3xl font-black text-tosca-600">{formatRupiah(cartTotal)}</span>
            </div>
          </div>
          <Button 
            className="w-full h-14 text-lg font-bold gap-2 shadow-lg shadow-tosca-500/20 hover:shadow-tosca-500/40 transition-all rounded-2xl"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            <CheckCircle2 size={20} />
            Proses Pembayaran
          </Button>
        </div>
      </Card>
    </div>
  );
}
