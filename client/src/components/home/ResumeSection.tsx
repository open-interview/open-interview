/**
 * Resume Section - Display all in-progress sessions on home page
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Sparkles } from 'lucide-react';
import { 
  getInProgressSessions, 
  abandonSession, 
  ResumeSession 
} from '../../lib/resume-service';
import { ResumeTile } from './ResumeTile';
import { useUnifiedToast } from '../../hooks/use-unified-toast';

export function ResumeSection() {
  const [sessions, setSessions] = useState<ResumeSession[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useUnifiedToast();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const inProgressSessions = getInProgressSessions();
    setSessions(inProgressSessions);
  };

  const handleResume = (session: ResumeSession) => {
    // Navigate to appropriate page based on session type
    switch (session.type) {
      case 'test':
        setLocation(`/test/${session.channelId}`);
        break;
      case 'voice-interview':
        setLocation('/voice-interview');
        break;
      case 'certification':
        setLocation(`/certification/${session.certificationId}/exam`);
        break;
      default:
        toast({
          title: 'Unknown session type',
          description: 'Unable to resume this session',
          variant: 'destructive'
        });
    }
  };

  const handleAbandon = (session: ResumeSession) => {
    // Confirm before abandoning
    if (confirm(`Are you sure you want to abandon "${session.title}"? Your progress will be lost.`)) {
      abandonSession(session.id);
      loadSessions(); // Refresh list
      
      toast({
        title: 'Session abandoned',
        description: `"${session.title}" has been removed`,
      });
    }
  };

  // Don't render if no sessions
  if (sessions.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Continue Where You Left Off</h2>
            <p className="text-xs text-muted-foreground">
              {sessions.length} session{sessions.length > 1 ? 's' : ''} in progress
            </p>
          </div>
        </div>
        
        {/* Sparkle indicator for new feature */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>New</span>
        </div>
      </div>

      {/* Session tiles grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {sessions.map((session) => (
            <ResumeTile
              key={session.id}
              session={session}
              onResume={handleResume}
              onAbandon={handleAbandon}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
