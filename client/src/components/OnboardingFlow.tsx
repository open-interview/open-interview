/**
 * OnboardingFlow — 3-step subscription wizard
 * Step 1: Pick role  →  Step 2: Confirm/tweak topics  →  Step 3: Pick certs
 * Pattern: Duolingo / Linear onboarding — focused, one decision at a time.
 */
import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Brain, Check, ChevronRight, Sparkles, X } from 'lucide-react';
import { allChannelsConfig, getRecommendedChannels, categories } from '../lib/channels-config';
import { certificationsConfig } from '../lib/certifications-config';
import { useUserPreferences } from '../context/UserPreferencesContext';

const ROLES = [
  { id: 'frontend',       label: 'Frontend',        emoji: '🎨', description: 'React, CSS, TypeScript' },
  { id: 'backend',        label: 'Backend',          emoji: '⚙️', description: 'APIs, databases, microservices' },
  { id: 'fullstack',      label: 'Full Stack',       emoji: '🚀', description: 'End-to-end development' },
  { id: 'mobile',         label: 'Mobile',           emoji: '📱', description: 'iOS, Android, React Native' },
  { id: 'devops',         label: 'DevOps / SRE',     emoji: '🔧', description: 'CI/CD, Kubernetes, cloud' },
  { id: 'data-engineer',  label: 'Data Engineer',    emoji: '📊', description: 'Pipelines, SQL, Spark' },
  { id: 'ml-engineer',    label: 'ML Engineer',      emoji: '🤖', description: 'Models, MLOps, Python' },
  { id: 'security',       label: 'Security',         emoji: '🔒', description: 'AppSec, cloud security' },
  { id: 'architect',      label: 'Architect',        emoji: '🏗️', description: 'System design, scalability' },
];

const CERT_PROVIDERS = ['Amazon Web Services', 'Kubernetes', 'HashiCorp', 'Google Cloud', 'Microsoft Azure'];

const STEP_NAMES = ['Role', 'Topics', 'Certs'];

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
};

interface Props {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: Props) {
  const { setRole, toggleSubscription, skipOnboarding, preferences } = useUserPreferences();
  const [step, setStep] = useState(0); // 0=role, 1=topics, 2=certs
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [recommendedTopics, setRecommendedTopics] = useState<Set<string>>(new Set());
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());
  const [certSearch, setCertSearch] = useState('');
  const [shakeRole, setShakeRole] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Focus heading on step change
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (step === 0 && selectedRole) goToStep(1);
        else if (step === 1) goToStep(2);
        else if (step === 2) finish();
      } else if (e.key === 'Escape') {
        skipOnboarding(); onComplete();
      } else if (e.key === 'ArrowLeft' && step > 0) {
        setStep(s => s - 1);
      } else if (e.key === 'ArrowRight') {
        if (step === 0 && selectedRole) goToStep(1);
        else if (step === 1) goToStep(2);
        else if (step === 2) finish();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [step, selectedRole]); // eslint-disable-line react-hooks/exhaustive-deps

  // When role chosen, pre-select recommended topics
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const recommended = getRecommendedChannels(roleId)
      .filter(c => !c.isCertification)
      .map(c => c.id);
    const recSet = new Set(recommended);
    setSelectedTopics(recSet);
    setRecommendedTopics(recSet);
  };

  const topicChannels = useMemo(() =>
    allChannelsConfig.filter(c => !c.isCertification),
  []);

  const certsByProvider = useMemo(() => {
    const map: Record<string, typeof certificationsConfig> = {};
    for (const cert of certificationsConfig) {
      if (!CERT_PROVIDERS.includes(cert.provider)) continue;
      (map[cert.provider] ??= []).push(cert);
    }
    return map;
  }, []);

  // Category breakdown for the floating summary chip
  const categorySummary = useMemo(() => {
    if (selectedTopics.size === 0) return '';
    const counts: Record<string, number> = {};
    for (const id of Array.from(selectedTopics)) {
      const ch = topicChannels.find(c => c.id === id);
      if (!ch) continue;
      const cat = categories.find(c => c.id === ch.category);
      if (!cat) continue;
      counts[cat.name] = (counts[cat.name] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, n]) => `${n} ${name}`)
      .join(' · ');
  }, [selectedTopics, topicChannels]);

  const toggleTopic = (id: string) =>
    setSelectedTopics(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleCert = (id: string) =>
    setSelectedCerts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const finish = () => {
    if (!selectedRole) { skipOnboarding(); onComplete(); return; }
    setRole(selectedRole);
    const allTopicIds = topicChannels.map(c => c.id);
    for (const id of allTopicIds) {
      const shouldBe = selectedTopics.has(id);
      const isCurrent = preferences.subscribedChannels.includes(id);
      if (shouldBe !== isCurrent) toggleSubscription(id);
    }
    for (const id of Array.from(selectedCerts)) toggleSubscription(id);
    onComplete();
  };

  const goToStep = (next: number) => {
    if (next === 2) setCertSearch('');
    setStep(next);
  };

  const isCtaDisabled = step === 1 && selectedTopics.size === 0;
  const progressWidth = step === 0 ? '33%' : step === 1 ? '66%' : '100%';

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border bg-[radial-gradient(ellipse_at_top,_var(--color-accent-violet)/15_0%,_transparent_70%)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--color-accent-violet-light)]" />
          <span className="font-bold text-sm">Personalize your feed</span>
        </div>
        <button
          onClick={() => { skipOnboarding(); onComplete(); }}
          aria-label="Skip onboarding"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Skip <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 px-6 py-3" role="list" aria-label="Onboarding steps">
        {STEP_NAMES.map((s, i) => (
          <div key={s} className="flex items-center gap-2" role="listitem">
            <div
              aria-label={`Step ${i + 1} of ${STEP_NAMES.length}: ${s}`}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                i < step ? 'bg-[var(--color-success)] text-white'
                : i === step ? 'bg-[var(--color-accent-violet)] text-white shadow-[0_0_12px_rgba(124,58,237,0.5)]'
                : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            {i < STEP_NAMES.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {/* ── Step 0: Role ── */}
          {step === 0 && (
            <motion.div key="role" {...slide} transition={{ duration: 0.2 }}>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-violet-400" />
              </div>
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold mb-1 outline-none">What's your role?</h2>
              <p className="text-sm text-muted-foreground mb-5">We'll pre-select the most relevant topics for you.</p>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                animate={shakeRole ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleSelect(r.id)}
                    aria-pressed={selectedRole === r.id}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRole === r.id
                        ? 'border-[var(--color-accent-violet)] bg-gradient-to-br from-violet-600/15 to-cyan-500/10'
                        : 'border-border hover:border-[var(--color-accent-violet)]/40 bg-card'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.emoji}</div>
                    <div className="text-sm font-semibold">{r.label}</div>
                    <p className='text-[10px] text-muted-foreground mt-0.5 leading-tight'>{r.description}</p>
                    {selectedRole === r.id && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-accent-violet-light)]">
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ── Step 1: Topics ── */}
          {step === 1 && (
            <motion.div key="topics" {...slide} transition={{ duration: 0.2 }}>
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold mb-1 outline-none">Choose your topics</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {selectedTopics.size} selected — only these will appear in your feed.
              </p>
              {selectedTopics.size === 0 && (
                <div className='flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4'>
                  <AlertTriangle className="w-4 h-4" /> Select at least one topic to continue
                </div>
              )}

              {/* Floating selection summary chip */}
              {selectedTopics.size > 0 && (
                <div className="sticky top-0 z-10 bg-background/90 backdrop-blur py-2 mb-3">
                  <span className="inline-block text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                    {categorySummary}
                  </span>
                </div>
              )}

              {categories.filter(cat => cat.id !== 'certification').map(cat => {
                const chans = topicChannels.filter(c => c.category === cat.id);
                if (!chans.length) return null;
                return (
                  <div key={cat.id} className="mb-5">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {chans.map(c => {
                        const on = selectedTopics.has(c.id);
                        const isRec = recommendedTopics.has(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleTopic(c.id)}
                            aria-pressed={on}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              on
                                ? 'border-[var(--color-accent-violet)] bg-[var(--color-accent-violet)]/15 text-[var(--color-accent-violet-light)]'
                                : 'border-border bg-card text-muted-foreground hover:border-[var(--color-accent-violet)]/40'
                            }`}
                          >
                            {on && <Check className="w-3 h-3 inline mr-1" />}{c.name}
                            {isRec && <span className="ml-1 text-[8px] bg-violet-500/20 text-violet-400 px-1 rounded">Rec</span>}
                          </button>
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
            <motion.div key="certs" {...slide} transition={{ duration: 0.2 }}>
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold mb-1 outline-none">Preparing for a cert?</h2>
              <p className="text-sm text-muted-foreground mb-5">Optional — adds cert-specific questions to your feed.</p>
              {selectedCerts.size === 0 && (
                <p className="text-xs text-muted-foreground italic mb-4">None selected — you can always add certs later</p>
              )}
              {Object.entries(certsByProvider).map(([provider, certs]) => (
                <div key={provider} className="mb-5">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{provider}</div>
                  <div className="space-y-2">
                    {certs.map(cert => {
                      const on = selectedCerts.has(cert.id);
                      return (
                        <button
                          key={cert.id}
                          onClick={() => toggleCert(cert.id)}
                          aria-pressed={on}
                          className={`w-full flex items-center justify-between p-4 min-h-[56px] rounded-xl border transition-all text-left ${
                            on
                              ? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10'
                              : 'border-border bg-card hover:border-[var(--color-accent-cyan)]/40'
                          }`}
                        >
                          <div>
                            <div className="text-base font-semibold">{cert.name}</div>
                            {cert.examCode && <div className="text-[10px] text-muted-foreground font-mono">{cert.examCode}</div>}
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            on ? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]' : 'border-border'
                          }`}>
                            {on && <Check className="w-3 h-3 text-white" />}
                          </div>
                        </button>
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
      <div className="px-6 pt-4 border-t border-border" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <motion.button
          onClick={() => {
            if (step === 0 && !selectedRole) { setShakeRole(true); setTimeout(() => setShakeRole(false), 500); return; }
            if (step < 2) goToStep(step + 1);
            else finish();
          }}
          disabled={isCtaDisabled}
          aria-disabled={isCtaDisabled}
          whileHover={isCtaDisabled ? {} : { scale: 1.01 }}
          whileTap={isCtaDisabled ? {} : { scale: 0.97 }}
          className="w-full py-4 min-h-[56px] rounded-xl font-bold text-base bg-gradient-to-r from-violet-600 to-cyan-500 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        >
          {step < 2 ? <>Continue <ChevronRight className="w-4 h-4" /></> : <>Start Learning <Sparkles className="w-4 h-4" /></>}
        </motion.button>
        {step === 2 && (
          <button
            onClick={finish}
            className="w-full mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors text-center"
          >
            Skip this step →
          </button>
        )}
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full mt-2 py-3 min-h-[44px] text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>
        )}
        <p className='hidden sm:block text-center text-[10px] text-muted-foreground mt-2'>Press Enter to continue · Esc to skip</p>
      </div>
    </div>
  );
}
