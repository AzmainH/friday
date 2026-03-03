import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

/* ── Types ── */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

export interface ToastFn {
  (message: string, type?: ToastType, action?: ToastAction): string;
}

interface ToastContextValue {
  toast: ToastFn;
}

/* ── Context ── */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ── Hook ── */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>');
  }
  return ctx;
}

/* ── Icon map ── */

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

/* ── Single Toast ── */

interface ToastItemProps {
  data: ToastData;
  onDismiss: (id: string) => void;
}

function ToastItem({ data, onDismiss }: ToastItemProps) {
  const Icon = iconMap[data.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-80',
        'bg-white dark:bg-surface-100',
        'rounded-[--radius-md] shadow-lg',
        'border border-surface-200 dark:border-surface-200',
        'px-4 py-3',
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', iconColorMap[data.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{data.message}</p>
        {data.action && (
          <button
            type="button"
            onClick={data.action.onClick}
            className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            {data.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(data.id)}
        className="shrink-0 text-text-tertiary hover:text-text-secondary transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/* ── Provider ── */

const AUTO_DISMISS_MS = 5000;

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast: ToastFn = useCallback(
    (message, type = 'info', action?) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const entry: ToastData = { id, message, type, action };

      setToasts((prev) => [...prev, entry]);

      const timer = setTimeout(() => {
        dismiss(id);
      }, AUTO_DISMISS_MS);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[--z-toast] flex flex-col-reverse gap-2 pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} data={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
