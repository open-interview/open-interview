#!/bin/bash
# Full regression suite (T2 tier) — needs build
set -e
pnpm run build && pnpm exec playwright test --project=chromium-desktop
