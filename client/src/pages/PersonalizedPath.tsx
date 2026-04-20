import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  User, Briefcase, Target, BookOpen, CheckCircle, 
  ArrowRight, TrendingUp, Award, Clock, Zap, Edit2, Bell
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

export default function PersonalizedPath() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  
  // Setup form state
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

  // Filter each path segment to only subscribed channels
  const learningPath = rawLearningPath.map(segment => ({
    ...segment,
    channels: segment.channels.filter(ch => subscribedChannelIds.includes(ch)),
  }));

  const jobTitles = getAvailableJobTitles();

  if (showSetup || !profile) {
    return (
      <>
        <SEOHead
          title="Personalized Learning Path | Setup Your Profile"
          description="Create your personalized learning path based on your job title and experience level"
        />
        <AppLayout title="Setup Your Profile" showBackOnMobile fullWidth>
          <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-8"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Let's Personalize Your Journey
                </h1>
                <p className="text-muted-foreground">
                  Tell us about your role to get a customized learning path
                </p>
              </div>

              <div className="space-y-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    What's your target role?
                  </label>
                  <select
                    value={selectedJobTitle}
                    onChange={(e) => setSelectedJobTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a role...</option>
                    {jobTitles.map(jt => (
                      <option key={jt.id} value={jt.id}>
                        {jt.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {(['entry', 'mid', 'senior', 'staff', 'principal'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setSelectedExperience(level)}
                        className={`px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ${
                          selectedExperience === level
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Company (Optional) */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Target Company (Optional)
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g., Google, Amazon, Meta..."
                    className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={handleCreateProfile}
                  disabled={!selectedJobTitle}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 min-h-[44px] bg-primary text-primary-foreground rounded-lg font-semibold cursor-pointer hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/20">
                  <Briefcase className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {profile.jobTitle.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)} Level
                    </span>
                    {profile.targetCompany && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Target: {profile.targetCompany}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowSetup(true)}
                className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-background border border-border rounded-lg text-sm font-medium cursor-pointer hover:bg-muted transition-all duration-200"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </motion.div>

          {/* CTA: subscribe to more topics */}
          {subscribedChannels.length < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="mb-8 flex items-start gap-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5"
            >
              <Bell className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-foreground mb-1">
                  Subscribe to more topics to unlock your full learning path
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  You're subscribed to {subscribedChannels.length} topic{subscribedChannels.length !== 1 ? 's' : ''}. Add at least {3 - subscribedChannels.length} more to see personalized recommendations here.
                </p>
                <button
                  onClick={() => setLocation('/channels')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-yellow-500 text-black rounded-lg text-sm font-semibold cursor-pointer hover:bg-yellow-400 transition-all duration-200"
                >
                  Browse Topics
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Required Topics */}
          {requiredPath && requiredPath.channels.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-bold text-foreground">Must-Know Topics</h3>
                <span className="px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-full">
                  REQUIRED
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requiredPath.channels.map((channel, idx) => (
                  <motion.div
                    key={channel}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.05 }}
                    onClick={() => setLocation(`/channel/${channel}`)}
                    className="group bg-card border border-border rounded-lg p-4 min-h-[72px] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                        {channel.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </h4>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      <span>Start practicing</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommended Topics */}
          {recommendedPath && recommendedPath.channels.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className="text-xl font-bold text-foreground">Recommended Topics</h3>
                <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-full">
                  NICE TO HAVE
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedPath.channels.map((channel, idx) => (
                  <motion.div
                    key={channel}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    onClick={() => setLocation(`/channel/${channel}`)}
                    className="group bg-card border border-border rounded-lg p-4 min-h-[72px] hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                        {channel.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </h4>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <BookOpen className="w-3 h-3" />
                      <span>Expand your skills</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Certifications */}
          {requiredPath && requiredPath.certifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-yellow-500" />
                <h3 className="text-xl font-bold text-foreground">Recommended Certifications</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {requiredPath.certifications.map((cert, idx) => (
                  <motion.div
                    key={cert}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                    onClick={() => setLocation(`/certifications/${cert}`)}
                    className="group bg-card border border-border rounded-lg p-4 min-h-[72px] hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/10 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-foreground group-hover:text-yellow-500 transition-colors duration-200">
                        {cert.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </h4>
                      <Award className="w-4 h-4 text-yellow-500" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Certification prep</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
