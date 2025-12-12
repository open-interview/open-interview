import { allQuestions, questionsByChannel } from './questions';

// Channel metadata for display (icons, colors, images)
// New channels will use default metadata automatically
const channelMeta: Record<string, { image: string; color: string; icon: string; description: string }> = {
  'system-design': {
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop',
    color: 'text-cyan-500',
    icon: 'cpu',
    description: 'Scalable architecture patterns'
  },
  'algorithms': {
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop',
    color: 'text-green-500',
    icon: 'terminal',
    description: 'Optimization logic'
  },
  'frontend': {
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    color: 'text-magenta-500',
    icon: 'layout',
    description: 'UI/UX Engineering'
  },
  'database': {
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop',
    color: 'text-yellow-500',
    icon: 'database',
    description: 'Storage Engines'
  },
  'sre': {
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    color: 'text-blue-400',
    icon: 'activity',
    description: 'Reliability Engineering'
  },
  'devops': {
    image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=300&fit=crop',
    color: 'text-orange-500',
    icon: 'infinity',
    description: 'CI/CD & Automation'
  }
};

// Default metadata for unknown channels
const defaultMeta = {
  image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop',
  color: 'text-gray-500',
  icon: 'folder',
  description: 'Questions'
};

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Question {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  diagram?: string;
  tags: string[];
  difficulty: Difficulty;
  channel: string;
  subChannel: string;
}

export interface SubChannel {
  id: string;
  name: string;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  image: string;
  color: string;
  icon: string;
  subChannels: SubChannel[];
}

// Load questions from split channel files
export const questions: Question[] = allQuestions as Question[];

// Get all channel IDs dynamically
export const channelIds: string[] = Object.keys(questionsByChannel);

// Dynamically derive channels from questions
function deriveChannels(): Channel[] {
  const channelMap: Record<string, Set<string>> = {};
  
  // Collect all channels and their subchannels
  for (const q of questions) {
    if (!channelMap[q.channel]) {
      channelMap[q.channel] = new Set();
    }
    channelMap[q.channel].add(q.subChannel);
  }
  
  // Build channel objects
  const derivedChannels: Channel[] = [];
  
  for (const channelId of Object.keys(channelMap)) {
    const subChannelSet = channelMap[channelId];
    const meta = channelMeta[channelId] || defaultMeta;
    const subChannels: SubChannel[] = [
      { id: 'all', name: 'All Topics' },
      ...Array.from(subChannelSet).sort().map((sc: string) => ({
        id: sc,
        name: formatSubChannelName(sc)
      }))
    ];
    
    derivedChannels.push({
      id: channelId,
      name: formatChannelName(channelId),
      description: meta.description,
      image: meta.image,
      color: meta.color,
      icon: meta.icon,
      subChannels
    });
  }
  
  // Sort channels by predefined order, unknown channels go at the end
  const order = ['system-design', 'algorithms', 'frontend', 'database', 'sre', 'devops'];
  derivedChannels.sort((a, b) => {
    const aIdx = order.indexOf(a.id);
    const bIdx = order.indexOf(b.id);
    if (aIdx === -1 && bIdx === -1) return a.id.localeCompare(b.id);
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });
  
  return derivedChannels;
}

// Format channel ID to display name (auto-formats unknown channels)
function formatChannelName(id: string): string {
  const nameMap: Record<string, string> = {
    'system-design': 'System.Design',
    'algorithms': 'Algorithms',
    'frontend': 'Frontend',
    'database': 'Database',
    'sre': 'SRE',
    'devops': 'DevOps'
  };
  return nameMap[id] || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Format subchannel ID to display name (auto-formats unknown subchannels)
function formatSubChannelName(id: string): string {
  const nameMap: Record<string, string> = {
    // Common abbreviations and special cases
    'api-design': 'API Design',
    'cicd': 'CI/CD',
    'aws': 'AWS',
    'gcp': 'GCP',
    'sql': 'SQL',
    'nosql': 'NoSQL',
    'slo-sli': 'SLO/SLI',
    'dp': 'Dynamic Programming',
    'k8s': 'Kubernetes',
    'iac': 'Infrastructure as Code',
    'dns': 'DNS',
    'elk': 'ELK Stack',
    'css': 'CSS',
    'js': 'JavaScript',
    'ts': 'TypeScript'
  };
  
  // Return mapped name or auto-format
  return nameMap[id] || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Export derived channels
export const channels: Channel[] = deriveChannels();

// Get questions filtered by channel, subchannel, and difficulty
export function getQuestions(channelId: string, subChannelId?: string, difficulty?: string): Question[] {
  let filtered = questions.filter(q => q.channel === channelId);
  
  if (subChannelId && subChannelId !== 'all') {
    filtered = filtered.filter(q => q.subChannel === subChannelId);
  }
  
  if (difficulty && difficulty !== 'all') {
    filtered = filtered.filter(q => q.difficulty === difficulty);
  }
  
  return filtered;
}

// Get all questions
export function getAllQuestions(): Question[] {
  return questions;
}

// Get channel by ID
export function getChannel(channelId: string): Channel | undefined {
  return channels.find(c => c.id === channelId);
}

// Get stats by channel
export function getStatsByChannel() {
  return channels.map(channel => {
    const channelQuestions = questions.filter(q => q.channel === channel.id);
    return {
      id: channel.id,
      name: channel.name,
      total: channelQuestions.length,
      beginner: channelQuestions.filter(q => q.difficulty === 'beginner').length,
      intermediate: channelQuestions.filter(q => q.difficulty === 'intermediate').length,
      advanced: channelQuestions.filter(q => q.difficulty === 'advanced').length,
    };
  });
}

// Get difficulty for a question
export function getQuestionDifficulty(question: Question): Difficulty {
  return question.difficulty;
}
