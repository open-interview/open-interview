/**
 * Analysis Bot integration test
 */
import { describe, it, expect } from 'vitest';

const runIntegration = process.env.TEST_DB === 'true';

describe.skipIf(!runIntegration)('analysis-bot integration', () => {
  it('addBatchToQueue creates no duplicate queue items on second run', async () => {
    const { addBatchToQueue } = await import('../../shared/queue.js');

    const items = [
      { itemType: 'question', itemId: 'analysis-test-1', action: 'expand_answer', priority: 3 },
      { itemType: 'question', itemId: 'analysis-test-2', action: 'expand_answer', priority: 3 },
    ];

    const first = await addBatchToQueue(items);
    const second = await addBatchToQueue(items);

    // All items on second run should be existing (isNew=false)
    expect(second.every(r => !r.isNew)).toBe(true);
    // IDs should match
    expect(first.map(r => r.id)).toEqual(second.map(r => r.id));
  });
});
