import { ReactNode } from "react";
import "./EmptyStates.css";

// ─── Base empty state (M3 formula: illustration + headline + body + CTA) ─────

interface EmptyStateProps {
  illustration: ReactNode;
  heading: string;
  description: string;
  cta?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ illustration, heading, description, cta, className = "" }: EmptyStateProps) {
  return (
    <div className={`google-empty-state ${className}`}>
      <div className="google-empty-state__illustration">{illustration}</div>
      <h3 className="google-empty-state__heading">{heading}</h3>
      <p className="google-empty-state__description">{description}</p>
      {cta && (
        <button className="google-empty-state__cta" onClick={cta.onClick}>
          {cta.label}
          <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">arrow_forward</span>
        </button>
      )}
    </div>
  );
}

// ─── Illustrations ────────────────────────────────────────────────────────────

function BookmarkIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--float" aria-hidden="true">
      <rect x="28" y="20" width="64" height="80" rx="8" fill="#E8F0FE" stroke="#4285F4" strokeWidth="3"/>
      <path d="M44 20V68L60 56L76 68V20" fill="#4285F4" fillOpacity="0.15" stroke="#4285F4" strokeWidth="3" strokeLinejoin="round"/>
      <circle cx="60" cy="44" r="8" fill="#4285F4" fillOpacity="0.3"/>
      <line x1="44" y1="82" x2="76" y2="82" stroke="#4285F4" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4"/>
      <line x1="44" y1="90" x2="68" y2="90" stroke="#4285F4" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.4"/>
    </svg>
  );
}

function ClockIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--pulse" aria-hidden="true">
      <circle cx="60" cy="60" r="36" fill="#FEF7E0" stroke="#FBBC04" strokeWidth="3"/>
      <circle cx="60" cy="60" r="28" stroke="#FBBC04" strokeWidth="2" strokeOpacity="0.4"/>
      <line x1="60" y1="60" x2="60" y2="38" stroke="#FBBC04" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="60" y1="60" x2="78" y2="60" stroke="#FBBC04" strokeWidth="3.5" strokeLinecap="round"/>
      <circle cx="60" cy="60" r="4" fill="#FBBC04"/>
      <line x1="60" y1="26" x2="60" y2="30" stroke="#FBBC04" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="60" y1="90" x2="60" y2="94" stroke="#FBBC04" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="26" y1="60" x2="30" y2="60" stroke="#FBBC04" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="90" y1="60" x2="94" y2="60" stroke="#FBBC04" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--float" aria-hidden="true">
      <circle cx="50" cy="50" r="26" fill="#E8F0FE" stroke="#4285F4" strokeWidth="3"/>
      <line x1="69" y1="69" x2="90" y2="90" stroke="#4285F4" strokeWidth="4" strokeLinecap="round"/>
      <line x1="42" y1="50" x2="58" y2="50" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
      <line x1="42" y1="58" x2="54" y2="58" stroke="#4285F4" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5"/>
      <circle cx="50" cy="42" r="4" fill="#EA4335" fillOpacity="0.6"/>
    </svg>
  );
}

function TrophyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--float" aria-hidden="true">
      <path d="M38 28H82V62C82 76.36 72.36 86 58 86H62C47.64 86 38 76.36 38 62V28Z" fill="#FEF7E0" stroke="#FBBC04" strokeWidth="3"/>
      <path d="M38 36H28C28 36 24 52 38 56" stroke="#FBBC04" strokeWidth="3" strokeLinecap="round"/>
      <path d="M82 36H92C92 36 96 52 82 56" stroke="#FBBC04" strokeWidth="3" strokeLinecap="round"/>
      <line x1="60" y1="86" x2="60" y2="96" stroke="#FBBC04" strokeWidth="3" strokeLinecap="round"/>
      <line x1="46" y1="96" x2="74" y2="96" stroke="#FBBC04" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="60" cy="54" r="10" fill="#FBBC04" fillOpacity="0.3" stroke="#FBBC04" strokeWidth="2"/>
      <path d="M60 48L62 53H67L63 56L65 61L60 58L55 61L57 56L53 53H58L60 48Z" fill="#FBBC04"/>
    </svg>
  );
}

// ─── Preset empty states ──────────────────────────────────────────────────────

export function NoBookmarks({ onBrowseQuestions }: { onBrowseQuestions?: () => void }) {
  return (
    <EmptyState
      illustration={<BookmarkIllustration />}
      heading="Save questions for later"
      description="Bookmark any question to find it here."
      cta={onBrowseQuestions ? { label: "Browse Questions", onClick: onBrowseQuestions } : undefined}
    />
  );
}

export function NoActivity({ onStartLearning }: { onStartLearning?: () => void }) {
  return (
    <EmptyState
      illustration={<ClockIllustration />}
      heading="No activity yet"
      description="Start practicing to see your history."
      cta={onStartLearning ? { label: "Start Practicing", onClick: onStartLearning } : undefined}
    />
  );
}

export function NoSearchResults({ query, onBrowseTopics }: { query?: string; onBrowseTopics?: () => void }) {
  return (
    <EmptyState
      illustration={<SearchIllustration />}
      heading={query ? `No results for "${query}"` : "No results found"}
      description="Try different keywords or browse by topic."
      cta={onBrowseTopics ? { label: "Browse Topics", onClick: onBrowseTopics } : undefined}
    />
  );
}

export function NoBadgesEarned({ onStartPracticing }: { onStartPracticing?: () => void }) {
  return (
    <EmptyState
      illustration={<TrophyIllustration />}
      heading="Earn your first badge"
      description="Complete 5 questions to unlock your first achievement."
      cta={onStartPracticing ? { label: "Start Practicing", onClick: onStartPracticing } : undefined}
    />
  );
}

// ─── Legacy aliases (backwards compat) ───────────────────────────────────────

export function NoNotifications({ onUpdatePreferences }: { onUpdatePreferences?: () => void }) {
  return (
    <EmptyState
      illustration={<ClockIllustration />}
      heading="No notifications"
      description="You're all caught up! Update your preferences to stay informed."
      cta={onUpdatePreferences ? { label: "Notification settings", onClick: onUpdatePreferences } : undefined}
    />
  );
}

export function NoLearningPaths({ onExplorePaths }: { onExplorePaths?: () => void }) {
  return (
    <EmptyState
      illustration={<TrophyIllustration />}
      heading="No learning paths"
      description="Start a curated learning path to structure your interview preparation."
      cta={onExplorePaths ? { label: "Explore paths", onClick: onExplorePaths } : undefined}
    />
  );
}
