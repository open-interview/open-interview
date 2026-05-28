import React, { useState, useRef } from 'react';
import type { FilterState } from '@/types/swipe';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { ChevronDown, Plus } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  color: string;
  category: string;
}

interface Certification {
  id: string;
  name: string;
  color: string;
}

interface FilterStripProps {
  channels: Channel[];
  certifications: Certification[];
  activeFilter: FilterState;
  onFilterChange: (filter: FilterState) => void;
  onCreateCard?: () => void;
}

const MODE_OPTIONS: Array<{ value: FilterState['mode']; label: string }> = [
  { value: 'due', label: 'Due' },
  { value: 'browse', label: 'Browse' },
  { value: 'new', label: 'New' },
];

export const FilterStrip = React.memo(function FilterStrip({
  channels,
  certifications,
  activeFilter,
  onFilterChange,
  onCreateCard,
}: FilterStripProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const topicChannels = channels.filter((c) => c.category === 'topic');
  const maxVisible = isMobile ? 4 : 7;
  const visibleChannels = topicChannels.length > maxVisible ? topicChannels.slice(0, maxVisible) : topicChannels;
  const hasMore = topicChannels.length > maxVisible;

  const isAllActive = activeFilter.scope === 'all';
  const isChannelActive = (id: string) =>
    activeFilter.scope === 'topic' && activeFilter.channelId != null && activeFilter.channelId === id;
  const isCertActive = (id: string) =>
    activeFilter.scope === 'cert' && activeFilter.certId != null && activeFilter.certId === id;

  const handleAll = () =>
    onFilterChange({ ...activeFilter, scope: 'all', channelId: undefined, certId: undefined });
  const handleChannel = (id: string) =>
    onFilterChange({ ...activeFilter, scope: 'topic', channelId: id, certId: undefined });
  const handleCert = (id: string) =>
    onFilterChange({ ...activeFilter, scope: 'cert', certId: id, channelId: undefined });
  const handleMode = (mode: FilterState['mode']) =>
    onFilterChange({ ...activeFilter, mode });

  const chipBase = cn(
    'inline-flex items-center justify-center h-8 px-3.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer select-none border',
  );

  const chip = (active: boolean) =>
    cn(
      chipBase,
      active
        ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 border-violet-500/25 text-violet-300 shadow-sm'
        : 'bg-transparent border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40 hover:bg-accent/30',
    );

  const modeBtnBase = cn(
    'inline-flex items-center justify-center h-7 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer border',
  );

  const moreChannels = isMobile ? topicChannels.slice(4) : [];
  const moreCerts = certifications;

  if (channels.length === 0) {
    return (
      <div className="flex items-center gap-2 py-1.5" data-pagefind-ignore>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1">
          <button type="button" className={cn(chip(isAllActive))} onClick={handleAll}>All</button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {MODE_OPTIONS.map((opt) => (
            <button key={opt.value} type="button" className={cn(modeBtnBase, activeFilter.mode === opt.value ? 'bg-violet-500/15 border-violet-500/25 text-violet-300' : 'bg-transparent border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40')} onClick={() => handleMode(opt.value)}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1.5" data-pagefind-ignore>
      <div ref={scrollRef} className={cn('flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth flex-1')}>
        <button type="button" className={cn(chip(isAllActive))} onClick={handleAll}>
          All
        </button>
        {visibleChannels.map((ch) => (
          <button key={ch.id} type="button" className={cn(chip(isChannelActive(ch.id)))} style={isChannelActive(ch.id) && ch.color ? { boxShadow: `inset 0 -2px 0 ${ch.color}` } : undefined} onClick={() => handleChannel(ch.id)}>
            {ch.name}
          </button>
        ))}
        {!isMobile && certifications.map((cert) => (
          <button key={cert.id} type="button" className={cn(chip(isCertActive(cert.id)))} style={isCertActive(cert.id) && cert.color ? { boxShadow: `inset 0 -2px 0 ${cert.color}` } : undefined} onClick={() => handleCert(cert.id)}>
            {cert.name}
          </button>
        ))}
        {hasMore && (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button type="button" className={cn(chipBase, 'bg-transparent border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40 flex items-center gap-1')}>
                More <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filters</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-4">
                {moreChannels.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-2">
                      {moreChannels.map((ch) => (
                        <DrawerClose key={ch.id} asChild>
                          <button type="button" className={cn(chipBase, isChannelActive(ch.id) ? 'bg-violet-500/15 border-violet-500/25 text-violet-300' : 'bg-transparent border-border/20 text-muted-foreground', 'text-sm')} onClick={() => handleChannel(ch.id)}>
                            {ch.name}
                          </button>
                        </DrawerClose>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Certifications</h4>
                  <div className="flex flex-wrap gap-2">
                    {moreCerts.map((cert) => (
                      <DrawerClose key={cert.id} asChild>
                        <button type="button" className={cn(chipBase, isCertActive(cert.id) ? 'bg-violet-500/15 border-violet-500/25 text-violet-300' : 'bg-transparent border-border/20 text-muted-foreground', 'text-sm')} onClick={() => handleCert(cert.id)}>
                          {cert.name}
                        </button>
                      </DrawerClose>
                    ))}
                  </div>
                </div>
                {onCreateCard && (
                  <div className="pt-3 border-t border-border/20">
                    <DrawerClose asChild>
                      <button type="button" className={cn(chipBase, 'w-full justify-center text-muted-foreground hover:text-foreground hover:bg-accent/30')} onClick={onCreateCard} aria-label="Create card">
                        <Plus className="w-4 h-4 mr-1" /> Create Card
                      </button>
                    </DrawerClose>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {MODE_OPTIONS.map((opt) => (
          <button key={opt.value} type="button" className={cn(modeBtnBase, activeFilter.mode === opt.value ? 'bg-violet-500/15 border-violet-500/25 text-violet-300' : 'bg-transparent border-border/20 text-muted-foreground hover:text-foreground hover:border-border/40')} onClick={() => handleMode(opt.value)}>
            {opt.label}
          </button>
        ))}
        {onCreateCard && (
          <button type="button" className={cn('inline-flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent/30')} onClick={onCreateCard} aria-label="Create card">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
});
