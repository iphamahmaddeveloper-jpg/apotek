import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout({ children, activePage, setActivePage, setAppMode }) {
  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <div className="flex-1 ml-72 flex flex-col transition-all duration-300">
        <Header setAppMode={setAppMode} />
        <main className="flex-1 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
