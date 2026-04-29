import {
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
  forwardRef,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./GoogleDialog.css";

interface GoogleDialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

interface GoogleDialogActionsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

const DialogContext = createContext<{ onClose: () => void } | null>(null);

export const GoogleDialog = forwardRef<HTMLDivElement, GoogleDialogProps>(
  ({ open, onClose, title, children, className = "", ...props }, ref) => {
    const [mounted, setMounted] = useState(false);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      setMounted(true);
    }, []);

    useEffect(() => {
      if (open) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && open) {
          onClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose]);

    if (!mounted || !open) return null;

    return createPortal(
      <DialogContext.Provider value={{ onClose }}>
        <div className="google-dialog-scrim" onClick={onClose}>
          <div
            ref={(node) => {
              dialogRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            className={`google-dialog ${className}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "google-dialog-title" : undefined}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {title && (
              <h2 id="google-dialog-title" className="google-dialog-title">
                {title}
              </h2>
            )}
            <div className="google-dialog-content">{children}</div>
          </div>
        </div>
      </DialogContext.Provider>,
      document.body
    );
  }
);

GoogleDialog.displayName = "GoogleDialog";

export const GoogleDialogActions = forwardRef<
  HTMLDivElement,
  GoogleDialogActionsProps
>(({ children, className = "" }, ref) => {
  const context = useContext(DialogContext);
  if (!context) throw new Error("GoogleDialogActions must be used within GoogleDialog");

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const buttonAction = e.currentTarget.getAttribute("data-dialog-action");
    if (buttonAction === "close") {
      context.onClose();
    }
  };

  return (
    <div ref={ref} className={`google-dialog-actions ${className}`} onClick={handleClick as any}>
      {children}
    </div>
  );
});

GoogleDialogActions.displayName = "GoogleDialogActions";