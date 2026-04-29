import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { BlogLayout, ArticleLayout } from "@/components/blog/BlogLayout";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ReadingProgressBar } from "@/components/blog/ReadingProgressBar";
import { PostCard, CategoryBadge, TagPill, type PostCardData } from "@/components/blog/PostCard";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import { BlogKnowledgeCheck } from "@/components/blog/BlogKnowledgeCheck";
import { blogQuizzes } from "@/data/blog-quizzes";
import { Calendar, Clock, Twitter, Linkedin, Link2, ArrowLeft, ArrowRight, Share2 } from "lucide-react";

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

export default function PostDetailPage({ slug }: PostDetailPageProps) {
  const [post, setPost] = useState<PostData | null>(null);
  const [related, setRelated] = useState<PostCardData[]>([]);
  const [prevPost, setPrevPost] = useState<PostCardData | null>(null);
  const [nextPost, setNextPost] = useState<PostCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setLoading(true);
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
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const copyLink = () => navigator.clipboard.writeText(window.location.href);

  if (notFound) {
    return (
      <BlogLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">Post not found</h1>
          <Link href="/blog" className="mt-6 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
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
          <div className="min-h-[48px] h-8 w-3/4 rounded bg-[var(--color-border)]" />
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

  const toc = <TableOfContents contentRef={articleRef as React.RefObject<HTMLElement>} />;

  return (
    <BlogLayout>
      <ReadingProgressBar />

      {/* Cover image with gradient overlay */}
      {post.coverImage && (
        <div className="w-full aspect-[21/9] overflow-hidden bg-[var(--color-border)] relative">
          <img
            src={post.coverImage}
            alt={`Cover image: ${post.title}`}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            width={1400}
            height={600}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)]/60 to-transparent" />
        </div>
      )}

      <ArticleLayout sidebar={toc}>
        {/* Back link */}
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors mb-6 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
          <ArrowLeft size={14} strokeWidth={1.5} /> Back to Blog
        </Link>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[var(--color-ink-muted)]">
          <ol className="flex items-center gap-1">
            <li><Link href="/blog" className="hover:text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 rounded-sm">Blog</Link></li>
            <li aria-hidden>/</li>
            <li><CategoryBadge category={post.category} /></li>
            <li aria-hidden>/</li>
            <li className="text-[var(--color-ink)] truncate max-w-[200px]">{post.title}</li>
          </ol>
        </nav>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-[var(--color-ink)] leading-tight mb-4" style={{ fontFamily: "var(--font-blog-heading)" }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-ink-muted)] mb-8 pb-8 border-b border-[var(--color-border)]">
          <span className="font-medium text-[var(--color-ink)]">{post.author}</span>
          <span className="flex items-center gap-1">
            <Calendar size={14} strokeWidth={1.5} aria-hidden />
            {formatDate(post.publishedAt)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={14} strokeWidth={1.5} aria-hidden />
            {post.readingTimeMinutes} min read
          </span>
        </div>

        {/* Article body with optimized typography */}
        <article
          ref={articleRef}
          className="prose prose-lg max-w-none leading-relaxed"
          style={{ 
            maxWidth: "68ch", 
            lineHeight: "1.8",
            fontSize: "1.125rem"
          }}
        >
          <div className="prose-headings:font-bold prose-headings:text-[var(--color-ink)] prose-p:text-[var(--color-ink-muted)] prose-a:text-[var(--color-accent)] prose-a:no-underline hover:prose-a:underline prose-code:text-[var(--color-accent)] prose-code:bg-[var(--color-surface-raised)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-pre:bg-[var(--color-surface-raised)] prose-pre:rounded-xl prose-pre:text-[var(--color-ink)]">
            <MarkdownRenderer content={post.content} />
          </div>
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

        {/* Share */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)]">
          <p className="text-sm font-medium text-[var(--color-ink)] mb-3 flex items-center gap-2">
            <Share2 size={14} strokeWidth={1.5} /> Share this post
          </p>
          <div className="flex gap-2 flex-wrap">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/30 transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              aria-label="Share on Twitter"
            >
              <Twitter size={16} strokeWidth={1.5} /> Twitter
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/30 transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              aria-label="Share on LinkedIn"
            >
              <Linkedin size={16} strokeWidth={1.5} /> LinkedIn
            </a>
            <button
              onClick={copyLink}
              className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-accent)]/30 transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
              aria-label="Copy link"
            >
              <Link2 size={16} strokeWidth={1.5} /> Copy link
            </button>
          </div>
        </div>

        {/* Enhanced Author card */}
        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface)] p-6">
          <AuthorCard 
            author={{
              name: post.author,
              bio: "Software engineer and technical writer sharing insights on engineering, cloud, and career growth.",
              twitterHandle: undefined
            }}
            variant="full"
          />
        </div>

        {/* Prev/Next navigation */}
        {(prevPost || nextPost) && (
          <nav className="mt-10 flex gap-4" aria-label="Post navigation">
            {prevPost ? (
               <Link href={`/blog/${prevPost.slug}`} className="flex-1 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)]/30 transition-all focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                <ArrowLeft size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="block text-xs text-[var(--color-accent)] uppercase tracking-wide">Previous</span>
                  <span className="block truncate font-medium">{prevPost.title}</span>
                </div>
              </Link>
            ) : <div className="flex-1" />}
            {nextPost ? (
               <Link href={`/blog/${nextPost.slug}`} className="flex-1 flex items-center justify-end gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)]/30 transition-all text-right focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">
                <div className="min-w-0">
                  <span className="block text-xs text-[var(--color-accent)] uppercase tracking-wide">Next</span>
                  <span className="block truncate font-medium">{nextPost.title}</span>
                </div>
                <ArrowRight size={16} strokeWidth={1.5} className="shrink-0 mt-0.5" />
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
