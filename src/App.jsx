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
import { ROLES } from './config/auth';
import { PWAInstallBanner } from './components/pwa/InstallPrompt';

// Protected Route Guard
function ProtectedRoute({ currentUser, allowedRoles, children }) {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
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
    storage.setActiveShift(activeShift);
  }, [activeShift]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    storage.setUser(user);
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
            <ProtectedRoute currentUser={currentUser} allowedRoles={[ROLES.OWNER]}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
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
            <ProtectedRoute currentUser={currentUser}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
              >
                <Inventory 
                  products={products} 
                  onAddProduct={handleAddProduct} 
                  onEditProduct={handleEditProduct} 
                  incomingGoods={incomingGoods}
                  onAddIncomingGoods={handleAddIncomingGoods}
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
            <ProtectedRoute currentUser={currentUser}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
              >
                <POS 
                  products={products} 
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

        {/* Laporan Penjualan (Owner Only) */}
        <Route 
          path="/admin/reports" 
          element={
            <ProtectedRoute currentUser={currentUser} allowedRoles={[ROLES.OWNER]}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
              >
                <Reports 
                  transactions={transactions} 
                  incomingGoods={incomingGoods}
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
            <ProtectedRoute currentUser={currentUser}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
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
            <ProtectedRoute currentUser={currentUser} allowedRoles={[ROLES.OWNER]}>
              <Layout 
                settings={settings} 
                products={products}
                currentUser={currentUser}
                activeShift={activeShift}
                onOpenShiftModal={() => setIsOpenShiftModalOpen(true)}
                onCloseShiftModal={() => setIsCloseShiftModalOpen(true)}
                onLogout={handleLogout}
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
