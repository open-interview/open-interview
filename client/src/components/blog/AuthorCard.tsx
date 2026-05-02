import { Twitter, Github, Linkedin, Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageWithFallback } from "./ImageWithFallback";

interface Author {
  name: string;
  bio?: string;
  avatarUrl?: string;
  twitterHandle?: string;
  githubHandle?: string;
  linkedinHandle?: string;
}

interface AuthorCardProps {
  author: Author;
  variant?: "compact" | "full";
  publishedAt?: string;
  readingTime?: number;
  className?: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function deriveHandle(name: string, separator: string = ""): string {
  return name.toLowerCase().replace(/\s+/g, separator);
}

export function AuthorCard({ author, variant = "full", publishedAt, readingTime, className }: AuthorCardProps) {
  const initials = author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] text-xs font-bold shrink-0">
          {author.avatarUrl ? (
            <ImageWithFallback
              src={author.avatarUrl}
              alt={author.name}
              className="w-full h-full rounded-full object-cover"
              fallback={<span>{initials}</span>}
            />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-[var(--color-ink)]">{author.name}</span>
      </div>
    );
  }

  const defaultBio = "Software engineer and technical writer sharing insights on engineering, cloud, and career growth.";

  const twitterHandle = author.twitterHandle ?? deriveHandle(author.name);
  const linkedinHandle = author.linkedinHandle ?? deriveHandle(author.name, "-");

  const socialLinks = [
    { href: `https://twitter.com/${twitterHandle}`, label: `${author.name} on Twitter`, icon: <Twitter size={16} strokeWidth={1.5} />, text: `@${twitterHandle}` },
    author.githubHandle && { href: `https://github.com/${author.githubHandle}`, label: `${author.name} on GitHub`, icon: <Github size={14} strokeWidth={1.5} />, text: author.githubHandle },
    { href: `https://linkedin.com/in/${linkedinHandle}`, label: `${author.name} on LinkedIn`, icon: <Linkedin size={16} strokeWidth={1.5} />, text: linkedinHandle },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; text: string }[];

  return (
    <div className={cn("rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 sm:p-8", className)}>
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold text-xl shrink-0 ring-2 ring-[var(--color-accent)]/20 overflow-hidden">
          {author.avatarUrl ? (
            <ImageWithFallback
              src={author.avatarUrl}
              alt={author.name}
              className="w-full h-full object-cover"
              fallback={<span>{initials}</span>}
            />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-ink)] text-lg">{author.name}</p>
          <p className="mt-1.5 text-sm text-[var(--color-ink-muted)] leading-relaxed">
            {author.bio ?? defaultBio}
          </p>
          {socialLinks.length > 0 && (
            <div className="mt-3 flex gap-3">
              {socialLinks.map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors"
                  aria-label={label}
                >
                  {icon}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      {(publishedAt || readingTime) && (
        <div className="mt-5 pt-5 border-t border-[var(--color-border)] flex flex-wrap items-center gap-4 text-sm">
          {publishedAt && (
            <span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
              <Calendar size={14} strokeWidth={1.5} aria-hidden="true" />
              {formatDate(publishedAt)}
            </span>
          )}
          {readingTime && (
            <span className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full px-3 py-1">
              <Clock size={13} strokeWidth={1.5} aria-hidden="true" />
              {readingTime} min read
            </span>
          )}
        </div>
      )}
    </div>
  );
}
