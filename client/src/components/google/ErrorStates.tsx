import { ReactNode, useState } from "react";
import "./ErrorStates.css";

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

export function ErrorFallback({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  showRetry = true,
}: ErrorFallbackProps) {
  return (
    <div className="error-fallback">
      <div className="error-fallback__icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="error-fallback__title">{title}</h2>
      <p className="error-fallback__message">{message}</p>
      {showRetry && onRetry && (
        <button className="error-fallback__retry" onClick={onRetry}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Try again
        </button>
      )}
    </div>
  );
}

interface InlineErrorProps {
  message: string;
  icon?: boolean;
  className?: string;
}

export function InlineError({ message, icon = true, className = "" }: InlineErrorProps) {
  return (
    <div className={`inline-error ${className}`}>
      {icon && (
        <svg className="inline-error__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      )}
      <span className="inline-error__message">{message}</span>
    </div>
  );
}

interface NetworkErrorProps {
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}

export function NetworkError({
  message = "Unable to connect. Please check your internet connection.",
  onRetry,
  onGoBack,
}: NetworkErrorProps) {
  return (
    <div className="network-error">
      <div className="network-error__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 1l22 22" />
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
      </div>
      <h3 className="network-error__title">No internet connection</h3>
      <p className="network-error__message">{message}</p>
      <div className="network-error__actions">
        {onRetry && (
          <button className="network-error__button network-error__button--primary" onClick={onRetry}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Try again
          </button>
        )}
        {onGoBack && (
          <button className="network-error__button network-error__button--secondary" onClick={onGoBack}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Go back
          </button>
        )}
      </div>
    </div>
  );
}

interface NotFound404Props {
  title?: string;
  message?: string;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  onGoHome?: () => void;
}

export function NotFound404({
  title = "Page not found",
  message = "The page you're looking for doesn't exist or has been moved.",
  searchQuery = "",
  onSearch,
  onGoHome,
}: NotFound404Props) {
  const [query, setQuery] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <div className="not-found-404">
      <div className="not-found-404__icon">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>
      <h1 className="not-found-404__title">{title}</h1>
      <p className="not-found-404__message">{message}</p>
      {onSearch && (
        <form className="not-found-404__search" onSubmit={handleSearch}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="not-found-404__search-input"
            placeholder="Search for something else"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      )}
      {onGoHome && (
        <button className="not-found-404__home" onClick={onGoHome}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Go to home page
        </button>
      )}
    </div>
  );
}

interface ErrorToastProps {
  message: string;
  onDismiss?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  isVisible?: boolean;
}

export function ErrorToast({ message, onDismiss, action, isVisible = true }: ErrorToastProps) {
  if (!isVisible) return null;

  return (
    <div className="error-toast">
      <div className="error-toast__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <span className="error-toast__message">{message}</span>
      {action && (
        <button className="error-toast__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      {onDismiss && (
        <button className="error-toast__dismiss" onClick={onDismiss}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
