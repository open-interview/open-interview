/**
 * OnboardingFlow — 3-step subscription wizard
 * Step 1: Pick role  →  Step 2: Confirm/tweak topics  →  Step 3: Pick certs
 * Pattern: Duolingo / Linear onboarding — focused, one decision at a time.
 */
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Sparkles, X } from 'lucide-react';
import { allChannelsConfig, getRecommendedChannels, categories } from '../lib/channels-config';
import { certificationsConfig } from '../lib/certifications-config';
import { useUserPreferences } from '../context/UserPreferencesContext';

const ROLES = [
  { id: 'frontend',       label: 'Frontend',        emoji: '🎨' },
  { id: 'backend',        label: 'Backend',          emoji: '⚙️' },
  { id: 'fullstack',      label: 'Full Stack',       emoji: '🚀' },
  { id: 'mobile',         label: 'Mobile',           emoji: '📱' },
  { id: 'devops',         label: 'DevOps / SRE',     emoji: '🔧' },
  { id: 'data-engineer',  label: 'Data Engineer',    emoji: '📊' },
  { id: 'ml-engineer',    label: 'ML Engineer',      emoji: '🤖' },
  { id: 'security',       label: 'Security',         emoji: '🔒' },
  { id: 'architect',      label: 'Architect',        emoji: '🏗️' },
];

const CERT_PROVIDERS = ['Amazon Web Services', 'Kubernetes', 'HashiCorp', 'Google Cloud', 'Microsoft Azure'];

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
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());

  // When role chosen, pre-select recommended topics
  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    const recommended = getRecommendedChannels(roleId)
      .filter(c => !c.isCertification)
      .map(c => c.id);
    setSelectedTopics(new Set(recommended));
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
    // Apply role (auto-subscribes recommended channels)
    setRole(selectedRole);
    // Override with user's manual topic selection
    const allTopicIds = topicChannels.map(c => c.id);
    for (const id of allTopicIds) {
      const shouldBe = selectedTopics.has(id);
      const isCurrent = preferences.subscribedChannels.includes(id);
      if (shouldBe !== isCurrent) toggleSubscription(id);
    }
    // Add cert subscriptions
    for (const id of Array.from(selectedCerts)) toggleSubscription(id);
    onComplete();
  };

  const steps = ['Role', 'Topics', 'Certs'];

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--color-accent-violet-light)]" />
          <span className="font-bold text-sm">Personalize your feed</span>
        </div>
        <button
          onClick={() => { skipOnboarding(); onComplete(); }}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Skip <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 px-6 py-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
              i < step ? 'bg-[var(--color-success)] text-white'
              : i === step ? 'bg-[var(--color-accent-violet)] text-white'
              : 'bg-muted text-muted-foreground'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <AnimatePresence mode="wait">
          {/* ── Step 0: Role ── */}
          {step === 0 && (
            <motion.div key="role" {...slide} transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-bold mb-1">What's your role?</h2>
              <p className="text-sm text-muted-foreground mb-5">We'll pre-select the most relevant topics for you.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ROLES.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleRoleSelect(r.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedRole === r.id
                        ? 'border-[var(--color-accent-violet)] bg-[var(--color-accent-violet)]/10'
                        : 'border-border hover:border-[var(--color-accent-violet)]/40 bg-card'
                    }`}
                  >
                    <div className="text-2xl mb-1">{r.emoji}</div>
                    <div className="text-sm font-semibold">{r.label}</div>
                    {selectedRole === r.id && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-accent-violet-light)]">
                        <Check className="w-3 h-3" /> Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 1: Topics ── */}
          {step === 1 && (
            <motion.div key="topics" {...slide} transition={{ duration: 0.2 }}>
              <h2 className="text-xl font-bold mb-1">Choose your topics</h2>
              <p className="text-sm text-muted-foreground mb-5">
                {selectedTopics.size} selected — only these will appear in your feed.
              </p>
              {categories.filter(cat => cat.id !== 'certification').map(cat => {
                const chans = topicChannels.filter(c => c.category === cat.id);
                if (!chans.length) return null;
                return (
                  <div key={cat.id} className="mb-5">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{cat.name}</div>
                    <div className="flex flex-wrap gap-2">
                      {chans.map(c => {
                        const on = selectedTopics.has(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleTopic(c.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                              on
                                ? 'border-[var(--color-accent-violet)] bg-[var(--color-accent-violet)]/15 text-[var(--color-accent-violet-light)]'
                                : 'border-border bg-card text-muted-foreground hover:border-[var(--color-accent-violet)]/40'
                            }`}
                          >
                            {on && <Check className="w-3 h-3 inline mr-1" />}{c.name}
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
              <h2 className="text-xl font-bold mb-1">Preparing for a cert?</h2>
              <p className="text-sm text-muted-foreground mb-5">Optional — adds cert-specific questions to your feed.</p>
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
                          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                            on
                              ? 'border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/10'
                              : 'border-border bg-card hover:border-[var(--color-accent-cyan)]/40'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-semibold">{cert.name}</div>
                            {cert.examCode && <div className="text-[10px] text-muted-foreground font-mono">{cert.examCode}</div>}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
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
      <div className="px-6 py-4 border-t border-border">
        <button
          onClick={() => {
            if (step < 2) setStep(s => s + 1);
            else finish();
          }}
          disabled={step === 0 && !selectedRole}
          className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[var(--color-accent-violet)] to-[var(--color-accent-cyan)] text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
        >
          {step < 2 ? <>Continue <ChevronRight className="w-4 h-4" /></> : <>Start Learning <Sparkles className="w-4 h-4" /></>}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full mt-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
