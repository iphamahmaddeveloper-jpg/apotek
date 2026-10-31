import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';
import { Storefront } from './pages/Storefront';
import { Login } from './pages/Login';
import { ShiftHistory } from './pages/ShiftHistory';
import { StaffManagement } from './pages/StaffManagement';
import { StorefrontHeader } from './components/layout/StorefrontHeader';
import { OpenShiftModal, CloseShiftModal } from './components/shift/ShiftModals';
import { storage } from './services/storage';
import { ToastProvider, useToast } from './context/ToastContext';
import { ROLES, USER_STATUS } from './config/auth';
import { PWAInstallBanner } from './components/pwa/InstallPrompt';

// Protected Route Guard with anti-tamper session integrity
function ProtectedRoute({ currentUser, users, allowedRoles, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Validate session against active registered users in system memory/storage
  const validUser = (users || []).find(
    u => u.id === currentUser.id && u.username === currentUser.username && u.status !== USER_STATUS.INACTIVE
  );

  // If user does not exist, was deactivated, or role was tampered with in storage
  if (!validUser || validUser.role !== currentUser.role) {
    storage.removeUser();
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(validUser.role)) {
    // If not allowed, redirect staff to POS
    return <Navigate to="/admin/pos" replace />;
  }

  return children;
}

function MainApp() {
  const toast = useToast();
  const [settings] = useState(() => storage.getSettings());
  const [products, setProducts] = useState(() => storage.getProducts());
  const [transactions, setTransactions] = useState(() => storage.getTransactions());
  const [incomingGoods, setIncomingGoods] = useState(() => storage.getIncomingGoods());
  const [currentUser, setCurrentUser] = useState(() => storage.getUser());
  const [users, setUsers] = useState(() => storage.getUsers());
  const [shifts, setShifts] = useState(() => storage.getShifts());
  const [activeShift, setActiveShift] = useState(() => storage.getActiveShift());
  const [members, setMembers] = useState(() => storage.getMembers());
  const [stockOpnames, setStockOpnames] = useState(() => storage.getStockOpnames());

  // Modal states for Shifts
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);

  // Sync state changes to storage
  useEffect(() => {
    storage.setProducts(products);
  }, [products]);

  useEffect(() => {
    storage.setTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storage.setIncomingGoods(incomingGoods);
  }, [incomingGoods]);

  useEffect(() => {
    storage.setUsers(users);
  }, [users]);

  useEffect(() => {
    storage.setShifts(shifts);
  }, [shifts]);

  useEffect(() => {
    storage.setMembers(members);
  }, [members]);

  useEffect(() => {
    storage.setStockOpnames(stockOpnames);
  }, [stockOpnames]);

  // Multi-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (!e.key) {
        // If storage was cleared
        setProducts(storage.getProducts());
        setTransactions(storage.getTransactions());
        setIncomingGoods(storage.getIncomingGoods());
        setUsers(storage.getUsers());
        setShifts(storage.getShifts());
        setActiveShift(storage.getActiveShift());
        return;
      }
      try {
        if (e.key === 'apotek_products_v3') setProducts(JSON.parse(e.newValue));
        if (e.key === 'apotek_transactions_v3') setTransactions(JSON.parse(e.newValue));
        if (e.key === 'apotek_incoming_v3') setIncomingGoods(JSON.parse(e.newValue));
        if (e.key === 'apotek_users_list_v3') setUsers(JSON.parse(e.newValue));
        if (e.key === 'apotek_shifts_v3') setShifts(JSON.parse(e.newValue));
        if (e.key === 'apotek_active_shift_v3') setActiveShift(JSON.parse(e.newValue));
      } catch (err) {
        console.warn('Sync error from storage event:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleResetDemoData = () => {
    if (window.confirm('Reset semua data ke konfigurasi demo awal? Semua transaksi uji coba dan stok akan dikembalikan ke kondisi default.')) {
      storage.resetToDefault();
    }
  };

  const handleLoginSuccess = (user) => {
    const { password: _, ...safeUser } = user;
    setCurrentUser(safeUser);
    storage.setUser(safeUser);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    storage.removeUser();
    toast.info('Anda telah keluar dari portal apotek.');
  };

  const handleTransactionComplete = (newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);

    // Decrease stock in state
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const purchasedItem = newTransaction.items.find(item => item.id === p.id);
        if (purchasedItem) {
          return { ...p, stock: Math.max(0, p.stock - purchasedItem.qty) };
        }
        return p;
      });
    });
  };

  const handleAddProduct = (newProduct) => {
    setProducts(prev => [...prev, newProduct]);
    toast.success(`Obat ${newProduct.name} berhasil ditambahkan!`);
  };

  const handleEditProduct = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    toast.success(`Data obat ${updatedProduct.name} berhasil diperbarui.`);
  };

  const handleAddIncomingGoods = (newIncoming) => {
    setIncomingGoods(prev => [newIncoming, ...prev]);

    setProducts(prevProducts => {
      return prevProducts.map(product => {
        const matchedItem = newIncoming.items.find(item => item.productId === product.id);
        if (matchedItem) {
          return {
            ...product,
            stock: product.stock + (parseInt(matchedItem.qty, 10) || 0),
            buy_price: matchedItem.buy_price ? parseInt(matchedItem.buy_price, 10) : product.buy_price,
            supplier: newIncoming.supplier_name || product.supplier
          };
        }
        return product;
      });
    });
    toast.success(`Faktur masuk ${newIncoming.invoice_number} berhasil dicatat.`);
  };

  // Pembatalan Faktur Penjualan (Void/Retur Obat)
  const handleVoidTransaction = (trxId, reason = 'Pasien ingin ganti obat/batal') => {
    const target = transactions.find(t => (t.id === trxId || t.invoice_no === trxId));
    if (!target) {
      toast.error(`Faktur ${trxId} tidak ditemukan.`);
      return false;
    }
    if (target.is_void) {
      toast.warning(`Faktur ${trxId} sudah dibatalkan sebelumnya.`);
      return false;
    }

    // 1. Tandai transaksi sebagai BATAL (VOID)
    setTransactions(prev => prev.map(t => {
      if (t.id === target.id) {
        return {
          ...t,
          is_void: true,
          void_at: new Date().toISOString(),
          void_by: currentUser?.name || 'Petugas Apotek',
          void_reason: reason
        };
      }
      return t;
    }));

    // 2. Kembalikan stok obat secara otomatis ke inventori rak apotek
    if (Array.isArray(target.items)) {
      setProducts(prevProducts => {
        return prevProducts.map(p => {
          const item = target.items.find(i => i.id === p.id);
          if (item) {
            return { ...p, stock: p.stock + (parseInt(item.qty, 10) || 0) };
          }
          return p;
        });
      });
    }

    toast.success(`Faktur ${target.invoice_no || target.id} berhasil DIBATALKAN. Stok obat telah dikembalikan ke inventori rak.`);
    return true;
  };

  // Simpan Sesi / Lembar Cek Fisik & Stok Opname
  const handleSaveStockOpname = (soRecord, shouldAdjustStock = false) => {
    setStockOpnames(prev => [soRecord, ...prev]);

    if (shouldAdjustStock && soRecord.productId) {
      setProducts(prev => prev.map(p => {
        if (p.id === soRecord.productId) {
          return { ...p, stock: soRecord.physicalStock };
        }
        return p;
      }));
      toast.success(`Stok sistem ${soRecord.productName} berhasil disinkronkan ke stok fisik (${soRecord.physicalStock} unit).`);
    } else {
      toast.success(`Catatan cek fisik ${soRecord.productName} berhasil disimpan.`);
    }
  };

  // Shift Handlers
  const handleConfirmOpenShift = (newShift) => {
    setActiveShift(newShift);
    setShifts(prev => [newShift, ...prev]);
    toast.success(`Shift ${newShift.shiftName} berhasil dibuka oleh ${newShift.userName}`);
  };

  const handleConfirmCloseShift = (closedShift) => {
    setActiveShift(null);
    setShifts(prev => prev.map(s => s.id === closedShift.id ? closedShift : s));
    toast.success(`Shift ${closedShift.shiftName} telah ditutup & direkapitulasi.`);
  };

  return (
    <>
      <Routes>
        {/* Public Storefront Route */}
        <Route 
          path="/" 
          element={
            <div className="flex flex-col min-h-screen">
              <StorefrontHeader settings={settings} />
              <Storefront products={products} settings={settings} />
            </div>
          } 
        />

        {/* Authentication Route */}
        <Route 
          path="/login" 
          element={
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              settings={settings}
              users={users}
            />
          } 
        />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />

        {/* Admin Catch Redirect */}
        <Route 
          path="/admin" 
          element={
            !currentUser ? (
              <Navigate to="/login" replace />
            ) : currentUser.role === ROLES.OWNER ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/admin/pos" replace />
            )
          } 
        />
        
        {/* Dashboard (Owner Only) */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute currentUser={currentUser} users={users} allowedRoles={[ROLES.OWNER]}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemoData}
              >
                <Dashboard 
                  products={products} 
                  transactions={transactions} 
                  incomingGoods={incomingGoods}
                  settings={settings} 
                />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Inventaris (Owner & Staff) */}
        <Route 
          path="/admin/inventory" 
          element={
            <ProtectedRoute currentUser={currentUser} users={users}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemoData}
              >
                <Inventory 
                  products={products} 
                  onAddProduct={handleAddProduct} 
                  onEditProduct={handleEditProduct} 
                  incomingGoods={incomingGoods}
                  onAddIncomingGoods={handleAddIncomingGoods}
                  stockOpnames={stockOpnames}
                  onSaveStockOpname={handleSaveStockOpname}
                  settings={settings}
                  currentUser={currentUser}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Kasir / POS (Owner & Staff) */}
        <Route 
          path="/admin/pos" 
          element={
            <ProtectedRoute currentUser={currentUser} users={users}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemoData}
              >
                <POS 
                  products={products} 
                  members={members}
                  onTransactionComplete={handleTransactionComplete}
                  onCheckout={handleTransactionComplete}
                  settings={settings}
                  currentUser={currentUser}
                  activeShift={activeShift}
                  onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                  onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Laporan Penjualan & Pembatalan Faktur (Owner & Staff) */}
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute currentUser={currentUser} users={users}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemoData}
              >
                <Reports 
                  transactions={transactions} 
                  incomingGoods={incomingGoods}
                  products={products}
                  stockOpnames={stockOpnames}
                  currentUser={currentUser}
                  onVoidTransaction={handleVoidTransaction}
                  settings={settings} 
                />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Riwayat Shift & Rekapitulasi Kas (Owner & Staff) */}
        <Route 
          path="/admin/shifts" 
          element={
            <ProtectedRoute currentUser={currentUser} users={users}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemoData}
              >
                <ShiftHistory 
                  shifts={shifts}
                  activeShift={activeShift}
                  currentUser={currentUser}
                  onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                  onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                  settings={settings}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Manajemen Karyawan / Staff (Owner Only) */}
        <Route 
          path="/admin/staff" 
          element={
            <ProtectedRoute currentUser={currentUser} users={users} allowedRoles={[ROLES.OWNER]}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
                onResetDemo={handleResetDemoData}
              >
                <StaffManagement 
                  users={users}
                  onUpdateUsers={(updated) => setUsers(updated)}
                  currentUser={currentUser}
                />
              </Layout>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global Shift Modals */}
      <OpenShiftModal 
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        onConfirmOpen={handleConfirmOpenShift}
        currentUser={currentUser}
      />

      <CloseShiftModal 
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        activeShift={activeShift}
        transactions={transactions}
        onConfirmClose={handleConfirmCloseShift}
        currentUser={currentUser}
      />

      {/* PWA Install Banner — auto-appears when browser detects installability */}
      <PWAInstallBanner />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
