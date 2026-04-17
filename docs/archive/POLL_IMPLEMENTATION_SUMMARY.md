# LinkedIn Poll Improvement Implementation Summary

## What Was Done

### 1. **Poll Performance Playbook Created**
- **File:** `docs/poll-playbook.md`
- **Contains:**
  - 10 topic categories (not just Kubernetes): SRE, DevOps, IaC, Observability, Platform Eng, Cloud, CI/CD, Security, Career
  - 42 opinion-based poll questions (debate-driven, not definitions)
  - 10 story hook templates (real incidents as poll leads)
  - 5 varied post templates (rotate structure weekly)
  - 5 follow-up templates (post results + your take)
  - 7 rotating hashtag sets (topic-specific, not repetitive)
  - Posting schedule (48-72 hours between polls, 60% articles/40% polls)
  - CTA variants and quick reference card

### 2. **New Use-Case Poll Workflow**
- **Files Created:**
  - `script/post-linkedin-poll-usecase.js` - New workflow script
  - `script/ai/prompts/templates/linkedin-poll-usecase.js` - AI prompt template
  - `script/ai/utils/web-search.js` - Web search utility (Tavily/Exa/DuckDuckGo fallback)

- **Better Flow:**
  1. Select topic, subtopic, concept
  2. Search web for real-world use case
  3. Generate poll with use case as hook
  4. Post to LinkedIn (or dry run)

- **Example Usage:**
  ```bash
  gh workflow run social-media.yml \
    --field use_poll_usecase=true \
    --field topic=sre \
    --field subtopic="on-call" \
    --field concept="incident response"
  ```

### 3. **Updated GitHub Workflow**
- **File:** `.github/workflows/social-media.yml`
- **New Job:** `linkedin-poll-usecase`
- **New Inputs:**
  - `topic` - e.g., sre, kubernetes, devops, aws
  - `subtopic` - e.g., on-call, networking, ci-cd
  - `concept` - e.g., incident response, cgroups
  - `use_poll_usecase` - Enable the new workflow

### 4. **Key Improvements Over Old Flow**

| Aspect | Old Flow | New Flow |
|--------|----------|----------|
| Use Case Finding | AI tries to generate at poll time (fails) | Web search FIRST, then generate poll |
| Topic Variety | Random + filter by channel | Explicit: topic/subtopic/concept |
| Engagement | Definition questions (1.7% vote rate) | Opinion/debate questions (target 10-15%) |
| Post Structure | Same template every time | 5 rotating templates |
| Hook | Generic context | Real-world use case from web |
| Hashtags | Same 3 every time | 7 rotating sets by topic |
| Follow-up | None | Results + your take next day |

---

## How to Use

### Quick Start - Topic/Subtopic/Concept Polls
```bash
# SRE incident response poll
gh workflow run social-media.yml \
  --field use_poll_usecase=true \
  --field topic=sre \
  --field subtopic="on-call" \
  --field concept="incident response" \
  --field dry_run=true

# DevOps Terraform state management poll  
gh workflow run social-media.yml \
  --field use_poll_usecase=true \
  --field topic=devops \
  --field subtopic="infrastructure" \
  --field concept="terraform state management" \
  --field dry_run=false
```

### Use the Playbook
1. **Pick a topic** from the 10 categories in `docs/poll-playbook.md`
2. **Select a question** from the debate-based questions bank
3. **Use a story hook** to lead in
4. **Rotate templates** (use a different one each post)
5. **Pick hashtags** from the rotating sets
6. **Wait 48-72 hours** before next poll
7. **Follow up** with results + your insight next day

---

## Technical Details

### Web Search Fallback Chain
1. **Tavily** (if `TAVILY_API_KEY` set) - Best for tech content
2. **Exa** (if `EXA_API_KEY` set) - Academic/research content
3. **DuckDuckGo** (free, no API key) - Fallback

### Poll Question Structure
- AI extracts core concept from context
- Generates 4 options (not always obvious correct answer)
- Creates story hook for intro text
- Returns poll ready for LinkedIn API

### AI Templates
- `linkedinPollMcq` - Old: Random question → MCQ poll
- `linkedinPollUsecase` - New: Topic/Subtopic/Concept + Real-World Use Case → Engaging Poll

---

## Files Modified/Created

### Created
- `docs/poll-playbook.md` - Complete playbook
- `script/post-linkedin-poll-usecase.js` - New workflow
- `script/ai/prompts/templates/linkedin-poll-usecase.js` - AI template
- `script/ai/utils/web-search.js` - Web search utils
- `.github/workflows/social-media.yml` - Updated with new job

### Updated
- `.github/workflows/social-media.yml` - Added use-case poll job
- `script/ai/index.js` - Registered new templates

---

## Next Steps

1. **Test the workflow** - Run dry runs to see generated polls
2. **Set up API keys** (optional):
   - `TAVILY_API_KEY` - Get from [tavily.com](https://tavily.com)
   - `EXA_API_KEY` - Get from [exa.ai](https://exa.ai)
3. **Start posting** - Use the playbook for variety
4. **Track metrics** - Monitor poll vote rates (target 10-15%)
5. **Iterate** - Adjust topics/questions based on engagement

---

## Problem Solved

**Before:** Polls got 1.7% engagement because they asked definition questions with obvious right answers, same structure every time, no story hook.

**After:** 
- Topic/subtopic/concept approach ensures relevant, timely polls
- Web search finds real-world use cases as hooks
- 42 debate-based questions replace definition-based ones
- 5 rotating templates + 7 hashtag sets prevent algorithm saturation
- Follow-up workflow creates content series
- 48-72 hour spacing respects audience attention

**Expected Result:** 10-15% poll engagement rate (LinkedIn average) vs current 1.7%
