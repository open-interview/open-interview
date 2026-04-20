# Quick Start: LinkedIn Poll Agent Team

## 5-Minute Setup

### Step 1: Start OpenCode
```bash
cd /home/runner/workspace
opencode
```

### Step 2: Check Agent Registration
The agents should be auto-loaded from `.opencode/agents/`:
- `poll-orchestrator` (primary)
- `poll-researcher` (subagent)
- `poll-generator` (subagent)
- `poll-reviewer` (subagent)
- `poll-poster` (subagent)

**Verify**: Type `@` and search for "poll-" to see all agents.

### Step 3: Connect to Model Provider
```
/connect
```
Select OpenCode Zen or an alternative provider with free tier models.

## Generate Your First Poll

### Quick Command
```
@poll-orchestrator Generate a LinkedIn poll on Kubernetes

topic: Kubernetes
subtopic: Container Orchestration
concept: Custom Resource Definitions (CRDs) vs built-in resources
```

### What Happens (Automated)

1. **Researcher** searches for K8s CRD use cases
   - Finds real incidents where teams debated this
   - Extracts narrative hooks

2. **Generator** creates poll question
   - "Do you use CRDs or stick with built-in K8s resources?"
   - Generates 4 valid options
   - Adds story hook

3. **Reviewer** validates quality
   - Checks debate-driven nature
   - Confirms engagement potential
   - Approves or requests revisions

4. **Poster** prepares for LinkedIn
   - Selects template
   - Chooses hashtags
   - Formats caption
   - Suggests posting time

5. **Result**: Ready-to-post poll package

## Expected Output

```
POLL GENERATED ✓

Story Hook:
"Based on incidents from K8s teams: CRDs provide flexibility 
but add complexity. Do you go with..."

Question:
"Do you use CRDs or stick with built-in K8s resources?"

Options:
1. CRDs (flexible, powerful)
2. Built-in resources (simpler)
3. Mix both depending on use case
4. Evaluated but stuck with what we have

Engagement Estimate: 10-14%

Template: Question Hook (#1)
Hashtags: #Kubernetes #CloudNative #DevOps #Automation

Caption ready to post:
[Full formatted text for LinkedIn]

Posting Recommendation:
Thursday 9-11am PT (optimal engagement window)
Follow-up: Post poll results + insight Friday
```

## Try Different Topics

### SRE Poll
```
@poll-orchestrator Generate SRE poll

topic: SRE
subtopic: Incident Response
concept: Blameless postmortems
```

### DevOps Poll
```
@poll-orchestrator Generate DevOps poll

topic: DevOps
subtopic: Deployment Strategy
concept: Blue-green vs canary deployments
```

### Platform Engineering Poll
```
@poll-orchestrator Generate Platform Engineering poll

topic: Platform Engineering
subtopic: Developer Experience
concept: Self-service vs managed deployment
```

## Available Topics

Choose from 10 strategic categories:

1. **SRE** - Reliability, incident response, monitoring
2. **DevOps** - Automation, deployment, infrastructure
3. **IaC/Terraform** - Infrastructure as code, state management
4. **Observability** - Monitoring, logging, tracing
5. **Platform Engineering** - Developer platforms, tooling
6. **Cloud Architecture** - Multi-cloud, serverless, containers
7. **CI/CD** - Pipeline design, testing, deployment
8. **Security** - DevSecOps, compliance, vulnerability
9. **Career/Leadership** - Engineering management, hiring
10. **Kubernetes** - Container orchestration, K8s patterns

## Quality Checks

Each generated poll is validated against:
- ✅ Debate-driven (not definition-based)
- ✅ Real-world use case (not theoretical)
- ✅ Engaging options (all equally valid)
- ✅ Story hook (specific, authentic)
- ✅ Target engagement (8-15% potential)

## Next Steps

### Manual Posting
1. Copy the caption from the agent's output
2. Go to LinkedIn
3. Create a poll post
4. Add question and options
5. Set share timing
6. Post!

### Monitor Engagement
- Check engagement rate after 24 hours
- Note which topics perform best
- Track reply sentiment
- Monitor which options win

### Automate Posting
(Future integration)
- Schedule polls via GitHub Actions
- Auto-post at optimal times
- Track engagement metrics
- Generate reports

## Common Questions

**Q: How accurate are the use cases?**
A: The researcher searches public incidents, postmortems, and community discussions. All findings are grounded in real scenarios.

**Q: Can I modify the generated poll?**
A: Yes! The output is a suggestion. You can:
- Edit the question for clarity
- Adjust options
- Refine the story hook
- Change hashtags

**Q: How often should I post?**
A: Per the playbook: every 48-72 hours with a 60% articles / 40% polls mix.

**Q: What engagement rate should I expect?**
A: Target is 8-15%. LinkedIn average is 1-3%, so 8-15% is strong engagement.

**Q: Do I need OpenCode Zen paid account?**
A: No! The agents use free models:
- big-pickle (free)
- nemotron-3-super-free (free, NVIDIA trial)
- qwen3.6-plus-free (free, Alibaba trial)

## Troubleshooting

### "Agent not found" error
→ Ensure `.opencode/agents/` files exist

### "Model not available" error
→ Check your model provider connection with `/connect`

### "Rate limit" error
→ Free models have usage limits. Wait 1 hour or upgrade

### Poll lacks engagement potential
→ Try different concept or more specific topic

## Resources

- Full documentation: `docs/AGENT_TEAM_ARCHITECTURE.md`
- Poll playbook: `docs/poll-playbook.md`
- Research guide: `.opencode/skills/poll-researcher-guide/SKILL.md`
- Quality standards: `.opencode/skills/poll-quality-standards/SKILL.md`

## Keyboard Shortcuts

```
@          # Search and invoke agents/skills
<TAB>      # Switch between primary agents
<LEADER>↓  # Enter first child session
←/→        # Cycle between child sessions
↑          # Return to parent session
/init      # Initialize OpenCode for project
/connect   # Configure model provider
/models    # List available models
```

---

**Ready to generate your first poll?** Start with:
```
@poll-orchestrator Generate a LinkedIn poll on Kubernetes CRDs
```
