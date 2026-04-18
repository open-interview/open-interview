/**
 * Page-level UI components — shared across all pages
 */

import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { InterviewLoader } from './InterviewLoader';

// ── PageHeader ────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode; // extra content below subtitle
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-10"
    >
      <h1 className="text-5xl md:text-6xl font-black mb-3">
        <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
          {title}
        </span>
      </h1>
      {subtitle && <p className="text-muted-foreground text-lg">{subtitle}</p>}
      {children}
    </motion.div>
  );
}

// ── PageLoader ────────────────────────────────────────────────────────────────

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = 'Loading...' }: PageLoaderProps) {
  return <InterviewLoader message={message} />;
}

// ── SearchBar ─────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className }: SearchBarProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 min-h-[44px] rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ── FilterPill ────────────────────────────────────────────────────────────────

interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | number;
}

export function FilterPill({ label, active, onClick, badge }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'cursor-pointer px-4 min-h-[44px] rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-150',
        active
          ? 'bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground'
          : 'bg-muted/50 border border-border text-muted-foreground hover:bg-muted'
      )}
    >
      {label}
      {badge !== undefined && (
        <span className={cn('ml-1.5 text-xs', active ? 'opacity-80' : 'opacity-60')}>
          {badge}
        </span>
      )}
    </button>
  );
}

// ── FilterPills ───────────────────────────────────────────────────────────────

interface FilterPillsProps {
  options: { id: string; label: string; badge?: string | number }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FilterPills({ options, active, onChange, className }: FilterPillsProps) {
  return (
    <div className={cn('flex gap-2 flex-wrap', className)}>
      {options.map(opt => (
        <FilterPill
          key={opt.id}
          label={opt.label}
          active={active === opt.id}
          onClick={() => onChange(opt.id)}
          badge={opt.badge}
        />
      ))}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;       // tailwind text color e.g. 'text-green-500'
  bgColor: string;     // tailwind bg gradient e.g. 'from-green-500/20 to-green-600/10'
  borderColor: string; // tailwind border e.g. 'border-green-500/30'
  delay?: number;
}

export function StatCard({ icon: Icon, label, value, color, bgColor, borderColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className={cn('p-4 rounded-xl border bg-gradient-to-br', bgColor, borderColor)}
    >
      <Icon className={cn('w-6 h-6 mb-1', color)} />
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </motion.div>
  );
}

// ── SectionHeader ─────────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, icon, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      <h2 className="text-lg font-bold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}
