/**
 * Desktop Sidebar Wrapper
 * Adds the collapsible sidebar to pages that don't use AppLayout
 * Use this for full-screen pages like CodingChallenge, VoiceInterview, etc.
 */

import { useState, useEffect } from 'react';
import { DesktopSidebar } from './UnifiedNav';
import { UnifiedSearch } from '../UnifiedSearch';
import { useSidebar } from '../../context/SidebarContext';
import { cn } from '../../lib/utils';

interface DesktopSidebarWrapperProps {
  children: React.ReactNode;
}

export function DesktopSidebarWrapper({ children }: DesktopSidebarWrapperProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const { isCollapsed } = useSidebar();

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopSidebar onSearchClick={() => setSearchOpen(true)} />
      </div>

      {/* Main content area - adjusts based on sidebar collapsed state */}
      <div className={cn(
        "min-h-screen transition-all duration-200",
        isCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {children}
      </div>

      {/* Search Modal */}
      <UnifiedSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
