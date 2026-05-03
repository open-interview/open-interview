import { useEffect, useState } from "react";
import { useSearch } from "wouter";
import { BlogLayout } from "@/components/blog/BlogLayout";
import { PostCard, PostCardSkeleton, type PostCardData } from "@/components/blog/PostCard";
import { SearchInput } from "@/components/blog/SearchInput";
import { EmptyState } from "@/components/blog/EmptyState";
import { BookOpen } from "lucide-react";
import { searchPosts } from "@/lib/blog-loader";

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
    searchPosts(query)
      .then((data) => setResults(data))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <BlogLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Search Articles</h1>
        <p className="text-muted-foreground mb-6">Find system design breakdowns, coding patterns, and interview strategies.</p>
        <SearchInput defaultValue={query} autoFocus />

        <div className="mt-8" data-testid="search-results-container" data-loading={loading ? "true" : "false"} data-searched={searched ? "true" : "false"}>
          {loading && (
            <div className="space-y-0">
              {Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <EmptyState
              icon={<BookOpen size={24} className="text-[var(--color-ink-muted)]" />}
              title="No results found"
              description={
                <>
                  No results for <strong className="text-[var(--color-ink)]">"{query}"</strong>
                  <br />
                  Try broader terms like &quot;system design&quot; or &quot;dynamic programming&quot;, or{" "}
                  <a href="/blog" className="text-[var(--color-accent)] hover:underline">
                    browse all articles
                  </a>
                  .
                </>
              }
            />
          )}

          {!loading && results.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                <strong className="text-foreground">"{query}"</strong>
              </p>
              <div className="space-y-0">
                {results.map((post) => (
                  <PostCard key={post.slug} post={post} variant="list" />
                ))}
              </div>
            </>
          )}

          {!searched && query.trim().length === 1 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Type at least 2 characters to search.
            </p>
          )}

          {!searched && query.trim().length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Search across all articles — try a topic, technology, or concept.
            </p>
          )}
        </div>
      </div>
    </BlogLayout>
  );
}
