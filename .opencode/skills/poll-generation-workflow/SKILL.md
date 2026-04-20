---
name: poll-generation-workflow
description: Complete workflow for generating debate-driven LinkedIn polls with real-world use cases
license: MIT
compatibility: opencode
metadata:
  audience: poll-generator
  workflow: linkedin-social-media
---

# LinkedIn Poll Generation Workflow

This skill provides a complete, structured workflow for generating high-quality LinkedIn polls using the agent team.

## When to Use

Use this skill when you need to generate a new LinkedIn poll with these characteristics:
- Debate-driven (not definition-based)
- Based on real-world use cases
- Targeting B2B/tech audience
- Following the strategic playbook

## The 5-Step Process

### Step 1: Analyze & Plan
**Agent**: poll-orchestrator

Request poll generation with:
```
topic: "Kubernetes" | "DevOps" | "SRE" | etc. (from 10-category system)
subtopic: "Container Orchestration" | "Deployment Strategy" | etc.
concept: "Blue-green deployments" | "CRD vs built-ins" | etc.
```

### Step 2: Research Real-World Use Cases
**Agent**: poll-researcher

The researcher finds 2-3 compelling real-world use cases:
- Production incidents or war stories
- Adoption patterns showing different approaches
- Debates currently happening in the community
- Recent examples (preferably last 12 months)

### Step 3: Generate Debate-Driven Poll
**Agent**: poll-generator

Creates the poll package:
- Story hook (context from research)
- Question (debate-driven, <140 chars)
- 4 options (mutually exclusive, equal weight)
- Engagement estimate (8-15% target)

### Step 4: Review for Quality
**Agent**: poll-reviewer

Validates against checklist:
- Question is debate-driven (no obvious answer)
- Story hook references real use case
- Options are equally valid
- Engagement potential is strong
- Approve or request revisions

### Step 5: Prepare for Posting
**Agent**: poll-poster

Provides posting package:
- Selected template (from 5 rotating)
- Hashtag set (from 7 topic-specific)
- Formatted caption (ready to copy)
- Recommended posting time
- Follow-up engagement strategy

## Quality Standards

All polls must meet these criteria:

**Debate-Driven**
- No obvious correct answer
- References real architectural/operational choices
- Both options feel equally valid
- Creates genuine discussion potential

**Real-World Grounded**
- Story hook references actual incident or pattern
- Based on community-discovered use cases
- Relatable to B2B/tech audience
- Not theoretical or generic

**Engagement-Focused**
- Targets 8-15% engagement rate
- Likely to trigger replies and discussion
- Avoids controversial topics
- Avoids overly niche questions

## Topic Categories (Choose One)

1. SRE
2. DevOps
3. IaC/Terraform
4. Observability
5. Platform Engineering
6. Cloud Architecture
7. CI/CD
8. Security
9. Career/Leadership
10. Kubernetes

## Template Examples

**Kubernetes Poll**
- Topic: Kubernetes
- Subtopic: Container Orchestration
- Concept: CRDs vs Built-in Resources
- Question: "Do you use Custom Resources or stick with built-in objects?"
- Use Case: How to extend K8s effectively

**DevOps Poll**
- Topic: DevOps
- Subtopic: Deployment Strategy
- Concept: Blue-green vs Canary
- Question: "Which deployment strategy works best for your team?"
- Use Case: Deployment safety and speed tradeoffs

**SRE Poll**
- Topic: SRE
- Subtopic: Incident Response
- Concept: Blameless Postmortems
- Question: "Do you conduct blameless postmortems?"
- Use Case: Learning from incidents without blame

## Integration with Main Workflow

This skill is used by:
- `poll-orchestrator` - Main coordinator
- `poll-researcher` - Search strategy
- `poll-generator` - Question design
- `poll-reviewer` - Quality validation
- `poll-poster` - Posting logistics

## Success Metrics

Track these metrics per poll:
- Engagement rate (target: 8-15%)
- Number of replies
- Save rate
- Share rate
- Time to first reply
- Sentiment of replies

## Common Issues & Solutions

**Issue**: Poll gets generic/definition-based responses
- **Solution**: Ensure story hook is compelling and specific

**Issue**: Low engagement (<3%)
- **Solution**: Question may not be debate-driven enough; revise

**Issue**: Engagement spikes then plateaus
- **Solution**: Plan strong follow-up post with poll results + insight

**Issue**: Followers debate authenticity of use case
- **Solution**: Source use cases from verified incidents; cite sources
