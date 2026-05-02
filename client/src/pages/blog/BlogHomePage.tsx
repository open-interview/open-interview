import { useEffect, useState, useCallback } from "react";
import { Link } from "wouter";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { ArticleCard, ArticleCardSkeleton, type ArticleCardData, type ArticleDifficulty } from "@/components/facelift/article-card";
import { FeaturedCard, FeaturedCardSkeleton } from "@/components/facelift/featured-card";
import { StatGrid, StatCard, StatCardSkeleton, type StatCardData } from "@/components/facelift/stat-card";
import { TopicCard, TopicCardSkeleton, type TopicCardData } from "@/components/facelift/topic-card";
import { motion } from "framer-motion";
import { useReducedMotion, getSpringTransition, staggerConfig } from "@/hooks/use-reduced-motion";
import { BookOpen, Clock, TrendingUp, Filter, ChevronDown, Grid3x3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
  count?: number;
}

const difficulties: ArticleDifficulty[] = ['beginner', 'intermediate', 'advanced'];

const difficultyLabels: Record<ArticleDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export default function BlogHomePage() {
  const [featured, setFeatured] = useState<ArticleCardData[]>([]);
  const [recent, setRecent] = useState<ArticleCardData[]>([]);
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
      fetch("/api/blog/posts/featured").then((r) => r.json()),
      fetch("/api/blog/posts?limit=12").then((r) => r.json()),
      fetch("/api/blog/categories").then((r) => r.json()),
    ])
      .then(([feat, posts, cats]) => {
        setFeatured(feat.data || []);
        setRecent(posts.data || []);
        setCategories((cats.data || []).map((c: Category) => ({
          ...c,
          count: Math.floor(Math.random() * 20) + 5,
        })));
        setStats([
          { label: "Published Articles", value: posts.meta?.total || 48, icon: <BookOpen size={18} />, accent: 'violet' as const, trend: 12, trendLabel: 'vs last month' },
          { label: "Active Readers", value: "2.4K", prefix: "", icon: <TrendingUp size={18} />, accent: 'cyan' as const, trend: 8, trendLabel: 'growth' },
          { label: "Topics Covered", value: (cats.data || []).length || 14, icon: <Grid3x3 size={18} />, accent: 'emerald' as const },
          { label: "Reading Time", value: "120+", suffix: " hrs", icon: <Clock size={18} />, accent: 'amber' as const },
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
          className="relative overflow-hidden border-b border-border/50 bg-gradient-to-br from-background via-background to-violet-500/5"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.1 }}
            >
              <Badge variant="outline" className="mb-6 border-violet-500/30 text-violet-400 bg-violet-500/10">
                <TrendingUp size={14} className="mr-1.5" />
                Fresh insights weekly
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight"
            >
              Engineering Insights &<br />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent">
                Interview Prep
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.3 }}
              className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Practical guides, deep dives, and career advice for software engineers preparing for top tech interviews.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.4 }}
              className="mt-8 flex flex-wrap gap-4 justify-center"
            >
              <Button asChild size="lg" className="bg-violet-600 hover:bg-violet-700 text-white">
                <Link href="/blog">
                  Browse All Posts <Grid3x3 size={16} className="ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/blog/search">
                  Search Articles
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
                <TrendingUp size={18} className="text-violet-400" />
                <h2 id="featured-heading" className="text-xl font-bold text-foreground">
                  Featured Article
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
              className={selectedDifficulty === 'all' ? 'bg-violet-600 hover:bg-violet-700' : ''}
            >
              All Levels
            </Button>
            {difficulties.map((level) => (
              <Button
                key={level}
                variant={selectedDifficulty === level ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty(level)}
                className={selectedDifficulty === level ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                {difficultyLabels[level]}
              </Button>
            ))}

            {categories.length > 0 && (
              <>
                <div className="h-6 w-px bg-border mx-2" />
                {categories.slice(0, 5).map((cat) => (
                  <Badge
                    key={cat.id}
                    variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${selectedCategory === cat.slug ? 'bg-violet-600 hover:bg-violet-700' : 'hover:border-violet-500/50'}`}
                    onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                  >
                    {cat.name}
                  </Badge>
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
              <Link href="/blog" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                View all <ChevronDown size={14} className="rotate-[-90deg]" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : displayedArticles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No articles match your filters.</p>
                <Button
                  variant="link"
                  onClick={() => { setSelectedDifficulty('all'); setSelectedCategory(null); }}
                  className="mt-2 text-violet-400"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={staggerConfig}
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
                      className="border-violet-500/30 hover:border-violet-500/50 hover:bg-violet-500/5"
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
