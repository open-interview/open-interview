import { ArticleCard, ArticleCardSkeleton, type ArticleCardData, type ArticleCardVariant, CategoryBadge, CategoryPill, TagPill, DifficultyBadge } from '@/components/facelift/article-card';

// Re-export for backward compatibility
export interface PostCardData extends ArticleCardData {
  author: string;
  publishedAt: string;
  readingTimeMinutes: number;
  tags: string[];
}

interface PostCardProps {
  post: PostCardData;
  variant?: ArticleCardVariant;
}

export function PostCard({ post, variant = 'grid' }: PostCardProps) {
  return (
    <ArticleCard
      article={post}
      href={`/blog/${post.slug}`}
      variant={variant}
    />
  );
}

export { ArticleCardSkeleton as PostCardSkeleton };
export { CategoryBadge, CategoryPill, TagPill, DifficultyBadge };
