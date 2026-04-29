/**
 * HomeGoogle — Material Design 3 revamp
 * Clean M3 surfaces, type scale, 8dp grid, no decorative noise
 */

// Re-export GoogleColors for backward compatibility with decorative components
export const GoogleColors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
};

import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { BookOpen, Mic, Target, Code, ChevronRight, Brain, Play, Award, TrendingUp, Zap } from 'lucide-react';
import { useUserPreferences } from '../context/UserPreferencesContext';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } } };
const stagger = { show: { transition: { staggerChildren: 0.07 } } };

// ─── M3 Shimmer Skeleton ──────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-muted ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

// ─── M3 Suggestion Chip ───────────────────────────────────────────────────────
function SuggestionChip({ label, icon: Icon, onClick }: { label: string; icon?: React.ElementType; onClick: () => void }) {
  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 min-h-[48px] h-8 px-4 rounded-full border border-border/60 bg-background text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ fontSize: 14, fontWeight: 500 }}
    >
      {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
      {label}
    </motion.button>
  );
}

// ─── M3 Metric Card (tonal container) ────────────────────────────────────────
function MetricCard({ value, label, toneColor }: { value: string; label: string; toneColor: string }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex-1 flex flex-col items-center gap-1 py-4 px-2 rounded-2xl"
      style={{ backgroundColor: `color-mix(in srgb, ${toneColor} 12%, var(--background, white))` }}
    >
      <span className="text-2xl font-medium leading-none" style={{ color: toneColor }}>{value}</span>
      <span className="text-center leading-tight text-foreground/70" style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
    </motion.div>
  );
}

// ─── M3 Elevated Feature Card ─────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, subtitle, toneColor, onClick }: {
  icon: React.ElementType; title: string; subtitle: string; toneColor: string; onClick: () => void;
}) {
  return (
    <motion.button
      variants={fadeUp}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl text-left transition-shadow duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ backgroundColor: 'var(--card, white)', boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 1px 3px 1px rgba(0,0,0,0.06)' }}
    >
      <div className="min-w-[48px] w-10 min-h-[48px] h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `color-mix(in srgb, ${toneColor} 15%, transparent)` }}>
        <Icon className="w-5 h-5" style={{ color: toneColor }} />
      </div>
      <div>
        <div className="font-medium text-foreground leading-snug" style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
        <div className="text-foreground/60 mt-0.5 leading-snug" style={{ fontSize: 12 }}>{subtitle}</div>
      </div>
      <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-foreground/30 group-hover:text-foreground/60 group-hover:translate-x-0.5 transition-all" />
    </motion.button>
  );
}

// ─── M3 Empty State (illustration + headline + body + CTA) ───────────────────
function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-8 gap-4">
      <div className="w-24 h-24 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)' }}>
        <Brain className="w-12 h-12 text-primary" />
      </div>
      {/* Headline Medium 28/36 */}
      <h2 className="font-normal text-foreground" style={{ fontSize: 28, lineHeight: '36px' }}>
        Start your journey
      </h2>
      {/* Body Large 16/24 */}
      <p className="text-foreground/60 max-w-xs" style={{ fontSize: 16, lineHeight: '24px' }}>
        Practice with 1000+ questions across 40+ topics and land your dream job.
      </p>
      {/* M3 Filled Button */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStart}
        className="mt-2 inline-flex items-center gap-2 min-h-[48px] h-10 px-6 rounded-full font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 14, fontWeight: 500 }}
      >
        <Play className="w-4 h-4 fill-current" />
        Start Practicing
      </motion.button>
    </div>
  );
}

// ─── Hero — Level 0: single purpose, streak + value prop ─────────────────────
function HeroSection({ onStart }: { onStart: () => void }) {
  return (
    <section className="pt-16 pb-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
        className="max-w-2xl mx-auto text-center"
      >
        {/* Display Large — clamp between 36px and 57px */}
        <h1 className="font-normal text-foreground"
          style={{ fontSize: 'clamp(36px, 6vw, 57px)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
          Master your{' '}
          <span style={{ color: 'var(--primary)' }}>technical</span>{' '}
          interviews
        </h1>
        {/* Body Large 16/24 */}
        <p className="mt-4 text-foreground/60 max-w-md mx-auto" style={{ fontSize: 16, lineHeight: '24px' }}>
          Practice with AI-powered voice interviews. Build confidence. Land your dream job.
        </p>
        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.3, ease: [0.2, 0, 0, 1] }}
          className="mt-8 flex items-center justify-center gap-3 flex-wrap"
        >
          {/* M3 Filled Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="inline-flex items-center gap-2 min-h-[48px] h-10 px-6 rounded-full font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 14, fontWeight: 500 }}
          >
            <Play className="w-4 h-4 fill-current" />
            Start Practicing
          </motion.button>
          {/* M3 Text Button */}
          <button
            className="inline-flex items-center gap-1 min-h-[48px] h-10 px-4 rounded-full font-medium text-foreground/70 hover:bg-muted/60 transition-colors"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Learn more <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Stats — M3 tonal metric cards ───────────────────────────────────────────
function StatsSection() {
  return (
    <section className="py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex gap-3">
          <MetricCard value="50+" label="Topics" toneColor="#4285F4" />
          <MetricCard value="1000+" label="Questions" toneColor="#EA4335" />
          <MetricCard value="12K+" label="Learners" toneColor="#34A853" />
          <MetricCard value="85%" label="Success" toneColor="#FBBC04" />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Quick Actions — M3 Suggestion Chips ─────────────────────────────────────
function QuickActionsSection({ onNavigate }: { onNavigate: (p: string) => void }) {
  const actions = [
    { label: 'Swipe Learn', icon: BookOpen, path: '/channels' },
    { label: 'Practice', icon: Mic, path: '/practice' },
    { label: 'Daily Quiz', icon: Target, path: '/tests' },
    { label: 'Code Challenges', icon: Code, path: '/coding' },
  ];
  return (
    <section className="py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <p className="mb-3 text-foreground/60" style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Quick actions
        </p>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} className="flex flex-wrap gap-2">
          {actions.map(a => <SuggestionChip key={a.label} label={a.label} icon={a.icon} onClick={() => onNavigate(a.path)} />)}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Features — M3 Elevated Cards ────────────────────────────────────────────
const ALL_FEATURES = [
  { id: 'learn',  icon: BookOpen, title: 'Swipe Learn',     subtitle: 'Browse questions like social media', toneColor: '#4285F4', path: '/channels',      roles: ['frontend', 'backend', 'devops', 'ml-engineer', 'manager'] },
  { id: 'voice',  icon: Mic,      title: 'Voice Interview', subtitle: 'AI-powered mock interviews',         toneColor: '#34A853', path: '/voice-interview', roles: ['frontend', 'backend', 'manager'] },
  { id: 'quiz',   icon: Target,   title: 'Daily Quiz',      subtitle: 'Test your knowledge daily',          toneColor: '#EA4335', path: '/tests',           roles: ['frontend', 'backend', 'devops', 'ml-engineer', 'manager'] },
  { id: 'code',   icon: Code,     title: 'Code Challenges', subtitle: 'Practice coding problems',           toneColor: '#FBBC04', path: '/coding',          roles: ['frontend', 'backend', 'ml-engineer'] },
  { id: 'certs',  icon: Award,    title: 'Certifications',  subtitle: 'Prep for cloud & tech certs',        toneColor: '#9334E9', path: '/certifications',  roles: ['devops', 'ml-engineer'] },
];

function FeaturesSection({ onNavigate }: { onNavigate: (p: string) => void }) {
  const { preferences } = useUserPreferences();
  const role = preferences.role ?? '';

  // Sort: role-relevant features first, then the rest
  const sorted = [...ALL_FEATURES].sort((a, b) => {
    const aRelevant = a.roles.includes(role) ? 0 : 1;
    const bRelevant = b.roles.includes(role) ? 0 : 1;
    return aRelevant - bRelevant;
  });
  const features = sorted.slice(0, 4);

  return (
    <section className="py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="mb-6">
          {/* Headline Small 24/32 */}
          <h2 className="font-normal text-foreground" style={{ fontSize: 24, lineHeight: '32px' }}>Everything you need</h2>
          <p className="mt-1 text-foreground/60" style={{ fontSize: 14, lineHeight: '20px' }}>
            Comprehensive tools to ace your technical interviews
          </p>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map(f => <FeatureCard key={f.id} {...f} onClick={() => onNavigate(f.path)} />)}
        </motion.div>
      </div>
    </section>
  );
}

// ─── CTA — M3 Filled Card (primary container) ────────────────────────────────
function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <section className="py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          className="p-8 rounded-3xl text-center"
          style={{ backgroundColor: 'color-mix(in srgb, var(--primary) 10%, var(--background, white))' }}
        >
          {/* Headline Medium 28/36 */}
          <h2 className="font-normal text-foreground" style={{ fontSize: 28, lineHeight: '36px' }}>
            Ready to get started?
          </h2>
          <p className="mt-2 text-foreground/60 max-w-xs mx-auto" style={{ fontSize: 14, lineHeight: '20px' }}>
            Join thousands of developers who improved their interview skills
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="mt-6 inline-flex items-center gap-2 min-h-[48px] h-10 px-6 rounded-full font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)', fontSize: 14, fontWeight: 500 }}
          >
            Start your first interview <ChevronRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function HomeGoogle() {
  const [, setLocation] = useLocation();
  const handleStart = () => setLocation('/practice');

  return (
    <div className="min-h-screen bg-background">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
        <HeroSection onStart={handleStart} />
        <QuickActionsSection onNavigate={setLocation} />
        <StatsSection />
        <FeaturesSection onNavigate={setLocation} />
        <CTASection onStart={handleStart} />
        <footer className="py-8 px-4 border-t border-border/40 text-center">
          <p className="text-foreground/40" style={{ fontSize: 12 }}>© 2026 Open Interview. Built for developers.</p>
        </footer>
      </motion.div>
    </div>
  );
}
