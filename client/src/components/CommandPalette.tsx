import { useCallback } from 'react';
import { useLocation } from 'wouter';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Home, Hash, Award, Mic, Swords, Code, RefreshCw, StickyNote,
  Bookmark, Bell, User, BookOpen, Zap, Sparkles, GraduationCap, ScrollText
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const pages = [
  { section: 'Learn', items: [
    { path: '/channels', label: 'Channels', icon: Hash, shortcut: 'C' },
    { path: '/certifications', label: 'Certifications', icon: Award, shortcut: 'E' },
    { path: '/my-path', label: 'My Path', icon: GraduationCap },
  ]},
  { section: 'Practice', items: [
    { path: '/voice-interview', label: 'Voice Interview', icon: Mic, shortcut: 'V' },
    { path: '/tests', label: 'Quick Tests', icon: Swords, shortcut: 'T' },
    { path: '/code', label: 'Code Challenges', icon: Code, shortcut: 'X' },
    { path: '/review', label: 'SRS Review', icon: RefreshCw, shortcut: 'R' },
    { path: '/flashcards', label: 'Flashcards', icon: StickyNote },
  ]},
  { section: 'Progress', items: [
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/badges', label: 'Badges', icon: Sparkles },
    { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { path: '/history', label: 'Answer History', icon: ScrollText },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/whats-new', label: "What's New", icon: Zap },
  ]},
  { section: 'Resources', items: [
    { path: '/blog', label: 'Blog', icon: BookOpen },
  ]},
  { section: 'General', items: [
    { path: '/', label: 'Home', icon: Home, shortcut: 'H' },
    { path: '/about', label: 'About', icon: User },
  ]},
];

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation();

  const handleSelect = useCallback((path: string) => {
    onOpenChange(false);
    setLocation(path);
  }, [onOpenChange, setLocation]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages or type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {pages.map((group) => (
          <CommandGroup key={group.section} heading={group.section}>
            {group.items.map((page) => (
              <CommandItem key={page.path} onSelect={() => handleSelect(page.path)}>
                <page.icon className="mr-2 h-4 w-4" />
                <span>{page.label}</span>
                {page.shortcut && <CommandShortcut>{page.shortcut}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
