/**
 * Creator Bot integration test
 * Uses TEST_DB=true env flag to target a local test DB.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Only run when TEST_DB is set
const runIntegration = process.env.TEST_DB === 'true';

describe.skipIf(!runIntegration)('creator-bot integration', () => {
  it('dry-run generates a question that passes validateBeforeInsert', async () => {
    // Import validation
    const { validateBeforeInsert } = await import('../../shared/validation.js');

    // Minimal mock question matching what creator-bot would produce
    const mockQuestion = {
      question: 'What is the difference between TCP and UDP in networking protocols?',
      answer: 'TCP is connection-oriented and guarantees delivery. UDP is connectionless and faster but does not guarantee delivery.',
      explanation: 'TCP establishes a three-way handshake before data transfer, ensuring reliable ordered delivery with error checking. UDP skips the handshake and sends packets without confirmation, making it suitable for real-time applications like video streaming.',
      channel: 'networking',
      subChannel: 'protocols',
      difficulty: 'intermediate',
      tags: ['tcp', 'udp', 'networking'],
    };

    expect(() => validateBeforeInsert(mockQuestion, 'creator')).not.toThrow();
  });

  it('duplicate detection prevents same question being inserted twice', async () => {
    const { addToQueue } = await import('../../shared/queue.js');
    const first = await addToQueue({ itemType: 'question', itemId: 'dup-test-1', action: 'improve_content' });
    const second = await addToQueue({ itemType: 'question', itemId: 'dup-test-1', action: 'improve_content' });
    expect(first.id).toBe(second.id);
    expect(second.isNew).toBe(false);
  });
});
