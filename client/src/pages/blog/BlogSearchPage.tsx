import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard, PostCardSkeleton, type PostCardData } from "@/components/blog/PostCard";
import { SearchInput } from "@/components/blog/SearchInput";

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
        <h1 className="text-3xl font-bold text-[var(--color-ink)] mb-6">Search</h1>
        <SearchInput defaultValue={query} autoFocus />

        <div className="mt-8">
          {loading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[var(--color-ink-muted)]">
                No results for <strong className="text-[var(--color-ink)]">"{query}"</strong>
              </p>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
                Try different keywords or{" "}
                <a href="/blog" className="text-[var(--color-accent)] hover:underline">
                  browse all posts
                </a>
                .
              </p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              <p className="text-sm text-[var(--color-ink-muted)] mb-6">
                {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
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
            <p className="text-center text-sm text-[var(--color-ink-muted)] py-8">
              Type at least 2 characters to search.
            </p>
          )}
        </div>
      </div>
    </BlogLayout>
  );
}
