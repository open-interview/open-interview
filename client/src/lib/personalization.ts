const ROLE_CHANNELS: Record<string, string[]> = {
  frontend: ['frontend', 'algorithms', 'data-structures'],
  backend: ['backend', 'database', 'system-design'],
  fullstack: ['frontend', 'backend', 'system-design'],
  devops: ['devops', 'kubernetes', 'linux'],
  sre: ['sre', 'linux', 'system-design'],
  'data-engineer': ['data-engineering', 'python', 'database'],
  'ml-engineer': ['machine-learning', 'python', 'data-engineering'],
  'ai-engineer': ['generative-ai', 'machine-learning', 'prompt-engineering'],
  'data-scientist': ['machine-learning', 'python', 'math-logic'],
  security: ['security', 'networking', 'linux'],
  architect: ['system-design', 'aws', 'backend'],
  manager: ['behavioral', 'engineering-management', 'system-design'],
  platform: ['kubernetes', 'devops', 'linux'],
  mobile: ['ios', 'android', 'react-native'],
  qa: ['testing', 'e2e-testing', 'api-testing'],
  sdet: ['testing', 'e2e-testing', 'api-testing'],
};

const ROLE_CERTS: Record<string, string[]> = {
  frontend: [],
  backend: ['aws', 'gcp'],
  devops: ['kubernetes', 'terraform', 'aws'],
  sre: ['kubernetes', 'aws'],
  cloud: ['aws', 'gcp', 'azure'],
  architect: ['aws', 'gcp', 'azure'],
  'ml-engineer': ['gcp', 'aws'],
  'data-scientist': ['gcp', 'aws'],
  'ai-engineer': ['gcp', 'aws'],
  'data-engineer': ['aws', 'gcp', 'data'],
  security: ['security', 'kubernetes', 'aws'],
  manager: [],
};

/** Returns default channel IDs for a role when subscribedChannels is empty. */
export function getRoleDefaultChannels(role: string): string[] {
  return ROLE_CHANNELS[role] ?? ['system-design', 'algorithms', 'data-structures'];
}

/** Returns cert provider priority order for a role. */
export function getRoleCertPriority(role: string): string[] {
  return ROLE_CERTS[role] ?? ['aws'];
}

/** Filters items to those whose channelId or id is in subscribedChannels. */
export function filterBySubscription<T extends { channelId?: string; id?: string }>(
  items: T[],
  subscribedChannels: string[]
): T[] {
  const set = new Set(subscribedChannels);
  return items.filter((item) => set.has(item.channelId ?? '') || set.has(item.id ?? ''));
}

/** Sorts items so subscribed ones appear first. */
export function sortBySubscription<T extends { channelId?: string; id?: string }>(
  items: T[],
  subscribedChannels: string[]
): T[] {
  const set = new Set(subscribedChannels);
  return [...items].sort((a, b) => {
    const aIn = set.has(a.channelId ?? '') || set.has(a.id ?? '');
    const bIn = set.has(b.channelId ?? '') || set.has(b.id ?? '');
    return (bIn ? 1 : 0) - (aIn ? 1 : 0);
  });
}

/** Returns true if channelId is in subscribedChannels. */
export function isChannelSubscribed(channelId: string, subscribedChannels: string[]): boolean {
  return subscribedChannels.includes(channelId);
}

/** Returns true if onboarding is complete and the user has at least one subscription. */
export function isPersonalized(onboardingComplete: boolean, subscribedChannels: string[]): boolean {
  return onboardingComplete && subscribedChannels.length > 0;
}
