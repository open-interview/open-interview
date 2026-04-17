# GitHub Workflows Quick Reference

## Automated Workflows

### 🚀 deploy.yml
**Purpose:** Consolidated deployment workflow (push and scheduled triggers)

**Triggers:**
- **Push to main:** Deploys to staging + production
- **Daily 2 AM UTC:** Deploys to production (after content generation)
- **Manual dispatch:** With optional environment override

**Environments:**
- Staging: stage-open-interview.github.io
- Production: open-interview.github.io

**Manual Trigger:**
```bash
# Auto-select environment based on trigger
gh workflow run deploy.yml

# Override environment (staging/production/all)
gh workflow run deploy.yml -f environment=staging -f reason="Testing deployment"
```

**What it does:**
- Builds application with latest content
- Race condition prevention via concurrency control
- Deploys to appropriate environments
- Ensures users always see fresh content
- Single deployment history source

---

### 🤖 content-generation.yml
**Purpose:** Generate and process content (questions, blog, voice sessions, intelligence) + daily maintenance

**Schedules:**
- **Hourly (0 * * * *):** Quick question generation (prioritizes empty channels)
- **Daily 2 AM (0 2 * * *):** Full pipeline (creator → analysis → verifier → processor → generators) + maintenance tasks
- **Daily 8 AM (0 8 * * *):** Flashcard generation (independent)

**Manual Trigger:**
```bash
# Quick generation
gh workflow run content-generation.yml -f mode=quick-generate -f count=10

# Full pipeline
gh workflow run content-generation.yml -f mode=full-pipeline

# Specific stage
gh workflow run content-generation.yml -f mode=specific-stage -f stage=creator
```

**Jobs:**
- quick-generate: Fast question generation
- creator: Create new questions
- analysis: Analyze quality issues
- verifier: Deep validation
- processor: Fix detected issues
- flashcard-generation: Generate flashcards (runs independently at 8 AM)
- blog-generator: Generate blog content
- voice-sessions: Create voice interview sessions
- interview-intelligence: Generate mock interview data
- maintenance: Run DB migrations + clear old NEW flags (runs at 2 AM)
- update-monitor: Update bot dashboard

---

### 🔄 issue-processing.yml
**Purpose:** Process GitHub issues (local and external repos)

**Schedules:**
- **Hourly (0 * * * *):** Sync external repo issues
- **Every 2 hours (0 */2 * * *):** Process local issues + cleanup stale

**Triggers:**
- Issues with `bot:processor` label
- Schedule
- Manual dispatch

**Manual Trigger:**
```bash
# Process local issues
gh workflow run issue-processing.yml -f source=local

# Process external issues
gh workflow run issue-processing.yml -f source=external -f source_repo=owner/repo

# Process both
gh workflow run issue-processing.yml -f source=both
```

**Jobs:**
- check-trigger: Determine what to process
- process-local: Handle local repo issues
- process-external: Sync and process external issues
- cleanup-stale: Remove stale in-progress labels

---

### 📊 social-media.yml
**Purpose:** Social media posting and analytics

**Schedules:**
- **Daily 5 AM (0 5 * * *):** LinkedIn posts + GitHub analytics

**Manual Trigger:**
```bash
# Post to LinkedIn
gh workflow run social-media.yml -f task=linkedin-post

# Post LinkedIn poll (requires explicit dispatch)
gh workflow run social-media.yml -f task=linkedin-poll -f channel=kubernetes

# Collect analytics
gh workflow run social-media.yml -f task=analytics

# All tasks
gh workflow run social-media.yml -f task=all
```

**Jobs:**
- linkedin-post: Share blog posts on LinkedIn
- linkedin-poll: Post question polls on LinkedIn (**manual dispatch only** — requires `task=linkedin-poll`)
- analytics: Collect GitHub analytics

---

### 📰 deploy-blog.yml
**Purpose:** Deploy blog site

**Schedules:**
- **Daily 4 AM (0 4 * * *):** Build and deploy blog

**Triggers:**
- Schedule
- After content-pipeline completes
- Manual dispatch

---

### 🔍 duplicate-check.yml
**Purpose:** Detect and optionally fix duplicate content

**Schedules:**
- **Weekly Sunday (0 0 * * 0):** Scan for duplicates

**Manual Trigger:**
```bash
# Check for duplicates
gh workflow run duplicate-check.yml -f content_type=question

# Auto-fix duplicates
gh workflow run duplicate-check.yml -f content_type=question -f auto_fix=true
```

---

### 🔦 lighthouse.yml
**Purpose:** Run Lighthouse performance audits

**Schedules:**
- **Weekly Monday 6 AM (0 6 * * 1):** Automated audit

**Triggers:**
- Pull requests to main
- Schedule
- Manual dispatch

**Manual Trigger:**
```bash
# Audit local build
gh workflow run lighthouse.yml

# Audit specific URL
gh workflow run lighthouse.yml -f url=https://open-interview.github.io
```

**Thresholds:**
- Performance: ≥ 70
- Accessibility: ≥ 90
- Best Practices: ≥ 80
- SEO: ≥ 80

**Pages audited:** home, channels

---

## Manual Workflows

### 📝 manual-blog.yml
Generate a blog post from a specific topic

```bash
gh workflow run manual-blog.yml -f topic="Kubernetes networking" -f publish=true
```

---

### 🧪 manual-e2e.yml
Run E2E tests with custom options

```bash
gh workflow run manual-e2e.yml -f pattern="search" -f browser=chromium
```

---

### 🎲 manual-intake.yml
Manually add a question to the database

```bash
gh workflow run manual-intake.yml -f question="What is a Kubernetes pod?"
```

---

### 🛤️ generate-learning-paths.yml
Regenerate learning paths when channel config changes

**Triggers:**
- Push to `channels-config.ts`
- Manual dispatch

```bash
gh workflow run generate-learning-paths.yml
```

---

### 📖 update-readme.yml
Update README with latest stats and generated content

```bash
gh workflow run update-readme.yml
```

---

## Setup Workflows

### 🏷️ setup-labels.yml
Create required labels for issue processing (run once)

```bash
gh workflow run setup-labels.yml
```

---

## Common Tasks

### Generate Questions
```bash
# Quick generation (10 questions)
gh workflow run content-generation.yml -f mode=quick-generate -f count=10

# Target specific channel
gh workflow run content-generation.yml -f mode=quick-generate -f channel=kubernetes
```

### Process Issues
```bash
# Process all pending issues
gh workflow run issue-processing.yml -f source=both

# Force reprocess completed issues
gh workflow run issue-processing.yml -f force_reprocess=true
```

### Social Media
```bash
# Post latest blog to LinkedIn
gh workflow run social-media.yml -f task=linkedin-post

# Post a poll (manual only)
gh workflow run social-media.yml -f task=linkedin-poll -f difficulty=intermediate
```

### Deploy
```bash
# Deploy app (push-triggered + scheduled)
gh workflow run deploy.yml

# Override environment for manual deployment
gh workflow run deploy.yml -f environment=production -f reason="Emergency deploy"

# Deploy blog
gh workflow run deploy-blog.yml
```

### Check Duplicates
```bash
# Scan for duplicates
gh workflow run duplicate-check.yml -f content_type=question

# Auto-fix duplicates
gh workflow run duplicate-check.yml -f auto_fix=true
```

---

## Monitoring

View workflow runs:
```bash
gh run list
gh run view <run-id>
gh run watch <run-id>
```

View logs:
```bash
gh run view <run-id> --log
```

Cancel a run:
```bash
gh run cancel <run-id>
```

---

## Troubleshooting

### Workflow not triggering
1. Check schedule syntax
2. Verify branch is correct
3. Check if workflow is disabled

### Job failing
1. Check logs: `gh run view <run-id> --log`
2. Verify secrets are set
3. Check script exists
4. Verify action exists

### Stale issues
- Cleanup runs every 2 hours
- Manual cleanup: `gh workflow run issue-processing.yml -f source=local`

### Duplicate runs
- Check if multiple schedules overlap
- Verify concurrency settings
- Check if manual trigger was used during scheduled run
