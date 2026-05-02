import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function StatsRedirect() {
  const [, nav] = useLocation();
  useEffect(() => {
    const t = setTimeout(() => nav('/profile'), 1500);
    return () => clearTimeout(t);
  }, [nav]);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-center px-4">
      <p className="text-muted-foreground text-sm">
        Stats have moved to your <strong className="text-foreground">Profile</strong> page.
      </p>
      <p className="text-xs text-muted-foreground/60">Redirecting…</p>
    </div>
  );
}
