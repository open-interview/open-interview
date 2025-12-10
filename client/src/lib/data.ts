import questionsData from './questions.json';

const systemDesignImg = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop';
const algoImg = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=300&fit=crop';
const frontendImg = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';
const dbImg = 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop';
const sreImg = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop';
const devopsImg = 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=300&fit=crop';

export interface Channel {
  id: string;
  name: string;
  description: string;
  image: string;
  color: string;
  icon?: string;
  subChannels?: { id: string; name: string }[];
}

export interface Question {
  id: string;
  channelId: string;
  question: string;
  answer: string;
  explanation: string;
  diagram?: string;
  tags: string[];
}

export const channels: Channel[] = [
  {
    id: 'system-design',
    name: 'System.Design',
    description: 'Scalable architecture patterns',
    image: systemDesignImg,
    color: 'text-cyan-500',
    icon: 'cpu'
  },
  {
    id: 'algorithms',
    name: 'Algorithms',
    description: 'Optimization logic',
    image: algoImg,
    color: 'text-green-500',
    icon: 'terminal'
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'UI/UX Engineering',
    image: frontendImg,
    color: 'text-magenta-500',
    icon: 'layout'
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Storage Engines',
    image: dbImg,
    color: 'text-yellow-500',
    icon: 'database'
  },
  {
    id: 'sre',
    name: 'SRE',
    description: 'Reliability Engineering',
    image: sreImg,
    color: 'text-blue-400',
    icon: 'activity'
  },
  {
    id: 'devops',
    name: 'DevOps',
    description: 'CI/CD & Automation',
    image: devopsImg,
    color: 'text-orange-500',
    icon: 'infinity',
    subChannels: [
      { id: 'all', name: 'All Topics' },
      { id: 'aws', name: 'AWS' },
      { id: 'k8s', name: 'Kubernetes' },
      { id: 'docker', name: 'Containers' },
      { id: 'observability', name: 'Observability' },
      { id: 'jenkins', name: 'Jenkins' },
      { id: 'terraform', name: 'Terraform' }
    ]
  },
];

export const questions: Question[] = questionsData as Question[];

export function getQuestions(channelId: string, subChannelId?: string) {
    let channelQuestions = questions.filter(q => q.channelId === channelId);
    
    if (subChannelId && subChannelId !== 'all') {
      // Map 'observability' topic to related tags
      if (subChannelId === 'observability') {
         return channelQuestions.filter(q => 
           q.tags.includes('monitoring') || 
           q.tags.includes('logging') || 
           q.tags.includes('prometheus') ||
           q.tags.includes('grafana') ||
           q.tags.includes('observability')
         );
      }
      // Map 'docker' topic to container tags
      if (subChannelId === 'docker') {
         return channelQuestions.filter(q => 
           q.tags.includes('docker') || 
           q.tags.includes('container') || 
           q.tags.includes('containers')
         );
      }
      
      return channelQuestions.filter(q => q.tags.includes(subChannelId));
    }
    
    return channelQuestions;
}

export function getChannel(channelId: string) {
    return channels.find(c => c.id === channelId);
}
