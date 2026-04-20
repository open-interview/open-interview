#!/bin/bash

# Bottom Navigation Icon Fix - Recursive Testing Script
# This script runs visual regression tests and applies fixes iteratively

set -e

echo "🔧 Bottom Navigation Icon Fix - Recursive Testing"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MAX_ITERATIONS=5
CURRENT_ITERATION=0
TEST_PASSED=false

# Create results directory
mkdir -p test-results/iterations

# Function to run the visual regression test
run_test() {
    local iteration=$1
    echo -e "${BLUE}📸 Running visual regression test (Iteration $iteration)...${NC}"
    
    # Run the specific test
    if pnpm exec playwright test e2e/visual/bottom-nav-icon-fix.spec.ts --reporter=list; then
        echo -e "${GREEN}✅ Test passed!${NC}"
        return 0
    else
        echo -e "${RED}❌ Test failed${NC}"
        return 1
    fi
}

# Function to analyze test results
analyze_results() {
    echo -e "${BLUE}🔍 Analyzing test results...${NC}"
    
    # Check if screenshots were generated
    if [ -d "test-results" ]; then
        local screenshot_count=$(find test-results -name "*.png" -type f | wc -l)
        echo "  Found $screenshot_count screenshots"
        
        # Copy screenshots to iteration folder
        mkdir -p "test-results/iterations/iteration-$CURRENT_ITERATION"
        cp test-results/*.png "test-results/iterations/iteration-$CURRENT_ITERATION/" 2>/dev/null || true
    fi
}

# Function to apply fix based on test results
apply_fix() {
    local iteration=$1
    echo -e "${YELLOW}🔨 Applying fix (Iteration $iteration)...${NC}"
    
    # Read the current UnifiedNav.tsx file
    local nav_file="client/src/components/layout/UnifiedNav.tsx"
    
    if [ ! -f "$nav_file" ]; then
        echo -e "${RED}Error: $nav_file not found${NC}"
        return 1
    fi
    
    # Progressive fixes based on iteration
    case $iteration in
        1)
            echo "  Fix 1: Increasing icon container size and adding overflow-visible"
            # Already applied in the main fix
            ;;
        2)
            echo "  Fix 2: Adjusting icon size and stroke width"
            # Reduce stroke width for cleaner rendering
            sed -i.bak 's/strokeWidth={1.5}/strokeWidth={1.25}/g' "$nav_file"
            ;;
        3)
            echo "  Fix 3: Increasing container padding"
            # Add more space around icon
            sed -i.bak 's/w-14 h-14/w-16 h-16/g' "$nav_file"
            ;;
        4)
            echo "  Fix 4: Adjusting icon positioning"
            # Ensure proper centering
            sed -i.bak 's/flex items-center justify-center/flex items-center justify-center p-1/g' "$nav_file"
            ;;
        5)
            echo "  Fix 5: Final adjustments - reducing icon size slightly"
            sed -i.bak 's/w-7 h-7/w-6 h-6/g' "$nav_file"
            ;;
    esac
    
    echo -e "${GREEN}  Fix applied${NC}"
}

# Main testing loop
echo "Starting recursive testing loop..."
echo ""

while [ $CURRENT_ITERATION -lt $MAX_ITERATIONS ] && [ "$TEST_PASSED" = false ]; do
    CURRENT_ITERATION=$((CURRENT_ITERATION + 1))
    
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  ITERATION $CURRENT_ITERATION of $MAX_ITERATIONS${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Run the test
    if run_test $CURRENT_ITERATION; then
        TEST_PASSED=true
        analyze_results
        break
    fi
    
    # Analyze results
    analyze_results
    
    # If not the last iteration, apply a fix
    if [ $CURRENT_ITERATION -lt $MAX_ITERATIONS ]; then
        apply_fix $CURRENT_ITERATION
        
        echo ""
        echo -e "${YELLOW}⏳ Waiting 2 seconds before next iteration...${NC}"
        sleep 2
    fi
done

echo ""
echo "=================================================="

if [ "$TEST_PASSED" = true ]; then
    echo -e "${GREEN}🎉 SUCCESS! Test passed after $CURRENT_ITERATION iteration(s)${NC}"
    echo ""
    echo "Screenshots saved in: test-results/iterations/"
    echo ""
    echo "Next steps:"
    echo "  1. Review the screenshots in test-results/"
    echo "  2. Verify the fix visually in the browser"
    echo "  3. Commit the changes if satisfied"
    exit 0
else
    echo -e "${RED}❌ FAILED: Test did not pass after $MAX_ITERATIONS iterations${NC}"
    echo ""
    echo "Please review:"
    echo "  1. Test results in test-results/"
    echo "  2. Console output above"
    echo "  3. Consider manual intervention"
    exit 1
fi
