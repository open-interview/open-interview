#!/bin/bash
# Integration tests for all bots (uses local SQLite test DB)
set -e
TEST_DB=true pnpm exec vitest run script/bots/__tests__/integration/
