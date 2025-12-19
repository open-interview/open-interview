/**
 * @deprecated This file is being replaced by database-driven channel configs.
 * Use the useChannelsMeta() hook from hooks/use-channels.ts instead.
 * The database tables `channels` and `subchannels` are now the source of truth.
 * Run `node script/seed-channels.js` to populate the database.
 * 
 * This file is kept for backward compatibility during migration.
 */

// All available channels with metadata
export interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'engineering' | 'data' | 'cloud' | 'security' | 'management' | 'mobile' | 'ai' | 'testing';
  roles: string[]; // Which roles this channel is recommended for
}

export const allChannelsConfig: ChannelConfig[] = [
  // Engineering Channels
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Scalable architecture patterns & distributed systems',
    icon: 'cpu',
    color: 'text-cyan-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'architect', 'sre', 'devops']
  },
  {
    id: 'algorithms',
    name: 'Algorithms',
    description: 'Data structures, sorting, searching & optimization',
    icon: 'terminal',
    color: 'text-green-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'frontend', 'mobile', 'data-engineer']
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'React, Vue, CSS, Performance & Web APIs',
    icon: 'layout',
    color: 'text-purple-500',
    category: 'engineering',
    roles: ['frontend', 'fullstack', 'mobile']
  },
  {
    id: 'backend',
    name: 'Backend',
    description: 'APIs, microservices, caching & server architecture',
    icon: 'server',
    color: 'text-blue-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'architect']
  },
  {
    id: 'database',
    name: 'Database',
    description: 'SQL, NoSQL, indexing & query optimization',
    icon: 'database',
    color: 'text-yellow-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'data-engineer', 'dba']
  },
  
  // DevOps & Cloud
  {
    id: 'devops',
    name: 'DevOps',
    description: 'CI/CD, automation, containers & orchestration',
    icon: 'infinity',
    color: 'text-orange-500',
    category: 'cloud',
    roles: ['devops', 'sre', 'backend', 'platform']
  },
  {
    id: 'sre',
    name: 'SRE',
    description: 'Reliability, monitoring, incident response & SLOs',
    icon: 'activity',
    color: 'text-red-500',
    category: 'cloud',
    roles: ['sre', 'devops', 'platform']
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Container orchestration, pods, services & deployments',
    icon: 'box',
    color: 'text-blue-400',
    category: 'cloud',
    roles: ['devops', 'sre', 'platform', 'backend']
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'EC2, S3, Lambda, RDS & cloud architecture',
    icon: 'cloud',
    color: 'text-orange-400',
    category: 'cloud',
    roles: ['devops', 'sre', 'backend', 'architect', 'platform']
  },
  {
    id: 'terraform',
    name: 'Terraform',
    description: 'Infrastructure as Code, modules & state management',
    icon: 'layers',
    color: 'text-purple-400',
    category: 'cloud',
    roles: ['devops', 'sre', 'platform']
  },
  
  // Data & AI
  {
    id: 'data-engineering',
    name: 'Data Engineering',
    description: 'ETL, data pipelines, warehousing & streaming',
    icon: 'workflow',
    color: 'text-teal-500',
    category: 'data',
    roles: ['data-engineer', 'backend', 'ml-engineer']
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    description: 'ML algorithms, model training & deployment',
    icon: 'brain',
    color: 'text-pink-500',
    category: 'ai',
    roles: ['ml-engineer', 'data-scientist', 'ai-engineer']
  },
  {
    id: 'generative-ai',
    name: 'Generative AI',
    description: 'LLMs, RAG, fine-tuning, agents & prompt engineering',
    icon: 'sparkles',
    color: 'text-violet-500',
    category: 'ai',
    roles: ['ai-engineer', 'ml-engineer', 'fullstack', 'backend']
  },
  {
    id: 'prompt-engineering',
    name: 'Prompt Engineering',
    description: 'Prompt design, optimization, safety & structured outputs',
    icon: 'message-circle',
    color: 'text-cyan-400',
    category: 'ai',
    roles: ['ai-engineer', 'ml-engineer', 'fullstack', 'product']
  },
  {
    id: 'llm-ops',
    name: 'LLMOps',
    description: 'LLM deployment, optimization, monitoring & infrastructure',
    icon: 'server',
    color: 'text-orange-400',
    category: 'ai',
    roles: ['ai-engineer', 'ml-engineer', 'devops', 'sre']
  },
  {
    id: 'computer-vision',
    name: 'Computer Vision',
    description: 'Image classification, object detection & multimodal AI',
    icon: 'eye',
    color: 'text-blue-400',
    category: 'ai',
    roles: ['ml-engineer', 'ai-engineer', 'data-scientist']
  },
  {
    id: 'nlp',
    name: 'NLP',
    description: 'Text processing, embeddings, transformers & language models',
    icon: 'file-text',
    color: 'text-emerald-400',
    category: 'ai',
    roles: ['ml-engineer', 'ai-engineer', 'data-scientist']
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python fundamentals, libraries & best practices',
    icon: 'code',
    color: 'text-yellow-400',
    category: 'engineering',
    roles: ['backend', 'data-engineer', 'ml-engineer', 'data-scientist']
  },
  
  // Security
  {
    id: 'security',
    name: 'Security',
    description: 'Application security, OWASP, encryption & auth',
    icon: 'shield',
    color: 'text-red-400',
    category: 'security',
    roles: ['security', 'backend', 'fullstack', 'devops']
  },
  {
    id: 'networking',
    name: 'Networking',
    description: 'TCP/IP, DNS, load balancing & CDN',
    icon: 'network',
    color: 'text-indigo-500',
    category: 'engineering',
    roles: ['sre', 'devops', 'security', 'backend']
  },
  {
    id: 'operating-systems',
    name: 'Operating Systems',
    description: 'OS concepts, processes, memory & file systems',
    icon: 'monitor',
    color: 'text-slate-500',
    category: 'engineering',
    roles: ['backend', 'sre', 'devops', 'security', 'platform']
  },
  {
    id: 'linux',
    name: 'Linux',
    description: 'Linux administration, shell scripting & system tools',
    icon: 'terminal',
    color: 'text-yellow-600',
    category: 'engineering',
    roles: ['backend', 'sre', 'devops', 'security', 'platform', 'data-engineer']
  },
  {
    id: 'unix',
    name: 'Unix',
    description: 'Unix fundamentals, commands & system programming',
    icon: 'terminal',
    color: 'text-gray-500',
    category: 'engineering',
    roles: ['backend', 'sre', 'devops', 'security', 'platform']
  },
  
  // Mobile
  {
    id: 'ios',
    name: 'iOS',
    description: 'Swift, UIKit, SwiftUI & iOS architecture',
    icon: 'smartphone',
    color: 'text-gray-400',
    category: 'mobile',
    roles: ['mobile', 'ios']
  },
  {
    id: 'android',
    name: 'Android',
    description: 'Kotlin, Jetpack Compose & Android architecture',
    icon: 'smartphone',
    color: 'text-green-400',
    category: 'mobile',
    roles: ['mobile', 'android']
  },
  {
    id: 'react-native',
    name: 'React Native',
    description: 'Cross-platform mobile development with React',
    icon: 'smartphone',
    color: 'text-cyan-400',
    category: 'mobile',
    roles: ['mobile', 'frontend', 'fullstack']
  },
  
  // Testing & QA
  {
    id: 'testing',
    name: 'Testing',
    description: 'Unit testing, integration testing, TDD & test strategies',
    icon: 'check-circle',
    color: 'text-green-500',
    category: 'testing',
    roles: ['frontend', 'backend', 'fullstack', 'mobile', 'qa']
  },
  {
    id: 'e2e-testing',
    name: 'E2E Testing',
    description: 'Playwright, Cypress, Selenium & browser automation',
    icon: 'monitor',
    color: 'text-purple-500',
    category: 'testing',
    roles: ['frontend', 'fullstack', 'qa', 'sdet']
  },
  {
    id: 'api-testing',
    name: 'API Testing',
    description: 'REST API testing, contract testing & load testing',
    icon: 'zap',
    color: 'text-yellow-500',
    category: 'testing',
    roles: ['backend', 'fullstack', 'qa', 'sdet']
  },
  {
    id: 'performance-testing',
    name: 'Performance Testing',
    description: 'Load testing, stress testing, JMeter & k6',
    icon: 'gauge',
    color: 'text-orange-500',
    category: 'testing',
    roles: ['sre', 'backend', 'qa', 'sdet', 'devops']
  },

  // Management & Soft Skills
  {
    id: 'engineering-management',
    name: 'Engineering Management',
    description: 'Team leadership, 1:1s, hiring & project management',
    icon: 'users',
    color: 'text-amber-500',
    category: 'management',
    roles: ['manager', 'tech-lead', 'architect']
  },
  {
    id: 'behavioral',
    name: 'Behavioral',
    description: 'STAR method, leadership principles & soft skills',
    icon: 'message-circle',
    color: 'text-emerald-500',
    category: 'management',
    roles: ['all'] // Recommended for everyone
  }
];

// User roles with display names
export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const rolesConfig: RoleConfig[] = [
  { id: 'frontend', name: 'Frontend Engineer', description: 'React, Vue, CSS, Web Performance', icon: 'layout' },
  { id: 'backend', name: 'Backend Engineer', description: 'APIs, Databases, Server Architecture', icon: 'server' },
  { id: 'fullstack', name: 'Full Stack Engineer', description: 'End-to-end web development', icon: 'layers' },
  { id: 'mobile', name: 'Mobile Engineer', description: 'iOS, Android, React Native', icon: 'smartphone' },
  { id: 'devops', name: 'DevOps Engineer', description: 'CI/CD, Infrastructure, Automation', icon: 'infinity' },
  { id: 'sre', name: 'Site Reliability Engineer', description: 'Reliability, Monitoring, Incident Response', icon: 'activity' },
  { id: 'data-engineer', name: 'Data Engineer', description: 'ETL, Data Pipelines, Warehousing', icon: 'workflow' },
  { id: 'ml-engineer', name: 'ML Engineer', description: 'Machine Learning, Model Deployment', icon: 'brain' },
  { id: 'ai-engineer', name: 'AI Engineer', description: 'GenAI, LLMs, RAG, Prompt Engineering', icon: 'sparkles' },
  { id: 'data-scientist', name: 'Data Scientist', description: 'ML, Statistics, Data Analysis', icon: 'chart' },
  { id: 'security', name: 'Security Engineer', description: 'AppSec, Penetration Testing, Compliance', icon: 'shield' },
  { id: 'architect', name: 'Solutions Architect', description: 'System Design, Cloud Architecture', icon: 'cpu' },
  { id: 'manager', name: 'Engineering Manager', description: 'Team Leadership, Hiring, Strategy', icon: 'users' },
  { id: 'platform', name: 'Platform Engineer', description: 'Developer Experience, Internal Tools', icon: 'box' },
  { id: 'qa', name: 'QA Engineer', description: 'Testing, Quality Assurance, Test Automation', icon: 'check-circle' },
  { id: 'sdet', name: 'SDET', description: 'Software Development Engineer in Test', icon: 'code' }
];

// Get recommended channels for a role
export function getRecommendedChannels(roleId: string): ChannelConfig[] {
  return allChannelsConfig.filter(
    channel => channel.roles.includes(roleId) || channel.roles.includes('all')
  );
}

// Get channels by category
export function getChannelsByCategory(category: string): ChannelConfig[] {
  return allChannelsConfig.filter(channel => channel.category === category);
}

// Categories for grouping
export const categories = [
  { id: 'engineering', name: 'Engineering', icon: 'code' },
  { id: 'cloud', name: 'Cloud & DevOps', icon: 'cloud' },
  { id: 'data', name: 'Data', icon: 'database' },
  { id: 'ai', name: 'AI & ML', icon: 'brain' },
  { id: 'testing', name: 'Testing & QA', icon: 'check-circle' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'mobile', name: 'Mobile', icon: 'smartphone' },
  { id: 'management', name: 'Management', icon: 'users' }
];
