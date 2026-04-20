# Elite Blog Generation System

## Overview

A sophisticated 5-agent pipeline that transforms technical interview questions into elite, SEO-optimized blog posts using OpenRouter's free models.

## Architecture

### 5-Agent Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    Blog Generation Pipeline                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 1: Research Agent (gpt-4o-mini)                      │
│  • Finds 8-12 high-quality sources                          │
│  • Identifies real-world production examples                │
│  • Extracts key technical insights                          │
│  • Validates all URLs                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 2: Structure Agent (gpt-4o-mini)                     │
│  • Creates compelling narrative structure                   │
│  • Designs logical flow                                     │
│  • Plans diagram placements                                 │
│  • Outlines code examples                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 3: Content Agent (gpt-4o)                            │
│  • Writes engaging, story-driven content                    │
│  • Creates mermaid diagrams                                 │
│  • Writes production-quality code examples                  │
│  • Maintains consistent voice and tone                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 4: Polish Agent (gpt-4o)                             │
│  • Enhances readability and flow                            │
│  • Improves sentence structure                              │
│  • Adds compelling transitions                              │
│  • Ensures consistent formatting                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Agent 5: SEO Agent (gpt-4o-mini)                           │
│  • Generates meta descriptions                              │
│  • Extracts relevant keywords                               │
│  • Optimizes headings                                       │
│  • Creates social media snippets                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Elite Blog Post (MDX)
```

## Features

### ✨ Elite Content Quality
- **Story-driven narratives** with compelling hooks
- **Real-world production examples** from major tech companies
- **Technical depth** balanced with accessibility
- **Mermaid diagrams** for architecture visualization
- **Production-quality code examples**
- **8-12 minute read time** (1200-3000 words)

### 🔍 Research Excellence
- **8-12 validated sources** per post
- **2-4 real-world case studies**
- **Recent content** (prioritizes last 2 years)
- **URL validation** (removes 404s)
- **Multiple source types** (docs, blogs, papers, videos)

### 🎯 SEO Optimization
- **Meta descriptions** (150-160 chars)
- **8-12 relevant keywords**
- **Optimized headings** (H2/H3 hierarchy)
- **Social media snippets** (Twitter, LinkedIn)
- **Internal linking opportunities**

### 📊 Instrumentation
- **Database tracking** (blog_posts table)
- **Progress reports** (status, channel, difficulty)
- **Detailed logging** (JSONL format)
- **Quality gates** at each stage
- **Automatic retry** on failure
- **Performance metrics** (duration, word count, sources)

## Usage

### Single Post Generation

```bash
# Generate one blog post
node script/generate-blog-incremental.js
```

### Batch Generation

```bash
# Generate 5 posts with 30s delay between each
./script/generate-blog-batch.sh 5 30

# Generate 10 posts with 60s delay
./script/generate-blog-batch.sh 10 60
```

### Progress Tracking

```bash
# View generation progress
psql $DATABASE_URL -c "
  SELECT status, COUNT(*) as count, 
         AVG(word_count) as avg_words,
         AVG(source_count) as avg_sources
  FROM blog_posts 
  GROUP BY status;
"
```

## Configuration

### Environment Variables

```bash
# Required
OPENROUTER_API_KEY=your_key_here
DATABASE_URL=your_postgres_url

# Optional
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Pipeline Configuration

Edit `script/ai/blog-pipeline-config.js`:

```javascript
export const PIPELINE_CONFIG = {
  research: {
    model: 'openai/gpt-4o-mini',  // Free model
    temperature: 0.7,
    maxTokens: 4000
  },
  // ... other agents
};
```

### Quality Gates

```javascript
export const QUALITY_GATES = {
  research: {
    minSources: 8,
    minRealWorldCases: 2,
    minKeyInsights: 5
  },
  content: {
    minWords: 1200,
    maxWords: 3000,
    minCodeBlocks: 1
  },
  // ... other gates
};
```

## Output Structure

### MDX File Format

```markdown
---
id: unique-id
title: Compelling Title
slug: url-friendly-slug
channel: system-design
difficulty: advanced
tags: ["tag1", "tag2", "tag3"]
createdAt: 2026-04-20T16:00:00Z
author:
  name: Author Name
  role: Software Engineer
  github: https://github.com/username
  linkedin: https://linkedin.com/in/username
  avatar: https://github.com/username.png
readingTime: 10
excerpt: Compelling 2-sentence summary
diagram: |
  graph TD
      A[Start] --> B[Process]
      B --> C[End]
images: []
sources:
  - title: Source Title
    url: https://example.com
    type: article
seo:
  keywords: ["keyword1", "keyword2"]
  description: Meta description
---

> **Picture this:** Compelling hook that draws readers in...

## Section 1

Content with technical depth...

## Section 2

More engaging content...
```

### Directory Structure

```
content/posts/
├── sy-144--mastering-distributed-rate-limiting.mdx
├── q-9934--building-scalable-microservices.mdx
└── ...

logs/blog-generation/
├── 2026-04-20.jsonl
├── batch-20260420-160000.log
└── ...
```

## Database Schema

```sql
CREATE TABLE blog_posts (
  id SERIAL PRIMARY KEY,
  question_id TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  word_count INTEGER,
  source_count INTEGER,
  generated_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB
);
```

## Quality Assurance

### Validation Checks

1. **Research Stage**
   - Minimum 8 sources
   - All URLs validated (no 404s)
   - At least 2 real-world cases

2. **Structure Stage**
   - 4-8 main sections
   - At least 1 diagram
   - Clear narrative flow

3. **Content Stage**
   - 1200-3000 words
   - At least 1 code block
   - Proper MDX formatting

4. **Polish Stage**
   - Short paragraphs (3-4 sentences)
   - 8-12 minute read time
   - Consistent formatting

5. **SEO Stage**
   - 8-12 keywords
   - Meta description 150-160 chars
   - Optimized headings

### Error Handling

- **Automatic retry** (up to 3 attempts)
- **Exponential backoff** (1s, 2s, 3s)
- **Detailed error logging**
- **Database tracking** of failures
- **Graceful degradation**

## Performance

### Benchmarks

- **Single post**: ~60-90 seconds
- **Batch of 5**: ~8-10 minutes (with 30s delays)
- **Batch of 10**: ~18-20 minutes (with 30s delays)

### Cost Optimization

- Uses **free OpenRouter models** (gpt-4o-mini, gpt-4o)
- **Rate limiting** between generations
- **Efficient token usage** (targeted prompts)
- **Caching** of research data

## Monitoring

### Log Files

```bash
# View today's logs
tail -f logs/blog-generation/$(date +%Y-%m-%d).jsonl

# Parse logs
cat logs/blog-generation/*.jsonl | jq -r 'select(.success == true) | .slug'
```

### Database Queries

```sql
-- Success rate
SELECT 
  status,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM blog_posts
GROUP BY status;

-- Average metrics
SELECT 
  AVG(word_count) as avg_words,
  AVG(source_count) as avg_sources,
  AVG(EXTRACT(EPOCH FROM (generated_at - created_at))) as avg_duration_seconds
FROM blog_posts
WHERE status = 'published';

-- Channel distribution
SELECT channel, COUNT(*) as count
FROM blog_posts
WHERE status = 'published'
GROUP BY channel
ORDER BY count DESC;
```

## Troubleshooting

### Common Issues

1. **API Rate Limits**
   - Increase delay between generations
   - Use batch script with longer delays

2. **Quality Gate Failures**
   - Adjust thresholds in `blog-pipeline-config.js`
   - Check agent prompts for clarity

3. **URL Validation Failures**
   - Some sites block HEAD requests
   - Fallback to GET requests implemented

4. **Database Connection Issues**
   - Check DATABASE_URL environment variable
   - Ensure PostgreSQL is running

## Future Enhancements

- [ ] Image generation for diagrams
- [ ] Multi-language support
- [ ] A/B testing for titles
- [ ] Automatic internal linking
- [ ] Social media auto-posting
- [ ] Analytics integration
- [ ] Content calendar planning

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](../LICENSE) for details.
