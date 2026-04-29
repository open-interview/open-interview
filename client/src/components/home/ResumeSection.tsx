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
import { GoogleDialog } from '../google/GoogleDialog';

export function ResumeSection() {
  const [sessions, setSessions] = useState<ResumeSession[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useUnifiedToast();
  const [abandonSession, setAbandonSession] = useState<ResumeSession | null>(null);

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
      case 'training':
        setLocation('/voice-interview');
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
    setAbandonSession(session);
  };

  const confirmAbandon = () => {
    if (abandonSession) {
      abandonSession(abandonSession.id);
      loadSessions(); // Refresh list
      
      toast({
        title: 'Session abandoned',
        description: `"${abandonSession.title}" has been removed`,
      });
      setAbandonSession(null);
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
          <div className="min-w-[48px] w-8 min-h-[48px] h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
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

      {/* Abandon Session Dialog */}
      <GoogleDialog
        open={abandonSession !== null}
        onClose={() => setAbandonSession(null)}
        title="Abandon Session"
      >
        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Are you sure you want to abandon "{abandonSession?.title}"? Your progress will be lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAbandonSession(null)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'transparent', color: 'var(--text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={confirmAbandon}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: 'var(--color-error)' }}
            >
              Abandon
            </button>
          </div>
        </div>
      </GoogleDialog>
    </motion.section>
  );
}
