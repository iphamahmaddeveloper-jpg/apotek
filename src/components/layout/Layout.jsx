import { Sidebar } from './Sidebar';
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa' }}>
      <Sidebar 
        settings={settings} 
        currentUser={currentUser} 
        activeShift={activeShift} 
        onLogout={onLogout} 
      />
      <div className="main-layout">
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
    </div>
  );
}
