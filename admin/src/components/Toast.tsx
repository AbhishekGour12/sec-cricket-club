import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4000) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastItem = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((message: string, title?: string, duration?: number) => {
    showToast('success', message, title || 'Success', duration);
  }, [showToast]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    showToast('error', message, title || 'Error', duration);
  }, [showToast]);

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    showToast('warning', message, title || 'Warning', duration);
  }, [showToast]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    showToast('info', message, title || 'Notice', duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      {/* Toast Overlay Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          const isSuccess = t.type === 'success';
          const isWarning = t.type === 'warning';

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
                isError
                  ? 'bg-rose-900/95 border-rose-700/80 text-rose-50 shadow-rose-950/40'
                  : isSuccess
                  ? 'bg-emerald-900/95 border-emerald-700/80 text-emerald-50 shadow-emerald-950/40'
                  : isWarning
                  ? 'bg-amber-900/95 border-amber-700/80 text-amber-50 shadow-amber-950/40'
                  : 'bg-[#1A2744]/95 border-slate-700 text-slate-100 shadow-slate-950/40'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-5 h-5 text-rose-300" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-300" />}
                {t.type === 'info' && <Info className="w-5 h-5 text-sky-300" />}
              </div>
              <div className="flex-1 min-w-0">
                {t.title && <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5 opacity-90">{t.title}</h4>}
                <p className="text-xs font-medium leading-relaxed break-words">{t.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
