import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useLocation } from "wouter";

interface SearchInputProps {
  defaultValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({ defaultValue = "", onSearch, placeholder = "Search articles...", autoFocus }: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [, navigate] = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (onSearch) {
        onSearch(value);
      } else if (value.trim().length >= 2) {
        navigate(`/blog/search?q=${encodeURIComponent(value.trim())}`);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search
          size={18}
          strokeWidth={1.5}
          className="text-[var(--color-ink-muted)] group-focus-within:text-[var(--color-accent)] transition-colors"
          aria-hidden
        />
      </div>
       <input
         ref={inputRef}
         type="search"
         value={value}
         onChange={(e) => setValue(e.target.value)}
         placeholder={placeholder}
         autoFocus={autoFocus}
         aria-label="Search posts"
         className="w-full h-[46px] rounded-full bg-[#F1F3F4] dark:bg-[#303134] pl-12 pr-10 text-base text-[var(--color-ink)] placeholder:text-[#9AA0A6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30 transition-all"
       />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          aria-label="Clear search"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}
