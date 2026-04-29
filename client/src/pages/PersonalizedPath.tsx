import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  User, Briefcase, Target, BookOpen, CheckCircle, 
  ArrowRight, TrendingUp, Award, Clock, Zap, Edit2, Bell,
  Plus, Minus, GripVertical, Check, Circle, PlayCircle,
  Flag, Star, Rocket, Building2, Code, Lightbulb
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SEOHead } from '@/components/SEOHead';
import {
  getUserProfile,
  getPersonalizedLearningPath,
  getAvailableJobTitles,
  createUserProfile,
  type UserProfile
} from '@/lib/user-profile-service';
import { useSubscriptions } from '@/hooks/use-subscriptions';

interface LearningStep {
  id: string;
  title: string;
  description: string;
  type: 'channel' | 'certification' | 'milestone';
  channel?: string;
  certification?: string;
  completed: boolean;
  estimatedMinutes: number;
  order: number;
}

export default function PersonalizedPath() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  
  const [steps, setSteps] = useState<LearningStep[]>([]);
  const [isReordering, setIsReordering] = useState(false);
  
  const [selectedJobTitle, setSelectedJobTitle] = useState('');
  const [selectedExperience, setSelectedExperience] = useState<UserProfile['experienceLevel']>('mid');
  const [targetCompany, setTargetCompany] = useState('');

  useEffect(() => {
    const userProfile = getUserProfile();
    if (userProfile) {
      setProfile(userProfile);
    } else {
      setShowSetup(true);
    }
  }, []);

  const handleCreateProfile = () => {
    if (!selectedJobTitle) return;
    
    const newProfile = createUserProfile(
      selectedJobTitle,
      selectedExperience,
      targetCompany || undefined
    );
    setProfile(newProfile);
    setShowSetup(false);
  };

  const { subscribedChannelIds, subscribedChannels } = useSubscriptions();

  const rawLearningPath = profile ? getPersonalizedLearningPath(profile) : [];

  const learningPath = rawLearningPath.map(segment => ({
    ...segment,
    channels: segment.channels.filter(ch => subscribedChannelIds.includes(ch)),
  }));

  useEffect(() => {
    if (learningPath.length > 0 && steps.length === 0) {
      const newSteps: LearningStep[] = [];
      
      const requiredPath = learningPath.find(p => p.priority === 'required');
      const recommendedPath = learningPath.find(p => p.priority === 'recommended');
      
      if (requiredPath) {
        requiredPath.channels.forEach((channel, idx) => {
          newSteps.push({
            id: `required-${channel}`,
            title: formatChannelName(channel),
            description: 'Required skill for your role',
            type: 'channel',
            channel,
            completed: false,
            estimatedMinutes: 30,
            order: idx,
          });
        });
        
        requiredPath.certifications?.forEach((cert, idx) => {
          newSteps.push({
            id: `cert-${cert}`,
            title: formatCertificationName(cert),
            description: 'Professional certification',
            type: 'certification',
            certification: cert,
            completed: false,
            estimatedMinutes: 120,
            order: newSteps.length,
          });
        });
      }
      
      if (recommendedPath) {
        recommendedPath.channels.forEach((channel, idx) => {
          newSteps.push({
            id: `recommended-${channel}`,
            title: formatChannelName(channel),
            description: 'Recommended skill enhancement',
            type: 'channel',
            channel,
            completed: false,
            estimatedMinutes: 20,
            order: newSteps.length,
          });
        });
      }
      
      if (newSteps.length > 0) {
        newSteps[0].description = 'Start your journey here';
        setSteps(newSteps);
      }
    }
  }, [learningPath]);

  const jobTitles = getAvailableJobTitles();

  const formatChannelName = (channel: string): string => {
    return channel.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const formatCertificationName = (cert: string): string => {
    return cert.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const completedSteps = steps.filter(s => s.completed).length;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const totalMinutes = steps.reduce((sum, s) => sum + s.estimatedMinutes, 0);
  const completedMinutes = steps.filter(s => s.completed).reduce((sum, s) => sum + s.estimatedMinutes, 0);

  const toggleStepComplete = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
  };

  const removeStep = (stepId: string) => {
    setSteps(prev => prev.filter(step => step.id !== stepId));
  };

  const addNewStep = (type: 'channel' | 'certification' | 'milestone') => {
    const newId = `${type}-${Date.now()}`;
    const newStep: LearningStep = {
      id: newId,
      title: type === 'milestone' ? 'New Milestone' : `New ${type === 'channel' ? 'Channel' : 'Certification'}`,
      description: 'Click to edit',
      type,
      completed: false,
      estimatedMinutes: type === 'milestone' ? 15 : type === 'certification' ? 90 : 25,
      order: steps.length,
    };
    setSteps(prev => [...prev, newStep]);
  };

  const handleReorder = (newOrder: LearningStep[]) => {
    setSteps(newOrder.map((step, idx) => ({ ...step, order: idx })));
  };

  if (showSetup || !profile) {
    return (
      <>
        <SEOHead
          title="Personalized Learning Path | Setup Your Profile"
          description="Create your personalized learning path based on your job title and experience"
        />
        <AppLayout title="Setup Your Profile" showBackOnMobile fullWidth>
          <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="g-card p-6"
            >
              <div className="text-center mb-8">
                <div className="g-fab g-fab-primary mb-4">
                  <User className="w-8 h-8" />
                </div>
                <h1 className="g-headline-medium text-foreground mb-2">
                  Let's Personalize Your Journey
                </h1>
                <p className="g-body-medium text-foreground/70">
                  Tell us about your role to get a customized learning path
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="g-label-large block text-foreground mb-2">
                    What's your target role?
                  </label>
                  <select
                    value={selectedJobTitle}
                    onChange={(e) => setSelectedJobTitle(e.target.value)}
                    className="g-select w-full"
                  >
                    <option value="">Select a role...</option>
                    {jobTitles.map(jt => (
                      <option key={jt.id} value={jt.id}>
                        {jt.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="g-label-large block text-foreground mb-2">
                    Experience Level
                  </label>
                  <div className="g-chip-group">
                    {(['entry', 'mid', 'senior', 'staff', 'principal'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedExperience(level)}
                        className={`g-chip ${selectedExperience === level ? 'g-chip-selected' : ''}`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="g-label-large block text-foreground mb-2">
                    Target Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g., Google, Amazon, Meta..."
                    className="g-text-field w-full"
                  />
                </div>

                <button
                  onClick={handleCreateProfile}
                  disabled={!selectedJobTitle}
                  className="g-button g-button-primary w-full"
                >
                  Create My Learning Path
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>
        </AppLayout>
      </>
    );
  }

  const requiredPath = learningPath.find(p => p.priority === 'required');
  const recommendedPath = learningPath.find(p => p.priority === 'recommended');

  return (
    <>
      <SEOHead
        title="Your Personalized Learning Path"
        description="Follow your customized learning path based on your job title and experience"
      />
      <AppLayout title="Your Learning Path" showBackOnMobile fullWidth>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          <style>{`
             .g-card {
               background: var(--surface-bg, #fff);
               border: 1px solid var(--border-default, #dadce0);
               border-radius: 1rem;
               box-shadow: var(--shadow-1);
             }
             .g-card:focus-visible {
               outline: 2px solid var(--g-primary, #4285F4);
               outline-offset: 2px;
             }
             .g-fab {
               width: 56px;
               height: 56px;
               border-radius: 1rem;
               display: inline-flex;
               align-items: center;
               justify-content: center;
             }
             .g-fab-primary {
               background: var(--g-primary, #4285F4);
               color: white;
             }
             .g-headline-medium {
               font-size: 1.5rem;
               font-weight: 500;
               line-height: 1.3;
             }
             .g-body-medium {
               font-size: 1rem;
               line-height: 1.5;
             }
             .g-label-large {
               font-size: 0.875rem;
               font-weight: 500;
             }
             .g-text-field {
               padding: 12px 16px;
               border: 1px solid var(--border-default, #dadce0);
               border-radius: var(--radius-md, 8px);
               font-size: 1rem;
               background: var(--surface-bg, #fff);
               color: var(--text-primary, #202124);
             }
             .g-text-field:focus {
               outline: none;
               border-color: var(--g-primary, #4285F4);
               box-shadow: 0 0 0 2px var(--g-primary-light, #8ab4f8);
             }
             .g-text-field:focus-visible {
               outline: 2px solid var(--g-primary, #4285F4);
               outline-offset: 2px;
             }
             .g-select {
               padding: 12px 16px;
               border: 1px solid var(--border-default, #dadce0);
               border-radius: var(--radius-md, 8px);
               font-size: 1rem;
               background: var(--surface-bg, #fff);
               color: var(--text-primary, #202124);
             }
             .g-select:focus-visible {
               outline: 2px solid var(--g-primary, #4285F4);
               outline-offset: 2px;
             }
             .g-chip-group {
               display: flex;
               gap: 8px;
               flex-wrap: wrap;
             }
             .g-chip {
               padding: 10px 16px;
               border: 1px solid var(--border-default, #dadce0);
               border-radius: 8px;
               background: var(--surface-bg, #fff);
               color: var(--text-primary, #202124);
               font-size: 0.875rem;
               font-weight: 500;
               cursor: pointer;
               transition: all 0.2s;
             }
             .g-chip:hover {
               background: var(--surface-raised, #f8f9fa);
             }
             .g-chip:focus-visible {
               outline: 2px solid var(--g-primary, #4285F4);
               outline-offset: 2px;
             }
             .g-chip-selected {
               background: var(--g-primary, #4285F4) !important;
               color: white !important;
               border-color: var(--g-primary, #4285F4) !important;
             }
             .g-button {
               display: inline-flex;
               align-items: center;
               justify-content: center;
               gap: 8px;
               padding: 12px 24px;
               border-radius: var(--radius-md, 8px);
               font-size: 0.875rem;
               font-weight: 500;
               cursor: pointer;
               transition: all 0.2s;
               border: none;
             }
             .g-button:focus-visible {
               outline: 2px solid var(--g-primary, #4285F4);
               outline-offset: 2px;
             }
             .g-button-primary {
               background: var(--g-primary, #4285F4);
               color: white;
             }
             .g-button-primary:hover {
               background: var(--g-primary-dark, #1a73e8);
             }
             .g-button-primary:disabled {
               opacity: 0.5;
               cursor: not-allowed;
             }
             .g-button-secondary {
               background: var(--surface-raised, #f8f9fa);
               color: var(--text-primary, #202124);
               border: 1px solid var(--border-default, #dadce0);
             }
             .g-button-tonal {
               background: var(--g-primary-container, #e8f0fe);
               color: var(--g-primary-dark, #1a73e8);
             }
             .timeline-line {
               position: absolute;
               left: 28px;
               top: 56px;
               bottom: -20px;
               width: 2px;
               background: var(--border-default, #dadce0);
             }
             .timeline-line-progress {
               position: absolute;
               left: 28px;
               top: 56px;
               width: 2px;
               background: var(--g-primary, #4285F4);
               transition: height 0.3s ease;
             }
             .step-card {
               position: relative;
               padding: 16px 16px 16px 56px;
             }
             .step-indicator {
               position: absolute;
               left: 0;
               top: 16px;
               width: 56px;
               height: 56px;
               display: flex;
               align-items: center;
               justify-content: center;
             }
             .step-number {
               width: 32px;
               height: 32px;
               border-radius: 50%;
               display: flex;
               align-items: center;
               justify-content: center;
               font-size: 0.875rem;
               font-weight: 600;
               background: var(--surface-raised, #f8f9fa);
               color: var(--text-secondary, #5f6368);
               border: 2px solid var(--border-default, #dadce0);
             }
             .step-completed .step-number {
               background: var(--g-primary, #4285F4);
               color: white;
               border-color: var(--g-primary, #4285F4);
             }
             .step-active .step-number {
               background: var(--g-primary, #4285F4);
               color: white;
               border-color: var(--g-primary, #4285F4);
               animation: pulse 2s infinite;
             }
             @keyframes pulse {
               0%, 100% { box-shadow: 0 0 0 0 rgba(66, 133, 244, 0.4); }
               50% { box-shadow: 0 0 0 8px rgba(66, 133, 244, 0); }
             }
             .type-channel { color: var(--g-primary, #4285F4); }
             .type-certification { color: var(--g-warning, #FBBC05); }
             .type-milestone { color: var(--g-success, #34A853); }
          `}</style>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="g-card p-6 mb-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start gap-4">
                <div className="g-fab g-fab-primary">
                  <Briefcase className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="g-headline-medium text-foreground mb-1">
                    {profile.jobTitle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-foreground/70">
                    <span className="g-chip">
                      {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)} Level
                    </span>
                    {profile.targetCompany && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        Target: {profile.targetCompany}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSetup(true)}
                className="g-button g-button-secondary"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-foreground/70">Progress</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
               <div className="h-2.5 bg-surface-raised rounded-full overflow-hidden">
                 <motion.div
                   className="h-full bg-primary"
                   initial={{ width: 0 }}
                   animate={{ width: `${progress}%` }}
                   transition={{ duration: 0.5, ease: 'easeOut' }}
                 />
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/70">
                <span>{completedSteps} of {steps.length} steps</span>
                <span>{completedMinutes} / {totalMinutes} min</span>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {subscribedChannels.length < 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                 className="g-card p-5 mb-8 border-warning/30 bg-warning/5"
               >
                 <div className="flex items-start gap-4">
                   <Bell className="w-5 h-5 text-warning mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-1">
                      Subscribe to more topics to unlock your full learning path
                    </p>
                    <p className="text-sm text-foreground/70 mb-3">
                      You're subscribed to {subscribedChannels.length} topic{subscribedChannels.length !== 1 ? 's' : ''}. Add at least {3 - subscribedChannels.length} more to see personalized recommendations here.
                    </p>
                    <button
                      onClick={() => setLocation('/channels')}
                      className="g-button g-button-primary"
                    >
                      Browse Topics
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-foreground">Your Learning Path</h3>
            <button
              onClick={() => setIsReordering(!isReordering)}
              className={`g-button ${isReordering ? 'g-button-primary' : 'g-button-secondary'}`}
            >
              <GripVertical className="w-4 h-4" />
              {isReordering ? 'Done' : 'Reorder'}
            </button>
          </div>

          {isReordering ? (
            <Reorder.Group axis="y" values={steps} onReorder={handleReorder} className="space-y-3">
              {steps.map((step) => (
                     <Reorder.Item
                       key={step.id}
                       value={step}
                       className="g-card p-4 pl-16 cursor-grab active:cursor-grabbing"
                     >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-foreground/70" />
                    <div className={`step-indicator ${step.completed ? 'step-completed' : ''}`}>
                      <div className="step-number">{step.order + 1}</div>
                    </div>
                    <div className="flex-1">
                               <div className="font-medium text-base text-foreground">{step.title}</div>
                               <div className="text-base text-foreground/70">{step.description}</div>
                    </div>
                    <span className="g-chip text-xs">{step.estimatedMinutes} min</span>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="space-y-0">
              {steps.map((step, index) => {
                const isCompleted = step.completed;
                const isActive = !isCompleted && (index === 0 || steps.slice(0, index).every(s => s.completed));
                const isLast = index === steps.length - 1;
                
                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                     <div className="g-card step-card mb-3">
                      <div className="flex items-start gap-4">
                        <div className={`step-indicator ${isCompleted ? 'step-completed' : isActive ? 'step-active' : ''}`}>
                          {isCompleted ? (
                            <CheckCircle className="w-8 h-8 text-primary" />
                          ) : isActive ? (
                            <PlayCircle className="w-8 h-8 text-primary" />
                          ) : (
                            <div className="step-number">{step.order + 1}</div>
                          )}
                        </div>
                        
                        <div 
                          className={`flex-1 cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
                          onClick={() => step.channel && setLocation(`/channel/${step.channel}`)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className={`font-semibold text-foreground ${isCompleted ? 'line-through' : ''}`}>
                                {step.title}
                              </div>
                              <div className="text-sm text-foreground/70 flex items-center gap-2 mt-1">
                                {step.type === 'channel' && <Code className="w-4 h-4 type-channel" />}
                         {step.type === 'certification' && <Award className="w-4 h-4 text-warning" />}
                                 {step.type === 'milestone' && <Flag className="w-4 h-4 text-success" />}
                                {step.description}
                              </div>
                            </div>
                            <div className="text-sm text-foreground/70 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {step.estimatedMinutes} min
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleStepComplete(step.id)}
                            className={`g-fab ${isCompleted ? 'g-fab-primary' : 'g-button-secondary'}`}
                            style={{ width: 40, height: 40, borderRadius: 12 }}
                            title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => removeStep(step.id)}
                           className="g-fab bg-destructive/10 text-destructive hover:bg-destructive/20"
                             style={{ width: 40, height: 40, borderRadius: 12 }}
                             title="Remove step"
                           >
                             <Minus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {!isLast && (
                      <div className="absolute left-[26px] top-[56px] w-0.5 h-3 bg-border-default" />
                    )}
                  </motion.div>
                );
              })}
              
              {steps.length === 0 && (
                <div className="g-card p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Rocket className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No steps yet</h3>
                  <p className="text-foreground/70 mb-6">
                    Subscribe to topics to generate your personalized learning path steps.
                  </p>
                  <button
                    onClick={() => setLocation('/channels')}
                    className="g-button g-button-primary"
                  >
                    Browse Topics
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => addNewStep('channel')}
              className="g-button g-button-tonal"
            >
              <Plus className="w-4 h-4" />
              Add Channel
            </button>
            <button
              onClick={() => addNewStep('certification')}
              className="g-button g-button-tonal"
            >
              <Plus className="w-4 h-4" />
              Add Certification
            </button>
            <button
              onClick={() => addNewStep('milestone')}
              className="g-button g-button-tonal"
            >
              <Plus className="w-4 h-4" />
              Add Milestone
            </button>
          </div>

          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-12"
            >
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Milestones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {requiredPath && requiredPath.channels.length > 0 && (
                   <div className="g-card p-4 border-l-4 border-l-destructive">
                     <div className="flex items-center gap-2 mb-2">
                       <Zap className="w-4 h-4 text-destructive" />
                       <span className="font-semibold text-sm">Required</span>
                     </div>
                     <p className="text-sm text-foreground/70">
                       {requiredPath.channels.length} channels to master
                     </p>
                   </div>
                 )}
                 {recommendedPath && recommendedPath.channels.length > 0 && (
                   <div className="g-card p-4 border-l-4 border-l-primary">
                     <div className="flex items-center gap-2 mb-2">
                       <Star className="w-4 h-4 text-primary" />
                       <span className="font-semibold text-sm">Recommended</span>
                     </div>
                     <p className="text-sm text-foreground/70">
                       {recommendedPath.channels.length} channels to explore
                     </p>
                   </div>
                 )}
              </div>
            </motion.div>
          )}
        </div>
      </AppLayout>
    </>
  );
}