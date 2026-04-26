/**
 * Learning Paths - Choose Your Career Journey
 * Create custom paths or select curated ones
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { allChannelsConfig } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import {
  Code, Rocket, Brain, Building2, Award,
  Plus, ChevronRight, Star, Clock, Zap, Check, X, Search, Target
} from 'lucide-react';

// Certification type
interface Certification {
  id: string;
  name: string;
  provider: string;
  icon: string;
  category: string;
}

// Custom path type
interface CustomPath {
  name: string;
  channels: string[];
  certifications: string[];
}

const PATH_ICON_MAP: Record<string, React.ElementType> = {
  'job-title': Code, 'company': Building2, 'skill': Brain, 'certification': Award,
};
const PATH_COLOR_MAP: Record<string, string> = {
  'job-title': 'from-blue-500 to-cyan-500', 'company': 'from-green-500 to-emerald-500',
  'skill': 'from-purple-500 to-pink-500', 'certification': 'from-orange-500 to-red-500',
};

function mapPathFromJson(path: any) {
  const questionIds = typeof path.questionIds === 'string' ? JSON.parse(path.questionIds) : (path.questionIds || []);
  const channels = typeof path.channels === 'string' ? JSON.parse(path.channels) : (path.channels || []);
  const tags = typeof path.tags === 'string' ? JSON.parse(path.tags) : (path.tags || []);
  const learningObjectives = typeof path.learningObjectives === 'string' ? JSON.parse(path.learningObjectives) : (path.learningObjectives || []);
  const pathType = path.pathType || getPathTypeFromId(path.id);
  return {
    id: path.id,
    name: path.title,
    icon: PATH_ICON_MAP[pathType] || Rocket,
    color: PATH_COLOR_MAP[pathType] || 'from-indigo-500 to-purple-500',
    description: path.description,
    channels,
    difficulty: path.difficulty ? path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1) : 'Intermediate',
    duration: path.estimatedHours ? `${path.estimatedHours}h` : '10h',
    totalQuestions: questionIds.length || 0,
    jobs: learningObjectives.slice(0, 4),
    skills: tags.slice(0, 5),
    salary: '',
    pathType,
  };
}
function getPathTypeFromId(id: string) {
  if (id.startsWith('company-')) return 'company';
  if (id.startsWith('job-')) return 'job-title';
  if (id.startsWith('cert-')) return 'certification';
  return 'skill';
}

export default function LearningPaths() {
  const [, setLocation] = useLocation();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [curatedPaths, setCuratedPaths] = useState<any[]>([]);
  const { preferences } = useUserPreferences();
  const subscribedSet = new Set(preferences.subscribedChannels);
  const visibleCuratedPaths = curatedPaths.filter(p => p.channels.some((c: string) => subscribedSet.has(c)));
  
  // Custom path builder state
  const [customPath, setCustomPath] = useState<CustomPath>({
    name: '',
    channels: [],
    certifications: []
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Load certifications
  useEffect(() => {
    async function loadCerts() {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/certifications.json`);
        if (response.ok) {
          const data = await response.json();
          setCertifications(data);
        }
      } catch (e) {
        console.error('Failed to load certifications:', e);
      }
    }
    loadCerts();
  }, []);

  // Load curated paths
  useEffect(() => {
    async function loadPaths() {
      try {
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/learning-paths.json`);
        if (response.ok) {
          const data = await response.json();
          setCuratedPaths(data.map(mapPathFromJson));
        }
      } catch (e) {
        console.error('Failed to load learning paths:', e);
      }
    }
    loadPaths();
  }, []);

  const handleSelectPath = (pathId: string) => {
    setSelectedPath(pathId);
    const path = curatedPaths.find(p => p.id === pathId);
    if (path) {
      // Save curated path with its channels (use array for multiple paths support)
      try {
        const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
        if (!currentPaths.includes(pathId)) {
          currentPaths.push(pathId);
        }
        localStorage.setItem('activeLearningPaths', JSON.stringify(currentPaths));
        
        // Don't save curated paths to customLearningPath - that's only for custom paths
        // The home page will find curated paths by their ID in the curatedPaths array
      } catch (e) {
        console.error('Failed to save path:', e);
      }
    }
    setTimeout(() => {
      setLocation('/');
    }, 500);
  };

  const handleCreateCustomPath = () => {
    if (!customPath.name || (customPath.channels.length === 0 && customPath.certifications.length === 0)) {
      alert('Please add a name and select at least one channel or certification');
      return;
    }

    try {
      // Generate unique ID
      const pathId = `custom-${Date.now()}`;
      
      // Create path object
      const newPath = {
        id: pathId,
        name: customPath.name,
        channels: customPath.channels,
        certifications: customPath.certifications,
        createdAt: new Date().toISOString()
      };

      // Load existing custom paths
      const existingPaths = JSON.parse(localStorage.getItem('customPaths') || '[]');
      
      // Add new path
      const updatedPaths = [...existingPaths, newPath];
      localStorage.setItem('customPaths', JSON.stringify(updatedPaths));

      // Set as active path (use array for multiple paths support)
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      if (!currentPaths.includes(pathId)) {
        currentPaths.push(pathId);
      }
      localStorage.setItem('activeLearningPaths', JSON.stringify(currentPaths));
      
      localStorage.setItem('customLearningPath', JSON.stringify({
        name: newPath.name,
        channels: newPath.channels,
        certifications: newPath.certifications
      }));

      setShowCustom(false);
      setLocation('/');
    } catch (e) {
      console.error('Failed to save custom path:', e);
    }
  };

  const toggleChannel = (channelId: string) => {
    setCustomPath(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(c => c !== channelId)
        : [...prev.channels, channelId]
    }));
  };

  const toggleCertification = (certId: string) => {
    setCustomPath(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certId)
        ? prev.certifications.filter(c => c !== certId)
        : [...prev.certifications, certId]
    }));
  };

  // Filter channels and certs by search
  const filteredChannels = allChannelsConfig.filter(ch =>
    ch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredCerts = certifications.filter(cert =>
    cert.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEOHead
        title="Learning Paths - Choose Your Career Journey"
        description="Curated learning paths for different tech careers"
        canonical="https://open-interview.github.io/learning-paths"
      />

      <AppLayout>
        {/* Custom Path Builder Modal */}
        <AnimatePresence>
          {showCustom && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowCustom(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-background border border-border rounded-[var(--radius-3xl)] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-semibold">Create Custom Path</h2>
                    <button
                      onClick={() => setShowCustom(false)}
                      className="w-10 h-10 bg-muted/50 hover:bg-muted rounded-full flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Path Name Input */}
                  <input
                    type="text"
                    placeholder="My Custom Path"
                    value={customPath.name}
                    onChange={(e) => setCustomPath(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-6 py-4 bg-muted/50 border border-border rounded-[var(--radius-xl)] text-xl focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search channels and certifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-[var(--radius-lg)] focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  {/* Selected Summary */}
                  {(customPath.channels.length > 0 || customPath.certifications.length > 0) && (
                    <div className="p-4 bg-[var(--color-accent-violet)]/10 border border-[var(--color-accent-violet)]/30 rounded-[var(--radius-xl)]">
                      <div className="text-sm text-muted-foreground mb-2">Selected:</div>
                      <div className="flex items-center gap-4 text-sm font-semibold">
                        <span>{customPath.channels.length} channels</span>
                        <span>•</span>
                        <span>{customPath.certifications.length} certifications</span>
                      </div>
                    </div>
                  )}

                  {/* Channels Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Channels</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredChannels.slice(0, 20).map((channel) => {
                        const isSelected = customPath.channels.includes(channel.id);
                        return (
                          <button
                            key={channel.id}
                            onClick={() => toggleChannel(channel.id)}
                            className={`p-4 rounded-[var(--radius-lg)] border transition-all text-left ${
                              isSelected
                                ? 'bg-gradient-to-r from-primary/20 to-cyan-500/20 border-primary'
                                : 'bg-muted/50 border-border hover:border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{channel.name}</span>
                              {isSelected && <Check className="w-5 h-5 text-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Certifications Section */}
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Certifications</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredCerts.slice(0, 20).map((cert) => {
                        const isSelected = customPath.certifications.includes(cert.id);
                        return (
                          <button
                            key={cert.id}
                            onClick={() => toggleCertification(cert.id)}
                            className={`p-4 rounded-[var(--radius-lg)] border transition-all text-left ${
                              isSelected
                                ? 'bg-gradient-to-r from-primary/20 to-cyan-500/20 border-primary'
                                : 'bg-muted/50 border-border hover:border-border'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">{cert.provider}</div>
                                <div className="font-semibold text-sm">{cert.name}</div>
                              </div>
                              {isSelected && <Check className="w-5 h-5 text-primary" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border">
                  <button
                    onClick={handleCreateCustomPath}
                    disabled={!customPath.name || (customPath.channels.length === 0 && customPath.certifications.length === 0)}
                    className="w-full py-4 bg-gradient-to-r from-primary to-cyan-500 rounded-[var(--radius-xl)] font-bold text-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                  >
                    Create Path
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-screen bg-background text-foreground">
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 mb-12"
            >
              <h1 className="text-5xl md:text-7xl font-bold">
                Choose your
                <br />
                <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  career path
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Curated learning journeys designed to land you your dream job
              </p>
            </motion.div>

            {/* Create Custom Path CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="w-full p-8 bg-gradient-to-r from-primary/20 to-cyan-500/20 backdrop-blur-xl rounded-[var(--radius-3xl)] border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-cyan-500 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
                    </div>
                    <div className="text-left">
                      <h3 className="text-2xl font-bold mb-1">Create Custom Path</h3>
                      <p className="text-muted-foreground">Build your own learning journey</p>
                    </div>
                  </div>
                  <ChevronRight className="w-8 h-8 text-primary group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            </motion.div>

            {/* Curated Paths */}
            <div className="space-y-6 mb-12">
              <h2 className="text-4xl font-bold">Curated Paths</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {visibleCuratedPaths.map((path, i) => {
                  const Icon = path.icon;
                  const isSelected = selectedPath === path.id;

                  return (
                    <motion.button
                      key={path.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectPath(path.id)}
                      className={`group relative p-8 backdrop-blur-xl rounded-[var(--radius-3xl)] border-2 transition-all text-left overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary/20 to-cyan-500/20 border-primary'
                          : 'bg-muted/50 border-border hover:border-[var(--color-border-strong)]'
                      }`}
                    >
                      {/* Background gradient on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${path.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                      <div className="relative space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 bg-gradient-to-br ${path.color} rounded-[var(--radius-xl)] flex items-center justify-center`}>
                              <Icon className="w-8 h-8 text-foreground" strokeWidth={2.5} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">{path.name}</h3>
                              <p className="text-sm text-muted-foreground">{path.description}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--color-success)' }}>
                              <Check className="w-5 h-5 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-muted/50 rounded-[var(--radius-lg)]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Target className="w-3 h-3" />
                              <span>Difficulty</span>
                            </div>
                            <div className="font-bold text-sm">{path.difficulty}</div>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-[var(--radius-lg)]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Clock className="w-3 h-3" />
                              <span>Duration</span>
                            </div>
                            <div className="font-bold text-sm">{path.duration}</div>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-[var(--radius-lg)]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Zap className="w-3 h-3" />
                              <span>Questions</span>
                            </div>
                            <div className="font-bold text-sm">{path.totalQuestions}</div>
                          </div>
                        </div>

                        {/* Skills */}
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">Skills you'll learn</div>
                          <div className="flex flex-wrap gap-2">
                            {path.skills.map((skill: string) => (
                              <span
                                key={skill}
                                className="px-3 py-1 bg-muted/50 rounded-full text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Jobs */}
                        <div className="pt-4 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-1">Career outcomes</div>
                          <div className="font-bold">{path.jobs[0]}</div>
                        </div>

                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Why Choose a Path */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="p-8 bg-[var(--color-accent-violet)]/10 backdrop-blur-xl rounded-[var(--radius-3xl)] border border-[var(--color-accent-violet)]/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gradient-primary)' }}>
                  <Star className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Why choose a learning path?</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Structured curriculum designed by industry experts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Clear progression from beginner to job-ready</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Focus on skills that actually get you hired</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>Track your progress and stay motivated</span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
