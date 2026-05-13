import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { getFeaturedPosts, getPosts, getCategories } from "@/lib/blog-loader";
import { useBlogSEO } from "@/hooks/use-blog-seo";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { ArticleCard, ArticleCardSkeleton, type ArticleCardData, type ArticleDifficulty } from "@/components/facelift/article-card";
import { FeaturedCard, FeaturedCardSkeleton } from "@/components/facelift/featured-card";
import { StatGrid, StatCard, StatCardSkeleton, type StatCardData } from "@/components/facelift/stat-card";
import { TopicCard, TopicCardSkeleton, type TopicCardData } from "@/components/facelift/topic-card";
import { motion } from "framer-motion";
import { useReducedMotion, getSpringTransition } from "@/hooks/use-reduced-motion";
import { BookOpen, Clock, TrendingUp, Filter, ChevronDown, Grid3x3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/blog/EmptyState";

interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

function getDifficultyFromCategory(category: string): ArticleDifficulty {
  const advancedCategories = ['system-design', 'algorithms', 'ai-ml', 'security', 'database'];
  const intermediateCategories = ['frontend', 'backend', 'react', 'javascript', 'python', 'aws', 'kubernetes'];
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (advancedCategories.includes(slug)) return 'advanced';
  if (intermediateCategories.includes(slug)) return 'intermediate';
  return 'beginner';
}

const difficulties: ArticleDifficulty[] = ['beginner', 'intermediate', 'advanced'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0,
    },
  },
};

const difficultyLabels: Record<ArticleDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export default function BlogHomePage() {
<<<<<<< Updated upstream
  const [featured, setFeatured] = useState<ArticleCardData[]>([]);
  const [recent, setRecent] = useState<ArticleCardData[]>([]);
=======
  useBlogSEO({
    title: "Engineering Insights & Interview Prep",
    description: "Practical guides, deep dives, and career advice for software engineers preparing for top tech interviews.",
    canonicalUrl: "https://open-interview.dev/blog",
  });
  const [featured, setFeatured] = useState<PostCardData[]>([]);
  const [recent, setRecent] = useState<PostCardData[]>([]);
>>>>>>> Stashed changes
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<StatCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<ArticleDifficulty | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(6);
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);

  const filteredRecent = selectedDifficulty === 'all'
    ? (selectedCategory ? recent.filter(a => a.category.toLowerCase() === selectedCategory.toLowerCase()) : recent)
    : (selectedCategory ? recent.filter(a => a.difficulty === selectedDifficulty && a.category.toLowerCase() === selectedCategory.toLowerCase()) : recent.filter(a => a.difficulty === selectedDifficulty));

  const displayedArticles = filteredRecent.slice(0, displayCount);
  const hasMore = displayCount < filteredRecent.length;

  useEffect(() => {
    Promise.all([
      getFeaturedPosts(3),
      getPosts({ limit: 12 }),
      getCategories(),
    ])
      .then(([featData, postsRes, catsData]) => {
        const mapPost = (p: any): ArticleCardData => ({
          ...p,
          difficulty: p.difficulty || getDifficultyFromCategory(p.category),
        });
        setFeatured(featData.map(mapPost));
        setRecent((postsRes.data || []).map(mapPost));
        const countByCategory: Record<string, number> = {};
        (postsRes.data || []).forEach((p: any) => {
          const cat = (p.category || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          countByCategory[cat] = (countByCategory[cat] || 0) + 1;
        });
        setCategories(catsData.map((c: Category) => ({
          ...c,
          count: countByCategory[c.slug] || 0,
        })));
        const totalArticles = postsRes.data?.length || 0;
        const totalReadingTime = (postsRes.data || []).reduce((sum: number, p: any) => sum + (p.readingTimeMinutes || 0), 0);
        const avgReadTime = totalArticles > 0 ? Math.round(totalReadingTime / totalArticles) : 0;
        setStats([
          { label: "Published Articles", value: totalArticles, icon: <BookOpen size={18} />, accent: 'violet' as const },
          { label: "Topics Covered", value: catsData.length || 0, icon: <Grid3x3 size={18} />, accent: 'emerald' as const },
          { label: "Avg Read Time", value: avgReadTime, suffix: " min", icon: <Clock size={18} />, accent: 'amber' as const },
          { label: "Newest Article", value: "Latest", icon: <TrendingUp size={18} />, accent: 'cyan' as const },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLoadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + 6, filteredRecent.length));
  }, [filteredRecent.length]);

  return (
    <BlogLayout>
      {/* Subtle dot pattern background */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" aria-hidden="true">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: prefersReducedMotion ? 0.01 : 0.6 }}
          className="relative overflow-hidden border-b border-border/50"
          style={{ background: 'var(--gradient-primary-subtle)' }}
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.1 }}
            >
              <Badge variant="outline" className="mb-6" style={{ borderColor: 'rgba(124, 58, 237, 0.25)', color: 'var(--brand-violet-300)', background: 'rgba(124, 58, 237, 0.12)' }}>
                <TrendingUp size={14} className="mr-1.5" />
                New articles every week
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight"
            >
              Land Your Dream Role with<br />
              <span className="gradient-text">
                Expert Interview Prep
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.3 }}
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Battle-tested strategies, system design breakdowns, and coding patterns from engineers who've passed interviews at FAANG and top startups.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.4 }}
              className="mt-8 flex flex-wrap gap-4 justify-center"
            >
              <Button asChild size="lg" className="text-white transition-all duration-200" style={{ background: 'var(--gradient-primary)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gradient-primary-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--gradient-primary)')}
              >
                <Link href="/blog">
                  <span className="inline-flex items-center gap-2">Explore All Articles <Grid3x3 size={16} /></span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/blog/search">
                  <span>Find What You Need</span>
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
          {/* Stats Section */}
          {!loading && stats.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={spring}
            >
              <StatGrid columns={4}>
                {stats.map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ ...spring, delay: prefersReducedMotion ? 0 : i * 0.1 }}
                  >
                    <StatCard stat={stat} />
                  </motion.div>
                ))}
              </StatGrid>
            </motion.section>
          )}

          {/* Featured Article */}
          {(loading || featured.length > 0) && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={spring}
              aria-labelledby="featured-heading"
            >
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} style={{ color: 'var(--brand-violet-400)' }} />
                <h2 id="featured-heading" className="text-xl font-bold text-foreground">
                  Editor's Pick
                </h2>
              </div>
              {loading ? <FeaturedCardSkeleton /> : featured[0] && <FeaturedCard article={featured[0]} href={`/blog/${featured[0].slug}`} />}
            </motion.section>
          )}

          {/* Topic Filter Pills */}
          {categories.length > 0 && (
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={spring}
              aria-labelledby="topics-heading"
            >
              <h2 id="topics-heading" className="text-xl font-bold text-foreground mb-4">
                Browse by Topic
              </h2>
              <div className="flex flex-wrap gap-3">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <TopicCardSkeleton key={i} className="w-[180px]" />)
                  : categories.map((cat, i) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ ...spring, delay: prefersReducedMotion ? 0 : i * 0.05 }}
                        className="w-[180px]"
                      >
                        <TopicCard
                          topic={{
                            id: cat.id,
                            name: cat.name,
                            slug: cat.slug,
                            count: cat.count || 0,
                            href: `/blog/category/${cat.slug}`,
                          }}
                          index={i}
                        />
                      </motion.div>
                    ))}
              </div>
            </motion.section>
          )}

          {/* Filter Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={spring}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-2 mr-4">
              <Filter size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filter:</span>
            </div>

            <Button
              variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('all')}
              className={selectedDifficulty === 'all' ? '' : ''}
              style={selectedDifficulty === 'all' ? { background: 'var(--gradient-primary)', color: '#fff' } : undefined}
              data-testid="button-filter-all"
            >
              All Levels
            </Button>
            {difficulties.map((level) => (
              <Button
                key={level}
                variant={selectedDifficulty === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty(level)}
                className={selectedDifficulty === level ? '' : ''}
                style={selectedDifficulty === level ? { background: 'var(--gradient-primary)', color: '#fff' } : undefined}
                data-testid={`button-filter-${level}`}
              >
                {difficultyLabels[level]}
              </Button>
            ))}

            {categories.length > 0 && (
              <>
                <div className="h-6 w-px bg-border mx-2" />
                {categories.slice(0, 5).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={selectedCategory === cat.slug}
                    className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${selectedCategory === cat.slug ? 'text-white border-transparent' : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/40'}`}
                    style={selectedCategory === cat.slug ? { background: 'var(--gradient-primary)', border: 'none' } : { borderColor: 'rgba(124, 58, 237, 0.25)' }}
                    onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                    data-testid={`button-category-${cat.slug}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </>
            )}
          </motion.div>

          {/* Recent Posts Grid */}
          <motion.section
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={spring}
            aria-labelledby="recent-heading"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 id="recent-heading" className="text-xl font-bold text-foreground">
                Latest Articles
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredRecent.length})
                </span>
              </h2>
              <Link href="/blog" className="text-sm flex items-center gap-1 transition-colors" style={{ color: 'var(--brand-violet-400)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-violet-300)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--brand-violet-400)')}
              >
                View all <ChevronDown size={14} className="rotate-[-90deg]" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : displayedArticles.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={24} className="text-[var(--color-ink-muted)]" />}
                title="No articles match those filters"
                description="Try broadening your search to find what you're looking for."
                action={{
                  label: "Reset to all articles",
                  onClick: () => { setSelectedDifficulty('all'); setSelectedCategory(null); },
                }}
              />
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {displayedArticles.map((article, i) => (
                    <motion.div
                      key={article.slug}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ ...spring, delay: prefersReducedMotion ? 0 : i * 0.08 }}
                    >
                      <ArticleCard article={article} href={`/blog/${article.slug}`} />
                    </motion.div>
                  ))}
                </motion.div>

                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="mt-10 text-center"
                  >
                    <Button
                      onClick={handleLoadMore}
                      variant="outline"
                      size="lg"
                      className="transition-colors"
                    style={{ borderColor: 'rgba(124, 58, 237, 0.25)', background: 'rgba(124, 58, 237, 0.05)' }}
                      data-testid="button-load-more"
                    >
                      <Loader2 size={16} className="mr-2" />
                      Load More ({filteredRecent.length - displayCount} remaining)
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </motion.section>
        </div>
      </div>
    </BlogLayout>
  );
}
