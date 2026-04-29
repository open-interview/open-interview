import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard, PostCardSkeleton, TagPill, type PostCardData } from "@/components/blog/PostCard";
import { SearchInput } from "@/components/blog/SearchInput";
import { ChevronLeft, ChevronRight, Filter, TrendingUp } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogListPageProps {
  categorySlug?: string;
  tag?: string;
}

export default function BlogListPage({ categorySlug, tag }: BlogListPageProps) {
  const [posts, setPosts] = useState<PostCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const PAGE_SIZE = 12;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(page) });
    if (categorySlug) params.set("category", categorySlug);
    if (tag) params.set("tag", tag);

    Promise.all([
      fetch(`/api/blog/posts?${params}`).then((r) => r.json()),
      fetch("/api/blog/categories").then((r) => r.json()),
      fetch("/api/blog/tags").then((r) => r.json()),
    ])
      .then(([postsRes, catsRes, tagsRes]) => {
        setPosts(postsRes.data || []);
        setTotal(postsRes.meta?.total || 0);
        setCategories(catsRes.data || []);
        setTags(tagsRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [categorySlug, tag, page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageTitle = categorySlug
    ? categories.find((c) => c.slug === categorySlug)?.name || categorySlug
    : tag
    ? `#${tag}`
    : "All Posts";

  return (
    <BlogLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced header */}
        <div className="mb-8">
          {(categorySlug || tag) && (
<nav aria-label="Breadcrumb" className="mb-3 text-sm text-[var(--color-ink-muted)]">
               <ol className="flex items-center gap-1">
                 <li><a href="/blog" className="hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-sm">Blog</a></li>
                <li aria-hidden>/</li>
                <li className="text-[var(--color-ink)]">{pageTitle}</li>
              </ol>
            </nav>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-ink)]">{pageTitle}</h1>
              {total > 0 && (
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{total} post{total !== 1 ? "s" : ""}</p>
              )}
            </div>
            <div className="w-full sm:w-80">
              <SearchInput placeholder="Filter articles..." />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
          {/* Posts grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-dashed border-[var(--color-border)]">
                <Filter size={32} strokeWidth={1} className="mx-auto text-[var(--color-ink-muted)] mb-3" />
                <p className="text-[var(--color-ink-muted)]">No posts found.</p>
<a href="/blog" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-sm">
                   Browse all posts
                 </a>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {posts.map((post) => <PostCard key={post.slug} post={post} variant="grid" />)}
                </div>
                {totalPages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border border-[var(--color-border)] p-2.5 disabled:opacity-40 hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/30 transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} strokeWidth={1.5} />
                    </button>
                    <span className="text-sm text-[var(--color-ink-muted)] px-4">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-lg border border-[var(--color-border)] p-2.5 disabled:opacity-40 hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/30 transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                      aria-label="Next page"
                    >
                      <ChevronRight size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <aside className="hidden lg:block space-y-8">
            <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
              <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
                <TrendingUp size={14} strokeWidth={1.5} className="text-[var(--color-accent)]" />
                Categories
              </h2>
              <ul className="space-y-1.5">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <a
                      href={`/blog/category/${cat.slug}`}
                      className={`text-sm block py-1.5 px-2 rounded-md transition-all ${
                        categorySlug === cat.slug
                          ? "font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                          : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
                      }`}
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {tags.length > 0 && (
              <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
                  <Filter size={14} strokeWidth={1.5} className="text-[var(--color-accent)]" />
                  Popular Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => <TagPill key={t} tag={t} />)}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </BlogLayout>
  );
}
