import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['script/bots/__tests__/**/*.test.ts', 'script/bots/__tests__/**/*.test.js'],
    environment: 'node',
    globals: true,
  },
});
