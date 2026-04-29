import { useState } from "react";
import "./ErrorStates.css";

// ─── M3 icon helper ───────────────────────────────────────────────────────────

function MIcon({ name, style }: { name: string; style?: React.CSSProperties }) {
  return <span className="material-symbols-rounded" style={style} aria-hidden="true">{name}</span>;
}

// ─── Friendly Illustrations ───────────────────────────────────────────────────

function NetworkErrorIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-illustration error-illustration--network" aria-hidden="true" role="img" aria-label="Network connection error">
      <rect width="120" height="120" rx="16" fill="var(--md-sys-color-error-container, #fce8e6)"/>
      {/* Cloud with no signal */}
      <ellipse cx="60" cy="38" rx="22" ry="14" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.15"/>
      <ellipse cx="48" cy="38" rx="18" ry="12" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.1"/>
      <ellipse cx="72" cy="38" rx="18" ry="12" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.1"/>
      {/* Signal lines crossed */}
      <path d="M35 75C35 75 45 60 60 60C75 60 85 75 85 75" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4"/>
      <path d="M40 82C40 82 48 72 60 72C72 72 80 82 80 82" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.6"/>
      <path d="M45 89C45 89 51 83 60 83C69 83 75 89 75 89" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" strokeLinecap="round"/>
      {/* X mark */}
      <line x1="42" y1="42" x2="78" y2="78" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="78" y1="42" x2="42" y2="78" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  );
}

function NotFoundIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-illustration error-illustration--notfound" aria-hidden="true" role="img" aria-label="Page not found">
      <rect width="120" height="120" rx="16" fill="var(--md-sys-color-tertiary-container, #e8f0fe)"/>
      {/* Friendly magnifying glass with question */}
      <circle cx="52" cy="52" r="24" stroke="var(--md-sys-color-tertiary, #4285f4)" strokeWidth="3.5" fill="var(--md-sys-color-tertiary, #4285f4)" fillOpacity="0.1"/>
      <line x1="72" y1="72" x2="88" y2="88" stroke="var(--md-sys-color-tertiary, #4285f4)" strokeWidth="4" strokeLinecap="round"/>
      <text x="52" y="60" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--md-sys-color-tertiary, #4285f4)" fontFamily="'Google Sans Display', sans-serif">?</text>
      {/* Small decorative elements */}
      <circle cx="35" cy="35" r="3" fill="var(--md-sys-color-tertiary, #4285f4)" fillOpacity="0.3"/>
      <circle cx="85" cy="40" r="2" fill="var(--md-sys-color-tertiary, #4285f4)" fillOpacity="0.4"/>
      <circle cx="90" cy="65" r="2.5" fill="var(--md-sys-color-tertiary, #4285f4)" fillOpacity="0.3"/>
    </svg>
  );
}

function PermissionDeniedIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-illustration error-illustration--permission" aria-hidden="true" role="img" aria-label="Permission denied">
      <rect width="120" height="120" rx="16" fill="var(--md-sys-color-error-container, #fce8e6)"/>
      {/* Shield with lock */}
      <path d="M60 30L85 45V65C85 80 60 90 60 90C60 90 35 80 35 65V45L60 30Z" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.1"/>
      {/* Lock body */}
      <rect x="50" y="55" width="20" height="16" rx="3" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" fill="white" fillOpacity="0.8"/>
      {/* Lock shackle */}
      <path d="M55 55V48C55 45 57 43 60 43C63 43 65 45 65 48V55" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* X mark */}
      <line x1="45" y1="45" x2="75" y2="75" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
      <line x1="75" y1="45" x2="45" y2="75" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
    </svg>
  );
}

function ServerErrorIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-illustration error-illustration--server" aria-hidden="true" role="img" aria-label="Server error">
      <rect width="120" height="120" rx="16" fill="var(--md-sys-color-error-container, #fce8e6)"/>
      {/* Server rack */}
      <rect x="35" y="25" width="50" height="20" rx="4" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.1"/>
      <rect x="35" y="50" width="50" height="20" rx="4" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.15"/>
      <rect x="35" y="75" width="50" height="20" rx="4" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="3" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.1"/>
      {/* Status lights - red on middle server */}
      <circle cx="42" cy="35" r="3" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.4"/>
      <circle cx="42" cy="60" r="3" fill="var(--md-sys-color-error, #b3261e)"/>
      <circle cx="42" cy="85" r="3" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.4"/>
      {/* 500 text */}
      <text x="72" y="65" textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--md-sys-color-error, #b3261e)" fontFamily="'Google Sans Display', sans-serif">500</text>
      {/* Wavy lines indicating problem */}
      <path d="M30 95Q35 90 40 95Q45 100 50 95Q55 90 60 95Q65 100 70 95Q75 90 80 95Q85 100 90 95" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  );
}

function ValidationErrorIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-illustration error-illustration--validation" aria-hidden="true" role="img" aria-label="Validation error">
      <rect width="120" height="120" rx="16" fill="var(--md-sys-color-error-container, #fce8e6)"/>
      {/* Form with error indicator */}
      <rect x="30" y="30" width="60" height="60" rx="6" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2.5" fill="white" fillOpacity="0.8"/>
      {/* Form lines */}
      <line x1="40" y1="45" x2="80" y2="45" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <line x1="40" y1="55" x2="70" y2="55" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      <line x1="40" y1="65" x2="75" y2="65" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2" strokeLinecap="round" opacity="0.3"/>
      {/* Error indicator on last line */}
      <circle cx="82" cy="65" r="8" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.15"/>
      <text x="82" y="69" textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--md-sys-color-error, #b3261e)">!</text>
      {/* Warning triangle */}
      <path d="M60 78L65 88H55Z" stroke="var(--md-sys-color-error, #b3261e)" strokeWidth="2" fill="var(--md-sys-color-error, #b3261e)" fillOpacity="0.2"/>
      <text x="60" y="86" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--md-sys-color-error, #b3261e)">!</text>
    </svg>
  );
}

function NoResultsIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="error-illustration error-illustration--noresults" aria-hidden="true" role="img" aria-label="No results found">
      <rect width="120" height="120" rx="16" fill="var(--md-sys-color-secondary-container, #e8f0fe)"/>
      {/* Empty folder with search */}
      <path d="M35 35H50L55 45H85V85H35V35Z" stroke="var(--md-sys-color-secondary, #4285f4)" strokeWidth="3" fill="var(--md-sys-color-secondary, #4285f4)" fillOpacity="0.1"/>
      {/* Search glass inside folder */}
      <circle cx="55" cy="60" r="12" stroke="var(--md-sys-color-secondary, #4285f4)" strokeWidth="2.5" fill="none"/>
      <line x1="65" y1="70" x2="72" y2="77" stroke="var(--md-sys-color-secondary, #4285f4)" strokeWidth="3" strokeLinecap="round"/>
      {/* Empty indicator */}
      <path d="M48 68L62 68" stroke="var(--md-sys-color-secondary, #4285f4)" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      {/* Decorative dots */}
      <circle cx="40" cy="50" r="2" fill="var(--md-sys-color-secondary, #4285f4)" fillOpacity="0.3"/>
      <circle cx="80" cy="50" r="2" fill="var(--md-sys-color-secondary, #4285f4)" fillOpacity="0.3"/>
    </svg>
  );
}

// ─── Base Error Container (M3) ──────────────────────────────────────────────

interface ErrorStateBaseProps {
  illustration: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

function ErrorStateBase({ illustration, title, description, children, className = "" }: ErrorStateBaseProps) {
  return (
    <div className={`google-error-state ${className}`} role="alert">
      <div className="google-error-state__illustration">{illustration}</div>
      <h2 className="google-error-state__title">{title}</h2>
      <p className="google-error-state__description">{description}</p>
      {children && <div className="google-error-state__actions">{children}</div>}
    </div>
  );
}

// ─── ErrorFallback (M3 compliant) ───────────────────────────────────────────

interface ErrorFallbackProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
  errorCode?: string;
}

export function ErrorFallback({
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  showRetry = true,
  errorCode,
}: ErrorFallbackProps) {
  return (
    <ErrorStateBase
      illustration={<ServerErrorIllustration />}
      title={title}
      description={`${message}${errorCode ? ` (Error code: ${errorCode})` : ''}`}
    >
      {showRetry && onRetry && (
        <button className="google-error-button google-error-button--primary" onClick={onRetry}>
          <MIcon name="refresh" style={{ fontSize: 18 }} />
          Try again
        </button>
      )}
    </ErrorStateBase>
  );
}

// ─── InlineError (M3 compliant) ─────────────────────────────────────────────

export function InlineError({ message, icon = true, className = "" }: { message: string; icon?: boolean; className?: string }) {
  return (
    <div className={`google-inline-error ${className}`} role="alert">
      {icon && <MIcon name="error" style={{ fontSize: 16, color: 'var(--md-sys-color-error, #b3261e)', flexShrink: 0 }} />}
      <span className="google-inline-error__message">{message}</span>
    </div>
  );
}

// ─── NetworkError (M3 compliant with recovery) ───────────────────────────────

export function NetworkError({
  title = "No internet connection",
  message = "We can't connect to our servers right now.",
  onRetry,
  onGoBack,
  onCheckConnection,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onCheckConnection?: () => void;
}) {
  return (
    <ErrorStateBase
      illustration={<NetworkErrorIllustration />}
      title={title}
      description={`${message} Check your connection and try again.`}
    >
      {onRetry && (
        <button className="google-error-button google-error-button--primary" onClick={onRetry}>
          <MIcon name="refresh" style={{ fontSize: 18 }} />
          Retry
        </button>
      )}
      <div className="google-error-state__secondary-actions">
        {onCheckConnection && (
          <button className="google-error-button google-error-button--text" onClick={onCheckConnection}>
            <MIcon name="network_check" style={{ fontSize: 18 }} />
            Check connection
          </button>
        )}
        {onGoBack && (
          <button className="google-error-button google-error-button--text" onClick={onGoBack}>
            <MIcon name="arrow_back" style={{ fontSize: 18 }} />
            Go back
          </button>
        )}
      </div>
    </ErrorStateBase>
  );
}

// ─── NotFound404 (M3 compliant with recovery) ──────────────────────────────

export function NotFound404({
  title = "Page not found",
  message = "The page you're looking for doesn't exist or has been moved.",
  onGoHome,
  onGoBack,
  onSearch,
  searchQuery,
}: {
  title?: string;
  message?: string;
  onGoHome?: () => void;
  onGoBack?: () => void;
  onSearch?: (q: string) => void;
  searchQuery?: string;
}) {
  return (
    <ErrorStateBase
      illustration={<NotFoundIllustration />}
      title={title}
      description={message}
    >
      <div className="google-error-state__secondary-actions">
        {onGoBack && (
          <button className="google-error-button google-error-button--text" onClick={onGoBack}>
            <MIcon name="arrow_back" style={{ fontSize: 18 }} />
            Go back
          </button>
        )}
        {onGoHome && (
          <button className="google-error-button google-error-button--primary" onClick={onGoHome}>
            <MIcon name="home" style={{ fontSize: 18 }} />
            Go to home page
          </button>
        )}
      </div>
      {onSearch && (
        <div className="google-error-search">
          <span className="material-symbols-rounded" style={{ fontSize: 20, color: 'var(--md-sys-color-on-surface-variant, #5f6368)' }}>search</span>
          <input
            type="text"
            placeholder="Search for content..."
            defaultValue={searchQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onSearch) {
                onSearch((e.target as HTMLInputElement).value);
              }
            }}
            className="google-error-search__input"
          />
        </div>
      )}
    </ErrorStateBase>
  );
}

// ─── PermissionDenied (NEW - M3 compliant) ──────────────────────────────────

export function PermissionDenied({
  title = "Access denied",
  message = "You don't have permission to access this feature.",
  permissionType = "microphone",
  onOpenSettings,
  onGoBack,
  onRequestAgain,
}: {
  title?: string;
  message?: string;
  permissionType?: "microphone" | "camera" | "location" | "notifications" | "storage";
  onOpenSettings?: () => void;
  onGoBack?: () => void;
  onRequestAgain?: () => void;
}) {
  const permissionLabels = {
    microphone: "microphone access",
    camera: "camera access",
    location: "location access",
    notifications: "notification permissions",
    storage: "storage access",
  };

  return (
    <ErrorStateBase
      illustration={<PermissionDeniedIllustration />}
      title={title}
      description={`${message} Please enable ${permissionLabels[permissionType]} in your browser settings to continue.`}
    >
      {onRequestAgain && (
        <button className="google-error-button google-error-button--primary" onClick={onRequestAgain}>
          <MIcon name="security" style={{ fontSize: 18 }} />
          Request permission
        </button>
      )}
      <div className="google-error-state__secondary-actions">
        {onOpenSettings && (
          <button className="google-error-button google-error-button--text" onClick={onOpenSettings}>
            <MIcon name="settings" style={{ fontSize: 18 }} />
            Open settings
          </button>
        )}
        {onGoBack && (
          <button className="google-error-button google-error-button--text" onClick={onGoBack}>
            <MIcon name="arrow_back" style={{ fontSize: 18 }} />
            Go back
          </button>
        )}
      </div>
    </ErrorStateBase>
  );
}

// ─── ServerError (NEW - M3 compliant with status page) ───────────────────────

export function ServerError({
  title = "Server error",
  message = "Our servers are having trouble right now.",
  statusCode = 500,
  onRetry,
  onCheckStatus,
  onGoHome,
}: {
  title?: string;
  message?: string;
  statusCode?: number;
  onRetry?: () => void;
  onCheckStatus?: () => void;
  onGoHome?: () => void;
}) {
  return (
    <ErrorStateBase
      illustration={<ServerErrorIllustration />}
      title={title}
      description={`${message} This is a temporary issue (Error ${statusCode}).`}
    >
      {onRetry && (
        <button className="google-error-button google-error-button--primary" onClick={onRetry}>
          <MIcon name="refresh" style={{ fontSize: 18 }} />
          Try again
        </button>
      )}
      <div className="google-error-state__secondary-actions">
        {onCheckStatus && (
          <button className="google-error-button google-error-button--text" onClick={onCheckStatus}>
            <MIcon name="info" style={{ fontSize: 18 }} />
            Check status page
          </button>
        )}
        {onGoHome && (
          <button className="google-error-button google-error-button--text" onClick={onGoHome}>
            <MIcon name="home" style={{ fontSize: 18 }} />
            Go to home page
          </button>
        )}
      </div>
    </ErrorStateBase>
  );
}

// ─── ValidationError (NEW - M3 compliant with specific actions) ──────────────

export function ValidationError({
  title = "Please check your input",
  errors,
  onFix,
  onDismiss,
}: {
  title?: string;
  errors: string[];
  onFix?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="google-validation-error" role="alert">
      <div className="google-validation-error__header">
        <MIcon name="error" style={{ fontSize: 20, color: 'var(--md-sys-color-error, #b3261e)' }} />
        <span className="google-validation-error__title">{title}</span>
        {onDismiss && (
          <button className="google-validation-error__dismiss" onClick={onDismiss} aria-label="Dismiss">
            <MIcon name="close" style={{ fontSize: 16 }} />
          </button>
        )}
      </div>
      <ul className="google-validation-error__list">
        {errors.map((error, index) => (
          <li key={index} className="google-validation-error__item">
            <MIcon name="circle" style={{ fontSize: 8, color: 'var(--md-sys-color-error, #b3261e)', opacity: 0.6 }} />
            {error}
          </li>
        ))}
      </ul>
      {onFix && (
        <button className="google-error-button google-error-button--text google-error-button--small" onClick={onFix}>
          <MIcon name="auto_fix" style={{ fontSize: 16 }} />
          Fix issues
        </button>
      )}
    </div>
  );
}

// ─── NoResults (M3 compliant with alternative suggestions) ───────────────────

export function NoResults({
  title = "No results found",
  message = "We couldn't find what you're looking for.",
  query,
  onClearSearch,
  onBrowseAll,
  suggestions,
}: {
  title?: string;
  message?: string;
  query?: string;
  onClearSearch?: () => void;
  onBrowseAll?: () => void;
  suggestions?: string[];
}) {
  return (
    <ErrorStateBase
      illustration={<NoResultsIllustration />}
      title={query ? `No results for "${query}"` : title}
      description={message}
    >
      {suggestions && suggestions.length > 0 && (
        <div className="google-error-suggestions">
          <p className="google-error-suggestions__label">Try these instead:</p>
          <div className="google-error-suggestions__chips">
            {suggestions.map((suggestion, index) => (
              <button key={index} className="google-error-chip">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="google-error-state__secondary-actions">
        {onClearSearch && (
          <button className="google-error-button google-error-button--text" onClick={onClearSearch}>
            <MIcon name="clear" style={{ fontSize: 18 }} />
            Clear search
          </button>
        )}
        {onBrowseAll && (
          <button className="google-error-button google-error-button--text" onClick={onBrowseAll}>
            <MIcon name="grid_view" style={{ fontSize: 18 }} />
            Browse all
          </button>
        )}
      </div>
    </ErrorStateBase>
  );
}

// ─── ErrorToast (M3 compliant) ───────────────────────────────────────────────

export function ErrorToast({
  message,
  onDismiss,
  action,
  isVisible = true,
}: {
  message: string;
  onDismiss?: () => void;
  action?: { label: string; onClick: () => void };
  isVisible?: boolean;
}) {
  if (!isVisible) return null;
  return (
    <div className="google-error-toast" role="alert">
      <MIcon name="error" style={{ fontSize: 20, color: 'var(--md-sys-color-on-error, #ffffff)', flexShrink: 0 }} />
      <span className="google-error-toast__message">{message}</span>
      {action && (
        <button className="google-error-toast__action" onClick={action.onClick}>{action.label}</button>
      )}
      {onDismiss && (
        <button className="google-error-toast__dismiss" onClick={onDismiss} aria-label="Dismiss">
          <MIcon name="close" style={{ fontSize: 16 }} />
        </button>
      )}
    </div>
  );
}
