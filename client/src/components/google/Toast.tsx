import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  HTMLAttributes,
  forwardRef,
  ReactNode,
} from "react";
import "./Toast.css";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const generateId = () => Math.random().toString(36).substring(2, 9);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, "id">) => {
    const id = generateId();
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const icons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "ℹ",
};

interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  toast: ToastData;
  onDismiss: () => void;
}

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  ({ toast, onDismiss, className = "", ...props }, ref) => {
    // M3 Snackbar: 4000ms auto-dismiss, optional 1 action, no action = 4000ms
    const { type, message, action, duration = 4000 } = toast;

    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          onDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, onDismiss]);

    // Use role="alert" for errors, role="status" for others (polite announcement)
    const ariaRole = type === 'error' ? 'alert' : 'status';

    return (
      <div
        ref={ref}
        className={`google-snackbar google-snackbar--${type} ${className}`}
        role={ariaRole}
        aria-live={type === 'error' ? 'assertive' : 'polite'}
        aria-atomic="true"
        {...props}
      >
        <span className="google-snackbar__message">{message}</span>
        {action && (
          <button
            className={`google-snackbar__action google-snackbar__action--${type}`}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
        <button
          className="google-snackbar__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    );
  }
);

Snackbar.displayName = "Snackbar";

interface ToastContainerProps {
  position?: "bottom-left" | "bottom-right" | "bottom-center";
}

export const ToastContainer = ({ position = "bottom-left" }: ToastContainerProps) => {
  const { toasts, removeToast } = useToast();

  return (
    <div className={`google-toast-container google-toast-container--${position}`}>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="google-toast-wrapper"
          style={{ "--toast-index": index } as React.CSSProperties}
        >
          <Toast toast={toast} onDismiss={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
};

ToastContainer.displayName = "ToastContainer";