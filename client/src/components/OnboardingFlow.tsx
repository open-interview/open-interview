import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, X, Sparkles } from 'lucide-react';
import { allChannelsConfig, getRecommendedChannels, categories } from '../lib/channels-config';
import { certificationsConfig } from '../lib/certifications-config';
import { useUserPreferences } from '../context/UserPreferencesContext';

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

const topicChannels = allChannelsConfig.filter(c => !c.isCertification);

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
      <motion.div
        className="absolute rounded-full pointer-events-none"
        animate={{ background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)` }}
        transition={{ duration: 0.8 }}
        style={{ width: 480, height: 480, top: -120, left: -120, filter: 'blur(60px)' }}
      />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, #06b6d420 0%, transparent 70%)', filter: 'blur(50px)' }} />
      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` }}>
            OI
          </div>
          <span className="font-bold text-white text-sm tracking-tight">Open Interview</span>
        </div>
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
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div key={i}
              animate={{ width: 24, opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="h-1.5 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accentColor}dd, #06b6d4)`,
                boxShadow: `0 0 8px ${accentColor}50`,
              }}
            />
          ))}
        </div>
      </div>
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

export function OnboardingFlow({ onComplete }: Props) {
  const { setRole, toggleSubscription, skipOnboarding, toggleCertificationSubscription } = useUserPreferences();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [selectedCerts, setSelectedCerts] = useState<Set<string>>(new Set());
  const [certsOpen, setCertsOpen] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { skipOnboarding(); onComplete(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []); // eslint-disable-line

  const handleRoleSelect = (roleId: string) => {
    if (selectedRole === roleId) {
      setSelectedRole(null);
      setSelectedTopics(new Set());
      return;
    }
    setSelectedRole(roleId);
    const rec = getRecommendedChannels(roleId).filter(c => !c.isCertification).map(c => c.id);
    setSelectedTopics(new Set(rec));
  };

  const certsByProvider = useMemo(() => {
    const map: Record<string, typeof certificationsConfig> = {};
    for (const cert of certificationsConfig) {
      if (!CERT_PROVIDERS.includes(cert.provider)) continue;
      (map[cert.provider] ??= []).push(cert);
    }
    return map;
  }, []);

  const relevantCategories = useMemo(() => {
    if (!selectedRole) return [];
    const recIds = new Set(getRecommendedChannels(selectedRole).filter(c => !c.isCertification).map(c => c.id));
    return categories.filter(c =>
      c.id !== 'certification' &&
      topicChannels.some(ch => ch.category === c.id && recIds.has(ch.id))
    );
  }, [selectedRole, topicChannels]);

  const toggleTopic = (id: string) =>
    setSelectedTopics(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleCert = (id: string) =>
    setSelectedCerts(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const finish = () => {
    try {
      if (!selectedRole) { skipOnboarding(); onComplete(); return; }
      setRole(selectedRole);
      const recSet = new Set(getRecommendedChannels(selectedRole).filter(c => !c.isCertification).map(c => c.id));
      for (const id of topicChannels.map(c => c.id)) {
        const want = selectedTopics.has(id);
        const rec = recSet.has(id);
        if (want !== rec) toggleSubscription(id);
      }
      for (const id of Array.from(selectedCerts)) toggleCertificationSubscription(id);
    } finally {
      onComplete();
    }
  };

  const activeRole = ROLES.find(r => r.id === selectedRole);
  const accentColor = activeRole?.color ?? '#7c3aed';

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex flex-col lg:flex-row" style={{ background: '#09090f' }}>
      <div className="w-full lg:w-[420px] flex-shrink-0 border-r border-b lg:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <LeftPanel step={2} activeRole={activeRole} />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-3 border-b flex-shrink-0 h-12"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` }}>OI</div>
            <span className="font-bold text-white text-sm">Open Interview</span>
          </div>
          <span className="hidden lg:block text-sm font-semibold text-white/70">personalize</span>
          <button onClick={() => { skipOnboarding(); onComplete(); }} aria-label="Skip onboarding"
            className="flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1">
            Skip <X className="w-3 h-3" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-8 py-4 gap-3">
          {/* Mobile brand header — shown when LeftPanel is hidden */}
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` }}>
              OI
            </div>
            <span className="font-bold text-white text-sm">Open Interview</span>
          </div>

          <motion.div className="flex-shrink-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.25 }}
          >
            <div className="text-sm font-semibold text-white mb-2">What's your role?</div>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map(r => {
                const sel = selectedRole === r.id;
                return (
                  <motion.button key={r.id}
                    onClick={() => handleRoleSelect(r.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-pressed={sel}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: sel ? `${r.color}18` : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${sel ? r.color + '60' : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: sel ? `0 0 12px ${r.color}30` : 'none',
                      color: sel ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    <span>{r.emoji}</span>
                    <span>{r.label}</span>
                    {sel && <Check className="w-3 h-3" style={{ color: r.color }} />}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <div className="h-px bg-white/5 flex-shrink-0" />

          <motion.div className="flex-shrink-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.25 }}
          >
            <div className="text-sm font-semibold text-white mb-2">
              Topics <span className="text-xs text-white/40 font-normal">({selectedTopics.size} selected)</span>
            </div>
            {!selectedRole ? (
              <div className="text-xs text-white/30 italic py-2">Select a role to see recommended topics</div>
            ) : (
              <div className="space-y-2">
                {relevantCategories.map(cat => {
                  const chans = topicChannels.filter(c => c.category === cat.id);
                  if (!chans.length) return null;
                  return (
                    <div key={cat.id}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1">{cat.name}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {chans.map(c => {
                          const on = selectedTopics.has(c.id);
                          return (
                            <motion.button key={c.id}
                              onClick={() => toggleTopic(c.id)}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.95 }}
                              aria-pressed={on}
                              className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-all"
                              style={{
                                background: on ? `${accentColor}18` : 'rgba(255,255,255,0.025)',
                                border: `1px solid ${on ? accentColor + '55' : 'rgba(255,255,255,0.06)'}`,
                                color: on ? '#e2d9f3' : 'rgba(255,255,255,0.45)',
                              }}
                            >
                              {on && <Check className="w-2.5 h-2.5" />}
                              {c.name}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          <div className="h-px bg-white/5 flex-shrink-0" />

          <motion.div className="flex-shrink-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.25 }}
          >
            <button onClick={() => setCertsOpen(o => !o)}
              className="flex items-center gap-1.5 w-full text-sm font-semibold text-white py-1.5">
              <motion.div animate={{ rotate: certsOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              </motion.div>
              Preparing for a cert?
            </button>
            <AnimatePresence initial={false}>
              {certsOpen && (
                <motion.div
                  key="certs"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-1 space-y-2">
                    {Object.entries(certsByProvider).map(([provider, certs]) => (
                      <div key={provider}>
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/35 mb-1">{provider}</div>
                        <div className="space-y-1">
                          {certs.map(cert => {
                            const on = selectedCerts.has(cert.id);
                            return (
                              <motion.button key={cert.id}
                                onClick={() => toggleCert(cert.id)}
                                whileTap={{ scale: 0.99 }}
                                aria-pressed={on}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-all"
                                style={{
                                  background: on ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                                  border: `1px solid ${on ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.07)'}`,
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-white">{cert.name}</span>
                                  {cert.examCode && <span className="text-[9px] font-mono text-white/30">{cert.examCode}</span>}
                                </div>
                                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                  style={{ background: on ? '#06b6d4' : 'rgba(255,255,255,0.08)' }}>
                                  {on && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <div className="flex-shrink-0 px-4 sm:px-8 py-3 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
          <motion.button
            onClick={finish}
            disabled={!selectedRole}
            whileHover={selectedRole ? { scale: 1.015 } : {}}
            whileTap={selectedRole ? { scale: 0.94 } : {}}
            className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: selectedRole ? `linear-gradient(135deg, ${accentColor}, #06b6d4)` : 'rgba(255,255,255,0.06)',
              color: selectedRole ? 'white' : 'rgba(255,255,255,0.2)',
              boxShadow: selectedRole ? `0 8px 32px ${accentColor}30, inset 0 1px 0 rgba(255,255,255,0.15)` : 'none',
              cursor: selectedRole ? 'pointer' : 'not-allowed',
            }}
          >
            <Sparkles className="w-4 h-4" /> Start Learning
          </motion.button>
          <button onClick={() => { skipOnboarding(); onComplete(); }} aria-label="Skip onboarding"
            className="block mx-auto mt-1 text-[10px] text-white/20 hover:text-white/50 transition-colors">
            Skip →
          </button>
        </div>
      </div>
    </div>
  );
}
