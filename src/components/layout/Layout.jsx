import { Header } from './Header';

export function Layout({ 
  children, 
  settings, 
  products, 
  currentUser, 
  activeShift, 
  onOpenShiftModal, 
  onCloseShiftModal, 
  onLogout, 
  onResetDemo 
}) {
  return (
    <div className="main-layout">
      {/* Sleek Floating Top-Pill Navbar matching modern SaaS apotek */}
      <Header 
        settings={settings} 
        products={products} 
        currentUser={currentUser} 
        activeShift={activeShift} 
        onOpenShiftModal={onOpenShiftModal} 
        onCloseShiftModal={onCloseShiftModal} 
        onLogout={onLogout} 
        onResetDemo={onResetDemo}
      />
      <main className="page-container animate-fade-in">
        {children}
      </main>
    </div>
  );
}
