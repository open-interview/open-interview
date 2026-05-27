export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-2 left-2 z-50 rounded-md bg-white px-4 py-2 text-sm font-medium text-black shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      Skip to content
    </a>
  );
}
