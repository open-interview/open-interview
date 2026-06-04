export interface ShortcutDef {
  keys: readonly string[]
  scope: 'global' | 'srs' | 'question' | 'admin'
  description: string
}

export const SHORTCUTS = {
  commandPalette: { keys: ['⌘K', 'Ctrl+K'], scope: 'global', description: 'Open command palette' } as const,
  search: { keys: ['/'], scope: 'global', description: 'Focus search' } as const,

  navHome: { keys: ['H'], scope: 'global', description: 'Go to Home' } as const,
  navChannels: { keys: ['C'], scope: 'global', description: 'Go to Channels' } as const,
  navCertifications: { keys: ['E'], scope: 'global', description: 'Go to Certifications' } as const,
  navVoice: { keys: ['V'], scope: 'global', description: 'Go to Voice Interview' } as const,
  navTests: { keys: ['T'], scope: 'global', description: 'Go to Quick Tests' } as const,
  navCode: { keys: ['X'], scope: 'global', description: 'Go to Code Challenges' } as const,
  navReview: { keys: ['R'], scope: 'global', description: 'Go to SRS Review' } as const,

  flipCard: { keys: ['Space'], scope: 'srs', description: 'Flip flashcard / reveal answer' } as const,
  rateAgain: { keys: ['1'], scope: 'srs', description: 'Rate "Again"' } as const,
  rateHard: { keys: ['2'], scope: 'srs', description: 'Rate "Hard"' } as const,
  rateGood: { keys: ['3'], scope: 'srs', description: 'Rate "Good"' } as const,
  rateEasy: { keys: ['4'], scope: 'srs', description: 'Rate "Easy"' } as const,
  prevCard: { keys: ['←'], scope: 'srs', description: 'Previous card / question' } as const,
  nextCard: { keys: ['→'], scope: 'srs', description: 'Next card / question' } as const,

  toggleRecording: { keys: ['Space'], scope: 'question', description: 'Toggle voice recording' } as const,
} as const

export type ShortcutId = keyof typeof SHORTCUTS

export function getShortcutsByScope(scope: ShortcutDef['scope']): [ShortcutId, ShortcutDef][] {
  return Object.entries(SHORTCUTS).filter(
    ([, def]) => def.scope === scope
  ) as [ShortcutId, ShortcutDef][]
}

export function formatShortcutKeys(keys: readonly string[]): string {
  return keys[0]
}
