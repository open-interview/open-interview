import { Link } from "wouter";
import { Brain, Github, ExternalLink } from "lucide-react";

export function FaceliftFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="size-6 rounded-lg bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center">
            <Brain className="size-3.5 text-white" />
          </div>
          <span>Open Interview &copy; {year}</span>
        </div>

        {/* Links */}
        <nav className="flex items-center gap-5 text-xs text-muted-foreground" aria-label="Footer navigation">
          <Link href="/about" className="hover:text-foreground transition-colors duration-150">
            About
          </Link>
          <Link href="/admin/docs" className="hover:text-foreground transition-colors duration-150">
            Docs
          </Link>
          <Link href="/blog" className="hover:text-foreground transition-colors duration-150">
            Blog
          </Link>
          <a
            href="https://github.com/open-interview/open-interview"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors duration-150"
          >
            <Github className="size-3.5" />
            GitHub
            <ExternalLink className="size-2.5 opacity-50" />
          </a>
        </nav>
      </div>
    </footer>
  );
}

export default FaceliftFooter;
