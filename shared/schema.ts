// Type definitions only — DB layer removed. All data is file-based.

export type User = { id: string; username: string; password: string };
export type InsertUser = { username: string; password: string };

export type Question = {
  id: string; question: string; answer: string; explanation: string;
  diagram?: string; difficulty: string; tags?: string[] | string;
  channel: string; subChannel: string; sourceUrl?: string;
  videos?: any; companies?: any; eli5?: string; tldr?: string;
  voiceKeywords?: any; voiceSuitable?: number; isNew?: number;
  status?: string; lastUpdated?: string; createdAt?: string;
};

export type Certification = {
  id: string; name: string; provider: string; description: string;
  icon?: string; color?: string; difficulty: string; category: string;
  estimatedHours?: number; examCode?: string; officialUrl?: string;
  domains?: string; channelMappings?: string; tags?: string;
  prerequisites?: string; status?: string; questionCount?: number;
  passingScore?: number; examDuration?: number;
};

export type BlogPost = {
  id: string; slug: string; title: string; summary?: string;
  introduction?: string; conclusion?: string; metaDescription?: string;
  sections?: string; tags?: string; channel?: string; difficulty?: string;
  diagram?: string; diagramType?: string; diagramLabel?: string;
  quickReference?: string; glossary?: string; realWorldExample?: string;
  funFact?: string; sources?: string; socialSnippet?: string;
  imageUrl?: string; images?: string; svgContent?: string;
  status?: string; publishedAt?: string; createdAt: string; lastUpdated?: string;
};

export type LearningPath = {
  id: string; title: string; description: string; pathType: string;
  targetCompany?: string; targetJobTitle?: string; difficulty: string;
  estimatedHours?: number; questionIds: string; channels: string;
  tags?: string; status?: string; createdAt?: string;
};

export type VoiceSession = {
  id: string; topic: string; description?: string; channel: string;
  difficulty: string; questionIds: string; totalQuestions: number;
  estimatedMinutes?: number; createdAt?: string;
};

export type Test = {
  id: string; channelId: string; channelName: string; title: string;
  description?: string; questions: string; passingScore?: number;
  version?: number; createdAt?: string; lastUpdated?: string;
};

export type Flashcard = {
  id: string; questionId?: string; channel?: string; difficulty?: string;
  tags?: string; front: string; back: string; hint?: string; mnemonic?: string;
  createdAt?: string;
};

export type UserSession = {
  id: string; userId?: string; sessionType: string; sessionKey: string;
  title: string; subtitle?: string; channelId?: string; certificationId?: string;
  progress?: number; totalItems: number; completedItems?: number;
  sessionData?: string; startedAt?: string; lastAccessedAt?: string;
  completedAt?: string; status?: string;
};
