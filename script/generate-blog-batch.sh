#!/bin/bash
# Batch Blog Generation Runner
# Generates multiple blog posts with rate limiting and error handling

set -e

# Configuration
BATCH_SIZE=${1:-5}  # Number of posts to generate (default: 5)
DELAY=${2:-30}      # Delay between generations in seconds (default: 30)
LOG_FILE="logs/blog-generation/batch-$(date +%Y%m%d-%H%M%S).log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Ensure log directory exists
mkdir -p logs/blog-generation

echo -e "${BLUE}🚀 Batch Blog Generation${NC}"
echo -e "   Batch size: ${BATCH_SIZE}"
echo -e "   Delay: ${DELAY}s"
echo -e "   Log file: ${LOG_FILE}\n"

# Track statistics
SUCCESS_COUNT=0
FAILURE_COUNT=0
TOTAL_TIME=0

# Generate posts
for i in $(seq 1 $BATCH_SIZE); do
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📝 Generating post $i of $BATCH_SIZE${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
  
  START_TIME=$(date +%s)
  
  # Run generation
  if node script/generate-blog-incremental.js 2>&1 | tee -a "$LOG_FILE"; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    TOTAL_TIME=$((TOTAL_TIME + DURATION))
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    
    echo -e "\n${GREEN}✅ Post $i completed in ${DURATION}s${NC}\n"
    
    # Delay before next generation (except for last one)
    if [ $i -lt $BATCH_SIZE ]; then
      echo -e "${YELLOW}⏳ Waiting ${DELAY}s before next generation...${NC}\n"
      sleep $DELAY
    fi
  else
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    echo -e "\n${RED}❌ Post $i failed${NC}\n"
    
    # Continue with next post after shorter delay
    if [ $i -lt $BATCH_SIZE ]; then
      echo -e "${YELLOW}⏳ Waiting 10s before retry...${NC}\n"
      sleep 10
    fi
  fi
done

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Batch Generation Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Successful: ${SUCCESS_COUNT}${NC}"
echo -e "${RED}❌ Failed: ${FAILURE_COUNT}${NC}"
echo -e "${BLUE}⏱️  Total time: ${TOTAL_TIME}s (avg: $((TOTAL_TIME / BATCH_SIZE))s per post)${NC}"
echo -e "${BLUE}📄 Log file: ${LOG_FILE}${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Exit with error if any failures
if [ $FAILURE_COUNT -gt 0 ]; then
  exit 1
fi
