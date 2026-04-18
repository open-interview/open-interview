/**
 * Changelog data - fetched from generated JSON file
 * Updated automatically by bots during build
 */

export interface ChangelogEntry {
  date: string;
  type: 'added' | 'improved' | 'initial' | 'feature';
  title: string;
  description: string;
  details?: {
    questionsAdded?: number;
    questionsImproved?: number;
    channels?: string[];
    questionIds?: string[];
    features?: string[];
    activities?: Array<{ type: string; action: string; count: number }>;
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

// Default changelog data - used as fallback
export const defaultChangelog: ChangelogData = {
  entries: [
    {
      date: new Date().toISOString().split('T')[0],
      type: 'feature',
      title: 'Platform Active',
      description: 'Questions served from SQLite database with real-time bot updates.',
      details: {
        features: [
          'Questions served from SQLite database',
          'Real-time updates from AI bots',
          'Improved API performance'
        ]
      }
    }
  ],
  stats: {
    totalQuestionsAdded: 0,
    totalQuestionsImproved: 0,
    lastUpdated: new Date().toISOString()
  }
};

// Fetch changelog from generated JSON file
export async function fetchChangelog(): Promise<ChangelogData> {
  try {
    const response = await fetch('/data/changelog.json');
    if (response.ok) {
      return await response.json();
    }
  } catch {
    // Use default if fetch fails
  }
  return defaultChangelog;
}

// Export default for backward compatibility (static fallback)
export const changelog = defaultChangelog;
export default changelog;
