import { BlogLayout } from "@/components/blog/BlogLayout";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import { Github, Twitter, Mail } from "lucide-react";

export default function AboutBlogPage() {
  return (
    <BlogLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-[var(--color-ink)] mb-6" style={{ fontFamily: "var(--font-blog-heading)" }}>
          About This Blog
        </h1>

        <div className="prose max-w-none text-[var(--color-ink-muted)] leading-relaxed space-y-6">
          <p>
            The OpenInterview Blog is a resource for software engineers preparing for technical interviews and growing their careers. We publish practical guides, deep dives, and career advice covering system design, cloud platforms, DevOps, frontend, backend, and AI/ML.
          </p>
          <p>
            Our content is written by engineers who have been through the interview process at top tech companies and want to share what they've learned.
          </p>
        </div>

        {/* Author */}
        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-[var(--color-accent)]/20 flex items-center justify-center text-[var(--color-accent)] font-bold text-2xl shrink-0">
              OI
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--color-ink)]">OpenInterview Team</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-muted)] leading-relaxed">
                We're a team of engineers passionate about making technical interview prep accessible to everyone. Our platform has helped thousands of engineers land jobs at top tech companies.
              </p>
              <div className="mt-4 flex gap-4">
                <a href="https://github.com/open-interview" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors">
                  <Github size={16} strokeWidth={1.5} /> GitHub
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors">
                  <Twitter size={16} strokeWidth={1.5} /> Twitter
                </a>
                <a href="mailto:hello@openinterview.dev" className="flex items-center gap-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors">
                  <Mail size={16} strokeWidth={1.5} /> Contact
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-8">
          <h2 className="text-xl font-bold text-[var(--color-ink)] mb-2">Stay Updated</h2>
          <p className="text-sm text-[var(--color-ink-muted)] mb-6">
            Subscribe to get new posts delivered to your inbox.
          </p>
          <NewsletterForm />
        </div>
      </div>
    </BlogLayout>
  );
}
