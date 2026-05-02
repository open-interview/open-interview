import { motion } from 'framer-motion';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion, getSpringTransition } from '@/hooks/use-reduced-motion';

export type ArticleDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ArticleCardData {
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author?: string;
  category: string;
  difficulty?: ArticleDifficulty;
  publishedAt?: string;
  readingTimeMinutes?: number;
  featured?: boolean;
}

interface ArticleCardProps {
  article: ArticleCardData;
  href?: string;
  onClick?: () => void;
  className?: string;
  as?: 'article' | 'div';
}

const difficultyConfig: Record<ArticleDifficulty, { label: string; colors: string; bg: string; border: string }> = {
  beginner: {
    label: 'Beginner',
    colors: 'text-emerald-400 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  intermediate: {
    label: 'Intermediate',
    colors: 'text-amber-400 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  advanced: {
    label: 'Advanced',
    colors: 'text-rose-400 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
};

const categoryGradients: Record<string, string> = {
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

function getCategoryGradient(category: string): string {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return categoryGradients[slug] || 'from-violet-500/20 to-cyan-500/20';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatReadingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min read`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m read` : `${hours}h read`;
}

function DifficultyBadge({ level }: { level: ArticleDifficulty }) {
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
      <span
        className={cn('h-1.5 w-1.5 rounded-full', {
          'bg-emerald-400': level === 'beginner',
          'bg-amber-400': level === 'intermediate',
          'bg-rose-400': level === 'advanced',
        })}
      />
      {config.label}
    </span>
  );
}

function CategoryPill({ category }: { category: string }) {
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
}

function CoverImage({ coverImage, title, category }: { coverImage?: string; title: string; category: string }) {
  const gradient = getCategoryGradient(category);

  if (coverImage) {
    return (
      <div className="relative aspect-video overflow-hidden">
        <img
          src={coverImage}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width={400}
          height={225}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={cn('relative aspect-video overflow-hidden bg-gradient-to-br', gradient)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-white/30">{category}</span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
    </div>
  );
}

export function ArticleCard({ article, href, onClick, className, as = 'article' }: ArticleCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);

  const content = (
    <div
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-colors',
        'before:absolute before:inset-0 before:rounded-xl before:p-[1px] before:opacity-0 before:transition-opacity',
        'before:bg-gradient-to-r before:from-violet-500/50 before:via-cyan-500/50 before:to-violet-500/50',
        'hover:before:opacity-100',
        className,
      )}
    >
      <div className="relative z-10 flex h-full flex-col bg-card/95 backdrop-blur">
        <CoverImage coverImage={article.coverImage} title={article.title} category={article.category} />

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CategoryPill category={article.category} />
            {article.difficulty && <DifficultyBadge level={article.difficulty} />}
          </div>

          <h3 className="text-base font-semibold leading-snug text-foreground line-clamp-2 transition-colors group-hover:text-primary">
            {article.title}
          </h3>

          {article.excerpt && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3 flex-1">
              {article.excerpt}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {article.author && (
              <span className="font-medium text-foreground/70">{article.author}</span>
            )}
            {article.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" strokeWidth={1.5} />
                {formatDate(article.publishedAt)}
              </span>
            )}
            {article.readingTimeMinutes && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                <Clock className="h-3 w-3" strokeWidth={2} />
                {formatReadingTime(article.readingTimeMinutes)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const wrapper = (
    <motion.div
      whileHover={!prefersReducedMotion ? { y: -4, transition: spring } : undefined}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className={cn(href || onClick ? 'cursor-pointer' : '', 'group block')}
      onClick={onClick}
    >
      {href ? (
        <a href={href} className="block h-full" aria-label={`Read article: ${article.title}`}>
          {content}
        </a>
      ) : (
        content
      )}
    </motion.div>
  );

  if (as === 'div') {
    return (
      <motion.div
        whileHover={!prefersReducedMotion ? { y: -4, transition: spring } : undefined}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        {content}
      </motion.div>
    );
  }

  return wrapper;
}

export function ArticleCardSkeleton({ className }: { className?: string }) {
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
