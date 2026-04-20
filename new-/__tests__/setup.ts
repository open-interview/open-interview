/**
 * Vitest setup file
 * Runs before all tests
 */

import { vi, afterEach } from "vitest";

// Mock Dexie database
global.indexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
} as any;

// Mock WebLLM
global.navigator = {
  ...global.navigator,
  gpu: undefined,
} as any;

// Mock crypto for consistent UUIDs in tests
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: vi.fn(() => `test-uuid-${Date.now()}`),
  },
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
};

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});
