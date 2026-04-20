/**
 * OnboardingFlow — Linear-style split-screen onboarding
 * Left: animated brand panel  |  Right: step-by-step form
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, X, Sparkles, AlertTriangle } from 'lucide-react';
import { allChannelsConfig, getRecommendedChannels, categories } from '../lib/channels-config';
import { certificationsConfig } from '../lib/certifications-config';
import { useUserPreferences } from '../context/UserPreferencesContext';

// ─── Data ─────────────────────────────────────────────────────────────────────

const ROLES = [
  { id: 'frontend',      label: 'Frontend Dev',    emoji: '🎨', desc: 'React · CSS · TypeScript',        color: '#f97316' },
  { id: 'backend',       label: 'Backend Dev',     emoji: '⚙️',  desc: 'APIs · Databases · Microservices', color: '#3b82f6' },
  { id: 'fullstack',     label: 'Full Stack',      emoji: '🚀', desc: 'End-to-end development',           color: '#8b5cf6' },
  { id: 'mobile',        label: 'Mobile Dev',      emoji: '📱', desc: 'iOS · Android · React Native',     color: '#10b981' },
  { id: 'devops',        label: 'DevOps / SRE',    emoji: '🔧', desc: 'CI/CD · Kubernetes · Cloud',       color: '#f59e0b' },
  { id: 'data-engineer', label: 'Data Engineer',   emoji: '📊', desc: 'Pipelines · SQL · Spark',          color: '#06b6d4' },
  { id: 'ml-engineer',   label: 'ML Engineer',     emoji: '🤖', desc: 'Models · MLOps · Python',          color: '#ec4899' },
  { id: 'security',      label: 'Security Eng',    emoji: '🔒', desc: 'AppSec · Cloud Security',          color: '#ef4444' },
  { id: 'architect',     label: 'Architect',       emoji: '🏗️', desc: 'System Design · Scalability',      color: '#a78bfa' },
];

const CERT_PROVIDERS = ['Amazon Web Services', 'Kubernetes', 'HashiCorp', 'Google Cloud', 'Microsoft Azure'];

const SOCIAL_PROOF = [
  { text: '"Passed my AWS SAA on the first try."',   author: 'Sarah K., Cloud Engineer' },
  { text: '"Best free interview prep I\'ve found."', author: 'Marcus T., Senior SWE' },
  { text: '"1000+ questions, zero paywalls."',        author: 'Priya M., ML Engineer' },
  { text: '"Got the job at FAANG. This helped."',    author: 'James L., Staff Engineer' },
];

const FEATURES = [
  { icon: '⚡', text: '1,000+ curated questions' },
  { icon: '🎯', text: 'Personalized to your role' },
  { icon: '🏆', text: '53+ certification tracks' },
  { icon: '🆓', text: 'Completely free, forever' },
];

interface Props { onComplete: () => void; }

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({ step, activeRole }: { step: number; activeRole: typeof ROLES[0] | undefined }) {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % SOCIAL_PROOF.length), 4000);
    return () => clearInterval(t);
  }, []);

  const accentColor = activeRole?.color ?? '#7c3aed';

  return (
    <div className="hidden lg:flex flex-col justify-between h-full px-12 py-12 relative overflow-hidden select-none"
      style={{ background: 'linear-gradient(160deg, #0d0d14 0%, #0a0a12 100%)' }}>

      {/* Animated background blob */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        animate={{ background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)` }}
        transition={{ duration: 0.8 }}
        style={{ width: 480, height: 480, top: -120, left: -120, filter: 'blur(60px)' }}
      />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d420 0%, transparent 70%)', filter: 'blur(50px)' }} />

      {/* Logo */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` }}>
            OI
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Open Interview</span>
        </div>

        {/* Headline */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-white leading-[1.1] mb-4">
            Ace your next<br />
            <motion.span
              key={accentColor}
              animate={{ color: accentColor }}
              transition={{ duration: 0.5 }}
            >
              tech interview.
            </motion.span>
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Free, personalized interview prep with 1,000+ questions across 40+ topics.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-10">
          {FEATURES.map((f, i) => (
            <motion.div key={f.text}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="flex items-center gap-3"
            >
              <span className="text-base">{f.icon}</span>
              <span className="text-white/60 text-sm">{f.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Step progress */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ width: i === step ? 24 : 8, opacity: i <= step ? 1 : 0.25 }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
              style={{ background: i <= step ? accentColor : 'rgba(255,255,255,0.2)' }}
            />
          ))}
        </div>
      </div>

      {/* Rotating quote */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={quoteIdx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="p-5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-white/80 text-sm italic mb-2">{SOCIAL_PROOF[quoteIdx].text}</p>
            <p className="text-white/35 text-xs">— {SOCIAL_PROOF[quoteIdx].author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
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
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { topRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [step]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { skipOnboarding(); onComplete(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []); // eslint-disable-line

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const rec = getRecommendedChannels(roleId).filter(c => !c.isCertification).map(c => c.id);
    const s = new Set(rec);
    setSelectedTopics(s);
    setRecommendedTopics(s);
  };

  const topicChannels = useMemo(() => allChannelsConfig.filter(c => !c.isCertification), []);

  const certsByProvider = useMemo(() => {
    const map: Record<string, typeof certificationsConfig> = {};
    for (const cert of certificationsConfig) {
      if (!CERT_PROVIDERS.includes(cert.provider)) continue;
      (map[cert.provider] ??= []).push(cert);
    }
    return map;
  }, []);

  const toggleTopic = (id: string) =>
    setSelectedTopics(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleCert = (id: string) =>
    setSelectedCerts(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const finish = () => {
    if (!selectedRole) { skipOnboarding(); onComplete(); return; }
    setRole(selectedRole);
    for (const id of topicChannels.map(c => c.id)) {
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
    if (step < 2) setStep(s => s + 1);
    else finish();
  };

  const activeRole = ROLES.find(r => r.id === selectedRole);
  const accentColor = activeRole?.color ?? '#7c3aed';
  const ctaDisabled = step === 1 && selectedTopics.size === 0;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex" style={{ background: '#09090f' }}>

      {/* Left panel — desktop only */}
      <div className="w-[420px] flex-shrink-0 border-r" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <LeftPanel step={step} activeRole={activeRole} />
      </div>

      {/* Right panel */}
      <div ref={topRef} className="flex-1 flex flex-col overflow-y-auto">

        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` }}>OI</div>
            <span className="font-bold text-white text-sm">Open Interview</span>
          </div>
          <div className="hidden lg:block" />

          {/* Step counter */}
          <div className="flex items-center gap-1.5">
            {['Role', 'Topics', 'Certs'].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  i < step ? 'text-emerald-400' : i === step ? 'text-white' : 'text-white/25'
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px]"
                    style={{ borderColor: i === step ? accentColor : 'rgba(255,255,255,0.2)', color: i === step ? accentColor : undefined }}>{i + 1}</span>}
                  {label}
                </div>
                {i < 2 && <div className="w-4 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />}
              </div>
            ))}
          </div>

          <button onClick={() => { skipOnboarding(); onComplete(); }}
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1">
            Skip <X className="w-3 h-3" />
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 px-8 py-10 max-w-2xl w-full mx-auto">
          <AnimatePresence mode="wait">

            {/* ── Step 0: Role ── */}
            {step === 0 && (
              <motion.div key="role"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.22 }}>

                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Step 1 of 3</p>
                  <h2 className="text-3xl font-black text-white mb-2">What's your role?</h2>
                  <p className="text-white/45 text-sm">We'll pre-select the most relevant topics for you.</p>
                </div>

                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
                  animate={shakeRole ? { x: [0, -6, 6, -6, 6, 0] } : {}}
                  transition={{ duration: 0.35 }}
                >
                  {ROLES.map((r, idx) => {
                    const sel = selectedRole === r.id;
                    return (
                      <motion.button key={r.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.035 }}
                        onClick={() => handleRoleSelect(r.id)}
                        aria-pressed={sel}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative group p-4 rounded-xl text-left transition-all"
                        style={{
                          background: sel ? `${r.color}14` : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${sel ? r.color + '50' : 'rgba(255,255,255,0.08)'}`,
                          boxShadow: sel ? `0 0 20px ${r.color}18` : 'none',
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xl">{r.emoji}</span>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: r.color }}>
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white mb-0.5">{r.label}</div>
                        <div className="text-[11px] text-white/35 leading-snug">{r.desc}</div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}

            {/* ── Step 1: Topics ── */}
            {step === 1 && (
              <motion.div key="topics"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.22 }}>

                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Step 2 of 3</p>
                  <h2 className="text-3xl font-black text-white mb-2">Choose your topics</h2>
                  <p className="text-white/45 text-sm">
                    {selectedTopics.size > 0
                      ? <><span className="font-semibold" style={{ color: accentColor }}>{selectedTopics.size} topics</span> selected — only these appear in your feed.</>
                      : 'Select at least one topic to continue.'}
                  </p>
                </div>

                {selectedTopics.size === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-2 p-3 rounded-xl mb-6 text-xs"
                    style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    Select at least one topic to continue
                  </motion.div>
                )}

                {categories.filter(c => c.id !== 'certification').map(cat => {
                  const chans = topicChannels.filter(c => c.category === cat.id);
                  if (!chans.length) return null;
                  return (
                    <div key={cat.id} className="mb-7">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">{cat.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {chans.map(c => {
                          const on = selectedTopics.has(c.id);
                          const rec = recommendedTopics.has(c.id);
                          return (
                            <motion.button key={c.id}
                              onClick={() => toggleTopic(c.id)}
                              aria-pressed={on}
                              whileTap={{ scale: 0.93 }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                              style={{
                                background: on ? `${accentColor}20` : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${on ? accentColor + '50' : 'rgba(255,255,255,0.1)'}`,
                                color: on ? '#e2d9f3' : 'rgba(255,255,255,0.45)',
                              }}
                            >
                              {on && <Check className="w-3 h-3" />}
                              {c.name}
                              {rec && !on && <span className="text-[9px] opacity-60">★</span>}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {/* ── Step 2: Certs ── */}
            {step === 2 && (
              <motion.div key="certs"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.22 }}>

                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Step 3 of 3</p>
                  <h2 className="text-3xl font-black text-white mb-2">Preparing for a cert?</h2>
                  <p className="text-white/45 text-sm">
                    Optional — adds cert-specific questions to your feed.{' '}
                    {selectedCerts.size > 0 && <span style={{ color: accentColor }}>{selectedCerts.size} selected.</span>}
                  </p>
                </div>

                {Object.entries(certsByProvider).map(([provider, certs]) => (
                  <div key={provider} className="mb-7">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-3">{provider}</div>
                    <div className="space-y-2">
                      {certs.map(cert => {
                        const on = selectedCerts.has(cert.id);
                        return (
                          <motion.button key={cert.id}
                            onClick={() => toggleCert(cert.id)}
                            aria-pressed={on}
                            whileTap={{ scale: 0.99 }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all"
                            style={{
                              background: on ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                              border: `1.5px solid ${on ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.07)'}`,
                            }}
                          >
                            <div>
                              <div className="text-sm font-semibold text-white">{cert.name}</div>
                              {cert.examCode && <div className="text-[10px] font-mono text-white/30 mt-0.5">{cert.examCode}</div>}
                            </div>
                            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-4 transition-all"
                              style={{ background: on ? '#06b6d4' : 'rgba(255,255,255,0.08)', border: `2px solid ${on ? '#06b6d4' : 'rgba(255,255,255,0.15)'}` }}>
                              {on && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer CTA */}
        <div className="flex-shrink-0 px-8 py-6 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)}
                className="px-5 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 transition-colors border"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                ← Back
              </button>
            )}
            <motion.button
              onClick={next}
              disabled={ctaDisabled}
              whileHover={ctaDisabled ? {} : { scale: 1.01 }}
              whileTap={ctaDisabled ? {} : { scale: 0.98 }}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: ctaDisabled ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${accentColor}, #06b6d4)`,
                color: ctaDisabled ? 'rgba(255,255,255,0.2)' : 'white',
                boxShadow: ctaDisabled ? 'none' : `0 0 28px ${accentColor}35`,
                cursor: ctaDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              {step < 2 ? <>Continue <ChevronRight className="w-4 h-4" /></> : <><Sparkles className="w-4 h-4" /> Start Learning</>}
            </motion.button>
            {step === 2 && (
              <button onClick={finish}
                className="px-5 py-3 rounded-xl text-sm text-white/30 hover:text-white/60 transition-colors">
                Skip →
              </button>
            )}
          </div>
          <p className="hidden sm:block text-center text-[10px] text-white/15 mt-3">Press Esc to skip</p>
        </div>
      </div>
    </div>
  );
}
