import { Link } from "wouter";
import { Clock, Calendar, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PostCardData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  featured?: boolean;
}

interface PostCardProps {
  post: PostCardData;
  variant?: "featured" | "grid" | "list";
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PostCard({ post, variant = "grid" }: PostCardProps) {
  if (variant === "featured") {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:shadow-lg hover:border-[var(--color-accent)]/20 transition-all duration-200">
          <div className="aspect-video md:aspect-auto bg-[var(--color-border)] overflow-hidden relative">
            {post.coverImage ? (
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                loading="eager"
                decoding="async"
                width={600}
                height={338}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-ink-muted)] text-sm">
                {post.category}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <ArrowUpRight size={24} strokeWidth={1.5} className="absolute bottom-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0" />
          </div>
          <div className="p-6 flex flex-col justify-center">
            <CategoryBadge category={post.category} />
            <h2 className="mt-3 text-2xl font-bold text-[var(--color-ink)] leading-tight group-hover:text-[var(--color-accent)] transition-colors">
              {post.title}
            </h2>
            <p className="mt-2 text-[var(--color-ink-muted)] text-sm leading-relaxed line-clamp-3">
              {post.excerpt}
            </p>
            <PostMeta post={post} className="mt-4" />
          </div>
        </article>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="flex gap-4 py-5 border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-raised)] -mx-4 px-4 rounded-lg transition-colors">
          <div className="flex-1 min-w-0 py-1">
            <CategoryBadge category={post.category} />
            <h3 className="mt-1.5 font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2 text-lg">
              {post.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-ink-muted)] line-clamp-2">
              {post.excerpt}
            </p>
            <PostMeta post={post} className="mt-2" />
          </div>
          {post.coverImage && (
            <div className="w-24 h-20 shrink-0 rounded-lg overflow-hidden bg-[var(--color-border)]">
              <img
                src={post.coverImage}
                alt=""
                className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-200"
                loading="lazy"
                decoding="async"
                width={96}
                height={80}
              />
            </div>
          )}
        </article>
      </Link>
    );
  }

  // grid (default)
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden hover:shadow-md hover:border-[var(--color-accent)]/20 transition-all duration-200 h-full flex flex-col">
        <div className="aspect-video bg-[var(--color-border)] overflow-hidden relative">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
              loading="lazy"
              decoding="async"
              width={400}
              height={225}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-ink-muted)] text-xs">
              {post.category}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <CategoryBadge category={post.category} />
          <h3 className="mt-2 font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors leading-snug line-clamp-2 text-lg">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed line-clamp-3 flex-1">
            {post.excerpt}
          </p>
          <PostMeta post={post} className="mt-4" />
        </div>
      </article>
    </Link>
  );
}

function PostMeta({ post, className }: { post: PostCardData; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 text-xs text-[var(--color-ink-muted)]", className)}>
      <span className="font-medium text-[var(--color-ink)]">{post.author}</span>
      <span className="flex items-center gap-1">
        <Calendar size={12} strokeWidth={1.5} aria-hidden />
        {formatDate(post.publishedAt)}
      </span>
      <span className="flex items-center gap-1">
        <Clock size={12} strokeWidth={1.5} aria-hidden />
        {post.readingTimeMinutes} min
      </span>
    </div>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <Link
      href={`/blog/category/${slug}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-block rounded-full bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
    >
      {category}
    </Link>
  );
}

export function TagPill({ tag }: { tag: string }) {
  return (
    <Link
      href={`/blog/tag/${encodeURIComponent(tag)}`}
      className="inline-block rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-ink-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/5 transition-all"
    >
      #{tag}
    </Link>
  );
}

export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden animate-pulse">
      <div className="aspect-video bg-[var(--color-border)]" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-20 rounded-full bg-[var(--color-border)]" />
        <div className="h-6 w-full rounded bg-[var(--color-border)]" />
        <div className="h-6 w-3/4 rounded bg-[var(--color-border)]" />
        <div className="h-4 w-full rounded bg-[var(--color-border)]" />
        <div className="h-4 w-2/3 rounded bg-[var(--color-border)]" />
        <div className="flex gap-3 mt-3 pt-2 border-t border-[var(--color-border)]">
          <div className="h-3 w-16 rounded bg-[var(--color-border)]" />
          <div className="h-3 w-20 rounded bg-[var(--color-border)]" />
          <div className="h-3 w-12 rounded bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}
