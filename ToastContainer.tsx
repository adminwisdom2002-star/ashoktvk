import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, Bell, X, ShieldCheck, Sparkles } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'update';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  duration?: number; // ms
  timestamp: string;
  trackingNo?: string;
  actionText?: string;
  onAction?: () => void;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const timestamp = new Date().toLocaleTimeString('ta-IN', { hour: '2-digit', minute: '2-digit' });

    const newToast: ToastMessage = {
      ...toast,
      id,
      timestamp,
      duration: toast.duration || 5000
    };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Keep max 5 visible

    // Play subtle soft notification chime using Web Audio API if supported
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(toast.type === 'success' ? 587.33 : 440, audioCtx.currentTime); // D5 or A4
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // Audio context ignored if blocked
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      {/* Floating Toast Container */}
      <div 
        aria-live="polite" 
        className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = toast.duration || 5000;
    const startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);
    }, 50);

    const closeTimer = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(closeTimer);
    };
  }, [toast.duration, onClose]);

  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-white border-emerald-500',
          iconBg: 'bg-emerald-100 text-emerald-700',
          progressBg: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle2
        };
      case 'update':
        return {
          bg: 'bg-[#4a0000] text-white border-[#ffcc00]',
          iconBg: 'bg-[#ffcc00] text-[#4a0000]',
          progressBg: 'bg-[#ffcc00]',
          badge: 'bg-[#ffcc00] text-[#4a0000]',
          icon: Bell
        };
      case 'warning':
        return {
          bg: 'bg-white border-amber-500',
          iconBg: 'bg-amber-100 text-amber-700',
          progressBg: 'bg-amber-500',
          badge: 'bg-amber-100 text-amber-800',
          icon: AlertCircle
        };
      case 'info':
      default:
        return {
          bg: 'bg-white border-sky-500',
          iconBg: 'bg-sky-100 text-sky-700',
          progressBg: 'bg-sky-500',
          badge: 'bg-sky-100 text-sky-800',
          icon: Info
        };
    }
  };

  const style = getToastStyle();
  const Icon = style.icon;
  const isDarkBg = toast.type === 'update';

  return (
    <div 
      className={`pointer-events-auto rounded-xl border-2 shadow-xl overflow-hidden transition-all duration-300 animate-slideInRight ${style.bg}`}
    >
      <div className="p-3.5 flex items-start gap-3 relative">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-bold shadow-2xs ${style.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${style.badge}`}>
              {toast.type === 'success' && 'வெற்றி (Success)'}
              {toast.type === 'update' && 'நேரலை புதுப்பிப்பு (Live)'}
              {toast.type === 'warning' && 'எச்சரிக்கை'}
              {toast.type === 'info' && 'தகவல்'}
            </span>
            {toast.trackingNo && (
              <span className={`text-[10px] font-mono font-bold ${isDarkBg ? 'text-[#ffcc00]' : 'text-[#4a0000]'}`}>
                {toast.trackingNo}
              </span>
            )}
            <span className={`text-[10px] ml-auto font-mono ${isDarkBg ? 'text-neutral-300' : 'text-neutral-400'}`}>
              {toast.timestamp}
            </span>
          </div>

          <h5 className={`text-xs sm:text-sm font-extrabold leading-tight ${isDarkBg ? 'text-white' : 'text-neutral-900'}`}>
            {toast.title}
          </h5>

          <p className={`text-xs mt-1 leading-snug ${isDarkBg ? 'text-neutral-200' : 'text-neutral-600'}`}>
            {toast.message}
          </p>

          {toast.actionText && toast.onAction && (
            <button
              onClick={toast.onAction}
              className={`mt-2 text-xs font-black underline flex items-center gap-1 ${
                isDarkBg ? 'text-[#ffcc00] hover:text-white' : 'text-[#4a0000] hover:text-black'
              }`}
            >
              <span>{toast.actionText} →</span>
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`p-1 rounded-md transition-colors ${
            isDarkBg ? 'text-neutral-300 hover:text-white hover:bg-white/10' : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Animated Timer Progress Bar */}
      <div className="w-full bg-black/10 h-1">
        <div
          className={`h-full transition-all duration-75 ${style.progressBg}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
