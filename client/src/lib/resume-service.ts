/**
 * Resume Service - Aggregates in-progress sessions from all activity types
 * Allows users to continue where they left off
 */

export type ActivityType = 'test' | 'voice-interview' | 'certification' | 'channel';

export interface ResumeSession {
  id: string;
  type: ActivityType;
  title: string;
  subtitle?: string;
  progress: number; // 0-100
  totalItems: number;
  completedItems: number;
  lastAccessedAt: string;
  channelId?: string;
  certificationId?: string;
  sessionData: any; // Type-specific session data
  icon: string; // Icon name for display
  color: string; // Theme color
}

/**
 * Get all in-progress sessions from localStorage
 */
export function getInProgressSessions(): ResumeSession[] {
  const sessions: ResumeSession[] = [];

  // 1. Check for in-progress tests
  const testSessions = getTestSessions();
  sessions.push(...testSessions);

  // 2. Check for in-progress voice interviews
  const voiceSession = getVoiceSession();
  if (voiceSession) sessions.push(voiceSession);

  // 3. Check for in-progress certification exams
  const certSessions = getCertificationSessions();
  sessions.push(...certSessions);

  // Sort by last accessed (most recent first)
  return sessions.sort((a, b) => 
    new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
  );
}

/**
 * Get in-progress test sessions
 */
function getTestSessions(): ResumeSession[] {
  const sessions: ResumeSession[] = [];
  
  // Scan localStorage for test session keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('test-session-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        
        // Only include if session is active (not completed)
        if (data.currentQuestionIndex !== undefined && 
            data.currentQuestionIndex < data.questions?.length) {
          
          const channelId = key.replace('test-session-', '');
          const progress = (data.currentQuestionIndex / data.questions.length) * 100;
          
          sessions.push({
            id: key,
            type: 'test',
            title: `${data.channelName || channelId} Test`,
            subtitle: `Question ${data.currentQuestionIndex + 1} of ${data.questions.length}`,
            progress: Math.round(progress),
            totalItems: data.questions.length,
            completedItems: data.currentQuestionIndex,
            lastAccessedAt: data.lastAccessedAt || new Date().toISOString(),
            channelId,
            sessionData: data,
            icon: 'clipboard-list',
            color: getChannelColor(channelId)
          });
        }
      } catch (e) {
        console.error('Error parsing test session:', e);
      }
    }
  }
  
  return sessions;
}

/**
 * Get in-progress voice interview session
 */
function getVoiceSession(): ResumeSession | null {
  try {
    const data = JSON.parse(localStorage.getItem('voice-session-state') || '{}');
    
    if (data.session && data.currentQuestionIndex !== undefined &&
        data.currentQuestionIndex < data.questions?.length) {
      
      const progress = (data.currentQuestionIndex / data.questions.length) * 100;
      
      return {
        id: 'voice-session-state',
        type: 'voice-interview',
        title: data.session.topic || 'Voice Interview',
        subtitle: `Question ${data.currentQuestionIndex + 1} of ${data.questions.length}`,
        progress: Math.round(progress),
        totalItems: data.questions.length,
        completedItems: data.currentQuestionIndex,
        lastAccessedAt: data.startedAt || new Date().toISOString(),
        channelId: data.session.channel,
        sessionData: data,
        icon: 'mic',
        color: '#8b5cf6' // Purple for voice
      };
    }
  } catch (e) {
    console.error('Error parsing voice session:', e);
  }
  
  return null;
}

/**
 * Get in-progress certification exam sessions
 */
function getCertificationSessions(): ResumeSession[] {
  const sessions: ResumeSession[] = [];
  
  // Scan localStorage for certification session keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('certification-session-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        
        // Only include if session is active
        if (data.currentQuestionIndex !== undefined && 
            data.currentQuestionIndex < data.questions?.length) {
          
          const certId = key.replace('certification-session-', '');
          const progress = (data.currentQuestionIndex / data.questions.length) * 100;
          
          sessions.push({
            id: key,
            type: 'certification',
            title: data.certificationName || `${certId} Exam`,
            subtitle: `Question ${data.currentQuestionIndex + 1} of ${data.questions.length}`,
            progress: Math.round(progress),
            totalItems: data.questions.length,
            completedItems: data.currentQuestionIndex,
            lastAccessedAt: data.lastAccessedAt || new Date().toISOString(),
            certificationId: certId,
            sessionData: data,
            icon: 'award',
            color: '#f59e0b' // Amber for certifications
          });
        }
      } catch (e) {
        console.error('Error parsing certification session:', e);
      }
    }
  }
  
  return sessions;
}

/**
 * Abandon a session (remove from localStorage)
 */
export function abandonSession(sessionId: string): void {
  localStorage.removeItem(sessionId);
}

/**
 * Get channel color for theming
 */
function getChannelColor(channelId: string): string {
  const colors: Record<string, string> = {
    'aws': '#ff9900',
    'azure': '#0078d4',
    'gcp': '#4285f4',
    'kubernetes': '#326ce5',
    'docker': '#2496ed',
    'terraform': '#7b42bc',
    'ansible': '#ee0000',
    'python': '#3776ab',
    'javascript': '#f7df1e',
    'typescript': '#3178c6',
    'react': '#61dafb',
    'nodejs': '#339933',
    'golang': '#00add8',
    'java': '#007396',
    'csharp': '#239120',
    'sql': '#cc2927',
    'mongodb': '#47a248',
    'redis': '#dc382d',
    'kafka': '#231f20',
    'elasticsearch': '#005571',
  };
  
  return colors[channelId.toLowerCase()] || '#6366f1'; // Default indigo
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return then.toLocaleDateString();
}
