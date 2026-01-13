/**
 * Resume Tile Component - Individual tile for resuming an activity
 */

import { motion } from 'framer-motion';
import { 
  ClipboardList, Mic, Award, Play, X, Clock,
  ChevronRight
} from 'lucide-react';
import { ResumeSession, formatRelativeTime } from '../../lib/resume-service';

interface ResumeTileProps {
  session: ResumeSession;
  onResume: (session: ResumeSession) => void;
  onAbandon: (session: ResumeSession) => void;
}

const iconMap = {
  'clipboard-list': ClipboardList,
  'mic': Mic,
  'award': Award,
};

export function ResumeTile({ session, onResume, onAbandon }: ResumeTileProps) {
  const Icon = iconMap[session.icon as keyof typeof iconMap] || ClipboardList;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-all duration-200 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${session.color}20` }}
        >
          <Icon 
            className="w-5 h-5" 
            style={{ color: session.color }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {session.title}
          </h3>
          {session.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {session.subtitle}
            </p>
          )}
        </div>
        
        {/* Abandon button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAbandon(session);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-destructive/10 rounded"
          title="Abandon session"
        >
          <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Progress</span>
          <span className="font-medium">{session.progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${session.progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: session.color }}
          />
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRelativeTime(session.lastAccessedAt)}</span>
        </div>
        
        <button
          onClick={() => onResume(session)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{ 
            backgroundColor: `${session.color}15`,
            color: session.color
          }}
        >
          <Play className="w-3.5 h-3.5" />
          Resume
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
