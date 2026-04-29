/**
 * NavigationGoogle — Google's Material 3 inspired navigation bar
 * Clean top bar with search pill, icons, responsive hamburger
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { useCredits } from '../../context/CreditsContext';

const GOOGLE_SANS = "'Google Sans Display', 'Roboto Flex', sans-serif";

interface NavigationGoogleProps {
  onMenuClick?: () => void;
}

function MIcon({ name, size = 24, filled = false }: { name: string; size?: number; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-rounded${filled ? ' filled' : ''}`}
      style={{ fontSize: size, display: 'inline-flex' }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function IconButton({
  onClick,
  children,
  ariaLabel,
  className = '',
}: {
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none ${className}`}
      style={{
        color: 'var(--foreground)',
        background: 'transparent',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function GoogleSVGLogo({ size = 28 }: { size?: number }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const gradientId = 'google-logo-gradient';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className="cursor-pointer"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#8AB4F8' : '#1A73E8'} />
          <stop offset="100%" stopColor={isDark ? '#81C995' : '#34A853'} />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="18" fill={`url(#${gradientId})`} />
      <text
        x="18"
        y="22"
        textAnchor="middle"
        fontFamily={GOOGLE_SANS}
        fontWeight={600}
        fontSize={size * 0.38}
        fill={isDark ? '#202124' : '#FFFFFF'}
        letterSpacing="-0.02em"
      >
        OI
      </text>
    </svg>
  );
}

function HamburgerIcon({ isOpen, size = 22 }: { isOpen: boolean; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={isOpen ? 'open' : 'closed'}
      transition={{ duration: 0.2 }}
    >
      <motion.path
        d="M4 6h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        variants={{
          closed: { d: "M4 6h16" },
          open: { d: "M6 6l12 12" }
        }}
      />
      <motion.path
        d="M4 12h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        variants={{
          closed: { opacity: 1 },
          open: { opacity: 0 }
        }}
      />
      <motion.path
        d="M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        variants={{
          closed: { d: "M4 18h16" },
          open: { d: "M6 18l12-12" }
        }}
      />
    </motion.svg>
  );
}

function NotificationBell({ hasNotifications = false, size = 22 }: { hasNotifications?: boolean; size?: number }) {
  return (
    <div className="relative w-fit h-fit">
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M12 2C10.343 2 9 3.343 9 5V5.09C6.718 5.648 5 7.68 5 10V14L3 16V17H21V16L19 14V10C19 7.68 17.282 5.648 15 5.09V5C15 3.343 13.657 2 12 2Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 21C14 22.1 13.1 23 12 23C10.9 23 10 22.1 10 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {hasNotifications && (
        <motion.svg
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          width={8}
          height={8}
          viewBox="0 0 8 8"
          className="absolute -top-1 -right-1"
        >
          <circle cx="4" cy="4" r="4" fill="#EA4335" />
        </motion.svg>
      )}
    </div>
  );
}

function ThemeToggleIcon({ isDark, size = 22 }: { isDark: boolean; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: isDark ? 180 : 0 }}
      transition={{ duration: 0.3 }}
    >
      {isDark ? (
        <motion.g
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </motion.g>
      ) : (
        <motion.g
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>
      )}
    </motion.svg>
  );
}

function SearchIcon({ size = 20, active = false }: { size?: number; active?: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      whileHover={{ scale: 1.1 }}
      animate={active ? { scale: 1.05 } : {}}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </motion.svg>
  );
}

function SearchPill({ onFocus }: { onFocus?: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="hidden md:flex flex-1 max-w-2xl mx-auto items-center px-4">
      <div
        className="flex items-center w-full h-10 px-4 rounded-full cursor-pointer transition-all hover:shadow-md"
        style={{
          background: isDark ? '#303134' : '#f1f3f4',
          border: '1px solid transparent',
        }}
        onClick={onFocus}
      >
        <span style={{ color: isDark ? '#9AA0A6' : '#5F6368', marginRight: 12, display: 'inline-flex' }}>
          <SearchIcon size={20} active={false} />
        </span>
        <span
          style={{
            fontFamily: GOOGLE_SANS,
            fontSize: 14,
            color: isDark ? '#9AA0A6' : '#5F6368',
          }}
        >
          Search questions, topics...
        </span>
        <div
          className="ml-auto hidden lg:flex items-center gap-1 px-2 py-1 rounded"
          style={{
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
            fontFamily: GOOGLE_SANS,
            fontSize: 11,
            color: isDark ? '#9AA0A6' : '#5F6368',
          }}
        >
          <span className="text-xs">⌘</span>
          <span className="text-xs">K</span>
        </div>
      </div>
    </div>
  );
}

export function NavigationGoogle({ onMenuClick }: NavigationGoogleProps) {
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { balance, formatCredits } = useCredits();
  const isDark = theme === 'dark';

  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-50 w-full transition-all duration-200"
        style={{
          background: isDark ? '#202124' : '#FFFFFF',
          borderBottom: scrolled
            ? `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e8eaed'}`
            : '1px solid transparent',
          boxShadow: scrolled ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center h-16 px-4 gap-2">
          {/* Mobile hamburger - only visible on mobile */}
          <div className="md:hidden">
            <IconButton
              onClick={() => {
                setMobileMenuOpen(!mobileMenuOpen);
                onMenuClick?.();
              }}
              ariaLabel="Open menu"
            >
              <HamburgerIcon isOpen={mobileMenuOpen} size={22} />
            </IconButton>
          </div>
          
          {/* Logo */}
          <div className="shrink-0 mr-4">
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <GoogleSVGLogo size={28} />
              <span
                className="hidden sm:block"
                style={{
                  fontFamily: GOOGLE_SANS,
                  fontWeight: 500,
                  fontSize: 16,
                  letterSpacing: '-0.02em',
                  color: isDark ? '#E8EAED' : '#202124',
                }}
              >
                Open Interview
              </span>
            </button>
          </div>
          
          {/* Search pill - desktop only */}
          <SearchPill onFocus={() => setSearchFocused(true)} />

          {/* Right side actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Credits display */}
            <button
              onClick={() => setLocation('/profile')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-full cursor-pointer hidden sm:flex transition-colors"
              style={{
                background: isDark ? 'rgba(249,171,0,0.15)' : 'rgba(249,171,0,0.1)',
                color: '#f9ab00',
                fontFamily: GOOGLE_SANS,
                fontWeight: 500,
                border: 'none',
                fontSize: 13,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(249,171,0,0.25)' : 'rgba(249,171,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(249,171,0,0.15)' : 'rgba(249,171,0,0.1)';
              }}
            >
              <MIcon name="paid" size={16} filled />
              <span className="text-xs">{formatCredits(balance)}</span>
            </button>

            {/* Mobile search button - visible only on mobile */}
            <div className="md:hidden">
              <IconButton
                onClick={() => setSearchFocused(true)}
                ariaLabel="Search"
              >
                <SearchIcon size={20} />
              </IconButton>
            </div>

            {/* Notifications */}
            <IconButton onClick={() => setLocation('/notifications')} ariaLabel="Notifications">
              <NotificationBell size={22} />
            </IconButton>

            {/* Theme toggle */}
            <IconButton onClick={toggleTheme} ariaLabel="Toggle theme">
              <ThemeToggleIcon isDark={isDark} size={22} />
            </IconButton>

            {/* Profile avatar */}
            <button
              onClick={() => setLocation('/profile')}
              className="w-8 h-8 rounded-full overflow-hidden cursor-pointer flex items-center justify-center transition-colors"
              style={{
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                border: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
              }}
            >
              <MIcon name="person" size={18} filled style={{ color: isDark ? '#9AA0A6' : '#5F6368' }} />
            </button>
          </div>
        </div>
      </header>
      
      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{
              background: isDark ? '#202124' : '#FFFFFF',
              borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e8eaed'}`,
            }}
          >
            <div className="px-2 py-2">
              {[
                { path: '/', icon: 'home', label: 'Home' },
                { path: '/practice', icon: 'psychology', label: 'Practice' },
                { path: '/review', icon: 'rate_review', label: 'Review' },
                { path: '/profile', icon: 'person', label: 'Profile' },
              ].map(({ path, icon, label }) => (
                <button
                  key={path}
                  onClick={() => { setLocation(path); setMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg cursor-pointer transition-colors"
                  style={{
                    fontFamily: GOOGLE_SANS,
                    fontWeight: 500,
                    fontSize: 14,
                    color: isDark ? '#E8EAED' : '#202124',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <MIcon name={icon} size={20} />
                  {label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Search modal - simplified overlay */}
      <AnimatePresence>
        {searchFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setSearchFocused(false)}
          >
            <motion.div
              initial={{ scale: 0.98, y: -8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.98, y: -8 }}
              className="w-full max-w-2xl rounded-xl overflow-hidden shadow-sm"
              style={{
                background: isDark ? '#303134' : '#FFFFFF',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#dadce0'}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center h-12 px-4 gap-3">
                <span style={{ color: isDark ? '#9AA0A6' : '#5F6368', display: 'inline-flex' }}>
                  <SearchIcon size={20} />
                </span>
                <input
                  type="text"
                  placeholder="Search questions, topics..."
                  autoFocus
                  className="flex-1 bg-transparent outline-none"
                  style={{
                    fontFamily: GOOGLE_SANS,
                    fontSize: 14,
                    color: isDark ? '#E8EAED' : '#202124',
                  }}
                />
                <button
                  onClick={() => setSearchFocused(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isDark ? '#9AA0A6' : '#5F6368',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  ✕
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}