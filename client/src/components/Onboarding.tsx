/**
 * Onboarding — Linear-style split-screen
 * Left: brand panel  |  Right: role picker → channel preview
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rolesConfig, getRecommendedChannels } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import {
  Layout, Server, Layers, Smartphone, Activity, Shield,
  Cpu, Users, Database, Brain, Workflow, Box,
  Check, ChevronRight, X, Zap, Rocket, Target,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ReactNode> = {
  layout: <Layout className="w-4 h-4" />, server: <Server className="w-4 h-4" />,
  layers: <Layers className="w-4 h-4" />, smartphone: <Smartphone className="w-4 h-4" />,
  infinity: <Activity className="w-4 h-4" />, activity: <Activity className="w-4 h-4" />,
  workflow: <Workflow className="w-4 h-4" />, brain: <Brain className="w-4 h-4" />,
  shield: <Shield className="w-4 h-4" />, cpu: <Cpu className="w-4 h-4" />,
  users: <Users className="w-4 h-4" />, box: <Box className="w-4 h-4" />,
  database: <Database className="w-4 h-4" />,
};

const ROLE_COLORS: Record<string, string> = {
  frontend: '#f97316', backend: '#3b82f6', fullstack: '#8b5cf6',
  mobile: '#10b981', devops: '#f59e0b', 'data-engineer': '#06b6d4',
  'ml-engineer': '#ec4899', security: '#ef4444', architect: '#a78bfa',
};

const STATS = [
  { n: '1,000+', label: 'Questions' },
  { n: '40+',    label: 'Topics' },
  { n: '53+',    label: 'Certifications' },
  { n: '100%',   label: 'Free' },
];

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({ accentColor, step }: { accentColor: string; step: number }) {
  return (
    <div className="hidden lg:flex flex-col justify-between h-full px-12 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0d14 0%, #0a0a12 100%)' }}>

      <motion.div className="absolute rounded-full pointer-events-none"
        animate={{ background: `radial-gradient(circle, ${accentColor}28 0%, transparent 70%)` }}
        transition={{ duration: 0.8 }}
        style={{ width: 500, height: 500, top: -150, left: -150, filter: 'blur(70px)' }} />

      <div className="relative z-10">
        <div className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
            style={{ background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` }}>OI</div>
          <span className="font-bold text-white text-base tracking-tight">Open Interview</span>
        </div>

        <h1 className="text-4xl font-black text-white leading-[1.1] mb-4 tracking-tight">
          Land your<br />
          <motion.span animate={{ color: accentColor }} transition={{ duration: 0.5 }}>
            dream role.
          </motion.span>
        </h1>
        <p className="text-white/60 text-base leading-relaxed mb-10">
          Free, personalized interview prep. No paywalls, no fluff.
        </p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          {STATS.map(s => (
            <div key={s.label} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="text-2xl font-black text-white mb-0.5 tracking-tight">{s.n}</div>
              <div className="text-sm text-white/45">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Step dots */}
        <div className="flex gap-2">
          {[0, 1].map(i => (
            <motion.div key={i}
              animate={{ width: i === step ? 24 : 8, opacity: i <= step ? 1 : 0.2 }}
              transition={{ duration: 0.3 }}
              className="h-1.5 rounded-full"
              style={{ background: i <= step ? accentColor : 'rgba(255,255,255,0.2)' }} />
          ))}
        </div>
      </div>

      <div className="relative z-10 p-5 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/80 text-base leading-relaxed italic mb-2">"Passed my AWS SAA on the first try. This is the best free prep out there."</p>
        <p className="text-white/45 text-sm">— Sarah K., Cloud Engineer</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Onboarding() {
  const { skipOnboarding } = useUserPreferences();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState<'role' | 'preview'>('role');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const accentColor = selectedRole ? (ROLE_COLORS[selectedRole] ?? '#7c3aed') : '#7c3aed';
  const recommended = selectedRole ? getRecommendedChannels(selectedRole) : [];
  const active = recommended.filter(c => !excluded.has(c.id));

  const toggleExclude = (id: string) =>
    setExcluded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleContinue = () => {
    if (!selectedRole) return;
    if (step === 'role') { setStep('preview'); return; }
    const prefs = {
      role: selectedRole,
      subscribedChannels: active.map(c => c.id),
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('user-preferences', JSON.stringify(prefs));
    window.location.href = '/';
  };

  const stepNum = step === 'role' ? 0 : 1;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#09090f', color: 'white', fontFamily: 'var(--font-sans)' }}>

      {/* Left panel */}
      <div className="w-full lg:w-[420px] flex-shrink-0 border-r border-b lg:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
        <LeftPanel accentColor={accentColor} step={stepNum} />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-y-auto min-h-0">

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-8 py-4 sm:py-5 border-b flex-shrink-0"
          style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
              style={{ background: `linear-gradient(135deg, ${accentColor}, #06b6d4)` }}>OI</div>
            <span className="font-bold text-white text-base tracking-tight">Open Interview</span>
          </div>
          <div className="hidden lg:block" />

          {/* Steps */}
          <div className="hidden sm:flex items-center gap-1.5 text-sm">
            {['Role', 'Channels'].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold tracking-tight transition-all ${
                  i < stepNum ? 'text-emerald-400' : i === stepNum ? 'text-white' : 'text-white/25'
                }`}>
                  {i < stepNum ? <Check className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[9px]"
                    style={{ borderColor: i === stepNum ? accentColor : 'rgba(255,255,255,0.2)', color: i === stepNum ? accentColor : undefined }}>{i + 1}</span>}
                  {label}
                </span>
                {i < 1 && <div className="w-4 h-px" style={{ background: 'rgba(255,255,255,0.1)' }} />}
              </div>
            ))}
          </div>

          <button onClick={() => { skipOnboarding(); window.location.href = '/'; }}
            className="flex items-center gap-1 text-xs text-white/25 hover:text-white/55 transition-colors px-2 py-1">
            Skip <X className="w-3 h-3" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-8 py-6 sm:py-10 max-w-2xl w-full mx-auto">
          <AnimatePresence mode="wait">

            {/* ── Role step ── */}
            {step === 'role' && (
              <motion.div key="role"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.22 }}>

                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Step 1 of 2</p>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">What's your role?</h2>
                  <p className="text-white/60 text-base leading-relaxed">We'll curate the perfect question set for you.</p>
                </div>

                {/* Quick start */}
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const prefs = { role: 'fullstack', subscribedChannels: ['system-design', 'algorithms', 'frontend', 'backend', 'database'], onboardingComplete: true, createdAt: new Date().toISOString() };
                    localStorage.setItem('user-preferences', JSON.stringify(prefs));
                    window.location.href = '/';
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl mb-6 transition-all"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1.5px solid rgba(124,58,237,0.25)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-bold text-base text-white tracking-tight">Quick Start</div>
                    <div className="text-sm text-white/55 leading-relaxed">Jump in with popular topics — customize later</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </motion.button>

                <div className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-3">Or choose your role</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {rolesConfig.map((role, idx) => {
                    const sel = selectedRole === role.id;
                    const color = ROLE_COLORS[role.id] ?? '#7c3aed';
                    return (
                      <motion.button key={role.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        onClick={() => { setSelectedRole(role.id); setExcluded(new Set()); }}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative p-4 rounded-xl text-left transition-all"
                        style={{
                          background: sel ? `${color}12` : 'rgba(255,255,255,0.03)',
                          border: `1.5px solid ${sel ? color + '45' : 'rgba(255,255,255,0.07)'}`,
                          boxShadow: sel ? `0 0 18px ${color}15` : 'none',
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div style={{ color: sel ? color : 'rgba(255,255,255,0.35)' }}>
                            {iconMap[role.icon] || <Cpu className="w-4 h-4" />}
                          </div>
                          {sel && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ background: color }}>
                              <Check className="w-2.5 h-2.5 text-white" />
                            </motion.div>
                          )}
                        </div>
                        <div className="text-base font-bold text-white mb-0.5 tracking-tight">{role.name}</div>
                        <div className="text-sm text-white/50 leading-relaxed line-clamp-2">{role.description}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Preview step ── */}
            {step === 'preview' && (
              <motion.div key="preview"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.22 }}>

                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Step 2 of 2</p>
                  <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Your question feed</h2>
                  <p className="text-white/60 text-base leading-relaxed">
                    <span className="font-semibold" style={{ color: accentColor }}>{active.length} channels</span> selected.{' '}
                    Tap any to toggle.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {recommended.map((ch, idx) => {
                    const off = excluded.has(ch.id);
                    return (
                      <motion.button key={ch.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.025 }}
                        onClick={() => toggleExclude(ch.id)}
                        whileTap={{ scale: 0.96 }}
                        className="relative p-4 rounded-xl text-left transition-all"
                        style={{
                          background: off ? 'rgba(255,255,255,0.02)' : `${accentColor}10`,
                          border: `1.5px solid ${off ? 'rgba(255,255,255,0.06)' : accentColor + '35'}`,
                          opacity: off ? 0.45 : 1,
                        }}
                      >
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: off ? 'rgba(255,255,255,0.07)' : accentColor }}>
                          {off ? <X className="w-2.5 h-2.5 text-white/30" /> : <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div className="mb-2" style={{ color: off ? 'rgba(255,255,255,0.2)' : (ch.color || accentColor) }}>
                          {iconMap[ch.icon] || <Target className="w-4 h-4" />}
                        </div>
                        <div className="text-base font-bold text-white tracking-tight">{ch.name}</div>
                        <div className="text-sm text-white/50 leading-relaxed line-clamp-2 mt-0.5">{ch.description}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer CTA */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-4 sm:py-6 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.07)', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {step === 'preview' && (
              <button onClick={() => setStep('role')}
                className="px-5 py-3 rounded-xl text-sm font-medium text-white/45 hover:text-white/75 transition-colors border"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                ← Back
              </button>
            )}
            <motion.button
              onClick={handleContinue}
              disabled={!selectedRole && step === 'role'}
              whileHover={selectedRole ? { scale: 1.01 } : {}}
              whileTap={selectedRole ? { scale: 0.98 } : {}}
              className="flex-1 py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all tracking-tight"
              style={{
                background: selectedRole ? `linear-gradient(135deg, ${accentColor}, #06b6d4)` : 'rgba(255,255,255,0.06)',
                color: selectedRole ? 'white' : 'rgba(255,255,255,0.2)',
                boxShadow: selectedRole ? `0 0 28px ${accentColor}30` : 'none',
                cursor: selectedRole ? 'pointer' : 'not-allowed',
              }}
            >
              {step === 'role'
                ? <>Continue <ChevronRight className="w-4 h-4" /></>
                : <><Zap className="w-4 h-4" /> Start Learning</>
              }
            </motion.button>
          </div>
          {step === 'role' && (
            <p className="text-center text-xs text-white/30 mt-3">
              <button onClick={() => { skipOnboarding(); window.location.href = '/'; }}
                className="hover:text-white/40 transition-colors underline underline-offset-2">
                Skip onboarding
              </button>
              {' '}— you can personalize later
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
