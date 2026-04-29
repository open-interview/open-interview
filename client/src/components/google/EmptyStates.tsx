import { ArrowRight } from "lucide-react";
import "./EmptyStates.css";

interface EmptyStateProps {
  illustration: ReactNode;
  heading: string;
  description: string;
  cta?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  illustration,
  heading,
  description,
  cta,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`google-empty-state ${className}`}>
      <div className="google-empty-state__illustration">{illustration}</div>
      <h3 className="google-empty-state__heading">{heading}</h3>
      <p className="google-empty-state__description">{description}</p>
      {cta && (
        <button className="google-empty-state__cta" onClick={cta.onClick}>
          {cta.label}
          <ArrowRight size={16} />
        </button>
      )}
    </div>
  );
}

interface NoBookmarksProps {
  onBrowseQuestions?: () => void;
}

function MagnifyingGlassIcon() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--float">
      <circle cx="60" cy="60" r="35" stroke="#4285F4" strokeWidth="6" fill="none" opacity="0.2"/>
      <circle cx="60" cy="60" r="35" stroke="#4285F4" strokeWidth="6" fill="none" opacity="0.6"/>
      <line x1="85" y1="85" x2="110" y2="110" stroke="#4285F4" strokeWidth="6" strokeLinecap="round" opacity="0.6"/>
      <text x="60" y="68" textAnchor="middle" fontSize="28" fontWeight="bold" fill="#4285F4" opacity="0.8">?</text>
    </svg>
  );
}

export function NoBookmarks({ onBrowseQuestions }: NoBookmarksProps) {
  return (
    <EmptyState
      illustration={<MagnifyingGlassIcon />}
      heading="No bookmarks yet"
      description="Save questions you want to review later. Your bookmarked questions will appear here."
      cta={
        onBrowseQuestions
          ? { label: "Browse questions", onClick: onBrowseQuestions }
          : undefined
      }
    />
  );
}

interface NoNotificationsProps {
  onUpdatePreferences?: () => void;
}

function BellIcon() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--pulse">
      <path d="M70 30C55 30 43 42 43 57V75L35 90H105L97 75V57C97 42 85 30 70 30Z" stroke="#EA4335" strokeWidth="6" fill="none" opacity="0.2"/>
      <path d="M70 30C55 30 43 42 43 57V75L35 90H105L97 75V57C97 42 85 30 70 30Z" stroke="#EA4335" strokeWidth="6" fill="none" opacity="0.6"/>
      <line x1="70" y1="90" x2="70" y2="105" stroke="#EA4335" strokeWidth="6" strokeLinecap="round" opacity="0.6"/>
      <line x1="55" y1="105" x2="85" y2="105" stroke="#EA4335" strokeWidth="6" strokeLinecap="round" opacity="0.6"/>
      <circle cx="85" cy="45" r="6" fill="#FBBC04" opacity="0.8"/>
      <circle cx="55" cy="50" r="4" fill="#34A853" opacity="0.8"/>
      <circle cx="80" cy="65" r="3" fill="#4285F4" opacity="0.8"/>
    </svg>
  );
}

export function NoNotifications({ onUpdatePreferences }: NoNotificationsProps) {
  return (
    <EmptyState
      illustration={<BellIcon />}
      heading="No notifications"
      description="You're all caught up! Update your notification preferences to stay informed."
      cta={
        onUpdatePreferences
          ? { label: "Notification settings", onClick: onUpdatePreferences }
          : undefined
      }
    />
  );
}

interface NoSearchResultsProps {
  onClearSearch?: () => void;
}

function SearchIllustration() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--float">
      <rect x="30" y="40" width="80" height="60" rx="8" stroke="#4285F4" strokeWidth="6" fill="none" opacity="0.2"/>
      <rect x="30" y="40" width="80" height="60" rx="8" stroke="#4285F4" strokeWidth="6" fill="none" opacity="0.6"/>
      <circle cx="55" cy="70" r="5" fill="#EA4335" opacity="0.8"/>
      <circle cx="70" cy="70" r="5" fill="#FBBC04" opacity="0.8"/>
      <circle cx="85" cy="70" r="5" fill="#34A853" opacity="0.8"/>
      <line x1="45" y1="55" x2="95" y2="55" stroke="#4285F4" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <line x1="45" y1="85" x2="75" y2="85" stroke="#4285F4" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
      <circle cx="105" cy="50" r="12" stroke="#4285F4" strokeWidth="4" fill="none" opacity="0.3"/>
      <line x1="113" y1="58" x2="120" y2="65" stroke="#4285F4" strokeWidth="4" strokeLinecap="round" opacity="0.6"/>
    </svg>
  );
}

export function NoSearchResults({ onClearSearch }: NoSearchResultsProps) {
  return (
    <EmptyState
      illustration={<SearchIllustration />}
      heading="No results found"
      description="Try adjusting your search terms or filters to find what you're looking for."
      cta={
        onClearSearch
          ? { label: "Clear filters", onClick: onClearSearch }
          : undefined
      }
    />
  );
}

interface NoLearningPathsProps {
  onExplorePaths?: () => void;
}

function LearningPathIcon() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--float">
      <circle cx="35" cy="40" r="12" stroke="#4285F4" strokeWidth="6" fill="none" opacity="0.2"/>
      <circle cx="35" cy="40" r="12" stroke="#4285F4" strokeWidth="6" fill="none" opacity="0.6"/>
      <circle cx="35" cy="40" r="6" fill="#4285F4" opacity="0.8"/>
      <circle cx="105" cy="40" r="12" stroke="#EA4335" strokeWidth="6" fill="none" opacity="0.2"/>
      <circle cx="105" cy="40" r="12" stroke="#EA4335" strokeWidth="6" fill="none" opacity="0.6"/>
      <circle cx="105" cy="40" r="6" fill="#EA4335" opacity="0.8"/>
      <circle cx="70" cy="100" r="12" stroke="#34A853" strokeWidth="6" fill="none" opacity="0.2"/>
      <circle cx="70" cy="100" r="12" stroke="#34A853" strokeWidth="6" fill="none" opacity="0.6"/>
      <circle cx="70" cy="100" r="6" fill="#34A853" opacity="0.8"/>
      <path d="M47 40L93 40" stroke="#FBBC04" strokeWidth="4" strokeDasharray="8 4" opacity="0.6"/>
      <path d="M70 52L70 88" stroke="#FBBC04" strokeWidth="4" strokeDasharray="8 4" opacity="0.6"/>
      <path d="M82 88L93 40" stroke="#FBBC04" strokeWidth="4" strokeDasharray="8 4" opacity="0.3"/>
      <path d="M58 88L47 40" stroke="#FBBC04" strokeWidth="4" strokeDasharray="8 4" opacity="0.3"/>
    </svg>
  );
}

export function NoLearningPaths({ onExplorePaths }: NoLearningPathsProps) {
  return (
    <EmptyState
      illustration={<LearningPathIcon />}
      heading="No learning paths"
      description="Start a curated learning path to structure your interview preparation."
      cta={
        onExplorePaths
          ? { label: "Explore paths", onClick: onExplorePaths }
          : undefined
      }
    />
  );
}

interface NoActivityProps {
  onStartLearning?: () => void;
}

function ClockIcon() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--pulse">
      <rect x="35" y="30" width="70" height="80" rx="8" stroke="#FBBC04" strokeWidth="6" fill="none" opacity="0.2"/>
      <rect x="35" y="30" width="70" height="80" rx="8" stroke="#FBBC04" strokeWidth="6" fill="none" opacity="0.6"/>
      <line x1="35" y1="50" x2="105" y2="50" stroke="#FBBC04" strokeWidth="3" opacity="0.4"/>
      <circle cx="70" cy="75" r="20" stroke="#FBBC04" strokeWidth="4" fill="none" opacity="0.6"/>
      <line x1="70" y1="75" x2="70" y2="60" stroke="#FBBC04" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
      <line x1="70" y1="75" x2="82" y2="75" stroke="#FBBC04" strokeWidth="4" strokeLinecap="round" opacity="0.8"/>
      <circle cx="70" cy="75" r="3" fill="#FBBC04" opacity="0.8"/>
      <rect x="60" y="30" width="20" height="8" rx="2" fill="#FBBC04" opacity="0.6"/>
    </svg>
  );
}

export function NoActivity({ onStartLearning }: NoActivityProps) {
  return (
    <EmptyState
      illustration={<ClockIcon />}
      heading="No recent activity"
      description="Start practicing questions to see your activity history here."
      cta={
        onStartLearning
          ? { label: "Get started", onClick: onStartLearning }
          : undefined
      }
    />
  );
}

interface NoBadgesEarnedProps {
  onViewChallenges?: () => void;
}

function ShieldIcon() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-illustration google-illustration--float">
      <path d="M70 25L105 45V70C105 90 90 105 70 115C50 105 35 90 35 70V45L70 25Z" stroke="#34A853" strokeWidth="6" fill="none" opacity="0.2"/>
      <path d="M70 25L105 45V70C105 90 90 105 70 115C50 105 35 90 35 70V45L70 25Z" stroke="#34A853" strokeWidth="6" fill="none" opacity="0.6"/>
      <circle cx="70" cy="65" r="20" stroke="#34A853" strokeWidth="4" fill="none" opacity="0.4"/>
      <path d="M63 65L68 70L77 58" stroke="#34A853" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"/>
      <circle cx="70" cy="65" r="3" fill="#FBBC04" opacity="0.8"/>
      <path d="M55 45L60 35L65 45" stroke="#EA4335" strokeWidth="3" fill="none" opacity="0.6"/>
      <path d="M75 45L80 35L85 45" stroke="#EA4335" strokeWidth="3" fill="none" opacity="0.6"/>
      <path d="M95 45L100 35L105 45" stroke="#EA4335" strokeWidth="3" fill="none" opacity="0.6"/>
    </svg>
  );
}

export function NoBadgesEarned({ onViewChallenges }: NoBadgesEarnedProps) {
  return (
    <EmptyState
      illustration={<ShieldIcon />}
      heading="No badges earned"
      description="Complete challenges and reach milestones to earn badges and showcase your achievements."
      cta={
        onViewChallenges
          ? { label: "View challenges", onClick: onViewChallenges }
          : undefined
      }
    />
  );
}