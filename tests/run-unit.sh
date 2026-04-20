#!/bin/bash
# Unit tests: bots + script logic, no browser, no build
set -e
pnpm exec vitest run script/bots/__tests__/
