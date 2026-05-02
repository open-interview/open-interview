import { motion } from 'framer-motion';
import { Clock, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReducedMotion, getSpringTransition } from '@/hooks/use-reduced-motion';
import type { ArticleCardData } from './article-card';

interface FeaturedCardProps {
  article: ArticleCardData;
  href?: string;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export function FeaturedCard({ article, href, onClick, className, badge = 'Featured' }: FeaturedCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);

  const content = (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card sm:flex-row',
        className,
      )}
    >
      {/* Background decorative gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-cyan-600/5" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-600/10 blur-3xl" />

      {/* Image section */}
      <div className="relative sm:w-2/5 lg:w-1/2">
        <div className="aspect-video sm:aspect-auto sm:h-full">
          {article.coverImage ? (
            <>
              <img
                src={article.coverImage}
                alt={article.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="eager"
                decoding="async"
                width={600}
                height={400}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/80 sm:block hidden" />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent sm:hidden" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-cyan-600/30">
              <div className="text-center">
                <span className="block text-4xl font-bold text-white/20">{article.category}</span>
              </div>
            </div>
          )}
        </div>

        {/* Featured badge */}
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
          <Star className="h-3 w-3 fill-current" />
          {badge}
        </div>
      </div>

      {/* Content section */}
      <div className="relative z-10 flex flex-1 flex-col justify-center p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {article.category}
          </span>
          {article.readingTimeMinutes && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {article.readingTimeMinutes} min read
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
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all group-hover:gap-3',
            )}
          >
            Read article
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>

          {article.author && (
            <span className="text-xs text-muted-foreground">
              by {article.author}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const wrapper = (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      whileHover={!prefersReducedMotion ? { y: -2, transition: spring } : undefined}
      className={cn(href || onClick ? 'cursor-pointer' : '', 'group block')}
      onClick={onClick}
    >
      {href ? (
        <a href={href} className="block" aria-label={`Read featured article: ${article.title}`}>
          {content}
        </a>
      ) : (
        content
      )}
    </motion.div>
  );

  return wrapper;
}

export function FeaturedCardSkeleton({ className }: { className?: string }) {
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
