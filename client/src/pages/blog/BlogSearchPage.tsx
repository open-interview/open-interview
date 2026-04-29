import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard, PostCardSkeleton, type PostCardData } from "@/components/blog/PostCard";
import { SearchInput } from "@/components/blog/SearchInput";
import { Search, FileQuestion } from "lucide-react";

export default function BlogSearchPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const query = params.get("q") || "";

  const [results, setResults] = useState<PostCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    fetch(`/api/blog/search?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => setResults(data.data || []))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <BlogLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[var(--color-ink)] mb-2 flex items-center gap-3">
            <Search size={28} strokeWidth={1.5} className="text-[var(--color-accent)]" />
            Search
          </h1>
          <p className="text-[var(--color-ink-muted)]">
            Find articles, tutorials, and insights
          </p>
        </div>
        <SearchInput defaultValue={query} autoFocus />

        <div className="mt-8">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)]/50">
              <FileQuestion size={40} strokeWidth={1} className="mx-auto text-[var(--color-ink-muted)] mb-4" />
              <p className="text-lg text-[var(--color-ink)] mb-2">
                No results for <strong>"{query}"</strong>
              </p>
              <p className="text-sm text-[var(--color-ink-muted)] mb-6">
                Try different keywords or browse all posts.
              </p>
              <a href="/blog" className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-surface-raised)] transition-all">
                Browse all posts
              </a>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <p className="text-sm text-[var(--color-ink-muted)] mb-6 flex items-center gap-2">
                <span className="font-semibold text-[var(--color-accent)]">{results.length}</span>
                result{results.length !== 1 ? "s" : ""} for{" "}
                <strong className="text-[var(--color-ink)]">"{query}"</strong>
              </p>
              <div className="space-y-0">
                {results.map((post) => (
                  <PostCard key={post.slug} post={post} variant="list" />
                ))}
              </div>
            </>
          )}

          {!searched && (
            <div className="text-center py-16">
              <Search size={48} strokeWidth={1} className="mx-auto text-[var(--color-ink-muted)] mb-4 opacity-50" />
              <p className="text-[var(--color-ink-muted)]">
                Type at least 2 characters to search.
              </p>
            </div>
          )}
        </div>
      </div>
    </BlogLayout>
  );
}
