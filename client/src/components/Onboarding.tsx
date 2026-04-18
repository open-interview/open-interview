import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { rolesConfig, getRecommendedChannels } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import { 
  Layout, Server, Layers, Smartphone, Activity, Shield, 
  Cpu, Users, Database, Brain, Workflow, Box, Check, ChevronRight, Sparkles, X,
  ChevronLeft, Rocket
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  'layout': <Layout className="w-6 h-6" />,
  'server': <Server className="w-6 h-6" />,
  'layers': <Layers className="w-6 h-6" />,
  'smartphone': <Smartphone className="w-6 h-6" />,
  'infinity': <Activity className="w-6 h-6" />,
  'activity': <Activity className="w-6 h-6" />,
  'workflow': <Workflow className="w-6 h-6" />,
  'brain': <Brain className="w-6 h-6" />,
  'shield': <Shield className="w-6 h-6" />,
  'cpu': <Cpu className="w-6 h-6" />,
  'users': <Users className="w-6 h-6" />,
  'box': <Box className="w-6 h-6" />,
  'database': <Database className="w-6 h-6" />
};

// Step indicator component
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <motion.div
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
              ${i < currentStep 
                ? 'bg-primary text-black' 
                : i === currentStep 
                  ? 'bg-primary/20 text-primary ring-2 ring-primary' 
                  : 'bg-white/10 text-white/40'
              }
            `}
            initial={false}
            animate={{ scale: i === currentStep ? 1.1 : 1 }}
          >
            {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
          </motion.div>
          {i < totalSteps - 1 && (
            <div className={`w-8 h-0.5 mx-1 ${i < currentStep ? 'bg-primary' : 'bg-white/10'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function Onboarding() {
  const { skipOnboarding } = useUserPreferences();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState<'role' | 'preview'>('role');
  const [excludedChannels, setExcludedChannels] = useState<Set<string>>(new Set());

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    // Reset excluded channels when role changes
    setExcludedChannels(new Set());
  };

  const handleContinue = () => {
    if (selectedRole) {
      if (step === 'role') {
        setStep('preview');
      } else {
        // Save preferences with excluded channels filtered out
        const recommended = getRecommendedChannels(selectedRole);
        const selectedChannels = recommended
          .filter(c => !excludedChannels.has(c.id))
          .map(c => c.id);
        
        // Save to localStorage directly
        const prefs = {
          role: selectedRole,
          subscribedChannels: selectedChannels,
          onboardingComplete: true,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('user-preferences', JSON.stringify(prefs));
        window.location.href = '/';
      }
    }
  };

  const toggleChannel = (channelId: string) => {
    setExcludedChannels(prev => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  };

  const recommendedChannels = selectedRole ? getRecommendedChannels(selectedRole) : [];
  const activeChannels = recommendedChannels.filter(c => !excludedChannels.has(c.id));

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-mono">
      <AnimatePresence mode="wait">
        {step === 'role' ? (
          <motion.div
            key="role"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl w-full"
          >
            {/* Progress indicator */}
            <StepIndicator currentStep={0} totalSteps={2} />

            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold mb-2">
                <span className="text-primary">&gt;</span> Welcome to Learn_Reels
              </h1>
              <p className="text-white/60 text-sm mb-1">
                Select your role to get personalized channel recommendations
              </p>
              <p className="text-white/40 text-xs">1000+ questions across 40+ topics</p>
            </div>

            {/* Quick start option for mobile */}
            <div className="mb-6 sm:hidden">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  // Quick start with popular channels
                  const prefs = {
                    role: 'fullstack',
                    subscribedChannels: ['system-design', 'algorithms', 'frontend', 'backend', 'database'],
                    onboardingComplete: true,
                    createdAt: new Date().toISOString()
                  };
                  localStorage.setItem('user-preferences', JSON.stringify(prefs));
                  window.location.href = '/';
                }}
                className="w-full p-4 min-h-[56px] cursor-pointer bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl flex items-center gap-3 transition duration-150 ease-out"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-black" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-bold text-sm">Quick Start</div>
                  <div className="text-xs text-white/60">Jump in with popular topics</div>
                </div>
                <ChevronRight className="w-5 h-5 text-primary" />
              </motion.button>
              <div className="text-center text-xs text-white/40 mt-2">or choose your role below</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
              {rolesConfig.map(role => (
                <motion.button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className={`
                    p-5 min-h-[88px] border rounded-lg text-left cursor-pointer transition duration-150 ease-out
                    ${selectedRole === role.id 
                      ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                      : 'border-white/20 hover:border-white/40 hover:bg-white/5'
                    }
                  `}
                >
                  <div className={`mb-2 ${selectedRole === role.id ? 'text-primary' : 'text-white/60'}`}>
                    {iconMap[role.icon] || <Cpu className="w-6 h-6" />}
                  </div>
                  <div className="font-bold text-sm mb-1">{role.name}</div>
                  <div className="text-xs text-white/50 line-clamp-2">{role.description}</div>
                  {selectedRole === role.id && (
                    <div className="mt-2 flex items-center gap-1 text-primary text-xs">
                      <Check className="w-3 h-3" /> Selected
                    </div>
                  )}
                </motion.button>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  skipOnboarding();
                  window.location.href = '/';
                }}
                className="px-6 py-2 min-h-[44px] cursor-pointer text-sm text-white/50 hover:text-white transition duration-150 ease-out"
              >
                Skip for now
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedRole}
                className={`
                  px-8 py-3 min-h-[48px] text-base font-bold rounded flex items-center gap-2 cursor-pointer transition duration-150 ease-out
                  ${selectedRole 
                    ? 'bg-primary text-black hover:bg-primary/90' 
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                  }
                `}
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-3xl w-full"
          >
            {/* Progress indicator */}
            <StepIndicator currentStep={1} totalSteps={2} />

            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 text-primary mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-widest">Recommended for you</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Your Personalized Channels
              </h2>
              <p className="text-white/60 text-sm">
                Based on your role, we've selected {recommendedChannels.length} channels for you.
                <br />
                <span className="text-white/40">Click on any channel to include or exclude it.</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {recommendedChannels.map(channel => {
                const isExcluded = excludedChannels.has(channel.id);
                return (
                  <motion.button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    whileTap={{ scale: 0.96 }}
                    className={`
                      p-4 min-h-[80px] border rounded-lg text-left transition-all duration-150 ease-out relative group cursor-pointer
                      ${isExcluded 
                        ? 'border-white/10 bg-white/5 opacity-50' 
                        : 'border-primary/50 bg-primary/10 ring-1 ring-primary/30'
                      }
                    `}
                  >
                    {/* Toggle indicator */}
                    <div className={`
                      absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ease-out
                      ${isExcluded 
                        ? 'bg-white/10 text-white/30' 
                        : 'bg-primary text-black'
                      }
                    `}>
                      {isExcluded ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                    </div>
                    
                    <div className={`mb-2 ${isExcluded ? 'text-white/30' : channel.color}`}>
                      {iconMap[channel.icon] || <Cpu className="w-5 h-5" />}
                    </div>
                    <div className={`text-sm font-bold ${isExcluded ? 'text-white/40' : ''}`}>
                      {channel.name}
                    </div>
                    <div className="text-xs text-white/50 line-clamp-2 mt-1">
                      {channel.description}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Selection summary — sticky bottom bar */}
            <div className="sticky bottom-0 bg-black/80 backdrop-blur px-4 py-3 border-t border-white/10 flex items-center justify-between gap-4">
              <div className="text-sm">
                <span className="text-white/60">Selected: </span>
                <span className="text-primary font-bold">{activeChannels.length}</span>
                <span className="text-white/60"> of {recommendedChannels.length} channels</span>
                {excludedChannels.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setExcludedChannels(new Set())}
                    className="ml-3 text-xs text-white/40 hover:text-white underline transition-colors duration-150 ease-out"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="px-4 py-2 min-h-[44px] text-sm text-white/50 hover:text-white transition-colors duration-150 ease-out cursor-pointer"
                >
                  Back
                </button>
                <motion.button
                  type="button"
                  data-testid="start-learning-btn"
                  onClick={handleContinue}
                  disabled={activeChannels.length === 0}
                  whileTap={activeChannels.length > 0 ? { scale: 0.97 } : undefined}
                  className={`
                    px-8 py-3.5 min-h-[52px] text-base font-bold rounded flex items-center gap-2 transition-all duration-150 ease-out cursor-pointer
                    ${activeChannels.length > 0
                      ? 'bg-primary text-black hover:bg-primary/90'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                    }
                  `}
                >
                  Start Learning <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
