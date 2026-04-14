---
name: poll-quality-standards
description: Quality criteria and validation checklist for LinkedIn polls
license: MIT
compatibility: opencode
metadata:
  audience: poll-reviewer
  workflow: validation
---

# LinkedIn Poll Quality Standards

This skill defines the quality criteria and validation checklist for ensuring generated polls meet engagement and authenticity standards.

## When to Use

Use this skill when you need to review generated polls before posting. This is critical for the poll-reviewer agent and orchestrator.

## Core Principles

All LinkedIn polls should follow these principles:

1. **Debate-Driven, Not Definition-Based**
   - Ask preferences, not facts
   - Multiple valid answers exist
   - No obvious "correct" option

2. **Grounded in Reality**
   - Based on real use cases or incidents
   - Relatable to B2B/tech audience
   - Specific, not generic

3. **High Engagement Potential**
   - Creates discussion space
   - Targets 8-15% engagement
   - Avoids polarization

4. **Consistent with Brand**
   - Professional B2B tone
   - Technical depth appropriate
   - Authentic to audience

## Question Quality Checklist

### ✅ Good Question Examples
```
"Do you use blue-green or canary deployments?"
"Do you prefer CRDs or built-in K8s resources?"
"Do you conduct blameless postmortems?"
"Do you enforce IaC for all infrastructure?"
"Do you monitor application performance or SLOs?"
```

### ❌ Bad Question Examples
```
"What is blue-green deployment?" (definition-based)
"Do you like DevOps?" (too vague)
"Is X better than Y?" (too absolute)
"When should you use microservices?" (generic)
"Have you heard of Docker?" (too easy)
```

### Question Validation

- [ ] **Debate-Driven**: No obvious correct answer?
- [ ] **Specific**: References actual tools/practices?
- [ ] **Actionable**: Applies to real workflows?
- [ ] **Length**: Under 140 characters?
- [ ] **Clarity**: Clear what you're asking?
- [ ] **Audience**: Relevant to B2B/tech professionals?

## Options Quality Checklist

### Requirements
- [ ] Exactly 4 options (not 3, not 5)
- [ ] Each 25-40 characters
- [ ] All feel equally valid
- [ ] No "all of the above"
- [ ] No "other" or vague options
- [ ] Based on real choices made

### Option Validation

**Bad Option Set**
```
1. Yes
2. No
3. Maybe
4. I don't know
```
(Too vague, not meaningful)

**Good Option Set**
```
1. Blue-green (full cutover, faster)
2. Canary (gradual rollout, safer)
3. Shadow deployments (risk-free validation)
4. Rolling updates (continuous, balanced)
```
(All specific, all reasonable, all used)

### Scoring Options

For each option, rate 1-5:
- **Authenticity**: Is this a real approach used?
- **Validity**: Is this a reasonable choice?
- **Feasibility**: Is this achievable for teams?

All options should score 4-5 on all dimensions.

## Story Hook Quality Checklist

### Purpose
- [ ] Opens with real scenario or incident?
- [ ] Creates curiosity gap?
- [ ] Establishes context without bias?
- [ ] 2-3 sentences maximum?
- [ ] Specific (not generic)?

### Good Hook Examples
```
"We recently had a production incident with our deployment strategy.
It got us thinking about the tradeoffs between approaches.
What does your team use?"
```

```
"Based on conversations with DevOps leaders, tool selection is still
surprisingly debated. Do you go with the cloud-native option or the
familiar tool?"
```

```
"A major platform outage highlighted the importance of deployment
strategy. We switched ours this quarter. What's your approach?"
```

### Bad Hook Examples
```
"Let's talk about DevOps." (Too generic)
"Do you use Docker?" (No context)
"I think X is better than Y, what do you think?" (Biased)
"This is a really hard problem with many solutions..." (Too long)
```

## Engagement Potential Scoring

Rate poll on engagement signals (1-10 each):

| Signal | Score | Notes |
|--------|-------|-------|
| **Debate Space** | _/10 | Does this create genuine debate? |
| **Relatability** | _/10 | How relatable to audience? |
| **Specificity** | _/10 | How specific vs generic? |
| **Recency** | _/10 | How current/relevant? |
| **Community Buzz** | _/10 | Is this actively debated now? |

**Engagement Estimate**
- 40+ score: 10-15% likely engagement
- 30-39 score: 8-12% likely engagement
- 20-29 score: 5-8% likely engagement
- Below 20: Likely underperform

## Real-World Use Case Validation

### Authenticity Checklist
- [ ] Based on documented incident or pattern?
- [ ] Specific company/project mentioned?
- [ ] Timeframe given (when did this happen)?
- [ ] Can be fact-checked?
- [ ] Not hypothetical or theoretical?

### Red Flags
🚩 "We might encounter..." (hypothetical)
🚩 "In theory, a team could..." (theoretical)
🚩 "Some companies probably..." (vague attribution)
🚩 "This could happen if..." (conditional)

### Good Attribution
✅ "Based on incidents at [known company]"
✅ "This came from discussions at KubeCon"
✅ "Trend we're seeing across portfolios"
✅ "Pattern from postmortems this quarter"

## Revision Guidance

When a poll needs revisions, provide specific feedback:

### Format
```
⚠️ REVISIONS NEEDED - [Main Issue]

Issue 1: [Specific problem]
  → Fix: [Actionable suggestion]
  → Impact: [How this improves engagement]

Issue 2: [Specific problem]
  → Fix: [Actionable suggestion]
  → Impact: [How this improves engagement]

Revised Poll:
[Example of how it could look]
```

### Common Revision Scenarios

**Too Definition-Based**
- Issue: Question asks "What is X?"
- Fix: Rephrase as "Do you use X or Y?"
- Impact: Creates debate instead of facts

**Options Not Equal**
- Issue: Option 1 is clearly superior
- Fix: Balance with real tradeoffs (speed vs safety)
- Impact: All options feel equally valid

**Generic Hook**
- Issue: "Let's talk about DevOps"
- Fix: "We switched deployment strategies this quarter"
- Impact: Creates curiosity and specificity

**Low Engagement Potential**
- Issue: Topic no one debates
- Fix: Choose more current/debated angle
- Impact: Higher reply rate

## Approval Decision Tree

```
Is question debate-driven?
  NO → Needs revision
  YES ↓

Are options equally valid?
  NO → Needs revision
  YES ↓

Is story hook specific + real?
  NO → Needs revision
  YES ↓

Engagement potential 8-15%?
  NO → Consider different angle
  YES ↓

✅ APPROVED - Ready to post
```

## Success Tracking

After posting, monitor these metrics:

| Metric | Target | Good | Excellent |
|--------|--------|------|-----------|
| **Engagement Rate** | 8-15% | 8-12% | 12-15% |
| **Reply Count** | 10-25 | 10-15 | 15-25 |
| **Reactions/Votes** | High variation | 30+ | 50+ |
| **Share Rate** | 2-5% | 3%+ | 5%+ |
| **Time to First Reply** | <2 hours | <2 hrs | <1 hr |
| **Reply Sentiment** | Positive | 80%+ | 90%+ |

## Continuous Improvement

Track these patterns:
- Which topics generate highest engagement?
- Which question formats work best?
- Which story hooks convert to replies?
- Which options generate debate?

Use learnings to improve future polls.
