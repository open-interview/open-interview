---
name: poll-researcher-guide
description: Research methodology and search strategies for finding real-world poll use cases
license: MIT
compatibility: opencode
metadata:
  audience: poll-researcher
  workflow: research
---

# Poll Researcher Guide

This skill provides search strategies and research methodologies for finding compelling real-world use cases for LinkedIn polls.

## When to Use

Use this skill when you need to research real-world use cases, incidents, or debates to ground a LinkedIn poll in reality. This is critical for the poll-researcher agent.

## Research Sources

### Primary Sources
1. **GitHub Issues & Discussions**
   - Search for real problems people face
   - Look for architecture decision threads
   - Find implementation war stories

2. **Reddit & Dev Communities**
   - r/devops, r/sre, r/kubernetes
   - Dev.to, Hashnode discussions
   - Stack Overflow questions (unanswered often reveal debates)

3. **Incident Postmortems**
   - Public postmortems (blameless.com, GitHub issues)
   - Company engineering blogs
   - Conference talks about production incidents

4. **Blog Posts & Articles**
   - Recent 12-month articles on topic
   - Comparison posts ("X vs Y")
   - Lessons learned posts

5. **Conference Talks**
   - KubeCon, DevOps Days, SREcon talks
   - Talks about tool selections and trade-offs
   - Incident debriefs

### Query Patterns

**For Tool/Framework Decisions**
```
"X vs Y" [topic]
"migrated from X to Y"
"why we chose X"
"evaluating X and Y"
```

**For Architecture Debates**
```
"best practice" [architecture topic]
"our approach to" [architectural decision]
"how we deploy"
"[tool/practice] in production"
```

**For Incident Learnings**
```
"postmortem" [topic]
"incident report" [topic]
"lessons learned" [topic]
"what went wrong" [topic]
```

**For Trend Analysis**
```
"adoption of X" [topic]
"shift towards X"
"moving away from X"
"X gaining traction"
```

## Analysis Framework

For each use case found, extract:

1. **The Scenario** - What actual situation is this?
2. **The Choices** - What options did they consider?
3. **The Outcome** - What did they choose and why?
4. **The Debate** - Why is this still debated in community?
5. **Recency** - Is this still relevant today?

## Real-World Use Case Examples

### Kubernetes Example: CRDs vs Built-ins
- **Scenario**: Team needed to extend K8s capabilities
- **Choices**: Build custom CRD vs use built-in resources
- **Outcome**: CRDs for flexibility, built-ins for simplicity
- **Debate**: When to use each, complexity tradeoffs
- **Recency**: Active discussion 2024-2026

### DevOps Example: Deployment Strategy
- **Scenario**: Production deployment went wrong
- **Choices**: Blue-green vs canary vs rolling
- **Outcome**: Blue-green for safety, canary for granularity
- **Debate**: Speed vs safety, team size implications
- **Recency**: Core DevOps practice, always relevant

### SRE Example: Incident Response
- **Scenario**: Team had blame-focused postmortems
- **Choices**: Blameless vs root-cause vs 5-why
- **Outcome**: Shifted to blameless for learning
- **Debate**: How to improve without blame, accountability
- **Recency**: Industry shift 2022-2026

## Red Flags to Avoid

❌ **Outdated Practices**
- Technology deprecated
- Practice abandoned by community
- Solved problems from 3+ years ago

❌ **Too Niche**
- Only affects 1-2% of audience
- Internal-only pattern
- Tool-specific minutiae

❌ **One-Sided Debates**
- Only one approach makes sense
- Clear winner in industry
- No genuine debate space

❌ **Controversial Topics**
- Politics, religion, identity
- Unrelated to technical merit
- Divisive personality debates

## Effective Searches

**High Engagement Topics**
- Deployment strategies (always debated)
- Tool selection (DevOps has many options)
- Architecture patterns (multiple valid approaches)
- Incident response (learning opportunities)
- Scaling decisions (different approaches)

**Community Engagement Signals**
- Lots of replies/comments
- Multiple perspectives offered
- Active debate, not consensus
- Recent activity (last 6 months)
- Industry experts weighing in

## Output Structure

When you find use cases, structure your response:

```
Use Case 1: [Title]
- Scenario: [What actually happened]
- Debate: [Why is this debated]
- Story Hook: "Based on real incidents at [Company]..."

Use Case 2: [Title]
- Scenario: [What actually happened]
- Debate: [Why is this debated]
- Story Hook: "Based on real incidents at [Company]..."

Use Case 3: [Title]
- Scenario: [What actually happened]
- Debate: [Why is this debated]
- Story Hook: "Based on real incidents at [Company]..."

Key Debate Angles:
1. [First major decision point]
2. [Second major decision point]
3. [Third major decision point]
```

## Time Allocation

Typical research time: 10-15 minutes per poll

- 3-5 min: Initial searches
- 2-3 min: Evaluating sources
- 3-5 min: Extracting narratives
- 2-3 min: Structuring findings

If searches yield no results, escalate to orchestrator for different concept.

## Documentation

Link sources in your findings:
- Include URLs where found
- Note publication/discussion date
- Cite author/company if public
- Flag if behind paywall

This helps validate authenticity to audience.
