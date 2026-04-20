import { BlogHeader } from "./BlogHeader";
import { BlogFooter } from "./BlogFooter";
import { BlogThemeProvider } from "./ThemeProvider";

interface BlogLayoutProps {
  children: React.ReactNode;
}

export function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <BlogThemeProvider>
      <div className="min-h-dvh flex flex-col bg-[var(--color-surface)] text-[var(--color-ink)]">
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <BlogHeader />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <BlogFooter />
      </div>
    </BlogThemeProvider>
  );
}

interface ArticleLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

export function ArticleLayout({ children, sidebar }: ArticleLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className={sidebar ? "grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12" : ""}>
        <article className="min-w-0">{children}</article>
        {sidebar && (
          <aside className="hidden lg:block">
            <div className="sticky top-24">{sidebar}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
