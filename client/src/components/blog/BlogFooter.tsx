import { Link } from "wouter";
import { Github, Twitter, Linkedin, ArrowUp } from "lucide-react";

export function BlogFooter() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] mt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-semibold text-[var(--color-ink)] mb-3">About</h3>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
              OpenInterview Blog — practical engineering insights, interview prep tips, and career advice for software engineers.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="https://github.com/open-interview" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                <Github size={18} strokeWidth={1.5} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                <Twitter size={18} strokeWidth={1.5} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                <Linkedin size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-[var(--color-ink)] mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: "/blog", label: "All Posts" },
                { href: "/blog/category/engineering", label: "Engineering" },
                { href: "/blog/category/devops", label: "DevOps" },
                { href: "/blog/category/cloud", label: "Cloud" },
                { href: "/blog/search", label: "Search" },
                { href: "/about-blog", label: "About" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-semibold text-[var(--color-ink)] mb-3">Stay Updated</h3>
            <p className="text-sm text-[var(--color-ink-muted)] mb-3">
              Get the latest posts delivered to your inbox.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Browse Posts
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
          <p className="text-xs text-[var(--color-ink-muted)]">
            © {new Date().getFullYear()} OpenInterview. MIT License.
          </p>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-1 text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
            aria-label="Back to top"
          >
            <ArrowUp size={14} strokeWidth={1.5} />
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
}
