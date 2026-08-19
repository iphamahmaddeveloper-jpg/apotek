import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';
import { Storefront } from './pages/Storefront';
import { StorefrontHeader } from './components/layout/StorefrontHeader';
import { mockProducts, mockTransactions } from './mockData';

function App() {
  const [appMode, setAppMode] = useState('admin'); // 'public' | 'admin'
  const [activePage, setActivePage] = useState('dashboard');
  const [products, setProducts] = useState(mockProducts);
  const [transactions, setTransactions] = useState(mockTransactions);

  const handleTransactionComplete = (newTransaction) => {
    setTransactions(prev => [newTransaction, ...prev]);
    // Decrease stock
    setProducts(prevProducts => {
      return prevProducts.map(p => {
        const purchasedItem = newTransaction.items.find(item => item.id === p.id);
        if (purchasedItem) {
          return { ...p, stock: p.stock - purchasedItem.quantity };
        }
        return p;
      });
    });
  };

  const handleAddProduct = (newProduct) => {
    setProducts(prev => [...prev, newProduct]);
  };

  const handleEditProduct = (updatedProduct) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  if (appMode === 'public') {
    return (
      <div className="flex flex-col min-h-screen">
        <StorefrontHeader setMode={setAppMode} />
        <Storefront products={products} />
      </div>
    );
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage} setAppMode={setAppMode}>
      {activePage === 'dashboard' && <Dashboard products={products} transactions={transactions} />}
      {activePage === 'inventory' && <Inventory products={products} onAddProduct={handleAddProduct} onEditProduct={handleEditProduct} />}
      {activePage === 'pos' && <POS products={products} onTransactionComplete={handleTransactionComplete} />}
      {activePage === 'reports' && <Reports transactions={transactions} />}
    </Layout>
  );
}

export default App;
