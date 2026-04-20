#!/bin/bash

# E2E Test Loop Runner
# Runs tests repeatedly until all pass or max attempts reached

MAX_ATTEMPTS=5
ATTEMPT=1
FAILED=1

echo "🚀 Starting E2E Test Loop Runner"
echo "================================"

while [ $ATTEMPT -le $MAX_ATTEMPTS ] && [ $FAILED -ne 0 ]; do
  echo ""
  echo "📝 Attempt $ATTEMPT of $MAX_ATTEMPTS"
  echo "-----------------------------------"
  
  # Run the comprehensive Gen Z tests
  pnpm exec playwright test e2e/genz-comprehensive.spec.ts --project=chromium-desktop
  
  FAILED=$?
  
  if [ $FAILED -eq 0 ]; then
    echo ""
    echo "✅ All tests passed on attempt $ATTEMPT!"
    echo "================================"
    exit 0
  else
    echo ""
    echo "❌ Tests failed on attempt $ATTEMPT"
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
      echo "⏳ Waiting 5 seconds before retry..."
      sleep 5
    fi
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "❌ Tests failed after $MAX_ATTEMPTS attempts"
echo "================================"
echo ""
echo "📊 Generating HTML report..."
pnpm exec playwright show-report

exit 1
