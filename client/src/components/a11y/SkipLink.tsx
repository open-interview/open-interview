import { useEffect, useRef } from 'react';

interface SkipLinkItem {
  href: string;
  label: string;
}

const skipLinks: SkipLinkItem[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#main-nav', label: 'Skip to main navigation' },
  { href: '#footer', label: 'Skip to footer' },
];

export function SkipLink() {
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Ensure skip links are the very first focusable elements when tabbing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        const activeElement = document.activeElement;
        const skipContainer = document.getElementById('skip-link-container');
        if (skipContainer && !skipContainer.contains(activeElement)) {
          e.preventDefault();
          firstLinkRef.current?.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      id="skip-link-container"
      className="fixed top-0 left-0 z-[9999] flex gap-2 p-2"
      role="navigation"
      aria-label="Skip links"
    >
      {skipLinks.map((link, index) => (
        <a
          key={link.href}
          ref={index === 0 ? firstLinkRef : undefined}
          href={link.href}
          className="
            -translate-y-full absolute
            px-6 py-3
            bg-primary text-primary-foreground
            font-medium text-sm
            rounded-b-xl
            shadow-lg
            focus-visible:translate-y-0
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            transition-transform duration-200
            min-h-[48px] min-w-[48px]
            flex items-center justify-center
          "
          onClick={(e) => {
            e.preventDefault();
            const targetId = link.href.replace('#', '');
            const target = document.getElementById(targetId);
            if (target) {
              target.setAttribute('tabindex', '-1');
              target.focus();
              window.scrollTo({
                top: target.getBoundingClientRect().top + window.scrollY,
                behavior: 'smooth'
              });
              // Remove tabindex after focus leaves
              target.addEventListener('blur', () => {
                target.removeAttribute('tabindex');
              }, { once: true });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
