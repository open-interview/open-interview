#!/bin/bash
# Set GitHub repository topics/tags
# Run: ./script/set-github-topics.sh

REPO="open-interview/open-interview"

# Topics to set (max 20 allowed by GitHub)
TOPICS=(
  "interview-prep"
  "technical-interview"
  "system-design"
  "algorithms"
  "leetcode-alternative"
  "coding-challenges"
  "faang-prep"
  "software-engineering"
  "react"
  "typescript"
  "ai-powered"
  "spaced-repetition"
  "voice-interview"
  "certification-prep"
  "aws"
  "kubernetes"
  "devops"
  "machine-learning"
  "open-source"
  "free"
)

# Join topics with commas
TOPICS_JSON=$(printf '"%s",' "${TOPICS[@]}" | sed 's/,$//')

echo "Setting GitHub topics for $REPO..."
echo "Topics: ${TOPICS[*]}"

# Use GitHub CLI to set topics
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/topics" \
  -f "names=[$TOPICS_JSON]"

echo ""
echo "✅ Topics updated!"
echo ""
echo "To update repository description, run:"
echo "gh repo edit $REPO --description \"🎬 Free technical interview prep with 1000+ questions. Swipe-based learning, voice practice, spaced repetition, coding challenges. Master system design, algorithms, DevOps, AI/ML.\""
