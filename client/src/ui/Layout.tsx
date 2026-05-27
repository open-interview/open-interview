import React, { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, User, ArrowLeft, Menu, Zap, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCredits } from '@/context/RewardContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from '@/components/ui/sidebar';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

const NAV_ITEMS = [
  { icon: BookOpen, label: 'Study', path: '/study' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const Layout = React.memo(function Layout({ children, title, showBack, onBack }: LayoutProps) {
  const [location, setLocation] = useLocation();
  const { balance, formatCredits } = useCredits();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const heading = title ?? (NAV_ITEMS.find(i => location.startsWith(i.path))?.label ?? 'Study');

  const isActive = useCallback(
    (path: string) => {
      if (path === '/study') return location === '/study' || location.startsWith('/study/');
      return location === path;
    },
    [location],
  );

  const handleNav = useCallback(
    (path: string) => {
      setLocation(path);
      setDrawerOpen(false);
    },
    [setLocation],
  );

  const handleBack = useCallback(() => {
    if (onBack) onBack();
    else window.history.back();
  }, [onBack]);

  return (
    <SidebarProvider
      defaultOpen={true}
      style={{ '--sidebar-width': '18rem' } as React.CSSProperties}
    >
      {/* Desktop sidebar */}
      <Sidebar collapsible="none" className="hidden lg:flex border-r border-border/50">
        <SidebarHeader className="p-4">
          <button onClick={() => setLocation('/study')} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Code2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Open Interview</span>
          </button>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                  <SidebarMenuItem key={path}>
                    <SidebarMenuButton
                      isActive={isActive(path)}
                      onClick={() => setLocation(path)}
                      size="lg"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-border/50">
          <button
            onClick={() => setLocation('/profile')}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
          >
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium">Profile</p>
              <p className="text-xs text-amber-500 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-500" />
                {formatCredits(balance)}
              </p>
            </div>
          </button>
        </SidebarFooter>
      </Sidebar>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-12 glass-nav flex items-center px-4 gap-3">
          {showBack && (
            <button
              aria-label="Go back"
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 -ml-1 rounded-lg hover:bg-accent"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-base font-semibold flex-1 truncate">{heading}</h1>

          <button
            aria-label={`Credits: ${formatCredits(balance)}`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-500" />
            {formatCredits(balance)}
          </button>

          {/* Mobile hamburger menu */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger className="flex lg:hidden items-center justify-center w-9 h-9 rounded-lg hover:bg-accent">
              <Menu className="w-5 h-5" />
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Navigation</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-1">
                {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
                  <button
                    key={path}
                    onClick={() => handleNav(path)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left',
                      isActive(path)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-accent text-muted-foreground',
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </header>

        {/* Skip to content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>

        {/* Content */}
        <main id="main-content" className="flex-1 pb-14 lg:pb-0 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden h-14 glass-nav border-t border-white/5 safe-bottom flex items-center justify-around px-2"
      >
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <button
            key={path}
            aria-current={isActive(path) ? 'page' : undefined}
            onClick={() => setLocation(path)}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 px-4 min-w-[72px] h-full rounded-lg transition-colors',
              isActive(path)
                ? 'text-primary glow-violet'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        ))}
      </nav>
    </SidebarProvider>
  );
});
