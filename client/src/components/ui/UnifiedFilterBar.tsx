import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  label: string;
  badge?: string | number;
}

interface UnifiedFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  options: FilterOption[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  className?: string;
  showSearch?: boolean;
  sticky?: boolean;
}

export function UnifiedFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  searchLabel,
  options,
  activeFilter,
  onFilterChange,
  className,
  showSearch = true,
  sticky = true,
}: UnifiedFilterBarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-2",
        sticky && "sticky top-0 z-20 bg-[var(--color-bg,var(--surface-base))]",
        className
      )}
      style={{ minHeight: "var(--filter-bar-height, 48px)" }}
    >
      {showSearch && (
        <div className="relative flex-1 min-w-0 max-w-xs">
          <label htmlFor="filter-search" className="sr-only">
            {searchLabel ?? searchPlaceholder}
          </label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted,var(--text-tertiary))] pointer-events-none" />
          <input
            id="filter-search"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 h-10 rounded-xl text-sm bg-[var(--color-surface-2,var(--surface-raised))] border border-[var(--color-border,var(--border-default))] text-[var(--color-text-primary,var(--text-primary))] placeholder:text-[var(--color-text-muted,var(--text-tertiary))] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,var(--brand-500))]/40 transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted,var(--text-tertiary))] hover:text-[var(--color-text-primary,var(--text-primary))] transition-colors"
              tabIndex={-1}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-2 px-2 flex-1">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onFilterChange(opt.id)}
            className={cn(
              "shrink-0 px-4 h-10 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-150",
              activeFilter === opt.id
                ? "bg-[var(--color-primary,var(--brand-500))] text-white"
                : "bg-[var(--color-surface-2,var(--surface-raised))] border border-[var(--color-border,var(--border-default))] text-[var(--color-text-secondary,var(--text-secondary))] hover:bg-[var(--color-surface-3,var(--surface-elevated))]"
            )}
          >
            {opt.label}
            {opt.badge !== undefined && (
              <span
                className={cn(
                  "ml-1.5 text-xs",
                  activeFilter === opt.id ? "opacity-80" : "opacity-60"
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
