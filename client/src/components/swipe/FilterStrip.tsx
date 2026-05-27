import React, { useState, useRef, useEffect } from 'react';
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
  const visibleChannels = isMobile ? topicChannels.slice(0, 4) : topicChannels;
  const hasMore = isMobile && topicChannels.length > 4;

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
    'inline-flex items-center justify-center h-8 px-3 rounded-full text-sm font-medium whitespace-nowrap',
    'bg-muted transition-colors cursor-pointer select-none',
  );

  const chipActive = 'bg-purple-600/20 text-purple-400';

  const chip = (active: boolean, color?: string) =>
    cn(
      chipBase,
      active
        ? chipActive
        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      active && color && 'shadow-[inset_0_-2px_0]',
    );

  const modeBtnBase = cn(
    'inline-flex items-center justify-center h-7 px-2.5 rounded-md text-xs font-medium whitespace-nowrap',
    'transition-colors cursor-pointer',
  );

  const moreChannels = isMobile ? topicChannels.slice(4) : [];
  const moreCerts = certifications;

  if (channels.length === 0) {
    return (
      <div className="flex items-center gap-2 py-1" data-pagefind-ignore>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth scroll-snap-x snap-x mandatory flex-1">
          <button
            type="button"
            className={cn(chip(isAllActive), 'snap-start')}
            onClick={handleAll}
          >
            All
          </button>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={cn(
                modeBtnBase,
                activeFilter.mode === opt.value
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent',
              )}
              onClick={() => handleMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1" data-pagefind-ignore>
      <div
        ref={scrollRef}
        className={cn(
          'flex items-center gap-2 overflow-x-auto hide-scrollbar scroll-smooth',
          'scroll-snap-x snap-x mandatory',
          isMobile ? 'flex-1' : 'flex-1',
        )}
      >
        {/* All */}
        <button
          type="button"
          className={cn(chip(isAllActive), 'snap-start')}
          onClick={handleAll}
        >
          All
        </button>

        {/* Topic channels */}
        {visibleChannels.map((ch) => (
          <button
            key={ch.id}
            type="button"
            className={cn(
              chip(isChannelActive(ch.id), ch.color),
              'snap-start',
            )}
            style={
              isChannelActive(ch.id) && ch.color
                ? { boxShadow: `inset 0 -2px 0 ${ch.color}` }
                : undefined
            }
            onClick={() => handleChannel(ch.id)}
          >
            {ch.name}
          </button>
        ))}

        {/* Certifications (desktop only inline) */}
        {!isMobile &&
          certifications.map((cert) => (
            <button
              key={cert.id}
              type="button"
              className={cn(
                chip(isCertActive(cert.id), cert.color),
                'snap-start',
              )}
              style={
                isCertActive(cert.id) && cert.color
                  ? { boxShadow: `inset 0 -2px 0 ${cert.color}` }
                  : undefined
              }
              onClick={() => handleCert(cert.id)}
            >
              {cert.name}
            </button>
          ))}

        {/* More (mobile only) */}
        {hasMore && (
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <button
                type="button"
                className={cn(chipBase, 'text-muted-foreground snap-start')}
              >
                More ▾
              </button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filters</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-6 space-y-4">
                {moreChannels.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Topics
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {moreChannels.map((ch) => (
                        <DrawerClose key={ch.id} asChild>
                          <button
                            type="button"
                            className={cn(
                              chipBase,
                              isChannelActive(ch.id)
                                ? chipActive
                                : 'text-muted-foreground',
                            )}
                            style={
                              isChannelActive(ch.id) && ch.color
                                ? { boxShadow: `inset 0 -2px 0 ${ch.color}` }
                                : undefined
                            }
                            onClick={() => handleChannel(ch.id)}
                          >
                            {ch.name}
                          </button>
                        </DrawerClose>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Certifications
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {moreCerts.map((cert) => (
                      <DrawerClose key={cert.id} asChild>
                        <button
                          type="button"
                          className={cn(
                            chipBase,
                            isCertActive(cert.id)
                              ? chipActive
                              : 'text-muted-foreground',
                          )}
                          style={
                            isCertActive(cert.id) && cert.color
                              ? { boxShadow: `inset 0 -2px 0 ${cert.color}` }
                              : undefined
                          }
                          onClick={() => handleCert(cert.id)}
                        >
                          {cert.name}
                        </button>
                      </DrawerClose>
                    ))}
                  </div>
                </div>
                {onCreateCard && (
                  <div className="pt-3 border-t border-[var(--border-default)]">
                    <DrawerClose asChild>
                      <button
                        type="button"
                        className={cn(
                          chipBase,
                          'w-full justify-center text-muted-foreground hover:text-foreground',
                        )}
                        onClick={onCreateCard}
                        aria-label="Create card"
                      >
                        +
                      </button>
                    </DrawerClose>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
        )}
      </div>

      {/* Mode toggles + create button */}
      <div className="flex items-center gap-1 shrink-0">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={cn(
              modeBtnBase,
              activeFilter.mode === opt.value
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
            onClick={() => handleMode(opt.value)}
          >
            {opt.label}
          </button>
        ))}
        {onCreateCard && (
          <button
            type="button"
            className={cn(
              modeBtnBase,
              'w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
            onClick={onCreateCard}
            aria-label="Create card"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
});
