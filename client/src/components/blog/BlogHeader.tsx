import { Link, useLocation } from "wouter";
import { useState } from "react";
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/blog" className="flex items-center gap-2 font-bold text-lg text-[var(--color-ink)]">
          <span className="text-[var(--color-accent)]">Open</span>Interview Blog
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm transition-colors hover:text-[var(--color-accent)]",
                location === href
                  ? "font-semibold text-[var(--color-accent)] underline underline-offset-4"
                  : "text-[var(--color-ink-muted)]"
              )}
              aria-current={location === href ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/blog/search"
            className="rounded-md p-2 text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] transition-colors"
            aria-label="Search"
          >
            <Search size={18} strokeWidth={1.5} />
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
          >
            {mobileOpen ? <X size={18} strokeWidth={1.5} /> : <Menu size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav
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
