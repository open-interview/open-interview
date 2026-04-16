/**
 * Gen Z Learning Paths - Choose Your Career Journey
 * Create custom paths or select curated ones
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { allChannelsConfig } from '../lib/channels-config';
import {
  Code, Server, Rocket, Target, Sparkles, Brain,
  Plus, ChevronRight, Star, Clock, Trophy, Zap, Check, X, Award, Search
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

// Curated Learning Paths
const curatedPaths = [
  {
    id: 'frontend',
    name: 'Frontend Developer',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    description: 'Master React, JavaScript, and modern web development',
    channels: ['frontend', 'react-native', 'javascript', 'algorithms'],
    difficulty: 'Beginner Friendly',
    duration: '3-6 months',
    totalQuestions: 450,
    jobs: ['Frontend Developer', 'React Developer', 'UI Engineer', 'Web Developer'],
    skills: ['React', 'JavaScript', 'CSS', 'HTML', 'TypeScript'],
    salary: '$80k - $120k'
  },
  {
    id: 'backend',
    name: 'Backend Engineer',
    icon: Server,
    color: 'from-green-500 to-emerald-500',
    description: 'Build scalable APIs and microservices',
    channels: ['backend', 'database', 'system-design', 'algorithms'],
    difficulty: 'Intermediate',
    duration: '4-8 months',
    totalQuestions: 520,
    jobs: ['Backend Engineer', 'API Developer', 'Systems Engineer', 'Platform Engineer'],
    skills: ['Node.js', 'Python', 'SQL', 'REST APIs', 'Microservices'],
    salary: '$90k - $140k'
  },
  {
    id: 'fullstack',
    name: 'Full Stack Developer',
    icon: Rocket,
    color: 'from-purple-500 to-pink-500',
    description: 'End-to-end application development',
    channels: ['frontend', 'backend', 'database', 'devops', 'system-design'],
    difficulty: 'Advanced',
    duration: '6-12 months',
    totalQuestions: 680,
    jobs: ['Full Stack Developer', 'Software Engineer', 'Tech Lead', 'Engineering Manager'],
    skills: ['React', 'Node.js', 'SQL', 'AWS', 'System Design'],
    salary: '$100k - $160k'
  },
  {
    id: 'devops',
    name: 'DevOps Engineer',
    icon: Target,
    color: 'from-orange-500 to-red-500',
    description: 'Infrastructure, CI/CD, and cloud platforms',
    channels: ['devops', 'kubernetes', 'aws', 'terraform', 'docker'],
    difficulty: 'Advanced',
    duration: '4-8 months',
    totalQuestions: 420,
    jobs: ['DevOps Engineer', 'SRE', 'Cloud Engineer', 'Infrastructure Engineer'],
    skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
    salary: '$110k - $170k'
  },
  {
    id: 'mobile',
    name: 'Mobile Developer',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    description: 'iOS and Android app development',
    channels: ['react-native', 'ios', 'android', 'frontend'],
    difficulty: 'Intermediate',
    duration: '4-6 months',
    totalQuestions: 380,
    jobs: ['Mobile Developer', 'iOS Developer', 'Android Developer', 'App Developer'],
    skills: ['React Native', 'Swift', 'Kotlin', 'Mobile UI', 'App Store'],
    salary: '$85k - $130k'
  },
  {
    id: 'data',
    name: 'Data Engineer',
    icon: Brain,
    color: 'from-indigo-500 to-purple-500',
    description: 'Data pipelines, warehousing, and analytics',
    channels: ['data-engineering', 'database', 'python', 'aws'],
    difficulty: 'Advanced',
    duration: '6-10 months',
    totalQuestions: 490,
    jobs: ['Data Engineer', 'Analytics Engineer', 'ML Engineer', 'Data Architect'],
    skills: ['Python', 'SQL', 'Spark', 'Airflow', 'Data Modeling'],
    salary: '$95k - $150k'
  }
];

export default function LearningPathsGenZ() {
  const [, setLocation] = useLocation();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  
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
        // The GenZHomePage will find curated paths by their ID in the curatedPaths array
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
                className="bg-background border border-border rounded-[32px] max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="p-8 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-3xl font-bold">Create Custom Path</h2>
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
                    className="w-full px-6 py-4 bg-muted/50 border border-border rounded-[16px] text-xl focus:outline-none focus:border-primary transition-all"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search channels and certifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-border rounded-[12px] focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  {/* Selected Summary */}
                  {(customPath.channels.length > 0 || customPath.certifications.length > 0) && (
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/30 rounded-[16px]">
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
                    <h3 className="text-xl font-bold mb-4">Channels</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredChannels.slice(0, 20).map((channel) => {
                        const isSelected = customPath.channels.includes(channel.id);
                        return (
                          <button
                            key={channel.id}
                            onClick={() => toggleChannel(channel.id)}
                            className={`p-4 rounded-[12px] border transition-all text-left ${
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
                    <h3 className="text-xl font-bold mb-4">Certifications</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredCerts.slice(0, 20).map((cert) => {
                        const isSelected = customPath.certifications.includes(cert.id);
                        return (
                          <button
                            key={cert.id}
                            onClick={() => toggleCertification(cert.id)}
                            className={`p-4 rounded-[12px] border transition-all text-left ${
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
                <div className="p-8 border-t border-border">
                  <button
                    onClick={handleCreateCustomPath}
                    disabled={!customPath.name || (customPath.channels.length === 0 && customPath.certifications.length === 0)}
                    className="w-full py-4 bg-gradient-to-r from-primary to-cyan-500 rounded-[16px] font-bold text-xl text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
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
              <h1 className="text-6xl md:text-7xl font-bold">
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
                className="w-full p-8 bg-gradient-to-r from-primary/20 to-cyan-500/20 backdrop-blur-xl rounded-[24px] border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all group"
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
              <h2 className="text-3xl font-bold">Curated Paths</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {curatedPaths.map((path, i) => {
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
                      className={`group relative p-8 backdrop-blur-xl rounded-[24px] border-2 transition-all text-left overflow-hidden ${
                        isSelected
                          ? 'bg-gradient-to-br from-primary/20 to-cyan-500/20 border-primary'
                          : 'bg-muted/50 border-border hover:border-white/30'
                      }`}
                    >
                      {/* Background gradient on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${path.color} opacity-0 group-hover:opacity-10 transition-opacity`} />

                      <div className="relative space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 bg-gradient-to-br ${path.color} rounded-[16px] flex items-center justify-center`}>
                              <Icon className="w-8 h-8 text-foreground" strokeWidth={2.5} />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold mb-1">{path.name}</h3>
                              <p className="text-sm text-muted-foreground">{path.description}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-5 h-5 text-black" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 bg-muted/50 rounded-[12px]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Target className="w-3 h-3" />
                              <span>Difficulty</span>
                            </div>
                            <div className="font-bold text-sm">{path.difficulty}</div>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-[12px]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Clock className="w-3 h-3" />
                              <span>Duration</span>
                            </div>
                            <div className="font-bold text-sm">{path.duration}</div>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-[12px]">
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
                            {path.skills.map((skill) => (
                              <span
                                key={skill}
                                className="px-3 py-1 bg-muted/50 rounded-full text-xs font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Jobs & Salary */}
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div>
                            <div className="text-xs text-muted-foreground mb-1">Career outcomes</div>
                            <div className="font-bold">{path.jobs[0]}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground mb-1">Avg. salary</div>
                            <div className="font-bold text-primary">{path.salary}</div>
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-sm font-semibold text-primary">
                            {isSelected ? 'Selected!' : 'Select Path'}
                          </span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
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
              className="p-8 bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-[24px] border border-purple-500/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
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
