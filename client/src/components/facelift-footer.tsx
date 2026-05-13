import { Link } from "wouter";

export function FaceliftFooter() {
  return (
    <footer className="border-t border-border/30 py-4 px-6 flex items-center justify-between text-xs text-muted-foreground mt-auto">
      <span>© {new Date().getFullYear()} Open Interview</span>
      <div className="flex gap-4">
        <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link href="/docs" className="hover:text-foreground transition-colors">Docs</Link>
        <a href="https://github.com/open-interview/open-interview" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
      </div>
    </footer>
  );
}

export default FaceliftFooter;
