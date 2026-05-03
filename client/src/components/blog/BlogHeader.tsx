import { Link, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Search, Sun, Moon, Menu, X } from "lucide-react";
import { useBlogTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/blog", label: "Blog" },
  { href: "/blog/category/engineering", label: "Engineering" },
  { href: "/blog/category/devops", label: "DevOps" },
  { href: "/blog/category/cloud", label: "Cloud" },
  { href: "/about-blog", label: "About" },
];

export function BlogHeader() {
  const [location] = useLocation();
  const { theme, toggle } = useBlogTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header role="banner" className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/blog" className="flex items-center gap-2 font-bold text-lg text-[var(--color-ink)] hover:opacity-80 transition-opacity">
          <span className="text-[var(--color-accent)]">Open</span>Interview
          <span className="hidden sm:inline text-[var(--color-ink-muted)] font-normal text-sm">/ Blog</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm transition-colors",
                location === href
                  ? "font-semibold text-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]"
              )}
              aria-current={location === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Link
            href="/blog/search"
            className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-raised)] transition-all"
            aria-label="Search articles"
          >
            <Search size={15} strokeWidth={1.5} />
            <span className="hidden sm:inline text-xs">Search</span>
          </Link>
          <button
            onClick={toggle}
            className="rounded-md p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          </button>
          <button
            className="md:hidden rounded-md p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav
          id="mobile-navigation"
          className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4"
          aria-label="Mobile navigation"
        >
          <ul className="flex flex-col gap-3">
            {NAV_LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "block py-2 text-sm transition-colors",
                    location === href
                      ? "font-semibold text-[var(--color-accent)]"
                      : "text-[var(--color-ink-muted)]"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
