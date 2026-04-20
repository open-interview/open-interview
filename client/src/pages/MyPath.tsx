/**
 * My Path - View and Manage Custom Learning Paths
 * Shows all custom paths created by the user + curated paths
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '../components/layout/AppLayout';
import { SEOHead } from '../components/SEOHead';
import { allChannelsConfig } from '../lib/channels-config';
import { useUserPreferences } from '../context/UserPreferencesContext';
import {
  Plus, Trash2, Edit, ChevronLeft, ChevronRight, Brain, Check, Target, Clock, Award,
  Code, Rocket, Building2, X, Search
} from 'lucide-react';

interface CustomPath {
  id: string;
  name: string;
  channels: string[];
  certifications: string[];
  createdAt: string;
}

// Certification type
interface Certification {
  id: string;
  name: string;
  provider: string;
  icon: string;
  category: string;
}

const PATH_ICON_MAP: Record<string, React.ElementType> = {
  'job-title': Code, 'company': Building2, 'skill': Brain, 'certification': Award,
};
const PATH_COLOR_MAP: Record<string, string> = {
  'job-title': 'from-blue-500 to-cyan-500', 'company': 'from-green-500 to-emerald-500',
  'skill': 'from-purple-500 to-pink-500', 'certification': 'from-orange-500 to-red-500',
};

function mapPathFromJson(path: any) {
  const channels = typeof path.channels === 'string' ? JSON.parse(path.channels) : (path.channels || []);
  const tags = typeof path.tags === 'string' ? JSON.parse(path.tags) : (path.tags || []);
  const learningObjectives = typeof path.learningObjectives === 'string' ? JSON.parse(path.learningObjectives) : (path.learningObjectives || []);
  const questionIds = typeof path.questionIds === 'string' ? JSON.parse(path.questionIds) : (path.questionIds || []);
  return {
    id: path.id,
    name: path.title,
    icon: PATH_ICON_MAP[path.pathType] || Rocket,
    color: PATH_COLOR_MAP[path.pathType] || 'from-indigo-500 to-purple-500',
    description: path.description,
    channels,
    difficulty: path.difficulty ? path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1) : 'Intermediate',
    duration: `${path.estimatedHours}h`,
    totalQuestions: questionIds.length,
    jobs: learningObjectives.slice(0, 3),
    skills: tags.slice(0, 5),
  };
}
export default function MyPath() {
  const [, setLocation] = useLocation();
  const { preferences } = useUserPreferences();
  const [customPaths, setCustomPaths] = useState<CustomPath[]>([]);
  const [activePathId, setActivePathId] = useState<string | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [curatedPaths, setCuratedPaths] = useState<any[]>([]);
  const subscribedSet = new Set(preferences.subscribedChannels);
  const visibleCuratedPaths = curatedPaths.filter(p => p.channels.some((c: string) => subscribedSet.has(c)));
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPath, setEditingPath] = useState<CustomPath | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    channels: [] as string[],
    certifications: [] as string[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomIdx, setSelectedCustomIdx] = useState(0);
  const [selectedCuratedIdx, setSelectedCuratedIdx] = useState(0);

  // Load custom paths from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('customPaths');
      if (saved) {
        setCustomPaths(JSON.parse(saved));
      }

      // Load active paths (plural - array)
      const activePaths = localStorage.getItem('activeLearningPaths');
      if (activePaths) {
        const pathIds = JSON.parse(activePaths);
        // For now, just check if any path is active (we'll show badges for all)
        setActivePathId(pathIds.length > 0 ? pathIds[0] : null);
      }
    } catch (e) {
      console.error('Failed to load paths:', e);
    }
  }, []);

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

  // Save paths to localStorage
  const savePaths = (paths: CustomPath[]) => {
    try {
      localStorage.setItem('customPaths', JSON.stringify(paths));
      setCustomPaths(paths);
    } catch (e) {
      console.error('Failed to save paths:', e);
    }
  };

  // Delete a custom path
  const deletePath = (pathId: string) => {
    const newPaths = customPaths.filter(p => p.id !== pathId);
    savePaths(newPaths);

    // If deleting active path, remove it from active paths
    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      if (currentPaths.includes(pathId)) {
        const updatedPaths = currentPaths.filter((id: string) => id !== pathId);
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      }
    } catch (e) {
      console.error('Failed to update active paths:', e);
    }
  };

  // Toggle path activation (add or remove from active paths)
  const togglePathActivation = (path: CustomPath) => {
    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      
      if (currentPaths.includes(path.id)) {
        // Deactivate - remove from array
        const updatedPaths = currentPaths.filter((id: string) => id !== path.id);
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      } else {
        // Activate - add to array
        const updatedPaths = [...currentPaths, path.id];
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      }
      
      // Reload to reflect changes
      window.location.reload();
    } catch (e) {
      console.error('Failed to toggle path:', e);
    }
  };

  // Toggle curated path activation
  const toggleCuratedPathActivation = (path: typeof curatedPaths[0]) => {
    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      
      if (currentPaths.includes(path.id)) {
        // Deactivate - remove from array
        const updatedPaths = currentPaths.filter((id: string) => id !== path.id);
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      } else {
        // Activate - add to array
        const updatedPaths = [...currentPaths, path.id];
        localStorage.setItem('activeLearningPaths', JSON.stringify(updatedPaths));
      }
      
      // Reload to reflect changes
      window.location.reload();
    } catch (e) {
      console.error('Failed to toggle curated path:', e);
    }
  };

  // Check if a path is active
  const isPathActive = (pathId: string): boolean => {
    try {
      const currentPaths = JSON.parse(localStorage.getItem('activeLearningPaths') || '[]');
      return currentPaths.includes(pathId);
    } catch {
      return false;
    }
  };

  // Open edit modal
  const openEditModal = (path: CustomPath) => {
    setEditingPath(path);
    setEditForm({
      name: path.name,
      channels: [...path.channels],
      certifications: [...path.certifications]
    });
    setSearchQuery('');
    setShowEditModal(true);
  };

  // Toggle channel in edit form
  const toggleEditChannel = (channelId: string) => {
    setEditForm(prev => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter(c => c !== channelId)
        : [...prev.channels, channelId]
    }));
  };

  // Toggle certification in edit form
  const toggleEditCertification = (certId: string) => {
    setEditForm(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certId)
        ? prev.certifications.filter(c => c !== certId)
        : [...prev.certifications, certId]
    }));
  };

  // Save edited path
  const saveEditedPath = () => {
    if (!editingPath || !editForm.name || (editForm.channels.length === 0 && editForm.certifications.length === 0)) {
      alert('Please add a name and select at least one channel or certification');
      return;
    }

    try {
      const updatedPath = {
        ...editingPath,
        name: editForm.name,
        channels: editForm.channels,
        certifications: editForm.certifications
      };

      const updatedPaths = customPaths.map(p => 
        p.id === editingPath.id ? updatedPath : p
      );

      savePaths(updatedPaths);

      setShowEditModal(false);
      setEditingPath(null);
    } catch (e) {
      console.error('Failed to save edited path:', e);
    }
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
        title="My Path - Custom Learning Journeys"
        description="View and manage your custom learning paths"
        canonical="https://open-interview.github.io/my-path"
      />

      <AppLayout>
        {/* Edit Path Modal */}
        <AnimatePresence>
          {showEditModal && editingPath && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
              onClick={() => setShowEditModal(false)}
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
                    <h2 className="text-3xl font-bold">Edit Path</h2>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="w-10 h-10 bg-muted/50 hover:bg-muted rounded-full flex items-center justify-center transition-all"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Path Name Input */}
                  <input
                    type="text"
                    placeholder="Path Name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
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
                  {(editForm.channels.length > 0 || editForm.certifications.length > 0) && (
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-cyan-500/10 border border-primary/30 rounded-[16px]">
                      <div className="text-sm text-muted-foreground mb-2">Selected:</div>
                      <div className="flex items-center gap-4 text-sm font-semibold">
                        <span>{editForm.channels.length} channels</span>
                        <span>•</span>
                        <span>{editForm.certifications.length} certifications</span>
                      </div>
                    </div>
                  )}

                  {/* Channels Section */}
                  <div>
                    <h3 className="text-xl font-bold mb-4">Channels</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {filteredChannels.slice(0, 20).map((channel) => {
                        const isSelected = editForm.channels.includes(channel.id);
                        return (
                          <button
                            key={channel.id}
                            onClick={() => toggleEditChannel(channel.id)}
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
                        const isSelected = editForm.certifications.includes(cert.id);
                        return (
                          <button
                            key={cert.id}
                            onClick={() => toggleEditCertification(cert.id)}
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
                    onClick={saveEditedPath}
                    disabled={!editForm.name || (editForm.channels.length === 0 && editForm.certifications.length === 0)}
                    className="w-full py-4 bg-gradient-to-r from-primary to-cyan-500 rounded-[16px] font-bold text-xl text-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all"
                  >
                    Save Changes
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
              className="mb-12"
            >
              <h1 className="text-6xl md:text-7xl font-bold mb-4">
                My
                <br />
                <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  custom paths
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                {customPaths.length} custom {customPaths.length === 1 ? 'path' : 'paths'} created
              </p>
            </motion.div>

            {/* Create New Path Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation('/learning-paths')}
              className="w-full p-8 bg-gradient-to-r from-primary/20 to-cyan-500/20 backdrop-blur-xl rounded-[24px] border-2 border-dashed border-primary/30 hover:border-primary/60 transition-all group mb-8"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-cyan-500 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-primary-foreground" strokeWidth={3} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold mb-1">Create New Path</h3>
                    <p className="text-muted-foreground">Build your own learning journey</p>
                  </div>
                </div>
                <ChevronRight className="w-8 h-8 text-primary group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.button>

            {/* Custom Paths Grid */}
            {customPaths.length > 0 ? (
              <div>
                {(() => {
                  const idx = Math.min(selectedCustomIdx, customPaths.length - 1);
                  const path = customPaths[idx];
                  const isActive = isPathActive(path.id);
                  return (
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`group relative p-6 backdrop-blur-xl rounded-[24px] border-2 transition-all overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-br from-primary/20 to-cyan-500/20 border-primary'
                          : 'bg-muted/50 border-border hover:border-border'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </div>
                      )}
                      <div className="space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[16px] flex items-center justify-center flex-shrink-0">
                            <Brain className="w-8 h-8 text-foreground" strokeWidth={2.5} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-1">{path.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(path.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-background/30 rounded-[12px]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Target className="w-3 h-3" />
                              <span>Channels</span>
                            </div>
                            <div className="font-bold">{path.channels.length}</div>
                          </div>
                          <div className="p-3 bg-background/30 rounded-[12px]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Award className="w-3 h-3" />
                              <span>Certifications</span>
                            </div>
                            <div className="font-bold">{path.certifications.length}</div>
                          </div>
                        </div>
                        {path.channels.length > 0 && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Channels</div>
                            <div className="flex flex-wrap gap-2">
                              {path.channels.slice(0, 3).map((channel: string) => (
                                <span key={channel} className="px-2 py-1 bg-muted/50 rounded-full text-xs font-medium">{channel}</span>
                              ))}
                              {path.channels.length > 3 && (
                                <span className="px-2 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground">+{path.channels.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => togglePathActivation(path)}
                            className={`flex-1 px-6 py-3 rounded-[16px] font-bold transition-all ${
                              isActive
                                ? 'bg-muted border border-border hover:bg-white/20'
                                : 'bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground hover:scale-105'
                            }`}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button onClick={() => openEditModal(path)} className="px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-[16px] transition-all" title="Edit path">
                            <Edit className="w-5 h-5 text-blue-400" />
                          </button>
                          <button onClick={() => deletePath(path.id)} className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-[16px] transition-all" title="Delete path">
                            <Trash2 className="w-5 h-5 text-red-500" />
                          </button>
                        </div>
                        {/* Prev/Next Navigation */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <button
                            onClick={() => setSelectedCustomIdx(i => Math.max(0, i - 1))}
                            disabled={idx === 0}
                            className="flex items-center gap-1 px-4 py-2 rounded-[12px] bg-muted/50 border border-border disabled:opacity-30 hover:bg-muted transition-all text-sm font-medium"
                          >
                            <ChevronLeft className="w-4 h-4" /> Previous Path
                          </button>
                          <span className="text-sm text-muted-foreground font-medium">{idx + 1} / {customPaths.length}</span>
                          <button
                            onClick={() => setSelectedCustomIdx(i => Math.min(customPaths.length - 1, i + 1))}
                            disabled={idx === customPaths.length - 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-[12px] bg-muted/50 border border-border disabled:opacity-30 hover:bg-muted transition-all text-sm font-medium"
                          >
                            Next Path <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })()}
              </div>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center py-20"
              >
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-12 h-12 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">No custom paths yet</h3>
                <p className="text-muted-foreground mb-6">Create your first custom learning path to get started</p>
                <button
                  onClick={() => setLocation('/learning-paths')}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground rounded-[16px] font-bold hover:scale-105 transition-all"
                >
                  Create Your First Path
                </button>
              </motion.div>
            )}

            {/* Curated Paths Section */}
            <div className="mt-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-8"
              >
                <h2 className="text-4xl font-bold mb-2">Curated Paths</h2>
                <p className="text-muted-foreground">Pre-built learning journeys for popular career paths</p>
              </motion.div>

              {visibleCuratedPaths.length > 0 && (() => {
                const idx = Math.min(selectedCuratedIdx, visibleCuratedPaths.length - 1);
                const path = visibleCuratedPaths[idx];
                const Icon = path.icon;
                const isActive = isPathActive(path.id);
                return (
                  <div>
                    <motion.div
                      key={path.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`group relative p-6 backdrop-blur-xl rounded-[24px] border-2 transition-all overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-br from-primary/20 to-cyan-500/20 border-primary'
                          : 'bg-muted/50 border-border hover:border-border'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${path.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      {isActive && (
                        <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Active
                        </div>
                      )}
                      <div className="relative space-y-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-16 h-16 bg-gradient-to-br ${path.color} rounded-[16px] flex items-center justify-center flex-shrink-0`}>
                            <Icon className="w-8 h-8 text-foreground" strokeWidth={2.5} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-1">{path.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">{path.description}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-background/30 rounded-[12px]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Target className="w-3 h-3" />
                              <span>Difficulty</span>
                            </div>
                            <div className="font-bold text-sm">{path.difficulty}</div>
                          </div>
                          <div className="p-3 bg-background/30 rounded-[12px]">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                              <Clock className="w-3 h-3" />
                              <span>Duration</span>
                            </div>
                            <div className="font-bold text-sm">{path.duration}</div>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-2">Channels ({path.channels.length})</div>
                          <div className="flex flex-wrap gap-2">
                            {path.channels.slice(0, 3).map((channel: string) => (
                              <span key={channel} className="px-2 py-1 bg-muted/50 rounded-full text-xs font-medium">{channel}</span>
                            ))}
                            {path.channels.length > 3 && (
                              <span className="px-2 py-1 bg-muted/50 rounded-full text-xs font-medium text-muted-foreground">+{path.channels.length - 3} more</span>
                            )}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs text-muted-foreground mb-1">Avg. salary</div>
                          <div className="font-bold text-primary">{path.salary}</div>
                        </div>
                        <div className="pt-2">
                          <button
                            onClick={() => toggleCuratedPathActivation(path)}
                            className={`w-full px-6 py-3 rounded-[16px] font-bold transition-all ${
                              isActive
                                ? 'bg-muted border border-border hover:bg-white/20'
                                : 'bg-gradient-to-r from-primary to-cyan-500 text-primary-foreground hover:scale-105'
                            }`}
                          >
                            {isActive ? 'Deactivate' : 'Activate Path'}
                          </button>
                        </div>
                        {/* Prev/Next Navigation */}
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <button
                            onClick={() => setSelectedCuratedIdx(i => Math.max(0, i - 1))}
                            disabled={idx === 0}
                            className="flex items-center gap-1 px-4 py-2 rounded-[12px] bg-muted/50 border border-border disabled:opacity-30 hover:bg-muted transition-all text-sm font-medium"
                          >
                            <ChevronLeft className="w-4 h-4" /> Previous Path
                          </button>
                          <span className="text-sm text-muted-foreground font-medium">{idx + 1} / {visibleCuratedPaths.length}</span>
                          <button
                            onClick={() => setSelectedCuratedIdx(i => Math.min(visibleCuratedPaths.length - 1, i + 1))}
                            disabled={idx === visibleCuratedPaths.length - 1}
                            className="flex items-center gap-1 px-4 py-2 rounded-[12px] bg-muted/50 border border-border disabled:opacity-30 hover:bg-muted transition-all text-sm font-medium"
                          >
                            Next Path <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
