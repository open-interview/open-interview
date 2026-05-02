import { ArticleCard, ArticleCardSkeleton, type ArticleCardData } from './article-card';

interface FeaturedCardProps {
  article: ArticleCardData;
  href?: string;
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export function FeaturedCard({ article, href, onClick, className }: FeaturedCardProps) {
  return (
    <ArticleCard
      article={article}
      href={href}
      onClick={onClick}
      className={className}
      variant="featured"
    />
  );
}

export function FeaturedCardSkeleton({ className }: { className?: string }) {
  return <ArticleCardSkeleton className={className} variant="featured" />;
}
