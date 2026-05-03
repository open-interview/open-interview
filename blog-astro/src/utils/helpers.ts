export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateFull(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    backend:           'badge-backend',
    frontend:          'badge-frontend',
    'system-design':   'badge-system-design',
    devops:            'badge-devops',
    kubernetes:        'badge-kubernetes',
    aws:               'badge-aws',
    sre:               'badge-sre',
    'generative-ai':   'badge-generative-ai',
    'machine-learning':'badge-machine-learning',
  };
  return map[category] ?? 'badge-default';
}

export function getDifficultyClass(difficulty: string): string {
  const map: Record<string, string> = {
    beginner:     'difficulty-beginner',
    intermediate: 'difficulty-intermediate',
    advanced:     'difficulty-advanced',
  };
  return map[difficulty] ?? 'difficulty-intermediate';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
