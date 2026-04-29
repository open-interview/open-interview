import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, TrendingUp, Users, Target, Clock, Star, ThumbsUp, AlertTriangle } from 'lucide-react';
import { useHEARTMetrics } from '../hooks/use-heart-metrics';

interface HeartMetricsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HeartMetricsDashboard({ isOpen, onClose }: HeartMetricsDashboardProps) {
  const [activeTab, setActiveTab] = useState<'happiness' | 'engagement' | 'adoption' | 'retention' | 'task_success'>('happiness');
  const heartMetrics = useHEARTMetrics();
  const [sessionData, setSessionData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      // Load data from storage
      try {
        const sessionRaw = sessionStorage.getItem('heart_metrics_session');
        const userRaw = localStorage.getItem('heart_metrics_user');
        setSessionData(sessionRaw ? JSON.parse(sessionRaw) : null);
        setUserData(userRaw ? JSON.parse(userRaw) : null);
      } catch {
        setSessionData(null);
        setUserData(null);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = [
    { id: 'happiness' as const, label: 'Happiness', icon: Heart },
    { id: 'engagement' as const, label: 'Engagement', icon: TrendingUp },
    { id: 'adoption' as const, label: 'Adoption', icon: Users },
    { id: 'retention' as const, label: 'Retention', icon: Target },
    { id: 'task_success' as const, label: 'Task Success', icon: Clock },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">HEART Metrics</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'happiness' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Happiness Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="NPS Score"
                  value={userData?.npsScore ?? 'Not submitted'}
                  icon={<Star className="w-4 h-4" />}
                  description="Net Promoter Score (0-10)"
                />
                <MetricCard
                  title="CSAT Ratings"
                  value={userData?.csatRatings?.length ?? 0}
                  icon={<ThumbsUp className="w-4 h-4" />}
                  description="Customer Satisfaction ratings"
                />
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-medium mb-2">NPS Category</h4>
                <p className="text-sm text-muted-foreground">
                  {userData?.npsScore >= 9
                    ? '🎉 Promoter - Highly likely to recommend'
                    : userData?.npsScore >= 7
                    ? '😐 Passive - Neutral about recommending'
                    : userData?.npsScore !== undefined
                    ? '😞 Detractor - Unlikely to recommend'
                    : 'No NPS submitted yet'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Engagement Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Sessions"
                  value={sessionData?.sessionCount ?? 0}
                  icon={<Clock className="w-4 h-4" />}
                  description="Total sessions"
                />
                <MetricCard
                  title="Features Used"
                  value={sessionData?.featuresUsed?.length ?? 0}
                  icon={<TrendingUp className="w-4 h-4" />}
                  description="Unique features used"
                />
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-medium mb-2">Features Used</h4>
                <div className="flex flex-wrap gap-2">
                  {sessionData?.featuresUsed?.map((feature: string) => (
                    <span key={feature} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                      {feature}
                    </span>
                  )) ?? <span className="text-sm text-muted-foreground">No features tracked yet</span>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'adoption' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Adoption Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="New User"
                  value={heartMetrics.isNewUser() ? 'Yes' : 'No'}
                  icon={<Users className="w-4 h-4" />}
                  description="First time user"
                />
                <MetricCard
                  title="Activated"
                  value={localStorage.getItem('heart_metrics_user_activated') ? 'Yes' : 'No'}
                  icon={<Target className="w-4 h-4" />}
                  description="Completed onboarding"
                />
              </div>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Retention Metrics</h3>
              
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  title="D1 Retention"
                  value="Tracked"
                  icon={<Clock className="w-4 h-4" />}
                  description="Day 1 return"
                />
                <MetricCard
                  title="D7 Retention"
                  value="Tracked"
                  icon={<Clock className="w-4 h-4" />}
                  description="Day 7 return"
                />
                <MetricCard
                  title="D30 Retention"
                  value="Tracked"
                  icon={<Clock className="w-4 h-4" />}
                  description="Day 30 return"
                />
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <h4 className="font-medium mb-2">User Since</h4>
                <p className="text-sm text-muted-foreground">
                  {userData?.firstSeen
                    ? new Date(userData.firstSeen).toLocaleDateString()
                    : 'Unknown'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'task_success' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Task Success Metrics</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Completion Rate"
                  value={`${(heartMetrics.getCompletionRate() * 100).toFixed(1)}%`}
                  icon={<Target className="w-4 h-4" />}
                  description="Tasks completed successfully"
                />
                <MetricCard
                  title="Error Rate"
                  value={`${(heartMetrics.getErrorRate() * 100).toFixed(1)}%`}
                  icon={<AlertTriangle className="w-4 h-4" />}
                  description="Errors encountered"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Challenges Completed"
                  value={sessionData?.challengesCompleted ?? 0}
                  icon={<Star className="w-4 h-4" />}
                  description="Total completed"
                />
                <MetricCard
                  title="Avg Time/Task"
                  value={`${Math.floor(heartMetrics.getAverageTimeOnTask() / 60)}m`}
                  icon={<Clock className="w-4 h-4" />}
                  description="Average time per task"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MetricCard({ title, value, icon, description }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <div className="bg-muted/20 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
