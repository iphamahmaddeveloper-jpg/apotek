import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Floating Container */}
      <div style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
        maxWidth: 380,
        width: 'calc(100% - 40px)'
      }}>
        {toasts.map(t => {
          let bg = '#ffffff';
          let border = '#e2e8f0';
          let iconColor = '#4f46e5';
          let IconComponent = Info;

          if (t.type === 'success') {
            bg = '#f0fdf4';
            border = '#bbf7d0';
            iconColor = '#16a34a';
            IconComponent = CheckCircle2;
          } else if (t.type === 'error') {
            bg = '#fff1f2';
            border = '#fecdd3';
            iconColor = '#e11d48';
            IconComponent = AlertCircle;
          } else if (t.type === 'warning') {
            bg = '#fffbeb';
            border = '#fde68a';
            iconColor = '#d97706';
            IconComponent = AlertTriangle;
          }

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                background: bg,
                border: `1.5px solid ${border}`,
                borderRadius: 12,
                padding: '12px 14px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'all 0.2s ease'
              }}
            >
              <IconComponent size={20} color={iconColor} style={{ flexShrink: 0 }} />
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1e293b',
                lineHeight: 1.4,
                flex: 1
              }}>
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: '#94a3b8',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Return safe fallback so it doesn't crash if used outside provider
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      info: (msg) => console.log('Toast info:', msg),
      warning: (msg) => console.warn('Toast warning:', msg)
    };
  }
  return ctx;
}
