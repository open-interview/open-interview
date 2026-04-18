import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard, PostCardSkeleton, TagPill, type PostCardData } from "@/components/blog/PostCard";
import { SearchInput } from "@/components/blog/SearchInput";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
        {/* Page header */}
        <div className="mb-8">
          {(categorySlug || tag) && (
            <nav aria-label="Breadcrumb" className="mb-3 text-sm text-[var(--color-ink-muted)]">
              <ol className="flex items-center gap-1">
                <li><a href="/blog" className="hover:text-[var(--color-accent)]">Blog</a></li>
                <li aria-hidden>/</li>
                <li className="text-[var(--color-ink)]">{pageTitle}</li>
              </ol>
            </nav>
          )}
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">{pageTitle}</h1>
          {total > 0 && (
            <p className="mt-1 text-sm text-[var(--color-ink-muted)]">{total} post{total !== 1 ? "s" : ""}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
          {/* Posts grid */}
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[var(--color-ink-muted)]">No posts found.</p>
                <a href="/blog" className="mt-4 inline-block text-sm text-[var(--color-accent)] hover:underline">
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
                      className="rounded-md border border-[var(--color-border)] p-2 disabled:opacity-40 hover:bg-[var(--color-surface-raised)] transition-colors"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} strokeWidth={1.5} />
                    </button>
                    <span className="text-sm text-[var(--color-ink-muted)]">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="rounded-md border border-[var(--color-border)] p-2 disabled:opacity-40 hover:bg-[var(--color-surface-raised)] transition-colors"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} strokeWidth={1.5} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-8">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Search</h2>
              <SearchInput />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Categories</h2>
              <ul className="space-y-1.5">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <a
                      href={`/blog/category/${cat.slug}`}
                      className={`text-sm transition-colors hover:text-[var(--color-accent)] ${
                        categorySlug === cat.slug
                          ? "font-semibold text-[var(--color-accent)]"
                          : "text-[var(--color-ink-muted)]"
                      }`}
                    >
                      {cat.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            {tags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-3">Tags</h2>
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
