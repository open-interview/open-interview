import { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion, getSpringTransition } from '@/hooks/use-reduced-motion';
import { ImageWithFallback } from '@/components/blog/ImageWithFallback';
import { Link, useLocation } from 'wouter';

// ─── Types ──────────────────────────────────────────────────────────────

export type ArticleDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author?: string;
  category: string;
  tags?: string[];
  difficulty?: ArticleDifficulty;
  publishedAt?: string;
  readingTimeMinutes?: number;
  featured?: boolean;
}

export type ArticleCardVariant = 'grid' | 'list' | 'featured';

interface ArticleCardProps {
  article: ArticleCardData;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: ArticleCardVariant;
}

// ─── Shared config (exported for reuse) ─────────────────────────────────

export const difficultyConfig: Record<ArticleDifficulty, { label: string; colors: string; bg: string; border: string; dot: string }> = {
  beginner: {
    label: 'Beginner',
    colors: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  intermediate: {
    label: 'Intermediate',
    colors: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  advanced: {
    label: 'Advanced',
    colors: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    dot: 'bg-rose-400',
  },
  expert: {
    label: 'Expert',
    colors: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
  },
};

export const categoryGradients: Record<string, string> = {
  'system-design': 'from-violet-500/20 to-indigo-500/20',
  'algorithms': 'from-cyan-500/20 to-blue-500/20',
  'frontend': 'from-pink-500/20 to-rose-500/20',
  'backend': 'from-emerald-500/20 to-teal-500/20',
  'devops': 'from-orange-500/20 to-amber-500/20',
  'ai-ml': 'from-purple-500/20 to-violet-500/20',
  'database': 'from-sky-500/20 to-cyan-500/20',
  'security': 'from-red-500/20 to-rose-500/20',
  'testing': 'from-lime-500/20 to-green-500/20',
  'kubernetes': 'from-blue-500/20 to-indigo-500/20',
  'aws': 'from-yellow-500/20 to-orange-500/20',
  'react': 'from-cyan-500/20 to-sky-500/20',
  'javascript': 'from-yellow-500/20 to-amber-500/20',
  'python': 'from-blue-500/20 to-violet-500/20',
};

export function getCategoryGradient(category: string): string {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return categoryGradients[slug] || 'from-violet-500/20 to-cyan-500/20';
}

// ─── Utility functions ──────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getCategorySlug(category: string): string {
  return category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// ─── Shared sub-components ──────────────────────────────────────────────

export const DifficultyBadge = memo(function DifficultyBadge({ level }: { level: ArticleDifficulty }) {
  const config = difficultyConfig[level];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border',
        config.colors,
        config.bg,
        config.border,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
});

export const CategoryPill = memo(function CategoryPill({ category }: { category: string }) {
  const gradient = getCategoryGradient(category);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-medium text-white/90',
        gradient,
      )}
    >
      {category}
    </span>
  );
});

export const CategoryBadge = memo(function CategoryBadge({ category }: { category: string }) {
  const [, navigate] = useLocation();
  const slug = getCategorySlug(category);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigate(`/blog/category/${slug}`);
      }}
      className={cn(
        'inline-flex items-center rounded-full bg-gradient-to-r px-2.5 py-0.5 text-[11px] font-medium text-white/90',
        getCategoryGradient(category),
      )}
    >
      {category}
    </button>
  );
});

export const TagPill = memo(function TagPill({ tag }: { tag: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(`/blog/tag/${encodeURIComponent(tag)}`)}
      className="inline-block rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
    >
      #{tag}
    </button>
  );
});

// ─── CoverImage with error handling ─────────────────────────────────────

function CoverImage({ coverImage, title, category, variant = 'grid', imageError, onImageError }: {
  coverImage?: string;
  title: string;
  category: string;
  variant: ArticleCardVariant;
  imageError: boolean;
  onImageError: () => void;
}) {
  const gradient = getCategoryGradient(category);

  // List variant: small thumbnail
  if (variant === 'list') {
    if (!coverImage) return null;
    return (
      <div className="w-20 h-16 shrink-0 rounded-md overflow-hidden bg-muted/50">
        <ImageWithFallback
          src={coverImage}
          alt={`Cover image for ${title}`}
          category={category}
          className="w-full h-full object-cover"
          onError={onImageError}
          fallback={<div className="w-full h-full bg-gradient-to-br from-muted/50 to-muted/30" />}
        />
      </div>
    );
  }

  // Featured + Grid variants with actual image
  if (coverImage && !imageError) {
    return (
      <div className={cn('relative overflow-hidden', variant === 'featured' ? 'aspect-video sm:aspect-auto sm:h-full' : 'aspect-video')}>
        <div className="h-full w-full transition-transform duration-500 group-hover:scale-105">
          <ImageWithFallback
            src={coverImage}
            alt={title}
            category={category}
            className="h-full w-full object-cover"
            onError={onImageError}
            fallback={
              <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', gradient)}>
                {imageError ? (
                  <ImageOff className={cn('text-white/30', variant === 'featured' ? 'h-8 w-8' : 'h-6 w-6')} />
                ) : (
                  <span className={cn('font-bold text-white/30', variant === 'featured' ? 'text-4xl' : 'text-lg')}>
                    {category}
                  </span>
                )}
              </div>
            }
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        {variant === 'featured' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 hidden sm:block" />
        )}
      </div>
    );
  }

  // Fallback placeholder with category gradient
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', gradient, variant === 'featured' ? 'aspect-video sm:aspect-auto sm:h-full' : 'aspect-video')}>
      <div className="absolute inset-0 flex items-center justify-center">
        {imageError ? (
          <ImageOff className="h-8 w-8 text-white/30" />
        ) : (
          <span className={cn('font-bold text-white/30', variant === 'featured' ? 'text-4xl' : 'text-lg')}>
            {category}
          </span>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}

// ─── Meta info ──────────────────────────────────────────────────────────

const ArticleMeta = memo(function ArticleMeta({ article }: { article: ArticleCardData }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
      {article.author && (
        <span className="font-medium text-foreground/70">{article.author}</span>
      )}
      {article.publishedAt && (
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" strokeWidth={1.5} aria-hidden />
          {formatDate(article.publishedAt)}
        </span>
      )}
      {article.readingTimeMinutes && (
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
          <Clock className="h-3 w-3" strokeWidth={2} aria-hidden />
          {formatReadingTime(article.readingTimeMinutes)}
        </span>
      )}
    </div>
  );
});

// ─── Card content renderer ──────────────────────────────────────────────

function CardContent({ article, variant, imageError, onImageError }: {
  article: ArticleCardData;
  variant: ArticleCardVariant;
  imageError: boolean;
  onImageError: () => void;
}) {
  // ── List variant ──
  if (variant === 'list') {
    return (
      <div className="flex gap-4 py-4 border-b border-border/50 last:border-0">
        <div className="flex-1 min-w-0">
          <CategoryBadge category={article.category} />
          <h2 className="mt-1 text-base font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h2>
          <ArticleMeta article={article} />
        </div>
        <CoverImage
          coverImage={article.coverImage}
          title={article.title}
          category={article.category}
          variant="list"
          imageError={imageError}
          onImageError={onImageError}
        />
      </div>
    );
  }

  // ── Featured variant ──
  if (variant === 'featured') {
    return (
      <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card sm:flex-row">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-cyan-600/5" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />

        <div className="relative sm:w-2/5 lg:w-1/2">
          <CoverImage
            coverImage={article.coverImage}
            title={article.title}
            category={article.category}
            variant="featured"
            imageError={imageError}
            onImageError={onImageError}
          />
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
            <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
            Featured
          </div>
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryPill category={article.category} />
            {article.readingTimeMinutes && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden />
                {formatReadingTime(article.readingTimeMinutes)}
              </span>
            )}
          </div>

          <h2 className="mt-4 text-xl font-bold leading-tight text-foreground transition-colors sm:text-2xl lg:text-3xl group-hover:text-primary">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground line-clamp-3 sm:text-base">
              {article.excerpt}
            </p>
          )}

          <div className="mt-6 flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-[gap] group-hover:gap-3">
              Read article
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
            {article.author && (
              <span className="text-xs text-muted-foreground">by {article.author}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Grid variant (default) ──
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-colors before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:opacity-0 before:transition-opacity before:bg-gradient-to-r before:from-violet-500/50 before:via-cyan-500/50 before:to-violet-500/50 hover:before:opacity-100">
      <div className="relative z-10 flex h-full flex-col bg-card/95 backdrop-blur">
        <CoverImage
          coverImage={article.coverImage}
          title={article.title}
          category={article.category}
          variant="grid"
          imageError={imageError}
          onImageError={onImageError}
        />

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CategoryPill category={article.category} />
            {article.difficulty && <DifficultyBadge level={article.difficulty} />}
          </div>

          <h2 className="text-base font-semibold leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3 flex-1">
              {article.excerpt}
            </p>
          )}

          <ArticleMeta article={article} />
        </div>
      </div>
    </div>
  );
}

// ─── Main ArticleCard component ─────────────────────────────────────────

export const ArticleCard = memo(function ArticleCard({ article, href, onClick, className, variant = 'grid' }: ArticleCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => setImageError(true);

  const ariaLabel = variant === 'featured'
    ? `Read featured article: ${article.title}`
    : `Read article: ${article.title}`;

  const content = (
    <CardContent
      article={article}
      variant={variant}
      imageError={imageError}
      onImageError={handleImageError}
    />
  );

  // List variant: simple wrapper (no motion)
  if (variant === 'list') {
    if (href) {
      return (
        <Link href={href} className="group block" aria-label={ariaLabel}>
          {content}
        </Link>
      );
    }
    return <div className="group">{content}</div>;
  }

  // Grid/Featured variants: motion wrapper
  const motionY = variant === 'featured' ? -2 : -4;

  return (
    <motion.div
      whileHover={!prefersReducedMotion ? { y: motionY, transition: spring } : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={cn(href || onClick ? 'cursor-pointer' : '', 'group block', className)}
      onClick={onClick}
    >
      {href ? (
        <a href={href} className="block h-full" aria-label={ariaLabel}>
          {content}
        </a>
      ) : (
        content
      )}
    </motion.div>
  );
});

// ─── Skeleton ───────────────────────────────────────────────────────────

export function ArticleCardSkeleton({ className, variant = 'grid' }: { className?: string; variant?: ArticleCardVariant }) {
  if (variant === 'list') {
    return (
      <div className={cn('flex gap-4 py-4 border-b border-border/50 animate-pulse', className)}>
        <div className="flex-1 space-y-2">
          <div className="h-5 w-16 rounded-full bg-muted/50" />
          <div className="h-5 w-3/4 rounded bg-muted/50" />
          <div className="flex gap-3 mt-1">
            <div className="h-3 w-12 rounded bg-muted/50" />
            <div className="h-3 w-20 rounded bg-muted/50" />
            <div className="h-3 w-16 rounded bg-muted/50" />
          </div>
        </div>
        <div className="w-20 h-16 rounded-md bg-muted/50 shrink-0" />
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className={cn('flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card animate-pulse sm:flex-row', className)}>
        <div className="aspect-video sm:aspect-auto sm:h-auto sm:w-2/5 lg:w-1/2 bg-muted/50" />
        <div className="flex flex-1 flex-col p-6 sm:p-8 lg:p-10 space-y-4">
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-muted/50" />
            <div className="h-6 w-24 rounded-full bg-muted/50" />
          </div>
          <div className="h-8 w-full rounded bg-muted/50" />
          <div className="h-8 w-3/4 rounded bg-muted/50" />
          <div className="h-4 w-full rounded bg-muted/50" />
          <div className="h-4 w-full rounded bg-muted/50" />
          <div className="h-4 w-2/3 rounded bg-muted/50" />
          <div className="mt-4 h-5 w-32 rounded bg-muted/50" />
        </div>
      </div>
    );
  }

  // Grid skeleton (default)
  return (
    <div className={cn('flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card animate-pulse', className)}>
      <div className="aspect-video bg-muted/50" />
      <div className="flex flex-1 flex-col p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-5 w-16 rounded-full bg-muted/50" />
          <div className="h-5 w-20 rounded-full bg-muted/50" />
        </div>
        <div className="h-5 w-full rounded bg-muted/50" />
        <div className="h-5 w-3/4 rounded bg-muted/50" />
        <div className="h-4 w-full rounded bg-muted/50" />
        <div className="h-4 w-2/3 rounded bg-muted/50" />
        <div className="mt-auto flex gap-3">
          <div className="h-3 w-12 rounded bg-muted/50" />
          <div className="h-3 w-20 rounded bg-muted/50" />
          <div className="h-3 w-16 rounded bg-muted/50" />
        </div>
      </div>
    </div>
  );
}
