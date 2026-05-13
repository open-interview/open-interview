export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  type: 'added' | 'improved' | 'initial' | 'feature';
  details?: {
    questionsAdded?: number;
    questionsImproved?: number;
    channels?: string[];
    features?: string[];
  };
}

export interface ChangelogData {
  entries: ChangelogEntry[];
  stats: {
    totalQuestionsAdded: number;
    totalQuestionsImproved: number;
    lastUpdated: string;
  };
}

export const defaultChangelog: ChangelogData = {
  entries: [
    {
      date: new Date().toISOString().split('T')[0],
      title: 'Platform Launch',
      description: 'Open Interview platform is live with 1000+ interview questions across 40+ topics.',
      type: 'initial',
      details: {
        questionsAdded: 1000,
        channels: ['system-design', 'algorithms', 'frontend', 'backend', 'devops', 'aws', 'ai-ml', 'kubernetes'],
        features: ['Voice interview practice', 'Spaced repetition flashcards', 'Coding challenges', 'Gamification system'],
      },
    },
  ],
  stats: {
    totalQuestionsAdded: 1000,
    totalQuestionsImproved: 0,
    lastUpdated: new Date().toISOString(),
  },
};

export async function fetchChangelog(): Promise<ChangelogData> {
  return defaultChangelog;
}
