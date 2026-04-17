/**
 * Modern Home Page V2 - Clean & Aesthetic Redesign
 * Simplified, spacious, and visually balanced
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useChannelStats } from '../../hooks/use-stats';
import { useUserPreferences } from '../../context/UserPreferencesContext';
import { useProgress, useGlobalStats } from '../../hooks/use-progress';
import { useCredits } from '../../context/CreditsContext';
import { ProgressStorage } from '../../services/storage.service';
import { allChannelsConfig } from '../../lib/channels-config';
import { ResumeSection } from './ResumeSection';
import {
  Target, Flame, Trophy, Zap, ChevronRight, Plus,
  Mic, Code, Brain, Star, TrendingUp,
  CheckCircle, ArrowRight, Sparkles, Users,
  Cpu, Terminal, Layout, Database, Activity, GitBranch, Server,
  Layers, Smartphone, Shield, Workflow, Box, Cloud,
  Network, MessageCircle, Eye, FileText, Monitor, Gauge, BookOpen
} from 'lucide-react';

// Icon mapping for channels
const iconMap: Record<string, React.ReactNode> = {
  'cpu': <Cpu className="w-5 h-5" />,
  'terminal': <Terminal className="w-5 h-5" />,
  'layout': <Layout className="w-5 h-5" />,
  'database': <Database className="w-5 h-5" />,
  'activity': <Activity className="w-5 h-5" />,
  'infinity': <GitBranch className="w-5 h-5" />,
  'server': <Server className="w-5 h-5" />,
  'layers': <Layers className="w-5 h-5" />,
  'smartphone': <Smartphone className="w-5 h-5" />,
  'shield': <Shield className="w-5 h-5" />,
  'brain': <Brain className="w-5 h-5" />,
  'workflow': <Workflow className="w-5 h-5" />,
  'box': <Box className="w-5 h-5" />,
  'cloud': <Cloud className="w-5 h-5" />,
  'code': <Code className="w-5 h-5" />,
  'network': <Network className="w-5 h-5" />,
  'message-circle': <MessageCircle className="w-5 h-5" />,
  'users': <Users className="w-5 h-5" />,
  'sparkles': <Sparkles className="w-5 h-5" />,
  'eye': <Eye className="w-5 h-5" />,
  'file-text': <FileText className="w-5 h-5" />,
  'chart': <Activity className="w-5 h-5" />,
  'check-circle': <CheckCircle className="w-5 h-5" />,
  'monitor': <Monitor className="w-5 h-5" />,
  'zap': <Zap className="w-5 h-5" />,
  'gauge': <Gauge className="w-5 h-5" />,
};

export function ModernHomePageV2() {
  const [, setLocation] = useLocation();
  const { stats: channelStats } = useChannelStats();
  const { getSubscribedChannels } = useUserPreferences();
  const { stats: activityStats } = useGlobalStats();
  const { balance, formatCredits } = useCredits();
  
  const subscribedChannels = getSubscribedChannels();
  const hasChannels = subscribedChannels.length > 0;
  const totalCompleted = ProgressStorage.getAllCompletedIds().size;
  
  // Calculate streak safely
  const streak = (() => {
    try {
      let s = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (activityStats?.find(x => x.date === dateStr)) s++;
        else break;
      }
      return s;
    } catch (error) {
      console.error('Error calculating streak:', error);
      return 0;
    }
  })();

  const questionCounts: Record<string, number> = {};
  channelStats?.forEach(s => { questionCounts[s.id] = s.total || 0; });

  if (!hasChannels) {
    return <OnboardingExperience onGetStarted={() => setLocation('/channels')} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Hero Section - Simplified */}
      <section className="relative border-b border-[#21262d]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            {/* Left: Welcome */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-5xl font-bold text-white mb-3">
                  Ready to practice?
                </h1>
                <p className="text-lg text-[#8b949e]">
                  Continue your interview preparation journey
                </p>
              </div>

              {/* Stats - Horizontal */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#238636]/10 flex items-center justify-center">
                    <Target className="w-5 h-5 text-[#3fb950]" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{totalCompleted}</div>
                    <div className="text-xs text-[#8b949e]">Completed</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{streak}</div>
                    <div className="text-xs text-[#8b949e]">Day Streak</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{formatCredits(balance)}</div>
                    <div className="text-xs text-[#8b949e]">Credits</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: CTA */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => setLocation('/voice-interview')}
              className="group px-8 py-4 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl font-semibold text-lg transition-all flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              <Mic className="w-6 h-6" />
              Voice Interview
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </section>

      {/* Main Content - Spacious Layout */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="space-y-12">
          {/* Resume Section */}
          <ResumeSection />
          
          {/* Quick Actions - Larger Cards */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Quick Start</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  title: 'Voice Interview',
                  desc: 'Practice speaking your answers',
                  icon: Mic,
                  color: 'bg-[#1f6feb]',
                  path: '/voice-interview'
                },
                {
                  title: 'Coding Challenge',
                  desc: 'Solve algorithmic problems',
                  icon: Code,
                  color: 'bg-[#238636]',
                  path: '/coding'
                },
                {
                  title: 'Training Mode',
                  desc: 'Structured learning path',
                  icon: Target,
                  color: 'bg-[#da3633]',
                  path: '/training'
                },
                {
                  title: 'Quick Tests',
                  desc: 'Rapid knowledge checks',
                  icon: Zap,
                  color: 'bg-[#d29922]',
                  path: '/tests'
                }
              ].map((action, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setLocation(action.path)}
                  className="group text-left p-6 bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-[#58a6ff] rounded-xl transition-all"
                >
                  <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{action.title}</h3>
                  <p className="text-sm text-[#8b949e]">{action.desc}</p>
                </motion.button>
              ))}
            </div>
          </section>
          
          {/* Channels Section - Cleaner Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-white">Your Channels</h2>
                <div className="px-3 py-1 bg-[#1f6feb]/10 text-[#58a6ff] rounded-full text-sm font-semibold">
                  {subscribedChannels.length}
                </div>
              </div>
              <button
                onClick={() => setLocation('/channels')}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-all flex items-center gap-2 border border-[#30363d]"
              >
                <Plus className="w-4 h-4" />
                Add Channel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subscribedChannels.map((channel, i) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  questionCount={questionCounts[channel.id] || 0}
                  onClick={() => setLocation(`/channel/${channel.id}`)}
                  index={i}
                />
              ))}
            </div>
          </section>

          {/* Bottom Section - Learning Paths & Community */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Learning Paths */}
            <section className="p-8 bg-[#161b22] border border-[#30363d] rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Learning Paths</h3>
                <button 
                  onClick={() => setLocation('/learning-paths')}
                  className="text-sm text-[#58a6ff] hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="space-y-6">
                {[
                  { title: 'Frontend Development', progress: 65, color: 'bg-[#1f6feb]', icon: Layout },
                  { title: 'Backend Engineering', progress: 40, color: 'bg-[#238636]', icon: Server },
                  { title: 'Algorithms & DS', progress: 80, color: 'bg-[#a371f7]', icon: Brain }
                ].map((path, i) => (
                  <div key={i} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${path.color} rounded-lg flex items-center justify-center`}>
                        <path.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-white">{path.title}</span>
                          <span className="text-sm text-[#8b949e]">{path.progress}%</span>
                        </div>
                        <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${path.progress}%` }}
                            transition={{ duration: 1, delay: i * 0.2 }}
                            className={`h-full ${path.color} rounded-full`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Community Stats */}
            <section className="p-8 bg-[#161b22] border border-[#30363d] rounded-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#1f6feb]/10 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-[#58a6ff]" />
                </div>
                <h3 className="text-xl font-bold text-white">Community</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-[#21262d]">
                  <span className="text-[#8b949e]">Active learners</span>
                  <span className="text-xl font-bold text-white">12,847</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#21262d]">
                  <span className="text-[#8b949e]">Questions solved today</span>
                  <span className="text-xl font-bold text-white">3,291</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-[#8b949e]">Success rate</span>
                  <span className="text-xl font-bold text-[#3fb950]">94%</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#21262d]">
                <div className="flex items-center gap-2 text-sm text-[#8b949e]">
                  <TrendingUp className="w-4 h-4 text-[#3fb950]" />
                  <span>You're in the top <span className="text-[#3fb950] font-semibold">15%</span> this week!</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// Onboarding Experience
function OnboardingExperience({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl text-center space-y-12"
      >
        {/* Logo */}
        <div className="space-y-6">
          <div className="w-24 h-24 mx-auto bg-[#238636] rounded-2xl flex items-center justify-center">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-white mb-4">
              Welcome to CodeReels
            </h1>
            <p className="text-xl text-[#8b949e]">
              Master technical interviews with AI-powered practice
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Brain, title: "AI-Powered", desc: "Smart question selection based on your progress" },
            { icon: Mic, title: "Voice Practice", desc: "Real interview simulation with feedback" },
            { icon: Trophy, title: "Track Progress", desc: "Detailed analytics and achievements" }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.3 }}
              className="p-8 bg-[#161b22] rounded-xl border border-[#30363d]"
            >
              <div className="w-14 h-14 bg-[#238636]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-7 h-7 text-[#3fb950]" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-lg">{item.title}</h3>
              <p className="text-sm text-[#8b949e]">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={onGetStarted}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-10 py-5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-3"
        >
          Start Your Journey
          <ArrowRight className="w-6 h-6" />
        </motion.button>
      </motion.div>
    </div>
  );
}

// Channel Card - Simplified
function ChannelCard({
  channel,
  questionCount,
  onClick,
  index
}: {
  channel: any;
  questionCount: number;
  onClick: () => void;
  index: number;
}) {
  const { completed } = useProgress(channel.id);
  const progress = questionCount > 0 ? Math.round((completed.length / questionCount) * 100) : 0;
  const config = allChannelsConfig.find(c => c.id === channel.id);

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative p-6 bg-[#161b22] hover:bg-[#1c2128] border border-[#30363d] hover:border-[#58a6ff] rounded-xl transition-all text-left"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#21262d] group-hover:bg-[#30363d] flex items-center justify-center text-[#58a6ff] transition-colors">
            {(config?.icon && iconMap[config.icon]) || <Code className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">{channel.name}</h3>
            <div className="flex items-center gap-2 text-sm text-[#8b949e]">
              <span>{completed.length}/{questionCount}</span>
              <span>•</span>
              <span>{progress}%</span>
            </div>
          </div>
        </div>
        {progress === 100 && (
          <Trophy className="w-5 h-5 text-amber-500" />
        )}
      </div>
      
      <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, delay: index * 0.1 }}
          className="h-full bg-[#238636] rounded-full"
        />
      </div>

      <ChevronRight className="absolute top-6 right-6 w-5 h-5 text-[#8b949e] group-hover:text-[#58a6ff] group-hover:translate-x-1 transition-all" />
    </motion.button>
  );
}

