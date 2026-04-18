#!/bin/bash
# Accessibility + Lighthouse audit suite
set -e
pnpm run build && pnpm exec playwright test --project=audit --project=lighthouse --project=iphone13-audit
