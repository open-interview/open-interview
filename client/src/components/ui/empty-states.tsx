import { Bookmark, Activity, Trophy, Search, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyGeneric({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in-up", className)}>
      <div className="mb-4 p-4 rounded-full bg-[rgba(124,58,237,0.1)] text-[var(--color-accent-violet)] pulse-glow">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-xs">{description}</p>}
      {action && (
        <Button size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function EmptyBookmarks({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyGeneric
      icon={<Bookmark className="w-8 h-8" />}
      title="No bookmarks yet"
      description="Start saving questions you want to revisit!"
      action={onAction ? { label: "Browse questions", onClick: onAction } : undefined}
    />
  );
}

export function EmptyActivity({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyGeneric
      icon={<Activity className="w-8 h-8" />}
      title="No activity yet"
      description="Your learning history will appear here."
      action={onAction ? { label: "Start practicing", onClick: onAction } : undefined}
    />
  );
}

export function EmptyBadges({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyGeneric
      icon={<Trophy className="w-8 h-8" />}
      title="No badges yet"
      description="Complete challenges to earn badges!"
      action={onAction ? { label: "View challenges", onClick: onAction } : undefined}
    />
  );
}

export function EmptySearch({ query }: { query?: string }) {
  return (
    <EmptyGeneric
      icon={<Search className="w-8 h-8" />}
      title="No results found"
      description={query ? `No matches for "${query}". Try different keywords.` : "Try a different search term."}
    />
  );
}

export function EmptyHistory({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyGeneric
      icon={<Activity className="w-8 h-8" />}
      title="No history yet"
      description="Your learning history will appear here."
      action={onAction ? { label: "Start learning", onClick: onAction } : undefined}
    />
  );
}

export function EmptyPath({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyGeneric
      icon={<MapPin className="w-8 h-8" />}
      title="No learning path started"
      description="Start a learning path to track your progress."
      action={onAction ? { label: "Explore paths", onClick: onAction } : undefined}
    />
  );
}
