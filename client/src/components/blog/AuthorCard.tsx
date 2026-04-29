import { Link } from "wouter";
import { Twitter, Github, Linkedin, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Author {
  name: string;
  bio?: string;
  avatarUrl?: string;
  twitterHandle?: string;
}

interface AuthorCardProps {
  author: Author;
  variant?: "compact" | "full";
  className?: string;
}

export function AuthorCard({ author, variant = "full", className }: AuthorCardProps) {
  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="min-w-[48px] w-8 min-h-[48px] h-8 rounded-full bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 flex items-center justify-center text-[var(--color-accent)] font-bold text-xs shrink-0">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-[var(--color-ink)]">{author.name}</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6", className)}>
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/20 to-[var(--color-accent)]/5 flex items-center justify-center text-[var(--color-accent)] font-bold text-2xl shrink-0 overflow-hidden shadow-sm">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" loading="lazy" decoding="async" width={64} height={64} />
          ) : (
            <User size={28} strokeWidth={1.5} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg text-[var(--color-ink)]">{author.name}</p>
          {author.bio && (
            <p className="mt-1.5 text-sm text-[var(--color-ink-muted)] leading-relaxed">{author.bio}</p>
          )}
          {author.twitterHandle && (
            <div className="mt-4 flex gap-4">
              <a
                href={`https://twitter.com/${author.twitterHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors"
                aria-label={`${author.name} on Twitter`}
              >
                <Twitter size={14} strokeWidth={1.5} /> @{author.twitterHandle}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
