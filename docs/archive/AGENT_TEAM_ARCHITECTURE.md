# OpenCode Agent Team for LinkedIn Polls

## Overview

This is a specialized team of OpenCode agents that orchestrates the complete LinkedIn poll generation workflow. The team uses a primary orchestrator agent that coordinates four subagents for research, generation, review, and posting.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              poll-orchestrator (Primary Agent)              │
│         Coordinates entire poll generation workflow         │
│                  (Free: big-pickle model)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                ▼             ▼             ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │  Researcher │ │  Generator  │ │  Reviewer   │
        │ (nemotron)  │ │  (qwen)     │ │ (big-pickle)│
        └─────────────┘ └─────────────┘ └─────────────┘
                │             │             │
                │             │             └─────┐
                └─────────────┼────────────────────┤
                              ▼                    ▼
                      ┌──────────────────────────────────┐
                      │    poll-poster (Subagent)        │
                      │  Posting & Engagement Strategy   │
                      │     (Free: nemotron model)       │
                      └──────────────────────────────────┘
```

## Agents

### 1. poll-orchestrator (Primary)
**Model**: `opencode/big-pickle` (free)  
**Temperature**: 0.3 (focused, deterministic)

**Role**: Coordinates the entire workflow
- Accepts poll requests (topic, subtopic, concept)
- Invokes specialized subagents in sequence
- Validates outputs at each stage
- Returns final poll package ready for posting

**Capabilities**:
- Task invocation (can call all subagents)
- Full tool access
- Decision-making authority

**Usage**:
```
/connect  # Set up OpenCode Zen or free model provider
cd /path/to/project
opencode

@poll-orchestrator Generate a LinkedIn poll on Kubernetes deployment strategies
topic: Kubernetes
subtopic: Deployment Strategies
concept: Blue-green vs Canary deployments
```

### 2. poll-researcher (Subagent)
**Model**: `opencode/nemotron-3-super-free` (free, NVIDIA)  
**Temperature**: 0.2 (focused, deterministic)

**Role**: Finds real-world use cases via web search
- Searches for real-world incidents and practices
- Validates recency and authenticity
- Extracts narrative hooks and debate angles
- Returns structured research findings

**Capabilities**:
- Web search (grep, basic file inspection)
- Read-only bash access (grep only)
- Web fetching

**Limitations**:
- Cannot modify files
- No write access
- No edit access

### 3. poll-generator (Subagent)
**Model**: `opencode/qwen3.6-plus-free` (free, Alibaba)  
**Temperature**: 0.4 (balanced, creative)

**Role**: Creates debate-driven poll content
- Generates compelling question based on research
- Creates 4 mutually-exclusive options
- Adds story hook with context
- Estimates engagement potential

**Capabilities**:
- Full reasoning capability
- Text generation focus
- No file/system modifications

### 4. poll-reviewer (Subagent)
**Model**: `opencode/big-pickle` (free)  
**Temperature**: 0.1 (very focused, deterministic)

**Role**: Validates poll quality and engagement
- Checks against quality checklist
- Validates debate-driven nature
- Assesses engagement potential
- Provides specific feedback or approval

**Capabilities**:
- Read-only analysis
- Quality validation
- Structured decision making

**Limitations**:
- Cannot modify files
- No bash access
- No edit access

### 5. poll-poster (Subagent)
**Model**: `opencode/nemotron-3-super-free` (free, NVIDIA)  
**Temperature**: 0.2 (focused, deterministic)

**Role**: Prepares approved poll for posting
- Selects rotating template (1 of 5)
- Chooses topic-specific hashtag set (1 of 7)
- Formats caption for LinkedIn
- Recommends posting time and strategy

**Capabilities**:
- Text formatting
- Template selection
- Strategy planning

## Free Models Used

All agents use **free models from OpenCode Zen** to minimize costs:

| Model | Tier | Use Case |
|-------|------|----------|
| **big-pickle** | Free/Stealth | Orchestration, Reviews (general capability) |
| **nemotron-3-super-free** | Free (NVIDIA) | Research, Posting (efficient, focused) |
| **qwen3.6-plus-free** | Free (Alibaba) | Generation (good code/reasoning) |

**Important**: Free models have usage limits and trial terms. See [OpenCode Zen Pricing](https://opencode.ai/docs/zen/#pricing).

## Skills Available

Three skills support this agent team:

### 1. poll-generation-workflow
Complete workflow documentation
- 5-step process
- Quality standards
- Topic categories
- Integration guide

### 2. poll-researcher-guide
Research methodology and search strategies
- Source evaluation
- Query patterns
- Analysis framework
- Real-world examples

### 3. poll-quality-standards
Quality criteria and validation checklist
- Question quality
- Options quality
- Story hook quality
- Engagement scoring
- Revision guidance

## Quick Start

### 1. Setup (One-time)

```bash
# Ensure .opencode/agents and .opencode/skills are in place
ls .opencode/agents/
ls .opencode/skills/

# Initialize OpenCode if not already done
cd /path/to/project
opencode
/init
```

### 2. Generate a Poll

```bash
opencode

# Option A: Use primary orchestrator
@poll-orchestrator Generate a LinkedIn poll on SRE incident response
topic: SRE
subtopic: Incident Response
concept: Blameless postmortems

# Option B: Switch to poll-orchestrator agent
<TAB>  # Cycle to poll-orchestrator
Generate a LinkedIn poll on SRE incident response
topic: SRE
subtopic: Incident Response
concept: Blameless postmortems
```

### 3. Workflow Execution

The orchestrator will:

1. **Invoke poll-researcher**
   - Searches for real-world SRE incidents
   - Finds postmortem examples
   - Extracts narrative hooks

2. **Invoke poll-generator**
   - Creates debate question: "Do you conduct blameless postmortems?"
   - Generates 4 options based on practices
   - Adds story hook from research

3. **Invoke poll-reviewer**
   - Validates quality checklist
   - Confirms debate-driven nature
   - Approves or requests revisions

4. **Invoke poll-poster**
   - Selects template
   - Chooses hashtags
   - Formats caption
   - Recommends posting time

5. **Return Final Package**
   ```
   Ready to post:
   - Story Hook
   - Question
   - 4 Options
   - Template selection
   - Hashtags
   - Caption
   - Engagement strategy
   ```

## Configuration

The agents are configured in `.opencode/opencode.json`:

- **model**: Specifies free model from OpenCode Zen
- **temperature**: Controls randomness (0.1-0.4 for polls)
- **permission**: Controls tool access per agent
- **description**: Defines agent role

## Integration with Existing Workflow

The agent team complements the existing `script/agents/poll-generator-agent.js`:

**Option 1: Use OpenCode Agents Directly**
```bash
cd /path/to/project
opencode

@poll-orchestrator Generate poll for Kubernetes topic
```

**Option 2: Refactor Node Script to Call Agents**
Integrate the agent team into the existing GitHub Actions workflow by calling OpenCode agents via CLI or API.

## Best Practices

### 1. Provide Clear Context
```
Bad:
@poll-orchestrator Generate a poll

Good:
@poll-orchestrator Generate a LinkedIn poll on blue-green deployments
topic: DevOps
subtopic: Deployment Strategy
concept: Blue-green vs canary deployments
```

### 2. Use Skills for Guidance
```
Loading skills during generation:
/skill poll-generation-workflow
/skill poll-researcher-guide
/skill poll-quality-standards
```

### 3. Monitor Quality Output
- Ensure all polls are debate-driven (not definition-based)
- Verify story hooks reference real incidents
- Check that options are equally valid
- Validate engagement potential 8-15%

### 4. Track Engagement Metrics
- Engagement rate (%)
- Reply count
- Save/share rate
- Time to first reply

### 5. Iterate Based on Results
- Best performing topics?
- Best performing question formats?
- Which hashtag sets work best?
- What story hooks convert?

## Troubleshooting

### Agent Not Found
```
Error: Agent 'poll-researcher' not found
```
**Solution**: Ensure `.opencode/agents/poll-researcher.md` exists

### Skill Not Loading
```
Error: Skill 'poll-generation-workflow' not found
```
**Solution**: Ensure `.opencode/skills/poll-generation-workflow/SKILL.md` exists with proper frontmatter

### Model Rate Limiting
```
Error: Rate limit exceeded for big-pickle
```
**Solution**: Free models have usage limits. Switch model or use alternative tier.

### Task Invocation Not Allowed
```
Error: Agent does not have permission to invoke poll-generator
```
**Solution**: Check `permission.task` in orchestrator config

## File Structure

```
.opencode/
├── agents/
│   ├── poll-orchestrator.md
│   ├── poll-researcher.md
│   ├── poll-generator.md
│   ├── poll-reviewer.md
│   └── poll-poster.md
└── skills/
    ├── poll-generation-workflow/
    │   └── SKILL.md
    ├── poll-researcher-guide/
    │   └── SKILL.md
    └── poll-quality-standards/
        └── SKILL.md

opencode.json  # Agent and model configuration
```

## Next Steps

1. **Test the agent team** with a sample poll request
2. **Monitor engagement** of generated polls
3. **Refactor `script/agents/poll-generator-agent.js`** to use OpenCode agents
4. **Integrate with GitHub Actions** for scheduled poll generation
5. **Track metrics** to validate 8-15% engagement target

## References

- [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)
- [OpenCode Skills Documentation](https://opencode.ai/docs/skills/)
- [OpenCode Zen Models](https://opencode.ai/docs/zen/)
- `docs/poll-playbook.md` - Strategic playbook
- `docs/POLL_IMPLEMENTATION_SUMMARY.md` - Implementation notes
