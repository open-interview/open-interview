import { Twitter, Github, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-6 h-6 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] text-xs font-bold shrink-0">
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

  const socialLinks = [
    author.twitterHandle && {
      href: `https://twitter.com/${author.twitterHandle}`,
      label: `${author.name} on Twitter`,
      icon: <Twitter size={14} strokeWidth={1.5} />,
      text: `@${author.twitterHandle}`,
    },
    author.githubHandle && {
      href: `https://github.com/${author.githubHandle}`,
      label: `${author.name} on GitHub`,
      icon: <Github size={14} strokeWidth={1.5} />,
      text: author.githubHandle,
    },
    author.linkedinHandle && {
      href: `https://linkedin.com/in/${author.linkedinHandle}`,
      label: `${author.name} on LinkedIn`,
      icon: <Linkedin size={14} strokeWidth={1.5} />,
      text: author.linkedinHandle,
    },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; text: string }[];

  return (
    <div className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6", className)}>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold text-xl shrink-0 overflow-hidden ring-2 ring-[var(--color-accent)]/20">
          {author.avatarUrl ? (
            <img src={author.avatarUrl} alt={author.name} className="w-full h-full object-cover" loading="lazy" decoding="async" width={64} height={64} />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-ink)]">{author.name}</p>
          {author.bio && (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)] leading-relaxed">{author.bio}</p>
          )}
          {socialLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {socialLinks.map(({ href, label, icon, text }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors"
                  aria-label={label}
                >
                  {icon} {text}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
