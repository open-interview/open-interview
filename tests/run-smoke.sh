#!/bin/bash
# Quick smoke test: core spec only, no build needed
# Requires dev server running on :5000
set -e
pnpm exec playwright test e2e/core.spec.ts --project=chromium-desktop
