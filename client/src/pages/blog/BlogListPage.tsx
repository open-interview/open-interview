import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { getPosts, getCategories, getTags } from "@/lib/blog-loader";
import { useBlogSEO } from "@/hooks/use-blog-seo";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { ArticleCard, ArticleCardSkeleton, type ArticleCardData, type ArticleDifficulty } from "@/components/facelift/article-card";
import { motion } from "framer-motion";
import { useReducedMotion, getSpringTransition } from "@/hooks/use-reduced-motion";
import { ChevronRight, Filter, BookOpen, Tag, Grid3x3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Breadcrumb } from "@/components/blog/Breadcrumb";
import { EmptyState } from "@/components/blog/EmptyState";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface SidebarContentProps {
  categories: Category[];
  tags: string[];
  total: number;
  filteredPosts: ArticleCardData[];
  categorySlug?: string;
  tag?: string;
  loading: boolean;
  onNavigate: (url: string) => void;
}

function SidebarContent({ categories, tags, total, filteredPosts, categorySlug, tag, loading, onNavigate }: SidebarContentProps) {
  return (
    <>
      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <BookOpen size={14} className="text-violet-400" />
          Categories
        </h2>
        <ul className="space-y-1.5">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="h-6 rounded bg-muted/50 animate-pulse" />
              ))
            : categories.map((cat) => (
                <li key={cat.id}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-start text-sm transition-colors ${
                      categorySlug === cat.slug
                        ? "text-violet-400 bg-violet-500/10"
                        : "text-muted-foreground hover:text-violet-400 hover:bg-violet-500/5"
                    }`}
                    onClick={() => onNavigate(`/blog/category/${cat.slug}`)}
                  >
                    {cat.name}
                  </Button>
                </li>
              ))}
        </ul>
      </div>

      {tags.length > 0 && (
        <div className="rounded-xl border border-border/50 bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Tag size={14} className="text-cyan-400" />
            Popular Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-6 w-16 rounded-full bg-muted/50 animate-pulse" />
                ))
              : tags.slice(0, 12).map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={tag === t}
                    className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      tag === t
                        ? 'bg-violet-600 text-white border-transparent hover:bg-violet-700'
                        : 'border-border/50 text-muted-foreground hover:border-violet-500/50 hover:text-violet-400'
                    }`}
                    onClick={() => onNavigate(`/blog/tag/${t}`)}
                  >
                    #{t}
                  </button>
                ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border/50 bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">This Category</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Articles</span>
            <span className="font-semibold text-foreground">{total}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Showing</span>
            <span className="font-semibold text-violet-400">{filteredPosts.length}</span>
          </div>
        </div>
      </div>
    </>
  );
}

interface BlogListPageProps {
  categorySlug?: string;
  tag?: string;
}

const difficulties: ArticleDifficulty[] = ['beginner', 'intermediate', 'advanced'];

const difficultyLabels: Record<ArticleDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

export default function BlogListPage({ categorySlug, tag }: BlogListPageProps) {
<<<<<<< Updated upstream
  const [posts, setPosts] = useState<ArticleCardData[]>([]);
=======
  const title = categorySlug ? `${categorySlug} Posts` : tag ? `#${tag}` : "All Posts";
  useBlogSEO({ title, canonicalUrl: `https://open-interview.dev/blog` });
  const [posts, setPosts] = useState<PostCardData[]>([]);
>>>>>>> Stashed changes
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<ArticleDifficulty | 'all'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [, navigate] = useLocation();
  const PAGE_SIZE = 12;
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);

  const filteredPosts = selectedDifficulty === 'all'
    ? posts
    : posts.filter(p => p.difficulty === selectedDifficulty);

  // Reset page/difficulty when filters change
  useEffect(() => {
    setPage(1);
    setSelectedDifficulty('all');
  }, [categorySlug, tag]);

  // Fetch posts when filters or page changes
  useEffect(() => {
    setLoading(true);
    Promise.all([
      getPosts({ category: categorySlug, tag, limit: PAGE_SIZE, page }),
      getCategories(),
      getTags(),
    ])
      .then(([postsRes, catsData, tagsData]) => {
        const mappedPosts = (postsRes.data || []).map((post: any) => ({
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt || '',
          coverImage: post.coverImage,
          author: post.author,
          category: post.category,
          tags: post.tags || [],
          difficulty: post.difficulty,
          publishedAt: post.publishedAt,
          readingTimeMinutes: post.readingTimeMinutes,
          featured: post.featured,
        }));
        setPosts(mappedPosts);
        setTotal(postsRes.meta?.total || 0);
        setCategories(catsData);
        setTags(tagsData);
      })
      .finally(() => setLoading(false));
  }, [categorySlug, tag, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const pageTitle = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name || categorySlug
    : tag
    ? `#${tag}`
    : "All Posts";

  const pageIcon = categorySlug ? (
    <BookOpen size={20} className="text-violet-400" />
  ) : tag ? (
    <Tag size={20} className="text-cyan-400" />
  ) : (
    <Grid3x3 size={20} className="text-violet-400" />
  );

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  }, [prefersReducedMotion]);

  return (
    <BlogLayout>
      {/* Subtle dot pattern background */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]" aria-hidden="true">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #888 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={spring}
        >
          <Breadcrumb
            items={[
              { label: "Blog", href: "/blog" },
              { label: pageTitle, isCurrent: true },
            ]}
          />
        </motion.div>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              {pageIcon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
              {total > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredPosts.length} article{filteredPosts.length !== 1 ? 's' : ''}
                  {selectedDifficulty !== 'all' && ` · ${difficultyLabels[selectedDifficulty]} level`}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10">
          {/* Main Content */}
          <div>
            {/* Filter Bar - with responsive Filters button for tablet/mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.2 }}
              className="flex flex-wrap items-center gap-2 mb-8 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur"
            >
              <div className="flex items-center gap-2 mr-2">
                <Filter size={14} className="text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Level</span>
              </div>

              <Button
                variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDifficulty('all')}
                className={selectedDifficulty === 'all' ? 'bg-violet-600 hover:bg-violet-700' : ''}
              >
                All
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

              {/* Filters button for tablet/mobile - hidden on lg+ */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto lg:hidden border-border/50 hover:border-violet-500/50"
                  >
                    <Filter size={14} className="mr-1.5" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0 flex flex-col">
                  <SheetHeader className="px-5 pt-5 pb-0">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="flex items-center gap-2">
                        <Filter size={16} className="text-violet-400" />
                        Filters
                      </SheetTitle>
                      <SheetClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <X size={16} />
                        <span className="sr-only">Close</span>
                      </SheetClose>
                    </div>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6 mt-4">
                    <SidebarContent
                      categories={categories}
                      tags={tags}
                      total={total}
                      filteredPosts={filteredPosts}
                      categorySlug={categorySlug}
                      tag={tag}
                      loading={loading}
                      onNavigate={(url) => {
                        navigate(url);
                        setSidebarOpen(false);
                      }}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </motion.div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <EmptyState
                  icon={<BookOpen size={24} className="text-[var(--color-ink-muted)]" />}
                  title="Nothing here yet"
                  description={
                    selectedDifficulty !== 'all'
                      ? `No ${difficultyLabels[selectedDifficulty].toLowerCase()} articles in this category — try a different level or browse all posts.`
                      : 'This category is still growing. Explore other topics or check back soon.'
                  }
                  action={
                    (selectedDifficulty !== 'all' || categorySlug || tag)
                      ? {
                          label: "View all articles",
                          onClick: () => {
                            setSelectedDifficulty('all');
                            if (categorySlug || tag) navigate('/blog');
                          },
                        }
                      : undefined
                  }
                />
              </motion.div>
            ) : (
              <>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.08,
                      },
                    },
                  }}
                  initial="hidden"
                  animate="visible"
                >
                  {filteredPosts.map((post, i) => (
                    <motion.div
                      key={post.slug}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      transition={{ ...spring, delay: prefersReducedMotion ? 0 : i * 0.06 }}
                    >
                      <ArticleCard article={post} href={`/blog/${post.slug}`} />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ...spring, delay: 0.3 }}
                    className="mt-10 flex items-center justify-center gap-2"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="border-border/50 hover:border-violet-500/50 disabled:opacity-40"
                      aria-label="Previous page"
                    >
                      <ChevronRight size={14} className="rotate-180" />
                    </Button>

                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className={page === pageNum ? 'bg-violet-600 hover:bg-violet-700' : 'border-border/50 hover:border-violet-500/50'}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="border-border/50 hover:border-violet-500/50 disabled:opacity-40"
                      aria-label="Next page"
                    >
                      <ChevronRight size={14} />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Sidebar - hidden on mobile/tablet, visible on lg+ */}
          <motion.aside
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: prefersReducedMotion ? 0 : 0.3 }}
            className="hidden lg:block space-y-6"
          >
            <SidebarContent
              categories={categories}
              tags={tags}
              total={total}
              filteredPosts={filteredPosts}
              categorySlug={categorySlug}
              tag={tag}
              loading={loading}
              onNavigate={navigate}
            />
          </motion.aside>
        </div>
      </div>
    </BlogLayout>
  );
}
