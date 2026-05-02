import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { BlogLayout, ArticleLayout } from "@/components/blog/BlogLayout";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ReadingProgressBar } from "@/components/blog/ReadingProgressBar";
import { PostCard, CategoryBadge, TagPill, type PostCardData } from "@/components/blog/PostCard";
import { BlogKnowledgeCheck } from "@/components/blog/BlogKnowledgeCheck";
import { blogQuizzes } from "@/data/blog-quizzes";
import { measureBlogPostLoad } from "@/lib/performance";
import { Calendar, Clock, Twitter, Linkedin, Link2, Check, ArrowLeft, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "@/components/blog/ImageWithFallback";

const MarkdownRenderer = lazy(() =>
  import("@/components/blog/MarkdownRenderer").then((m) => ({ default: m.MarkdownRenderer }))
);

interface PostDetailPageProps {
  slug: string;
}

interface PostData extends PostCardData {
  content: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

export default function PostDetailPage({ slug }: PostDetailPageProps) {
  const [post, setPost] = useState<PostData | null>(null);
  const [related, setRelated] = useState<PostCardData[]>([]);
  const [prevPost, setPrevPost] = useState<PostCardData | null>(null);
  const [nextPost, setNextPost] = useState<PostCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLoading(true);
    const markFMP = measureBlogPostLoad(slug);
    fetch(`/api/blog/posts/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setPost(data.data);
        setRelated(data.related || []);
        setPrevPost(data.prev || null);
        setNextPost(data.next || null);
        markFMP();
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (notFound) {
    return (
      <BlogLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">Post not found</h1>
          <Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline">
            <ArrowLeft size={16} strokeWidth={1.5} /> Back to Blog
          </Link>
        </div>
      </BlogLayout>
    );
  }

  if (loading || !post) {
    return (
      <BlogLayout>
        <div className="mx-auto max-w-3xl px-4 py-12 animate-pulse space-y-4">
          <div className="aspect-video rounded-xl bg-[var(--color-border)]" />
          <div className="h-8 w-3/4 rounded bg-[var(--color-border)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--color-border)]" />
          <div className="space-y-2 mt-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-[var(--color-border)]" style={{ width: `${70 + Math.random() * 30}%` }} />
            ))}
          </div>
        </div>
      </BlogLayout>
    );
  }

  const readingTime = post.readingTimeMinutes ?? calcReadingTime(post.content);
  const toc = <TableOfContents contentRef={articleRef as React.RefObject<HTMLElement>} />;

  return (
    <BlogLayout>
      <ReadingProgressBar />

      {/* Cover image */}
      {post.coverImage && (
        <div className="w-full aspect-[21/9] overflow-hidden bg-[var(--color-border)]">
          <ImageWithFallback
            src={post.coverImage}
            alt={post.title}
            category={post.category}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <ArticleLayout sidebar={toc}>
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors mb-6">
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to Blog
        </Link>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[var(--color-ink-muted)]">
          <ol className="flex items-center gap-1">
            <li><Link href="/blog" className="hover:text-[var(--color-accent)]">Blog</Link></li>
            <li aria-hidden>/</li>
            <li><CategoryBadge category={post.category} /></li>
            <li aria-hidden>/</li>
            <li className="text-[var(--color-ink)] truncate max-w-[200px]">{post.title}</li>
          </ol>
        </nav>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-ink)] leading-tight mb-4 font-blog-heading">
          {post.title}
        </h1>

        {/* Meta + Share */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-8 border-b border-[var(--color-border)]">
          <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-ink-muted)]">
            <span className="font-medium text-[var(--color-ink)]">{post.author}</span>
            <span className="flex items-center gap-1">
              <Calendar size={14} strokeWidth={1.5} aria-hidden />
              {formatDate(post.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-full px-2.5 py-0.5">
              <Clock size={13} strokeWidth={1.5} aria-hidden />
              {readingTime} min read
            </span>
          </div>
          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
              aria-label="Share on Twitter"
            >
              <Twitter size={13} strokeWidth={1.5} />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
              aria-label="Share on LinkedIn"
            >
              <Linkedin size={13} strokeWidth={1.5} />
            </a>
            <button
              onClick={copyLink}
              className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                linkCopied
                  ? "border-green-400/50 bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400"
                  : "border-[var(--color-border)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]"
              }`}
              aria-label="Copy link"
            >
              {linkCopied
                ? <><Check size={13} strokeWidth={1.5} /> Copied!</>
                : <><Link2 size={13} strokeWidth={1.5} /> Copy link</>}
            </button>
          </div>
        </div>

        {/* Article body */}
        <article
          ref={articleRef}
          className="min-w-0"
          style={{ maxWidth: "68ch", lineHeight: "1.75" }}
        >
          <Suspense fallback={
            <div className="animate-pulse space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-[var(--color-border)]" style={{ width: `${60 + (i * 7) % 40}%` }} />
              ))}
            </div>
          }>
            <MarkdownRenderer content={post.content} />
          </Suspense>
        </article>

        {/* Knowledge Check */}
        {blogQuizzes[post.slug] && (
          <BlogKnowledgeCheck questions={blogQuizzes[post.slug].questions} />
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
          </div>
        )}

        {/* Prev/Next navigation */}
        {(prevPost || nextPost) && (
          <nav className="mt-10 flex gap-4" aria-label="Post navigation">
            {prevPost ? (
              <Link href={`/blog/${prevPost.slug}`} className="flex-1 flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-border)] transition-colors">
                <ArrowLeft size={14} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate">{prevPost.title}</span>
              </Link>
            ) : <div className="flex-1" />}
            {nextPost ? (
              <Link href={`/blog/${nextPost.slug}`} className="flex-1 flex items-center justify-end gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-border)] transition-colors text-right">
                <span className="truncate">{nextPost.title}</span>
                <ArrowRight size={14} strokeWidth={1.5} className="shrink-0" />
              </Link>
            ) : <div className="flex-1" />}
          </nav>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-12" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-bold text-[var(--color-ink)] mb-6">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} variant="grid" />
              ))}
            </div>
          </section>
        )}
      </ArticleLayout>
    </BlogLayout>
  );
}
