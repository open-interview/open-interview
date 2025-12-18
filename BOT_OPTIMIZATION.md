# Bot Optimization Guide

## Optimized Schedule (UTC)

| Time | Bot | LLM? | Purpose |
|------|-----|------|---------|
| 00:00 | generate-question | ✅ | Generate new questions |
| 05:00 | motivation-bot | ✅ | Generate daily quotes |
| 06:00 | improve-question | ✅ | Improve answer/explanation quality |
| 08:00 | eli5-bot | ✅ | Add ELI5 explanations |
| 10:00 | classify-bot | ✅ | Classify channels + create work queue |
| 12:00 | video-bot | ❌ | Validate existing videos only |
| 14:00 | mermaid-bot | ✅ | Generate diagrams |
| 16:00 | company-bot | ✅ | Find company associations |
| 18:00 | tldr-bot | ✅ | Add TLDR summaries |

## Bot Responsibilities (Single Responsibility)

### 1. generate-question.js
- **Uses LLM**: Yes
- **Purpose**: Generate new interview questions
- **Output**: Complete question with answer, explanation, diagram

### 2. motivation-bot.js
- **Uses LLM**: Yes
- **Purpose**: Generate motivational quotes
- **Note**: Doesn't need database, works with local JSON file

### 3. improve-question.js
- **Uses LLM**: Yes
- **Purpose**: Improve answer and explanation quality ONLY
- **Does NOT**: Generate diagrams, find videos, find companies (delegated to specialized bots)

### 4. eli5-bot.js
- **Uses LLM**: Yes
- **Purpose**: Add "Explain Like I'm 5" explanations
- **Single field**: `eli5`

### 5. classify-bot.js
- **Uses LLM**: Yes
- **Purpose**: 
  - Classify questions into correct channels
  - Create work items for other bots
- **Orchestrator**: Creates work queue items for video, mermaid, company, eli5 bots

### 6. video-bot.js (add-videos.js)
- **Uses LLM**: NO (removed - LLMs hallucinate video IDs)
- **Purpose**: Validate existing YouTube videos
- **Future**: Integrate YouTube Data API for real video search

### 7. mermaid-bot.js
- **Uses LLM**: Yes
- **Purpose**: Generate Mermaid diagrams
- **Single field**: `diagram`

### 8. company-bot.js
- **Uses LLM**: Yes
- **Purpose**: Find companies that ask similar questions
- **Single field**: `companies`

### 9. tldr-bot.js
- **Uses LLM**: Yes
- **Purpose**: Generate concise one-liner summaries
- **Single field**: `tldr`

## Work Queue Architecture

The `classify-bot` acts as an orchestrator:
1. Scans questions for missing data
2. Creates work items in `work_queue` table
3. Other bots pick up work from queue

```
classify-bot (orchestrator)
    ├── Creates work for: video-bot
    ├── Creates work for: mermaid-bot
    ├── Creates work for: company-bot
    ├── Creates work for: eli5-bot
    └── Creates work for: improve-bot
```

## LLM Usage Optimization

### What SHOULD use LLM:
- ✅ Generating questions/answers/explanations
- ✅ Creating ELI5 explanations
- ✅ Generating Mermaid diagrams
- ✅ Finding company associations (based on question topic)
- ✅ Creating TLDR summaries
- ✅ Classifying questions into channels
- ✅ Generating motivational quotes

### What should NOT use LLM:
- ❌ Finding YouTube videos (LLMs hallucinate video IDs)
- ❌ Validating URLs (use HTTP requests)
- ❌ Database operations
- ❌ File operations

## Batch Processing

All bots support configurable batch sizes via `BATCH_SIZE` env var:
- Default: 5 questions per run
- Prevents rate limiting
- Allows incremental processing

## Rate Limiting

All LLM-using bots implement:
- 2 second delay between API calls (`RATE_LIMIT_MS = 2000`)
- 3 retry attempts with 10 second delays
- 5 minute timeout per call

## Database Fields by Bot

| Field | Bot Responsible |
|-------|-----------------|
| question | generate-question, improve-question |
| answer | generate-question, improve-question |
| explanation | generate-question, improve-question |
| diagram | mermaid-bot |
| eli5 | eli5-bot |
| tldr | tldr-bot |
| companies | company-bot |
| videos | video-bot (validation only) |
| channel/subChannel | classify-bot |
