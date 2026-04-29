import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { allChannelsConfig, categories, getRecommendedChannels } from '../lib/channels-config';
import { certificationsConfig } from '../lib/certifications-config';
import { useUserPreferences } from '../context/UserPreferencesContext';

// ─── Data ─────────────────────────────────────────────────────────────────────

type Role = {
  id: string;
  label: string;
  icon: string;        // Material Symbols Rounded ligature name
  desc: string;
  color: string;       // Material tonal accent
};

const ROLES: Role[] = [
  { id: 'frontend',      label: 'Frontend Dev',  icon: 'palette',          desc: 'React · CSS · TypeScript',         color: '#f9ab00' },
  { id: 'backend',       label: 'Backend Dev',   icon: 'dns',              desc: 'APIs · Databases · Microservices', color: '#1a73e8' },
  { id: 'fullstack',     label: 'Full Stack',    icon: 'layers',           desc: 'End-to-end development',           color: '#673ab7' },
  { id: 'mobile',        label: 'Mobile Dev',    icon: 'smartphone',       desc: 'iOS · Android · React Native',     color: '#1e8e3e' },
  { id: 'devops',        label: 'DevOps / SRE',  icon: 'settings_suggest', desc: 'CI/CD · Kubernetes · Cloud',       color: '#e8710a' },
  { id: 'data-engineer', label: 'Data Engineer', icon: 'analytics',        desc: 'Pipelines · SQL · Spark',          color: '#00897b' },
  { id: 'ml-engineer',   label: 'ML Engineer',   icon: 'smart_toy',        desc: 'Models · MLOps · Python',          color: '#c2185b' },
  { id: 'security',      label: 'Security Eng',  icon: 'shield',           desc: 'AppSec · Cloud Security',          color: '#d93025' },
  { id: 'architect',     label: 'Architect',     icon: 'architecture',     desc: 'System Design · Scalability',      color: '#5e35b1' },
];

const CERT_PROVIDERS = ['Amazon Web Services', 'Kubernetes', 'HashiCorp', 'Google Cloud', 'Microsoft Azure'];

interface Props { onComplete: () => void; }

// ─── Material Symbol helper ───────────────────────────────────────────────────

function MIcon({ name, className = '', filled = false, style }: { name: string; className?: string; filled?: boolean; style?: React.CSSProperties }) {
  return (
    <span className={`material-symbols-rounded${filled ? ' filled' : ''} ${className}`} style={style} aria-hidden="true">
      {name}
    </span>
  );
}

// ─── Top app bar (Google-style) ───────────────────────────────────────────────

function TopAppBar({ step, totalSteps, onSkip }: { step: number; totalSteps: number; onSkip: () => void }) {
  const labels = ['Role', 'Topics', 'Certifications'];
  const progressPct = ((step + 1) / totalSteps) * 100;

  return (
    <header
      className="sticky top-0 z-10 flex flex-col"
      style={{
        background: 'var(--background)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-between px-6 h-16">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-full text-sm tracking-tight"
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              fontFamily: "'Google Sans Display', 'Roboto Flex', sans-serif",
              fontWeight: 500,
            }}
          >
            OI
          </div>
          <span
            className="text-base"
            style={{
              color: 'var(--foreground)',
              fontFamily: "'Google Sans Display', 'Roboto Flex', sans-serif",
              fontWeight: 500,
              letterSpacing: '-0.005em',
            }}
          >
            Open Interview
          </span>
        </div>

        {/* Step indicator (text only, M3 style) */}
        <nav className="hidden md:flex items-center gap-2 text-sm" aria-label="Progress">
          {labels.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 h-8 rounded-full transition-colors"
                  style={{
                    background: active ? 'var(--secondary)' : 'transparent',
                    color: active
                      ? 'var(--secondary-foreground)'
                      : done
                        ? 'var(--foreground)'
                        : 'var(--muted-foreground)',
                  }}
                >
                  {done ? (
                    <MIcon name="check_circle" filled style={{ fontSize: 18, color: 'var(--primary)' }} />
                  ) : (
                    <span
                      className="flex items-center justify-center w-5 h-5 rounded-full text-[11px]"
                      style={{
                        background: active ? 'var(--primary)' : 'transparent',
                        color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                        border: active ? 'none' : '1.5px solid var(--border)',
                        fontFamily: "'Google Sans Display', sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      {i + 1}
                    </span>
                  )}
                  <span style={{ fontFamily: "'Google Sans Display', sans-serif", fontWeight: 500 }}>{label}</span>
                </div>
                {i < labels.length - 1 && <span className="w-4 h-px" style={{ background: 'var(--border)' }} />}
              </div>
            );
          })}
        </nav>

        {/* Skip */}
        <button
          onClick={onSkip}
          data-testid="button-skip-onboarding"
          className="flex items-center gap-1 px-4 h-9 rounded-full text-sm transition-colors"
          style={{
            color: 'var(--muted-foreground)',
            fontFamily: "'Google Sans Display', sans-serif",
            fontWeight: 500,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          Skip
        </button>
      </div>

      {/* M3 linear progress */}
      <div className="relative h-1 w-full" style={{ background: 'var(--muted)' }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-r-full"
          style={{ background: 'var(--primary)' }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        />
      </div>
    </header>
  );
}

// ─── Filled button (M3) ───────────────────────────────────────────────────────

function FilledButton({
  children,
  onClick,
  disabled,
  variant = 'filled',
  testId,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'filled' | 'text' | 'outlined';
  testId?: string;
}) {
  const base: React.CSSProperties = {
    fontFamily: "'Google Sans Display', sans-serif",
    fontWeight: 500,
    letterSpacing: '0.005em',
    minHeight: 40,
    padding: '0 24px',
    borderRadius: 9999,
    transition: 'background 160ms ease, box-shadow 160ms ease, color 160ms ease',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    fontSize: 14,
  };

  if (variant === 'filled') {
    return (
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={disabled ? {} : { y: -1 }}
        whileTap={disabled ? {} : { scale: 0.97 }}
        data-testid={testId}
        style={{
          ...base,
          background: disabled ? 'var(--muted)' : 'var(--primary)',
          color: disabled ? 'var(--muted-foreground)' : 'var(--primary-foreground)',
          boxShadow: disabled ? 'none' : 'var(--shadow-sm)',
        }}
      >
        {children}
      </motion.button>
    );
  }

  if (variant === 'outlined') {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        data-testid={testId}
        style={{
          ...base,
          background: 'transparent',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        }}
        onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'var(--muted)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {children}
      </button>
    );
  }

  // text
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      style={{
        ...base,
        background: 'transparent',
        color: 'var(--primary)',
      }}
      onMouseEnter={(e) => !disabled && (e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 8%, transparent)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OnboardingFlow({ onComplete }: Props) {
  const { setRole, toggleSubscription, skipOnboarding, preferences } = useUserPreferences();
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [recommendedTopics, setRecommendedTopics] = useState<Set<string>>(new Set());
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());
  const [shakeRole, setShakeRole] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { skipOnboarding(); onComplete(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []); // eslint-disable-line

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const rec = getRecommendedChannels(roleId).filter((c) => !c.isCertification).map((c) => c.id);
    const s = new Set(rec);
    setSelectedTopics(s);
    setRecommendedTopics(s);
  };

  const topicChannels = useMemo(() => allChannelsConfig.filter((c) => !c.isCertification), []);

  const certsByProvider = useMemo(() => {
    const map: Record<string, typeof certificationsConfig> = {};
    for (const cert of certificationsConfig) {
      if (!CERT_PROVIDERS.includes(cert.provider)) continue;
      (map[cert.provider] ??= []).push(cert);
    }
    return map;
  }, []);

  const toggleTopic = (id: string) =>
    setSelectedTopics((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleCert = (id: string) =>
    setSelectedCerts((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const finish = () => {
    if (!selectedRole) { skipOnboarding(); onComplete(); return; }
    setRole(selectedRole);
    for (const id of topicChannels.map((c) => c.id)) {
      const want = selectedTopics.has(id);
      const has = preferences.subscribedChannels.includes(id);
      if (want !== has) toggleSubscription(id);
    }
    for (const id of Array.from(selectedCerts)) toggleSubscription(id);
    onComplete();
  };

  const next = () => {
    if (step === 0 && !selectedRole) { setShakeRole(true); setTimeout(() => setShakeRole(false), 500); return; }
    if (step === 1 && selectedTopics.size === 0) return;
    if (step < 2) setStep((s) => s + 1);
    else finish();
  };

  const ctaDisabled = (step === 0 && !selectedRole) || (step === 1 && selectedTopics.size === 0);

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex flex-col"
      style={{
        background: 'var(--background)',
        color: 'var(--foreground)',
        fontFamily: "'Roboto Flex', 'Roboto', sans-serif",
      }}
    >
      <TopAppBar step={step} totalSteps={3} onSkip={() => { skipOnboarding(); onComplete(); }} />

      {/* Centered scrollable content */}
      <main ref={scrollerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14">
          <AnimatePresence mode="wait">

            {/* ── Step 0: Role ── */}
            {step === 0 && (
              <motion.section
                key="role"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
              >
                <div className="mb-10 text-center">
                  <h1
                    className="text-[clamp(2rem,4vw,2.75rem)] leading-tight mb-3"
                    style={{
                      fontFamily: "'Google Sans Display', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '-0.015em',
                      color: 'var(--foreground)',
                    }}
                  >
                    What's your role?
                  </h1>
                  <p
                    className="text-base sm:text-lg max-w-xl mx-auto"
                    style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}
                  >
                    We'll personalize your interview prep with the most relevant topics.
                  </p>
                </div>

                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  animate={shakeRole ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                  transition={{ duration: 0.35 }}
                >
                  {ROLES.map((r, idx) => {
                    const sel = selectedRole === r.id;
                    return (
                      <motion.button
                        key={r.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.25 }}
                        onClick={() => handleRoleSelect(r.id)}
                        aria-pressed={sel}
                        data-testid={`role-${r.id}`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative text-left p-5 rounded-xl transition-all"
                        style={{
                          background: sel ? 'var(--secondary)' : 'var(--card)',
                          border: `1px solid ${sel ? 'var(--primary)' : 'var(--border)'}`,
                          boxShadow: sel ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                          minHeight: 152,
                        }}
                      >
                        {sel && (
                          <span
                            className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-full"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                          >
                            <MIcon name="check" style={{ fontSize: 16 }} />
                          </span>
                        )}

                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
                          style={{
                            background: sel ? 'var(--primary)' : `color-mix(in srgb, ${r.color} 14%, transparent)`,
                            color: sel ? 'var(--primary-foreground)' : r.color,
                          }}
                        >
                          <MIcon name={r.icon} filled style={{ fontSize: 26 }} />
                        </div>

                        <div
                          className="text-base mb-1"
                          style={{
                            fontFamily: "'Google Sans Display', sans-serif",
                            fontWeight: 500,
                            color: sel ? 'var(--secondary-foreground)' : 'var(--foreground)',
                            letterSpacing: '-0.005em',
                          }}
                        >
                          {r.label}
                        </div>
                        <div className="text-sm" style={{ color: 'var(--muted-foreground)', lineHeight: 1.4 }}>
                          {r.desc}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.section>
            )}

            {/* ── Step 1: Topics ── */}
            {step === 1 && (
              <motion.section
                key="topics"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
              >
                <div className="mb-10 text-center">
                  <h1
                    className="text-[clamp(2rem,4vw,2.75rem)] leading-tight mb-3"
                    style={{
                      fontFamily: "'Google Sans Display', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '-0.015em',
                      color: 'var(--foreground)',
                    }}
                  >
                    Choose your topics
                  </h1>
                  <p
                    className="text-base sm:text-lg max-w-xl mx-auto"
                    style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}
                  >
                    {selectedTopics.size > 0 ? (
                      <>
                        <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{selectedTopics.size} selected</span>
                        {' '}— only these will appear in your feed.
                      </>
                    ) : (
                      <>Select at least one topic to continue.</>
                    )}
                  </p>
                </div>

                {selectedTopics.size === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    role="alert"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-6 text-sm max-w-xl mx-auto"
                    style={{
                      background: 'color-mix(in srgb, var(--destructive) 8%, var(--card))',
                      border: '1px solid color-mix(in srgb, var(--destructive) 30%, transparent)',
                      color: 'var(--destructive)',
                    }}
                  >
                    <MIcon name="info" filled style={{ fontSize: 20 }} />
                    Select at least one topic to continue.
                  </motion.div>
                )}

                <div className="space-y-8">
                  {categories
                    .filter((c) => c.id !== 'certification')
                    .map((cat) => {
                      const chans = topicChannels.filter((c) => c.category === cat.id);
                      if (!chans.length) return null;
                      return (
                        <div key={cat.id}>
                          <h3
                            className="text-xs uppercase tracking-[0.08em] mb-3 px-1"
                            style={{
                              color: 'var(--muted-foreground)',
                              fontFamily: "'Google Sans Display', sans-serif",
                              fontWeight: 500,
                            }}
                          >
                            {cat.name}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {chans.map((c) => {
                              const on = selectedTopics.has(c.id);
                              const rec = recommendedTopics.has(c.id);
                              return (
                                <motion.button
                                  key={c.id}
                                  onClick={() => toggleTopic(c.id)}
                                  aria-pressed={on}
                                  data-testid={`topic-${c.id}`}
                                  whileTap={{ scale: 0.96 }}
                                  className="flex items-center gap-1.5 px-4 h-9 rounded-full text-sm transition-colors"
                                  style={{
                                    background: on ? 'var(--secondary)' : 'transparent',
                                    border: `1px solid ${on ? 'transparent' : 'var(--border)'}`,
                                    color: on ? 'var(--secondary-foreground)' : 'var(--foreground)',
                                    fontFamily: "'Google Sans Display', sans-serif",
                                    fontWeight: 500,
                                  }}
                                >
                                  {on && <MIcon name="check" style={{ fontSize: 18 }} />}
                                  {c.name}
                                  {rec && !on && (
                                    <MIcon name="auto_awesome" style={{ fontSize: 14, color: 'var(--primary)' }} />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </motion.section>
            )}

            {/* ── Step 2: Certs ── */}
            {step === 2 && (
              <motion.section
                key="certs"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
              >
                <div className="mb-10 text-center">
                  <h1
                    className="text-[clamp(2rem,4vw,2.75rem)] leading-tight mb-3"
                    style={{
                      fontFamily: "'Google Sans Display', sans-serif",
                      fontWeight: 500,
                      letterSpacing: '-0.015em',
                      color: 'var(--foreground)',
                    }}
                  >
                    Preparing for a certification?
                  </h1>
                  <p
                    className="text-base sm:text-lg max-w-xl mx-auto"
                    style={{ color: 'var(--muted-foreground)', lineHeight: 1.5 }}
                  >
                    Optional — adds cert-specific questions to your feed.
                    {selectedCerts.size > 0 && (
                      <> <span style={{ color: 'var(--primary)', fontWeight: 500 }}>{selectedCerts.size} selected.</span></>
                    )}
                  </p>
                </div>

                <div className="space-y-8">
                  {Object.entries(certsByProvider).map(([provider, certs]) => (
                    <div key={provider}>
                      <h3
                        className="text-xs uppercase tracking-[0.08em] mb-3 px-1"
                        style={{
                          color: 'var(--muted-foreground)',
                          fontFamily: "'Google Sans Display', sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        {provider}
                      </h3>
                      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)' }}>
                        {certs.map((cert, i) => {
                          const on = selectedCerts.has(cert.id);
                          return (
                            <button
                              key={cert.id}
                              onClick={() => toggleCert(cert.id)}
                              aria-pressed={on}
                              data-testid={`cert-${cert.id}`}
                              className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors"
                              style={{
                                background: on ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                              }}
                              onMouseEnter={(e) => !on && (e.currentTarget.style.background = 'var(--muted)')}
                              onMouseLeave={(e) => !on && (e.currentTarget.style.background = 'transparent')}
                            >
                              <span
                                className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                                style={{
                                  background: on ? 'var(--primary)' : 'var(--muted)',
                                  color: on ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                                }}
                              >
                                <MIcon name={on ? 'check' : 'workspace_premium'} filled={on} style={{ fontSize: 20 }} />
                              </span>
                              <div className="flex-1 min-w-0">
                                <div
                                  className="text-sm truncate"
                                  style={{
                                    fontFamily: "'Google Sans Display', sans-serif",
                                    fontWeight: 500,
                                    color: 'var(--foreground)',
                                  }}
                                >
                                  {cert.name}
                                </div>
                                {cert.examCode && (
                                  <div
                                    className="text-xs mt-0.5"
                                    style={{ color: 'var(--muted-foreground)', fontFamily: "'Roboto Mono', monospace" }}
                                  >
                                    {cert.examCode}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Bottom action bar */}
      <footer
        className="flex-shrink-0"
        style={{
          background: 'var(--background)',
          borderTop: '1px solid var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div>
            {step > 0 && (
              <FilledButton variant="text" onClick={() => setStep((s) => s - 1)} testId="button-back">
                <MIcon name="arrow_back" style={{ fontSize: 18 }} /> Back
              </FilledButton>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <FilledButton variant="text" onClick={finish} testId="button-skip-certs">
                Skip
              </FilledButton>
            )}
            <FilledButton onClick={next} disabled={ctaDisabled} testId="button-next">
              {step < 2 ? (
                <>Next <MIcon name="arrow_forward" style={{ fontSize: 18 }} /></>
              ) : (
                <>Get started <MIcon name="arrow_forward" style={{ fontSize: 18 }} /></>
              )}
            </FilledButton>
          </div>
        </div>
      </footer>
    </div>
  );
}
