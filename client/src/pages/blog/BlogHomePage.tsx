import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard, PostCardSkeleton, type PostCardData } from "@/components/blog/PostCard";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BlogHomePage() {
  const [featured, setFeatured] = useState<PostCardData[]>([]);
  const [recent, setRecent] = useState<PostCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/blog/posts/featured").then((r) => r.json()),
      fetch("/api/blog/posts?limit=6").then((r) => r.json()),
      fetch("/api/blog/categories").then((r) => r.json()),
    ])
      .then(([feat, posts, cats]) => {
        setFeatured(feat.data || []);
        setRecent(posts.data || []);
        setCategories(cats.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <BlogLayout>
      {/* Hero */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--color-ink)] leading-tight" style={{ fontFamily: "var(--font-blog-heading)" }}>
            Engineering Insights &<br />
            <span className="text-[var(--color-accent)]">Interview Prep</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-ink-muted)] max-w-2xl mx-auto">
            Practical guides, deep dives, and career advice for software engineers preparing for top tech interviews.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-3 font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Browse All Posts <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
            <Link
              href="/blog/search"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              Search
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* Featured Post */}
        {(loading || featured.length > 0) && (
          <section aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="text-xl font-bold text-[var(--color-ink)] mb-6">
              Featured
            </h2>
            {loading ? (
              <PostCardSkeleton />
            ) : (
              featured[0] && <PostCard post={featured[0]} variant="featured" />
            )}
          </section>
        )}

        {/* Recent Posts Grid */}
        <section aria-labelledby="recent-heading">
          <div className="flex items-center justify-between mb-6">
            <h2 id="recent-heading" className="text-xl font-bold text-[var(--color-ink)]">
              Recent Posts
            </h2>
            <Link href="/blog" className="text-sm text-[var(--color-accent)] hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)
              : recent.map((post) => <PostCard key={post.slug} post={post} variant="grid" />)}
          </div>
        </section>

        {/* Category Pills */}
        {categories.length > 0 && (
          <section aria-labelledby="categories-heading">
            <h2 id="categories-heading" className="text-xl font-bold text-[var(--color-ink)] mb-4">
              Browse by Topic
            </h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog/category/${cat.slug}`}
                  className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-ink-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Newsletter CTA */}
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">Stay in the loop</h2>
          <p className="text-[var(--color-ink-muted)] mb-6 text-sm">
            Get the latest posts delivered to your inbox. No spam, ever.
          </p>
          <div className="max-w-sm mx-auto">
            <NewsletterForm />
          </div>
        </section>
      </div>
    </BlogLayout>
  );
}
