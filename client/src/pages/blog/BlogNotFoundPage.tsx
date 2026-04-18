import { BlogLayout } from "@/components/blog/BlogLayout";
import { Link } from "wouter";
import { Home, BookOpen, Search } from "lucide-react";

export default function BlogNotFoundPage() {
  return (
    <BlogLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="text-6xl font-bold text-[var(--color-accent)]">404</p>
        <h1 className="mt-4 text-2xl font-bold text-[var(--color-ink)]">Page not found</h1>
        <p className="mt-3 text-[var(--color-ink-muted)]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <Home size={16} strokeWidth={1.5} /> Home
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <BookOpen size={16} strokeWidth={1.5} /> Blog
          </Link>
          <Link
            href="/blog/search"
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
          >
            <Search size={16} strokeWidth={1.5} /> Search
          </Link>
        </div>
      </div>
    </BlogLayout>
  );
}
