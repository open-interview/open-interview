import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { BlogLayout, ArticleLayout } from "@/components/blog/BlogLayout";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ReadingProgressBar } from "@/components/blog/ReadingProgressBar";
import { PostCard, CategoryBadge, TagPill, type PostCardData } from "@/components/blog/PostCard";
import { BlogKnowledgeCheck } from "@/components/blog/BlogKnowledgeCheck";
import { blogQuizzes } from "@/data/blog-quizzes";
import { measureBlogPostLoad } from "@/lib/performance";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ArrowLeft, ArrowRight, Twitter, Linkedin, Link2, Check, Calendar, Clock, List, Share2, BookmarkPlus, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

const MarkdownRenderer = lazy(() =>
  import("@/components/blog/MarkdownRenderer").then((m) => ({ default: m.MarkdownRenderer }))
);

interface PostFaceliftPageProps {
  slug: string;
}

interface PostData extends PostCardData {
  content: string;
  subtitle?: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | "expert";
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

const difficultyConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
  beginner: {
    label: "Beginner",
    bg: "bg-[var(--color-difficulty-beginner)]/10",
    text: "text-[var(--color-difficulty-beginner)]",
    border: "border-[var(--color-difficulty-beginner)]/30",
  },
  intermediate: {
    label: "Intermediate",
    bg: "bg-[var(--color-difficulty-intermediate)]/10",
    text: "text-[var(--color-difficulty-intermediate)]",
    border: "border-[var(--color-difficulty-intermediate)]/30",
  },
  advanced: {
    label: "Advanced",
    bg: "bg-[var(--color-difficulty-advanced)]/10",
    text: "text-[var(--color-difficulty-advanced)]",
    border: "border-[var(--color-difficulty-advanced)]/30",
  },
  expert: {
    label: "Expert",
    bg: "bg-[var(--color-difficulty-expert,var(--color-difficulty-advanced))]/10",
    text: "text-[var(--color-difficulty-expert,var(--color-difficulty-advanced))]",
    border: "border-[var(--color-difficulty-expert,var(--color-difficulty-advanced))]/30",
  },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = difficultyConfig[difficulty];
  if (!config) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", config.bg, config.text, config.border)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}

export default function PostFaceliftPage({ slug }: PostFaceliftPageProps) {
  const [post, setPost] = useState<PostData | null>(null);
  const [related, setRelated] = useState<PostCardData[]>([]);
  const [prevPost, setPrevPost] = useState<PostCardData | null>(null);
  const [nextPost, setNextPost] = useState<PostCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const [, setLocation] = useLocation();

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

  const shareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(post?.title || "")}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (notFound) {
    return (
      <BlogLayout>
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)]">
            <svg className="h-8 w-8 text-[var(--color-ink-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75v10.5m0 0l-3-3m3 3l3-3M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">Post not found</h1>
          <p className="mt-3 text-[var(--color-ink-muted)]">The article you're looking for doesn't exist or has been moved.</p>
          <Link href="/blog" className="mt-8 inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline font-medium">
            <ArrowLeft size={16} strokeWidth={1.5} /> Back to Blog
          </Link>
        </div>
      </BlogLayout>
    );
  }

  if (loading || !post) {
    return (
      <BlogLayout>
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="aspect-[21/9] rounded-2xl bg-[var(--color-border)]" />
            <div className="flex gap-4">
              <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
              <div className="h-4 w-24 rounded bg-[var(--color-border)]" />
            </div>
            <div className="h-10 w-3/4 rounded bg-[var(--color-border)]" />
            {post?.subtitle && <div className="h-6 w-1/2 rounded bg-[var(--color-border)]" />}
            <div className="space-y-3 mt-8">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-[var(--color-border)]" style={{ width: `${60 + Math.random() * 40}%` }} />
              ))}
            </div>
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

      {/* Cover image with gradient overlay */}
      {post.coverImage && (
        <div className="relative w-full aspect-[21/9] overflow-hidden bg-[var(--color-border)]">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
            fetchPriority="high"
            decoding="async"
            width={1400}
            height={600}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/30 to-transparent" />
        </div>
      )}

      <ArticleLayout sidebar={toc}>
        {/* Back navigation + breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors mb-4">
            <ArrowLeft size={14} strokeWidth={1.5} /> Back to Blog
          </Link>
          <ol className="flex items-center gap-1.5 text-xs text-[var(--color-ink-muted)]">
            <li><Link href="/blog" className="hover:text-[var(--color-accent)] transition-colors">Blog</Link></li>
            <li aria-hidden="true" className="text-[var(--color-border)]">/</li>
            <li><CategoryBadge category={post.category} /></li>
            <li aria-hidden="true" className="text-[var(--color-border)]">/</li>
            <li className="text-[var(--color-ink)] truncate max-w-[200px] font-medium">{post.title}</li>
          </ol>
        </nav>

        {/* Article header */}
        <header className="mb-10">
          {/* Category + difficulty + tags row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <CategoryBadge category={post.category} />
            {post.difficulty && <DifficultyBadge difficulty={post.difficulty} />}
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-ink)] leading-tight tracking-tight" style={{ fontFamily: "var(--font-blog-heading)" }}>
            {post.title}
          </h1>

          {/* Subtitle */}
          {post.subtitle && (
            <p className="mt-4 text-lg sm:text-xl text-[var(--color-ink-muted)] leading-relaxed max-w-3xl">
              {post.subtitle}
            </p>
          )}

          {/* Meta info */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[var(--color-border)]">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {/* Author */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold text-sm ring-2 ring-[var(--color-accent)]/20">
                  {post.author[0]}
                </div>
                <span className="font-semibold text-[var(--color-ink)]">{post.author}</span>
              </div>

              <span className="text-[var(--color-border)]" aria-hidden="true">|</span>

              {/* Date */}
              <span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                <Calendar size={14} strokeWidth={1.5} aria-hidden="true" />
                {formatDate(post.publishedAt)}
              </span>

              {/* Reading time */}
              <span className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)] bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-full px-3 py-1">
                <Clock size={13} strokeWidth={1.5} aria-hidden="true" />
                {readingTime} min read
              </span>
            </div>

            {/* Top share buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={shareTwitter}
                className="h-8 px-3 text-xs gap-1.5 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                aria-label="Share on Twitter"
              >
                <Twitter size={13} strokeWidth={1.5} /> Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={shareLinkedIn}
                className="h-8 px-3 text-xs gap-1.5 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                aria-label="Share on LinkedIn"
              >
                <Linkedin size={13} strokeWidth={1.5} /> LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={copyLink}
                className={cn(
                  "h-8 px-3 text-xs gap-1.5 border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
                  linkCopied && "border-green-400/50 bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400"
                )}
                aria-label="Copy link"
              >
                {linkCopied
                  ? <><Check size={13} strokeWidth={1.5} /> Copied!</>
                  : <><Link2 size={13} strokeWidth={1.5} /> Copy link</>}
              </Button>
            </div>
          </div>
        </header>

        {/* Mobile TOC drawer */}
        <div className="lg:hidden mb-6">
          <Sheet open={tocOpen} onOpenChange={setTocOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between border-[var(--color-border)]">
                <span className="flex items-center gap-2">
                  <List size={14} strokeWidth={1.5} />
                  Table of Contents
                </span>
                <span className="text-[var(--color-ink-muted)] text-xs">Jump to section</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-4">
                  On this page
                </p>
                <TableOfContents contentRef={articleRef as React.RefObject<HTMLElement>} />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Article body with premium typography */}
        <article
          ref={articleRef}
          className="blog-article min-w-0"
          style={{ maxWidth: "68ch" }}
        >
          <Suspense fallback={
            <div className="animate-pulse space-y-3">
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
          <div className="mt-12">
            <BlogKnowledgeCheck questions={blogQuizzes[post.slug].questions} />
          </div>
        )}

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mt-10 pt-8 border-t border-[var(--color-border)]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">Tagged with</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => <TagPill key={tag} tag={tag} />)}
            </div>
          </div>
        )}

        {/* Author bio */}
        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 sm:p-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[var(--color-accent)]/30 to-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold text-xl shrink-0 ring-2 ring-[var(--color-accent)]/20">
              {post.author[0]}
            </div>
            <div>
              <p className="font-semibold text-[var(--color-ink)] text-lg">{post.author}</p>
              <p className="mt-1.5 text-sm text-[var(--color-ink-muted)] leading-relaxed">
                Software engineer and technical writer sharing insights on engineering, cloud, and career growth.
              </p>
              <div className="mt-3 flex gap-3">
                <a href={`https://twitter.com/${post.author.toLowerCase().replace(' ', '')}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors">
                  <Twitter size={16} strokeWidth={1.5} />
                </a>
                <a href={`https://linkedin.com/in/${post.author.toLowerCase().replace(' ', '-')}`} target="_blank" rel="noopener noreferrer" className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors">
                  <Linkedin size={16} strokeWidth={1.5} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Prev/Next navigation */}
        {(prevPost || nextPost) && (
          <nav className="mt-10 flex flex-col sm:flex-row gap-4" aria-label="Post navigation">
            {prevPost ? (
              <Link
                href={`/blog/${prevPost.slug}`}
                className="flex-1 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4 text-sm hover:border-[var(--color-accent)] hover:shadow-md transition-all group"
              >
                <ArrowLeft size={16} strokeWidth={1.5} className="shrink-0 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
                <div className="min-w-0">
                  <p className="text-[var(--color-ink-muted)] text-xs mb-0.5">Previous</p>
                  <p className="font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">{prevPost.title}</p>
                </div>
              </Link>
            ) : <div className="flex-1" />}
            {nextPost ? (
              <Link
                href={`/blog/${nextPost.slug}`}
                className="flex-1 flex items-center justify-end gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-4 text-sm hover:border-[var(--color-accent)] hover:shadow-md transition-all group text-right"
              >
                <div className="min-w-0">
                  <p className="text-[var(--color-ink-muted)] text-xs mb-0.5">Next</p>
                  <p className="font-medium text-[var(--color-ink)] truncate group-hover:text-[var(--color-accent)] transition-colors">{nextPost.title}</p>
                </div>
                <ArrowRight size={16} strokeWidth={1.5} className="shrink-0 text-[var(--color-ink-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
              </Link>
            ) : <div className="flex-1" />}
          </nav>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-16 pt-8 border-t border-[var(--color-border)]" aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-2xl font-bold text-[var(--color-ink)] mb-8" style={{ fontFamily: "var(--font-blog-heading)" }}>
              Related Articles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} variant="grid" />
              ))}
            </div>
          </section>
        )}
      </ArticleLayout>

      {/* Floating share sidebar - desktop only */}
      <div className="hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col gap-1.5 bg-[var(--color-surface)]/90 backdrop-blur-md border border-[var(--color-border)] rounded-2xl p-2 shadow-lg">
          <Button
            variant="ghost"
            size="icon"
            onClick={shareTwitter}
            className="h-10 w-10 rounded-xl text-[var(--color-ink-muted)] hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/10 transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter size={16} strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={shareLinkedIn}
            className="h-10 w-10 rounded-xl text-[var(--color-ink-muted)] hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
            aria-label="Share on LinkedIn"
          >
            <Linkedin size={16} strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyLink}
            className={cn(
              "h-10 w-10 rounded-xl text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 transition-colors",
              linkCopied && "text-green-500"
            )}
            aria-label="Copy link"
          >
            {linkCopied ? <Check size={16} strokeWidth={1.5} /> : <Link2 size={16} strokeWidth={1.5} />}
          </Button>
          <div className="w-full h-px bg-[var(--color-border)] my-1" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={cn(
              "h-10 w-10 rounded-xl transition-colors",
              isBookmarked
                ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10"
            )}
            aria-label={isBookmarked ? "Remove bookmark" : "Bookmark this article"}
          >
            <BookmarkPlus size={16} strokeWidth={isBookmarked ? 2.5 : 1.5} />
          </Button>
        </div>
      </div>
    </BlogLayout>
  );
}
