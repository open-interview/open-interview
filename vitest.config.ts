import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
  test: {
    include: [
      'script/bots/__tests__/**/*.test.ts',
      'script/bots/__tests__/**/*.test.js',
      'client/src/__tests__/**/*.test.ts',
      'client/src/components/**/*.test.tsx',
      'client/src/components/**/*.test.ts',
    ],
    environment: 'jsdom',
    globals: true,
  },
});
