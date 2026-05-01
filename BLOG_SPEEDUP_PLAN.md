# Blog Generation 10x Speedup Plan

> Target: Reduce per-post generation from ~180-300s to ~20-30s
> Strategy: Eliminate the 3 bottlenecks that account for 90% of runtime

---

## Current Timing Breakdown (Single Post)

| Step | Time | % of Total |
|------|------|-----------|
| AI: find_real_world_case (OpenCode CLI) | 30-60s | 15-20% |
| AI: generate_blog (OpenCode CLI) | 60-120s | 30-40% |
| URL validation (quality gates + main, sequential) | 80-160s | 40-55% |
| Retry loops (up to 3 case attempts) | 0-180s | 0-50% |
| Vector DB, images, DB save, HTML regen | 5-15s | 3-5% |
| **TOTAL** | **~180-300s** | **100%** |

---

## SP-01 · 🔴 · Parallelize URL Validation (Save 60-140s)

**Problem:**
`validateSources()` in both `generate-blog.js` and `blog-quality-gates.js` validates URLs sequentially with 5s timeout per URL. With MIN_SOURCES=8, that's 40-80s per run. And it runs **TWICE** — once inside quality gates, once in main().

**Fix:**

### A. Parallelize with `Promise.all()`
```js
// Replace sequential for-loop in validateSources():
const results = await Promise.allSettled(
  sources.map(src => validateUrlWithReason(src.url, src))
);
```

### B. Reduce timeout to 3s
```js
// validateUrl(url, timeout = 3000) instead of 5000
```

### C. Remove duplicate validation in `generate-blog.js` main()
The quality gates node already validates sources. Remove the second `validateSources()` call at line ~1820 of `generate-blog.js`. Instead, read validation results from the graph state.

### D. Use `Promise.allSettled` for resilience
Individual URL failures don't block the whole batch.

**Expected:** 80-160s → 5-10s

**Files:** `script/generate-blog.js`, `script/ai/services/blog-quality-gates.js`

---

## SP-02 · 🔴 · Switch AI Provider to Direct API (Save 60-120s)

**Problem:**
Every AI call spawns a new `opencode` CLI child process (`script/ai/providers/opencode.js` line 44). Process startup + JSON parsing overhead adds 5-10s per call. The model `opencode/gpt-5-nano` itself takes 25-55s per call. Two mandatory AI calls per post = 90-180s.

**Fix:**

### A. Add direct OpenRouter API provider
Create `script/ai/providers/openrouter.js` that uses `fetch()` directly instead of spawning CLI:
```js
export async function callOpenRouter(prompt, options = {}) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://open-interview.github.io',
      'X-Title': 'OpenInterview Blog Generator',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'openai/gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: options.json ? { type: 'json_object' } : undefined,
      max_tokens: options.maxTokens || 4000,
      temperature: options.temperature ?? 0.7,
    }),
  });
  // ...
}
```

### B. Use faster model for blog generation
- `find_real_world_case`: `openai/gpt-4o-mini` (fast, cheap, good for research)
- `generate_blog`: `openai/gpt-4o-mini` or `anthropic/claude-3.5-haiku` (fast generation)

### C. Configure via env var
```js
// script/ai/config.js
BLOG_AI_PROVIDER: process.env.BLOG_AI_PROVIDER || 'opencode', // 'opencode' | 'openrouter'
BLOG_MODEL: process.env.BLOG_MODEL || 'opencode/gpt-5-nano',
BLOG_FAST_MODEL: process.env.BLOG_FAST_MODEL || 'openai/gpt-4o-mini',
```

**Expected:** 90-180s → 15-30s for AI calls (5-6x faster)

**Files:** `script/ai/providers/openrouter.js` (new), `script/ai/config.js`, `script/ai/graphs/blog-graph.js`

---

## SP-03 · 🔴 · Reduce Retry Attempts (Save 30-120s)

**Problem:**
`maxCaseAttempts = 3` in `blog-graph.js` line 82. If a real-world case scores < 6, the entire AI call for case-finding repeats. Worst case: 3 failed attempts × 40s = 120s wasted before generating the blog.

**Fix:**

### A. Reduce `maxCaseAttempts` from 3 to 1
```js
maxCaseAttempts: Annotation({ reducer: (_, b) => b, default: () => 1 }),
```

### B. Lower `MIN_SCORE` from 6 to 4
A "good enough" case is better than no case. The quality gates will catch truly bad content.
```js
const MIN_CASE_SCORE = 4; // was 6
```

### C. Add timeout to case-finding node
If `find_real_world_case` takes > 30s, skip it and use the question's own context.

**Expected:** 0-120s → 0-40s

**Files:** `script/ai/graphs/blog-graph.js`

---

## SP-04 · 🟠 · Combine AI Calls (Save 10-30s)

**Problem:**
Two separate AI calls: one to find a real-world case, one to generate the blog. The case-finding call is essentially research that could be done as part of the generation prompt.

**Fix:**

### Option A: Single-call generation
Add real-world case research as a section within the `generate_blog` prompt. The AI finds the case AND writes the blog in one call:
```
You are writing a blog post about {question}. 

Step 1: Find a relevant real-world case from companies like {companies}. 
Search for recent incidents, outages, or engineering decisions related to {tags}.

Step 2: Write the blog post incorporating that case...
```

### Option B: Parallel case + blog
If `find_real_world_case` fails or times out, `generate_blog` still runs with a fallback case.

**Expected:** Saves one AI round-trip (15-30s)

**Files:** `script/ai/graphs/blog-graph.js`, `script/ai/prompts/`

---

## SP-05 · 🟠 · Incremental HTML Regeneration (Save 2-8s)

**Problem:**
After saving a new post, `generate-blog.js` regenerates ALL static HTML files — index, category pages, every article page — even though only one post changed.

**Fix:**
- Only regenerate the new article page + index.html
- Use a dirty-flag system: track which pages need regeneration
- Or skip static HTML generation entirely (the React SPA serves blog content via API now)

**Expected:** 5-10s → 1-2s

**Files:** `script/generate-blog.js`

---

## SP-06 · 🟡 · Parallelize Independent Pipeline Steps (Save 3-5s)

**Problem:**
The LangGraph pipeline runs `find_real_world_case` → `generate_blog` sequentially. Some prep work could overlap.

**Fix:**
- Run vector DB search for related questions in parallel with `find_real_world_case`
- Generate pixel illustrations in parallel with `Promise.all()`
- Run DB existence checks in parallel at startup

**Expected:** 3-5s saved

**Files:** `script/ai/graphs/blog-graph.js`

---

## SP-07 · 🟡 · Connection Pooling for DB (Save 1-2s)

**Problem:**
If the pg-client doesn't use connection pooling, each query has connection setup overhead.

**Fix:**
- Ensure the pg-client reuses connections
- Add `keepAlive` and connection pooling config

**Expected:** <1s per post (cumulative benefit across many posts)

**Files:** `script/db/pg-client.js`

---

## SP-08 · 🟢 · Cache Source Validation Results (Save 2-5s per post)

**Problem:**
The same source URLs get validated repeatedly across multiple blog posts (e.g., popular documentation pages, AWS blog posts).

**Fix:**
- Add a simple in-memory or file-based cache for URL validation results
- Cache with 24h TTL
- Key: URL, Value: `{ valid: bool, status: int, timestamp }`

**Expected:** 2-5s saved on subsequent posts

**Files:** `script/generate-blog.js`

---

## SP-09 · 🟢 · Preload Next Question During Generation (Save 0-2s)

**Problem:**
`getNextQuestionForBlog()` runs after the current post is fully saved. It could run in parallel with the final steps of the current post.

**Fix:**
- Fetch the next candidate question in the background while saving the current post
- Overlap DB query with file I/O

**Expected:** Marginal but free

**Files:** `script/generate-blog.js`

---

## Implementation Order

| Priority | Steps | Time Saved | Effort |
|----------|-------|-----------|--------|
| 1 | SP-01 (parallel URL validation) | 60-140s | Low |
| 2 | SP-03 (reduce retries) | 30-120s | Low |
| 3 | SP-02 (direct API provider) | 60-120s | Medium |
| 4 | SP-04 (combine AI calls) | 10-30s | Medium |
| 5 | SP-05 (incremental HTML) | 2-8s | Low |
| 6 | SP-06 (parallelize steps) | 3-5s | Low |
| 7 | SP-07 (connection pooling) | 1-2s | Low |
| 8 | SP-08 (URL cache) | 2-5s | Low |
| 9 | SP-09 (preload question) | 0-2s | Low |

**Total expected speedup:**
- Current: ~180-300s per post
- After steps 1-3: ~30-60s per post (3-6x)
- After all steps: ~15-25s per post (8-12x)

---

## Quick Wins (implement first, highest ROI)

1. **Parallelize URL validation** — 1 line change to `Promise.allSettled`, saves 60-140s
2. **Remove duplicate validation** — delete 10 lines in main(), saves 40-80s
3. **Reduce maxCaseAttempts to 1** — 1 line change, saves up to 120s
4. **Lower MIN_SCORE to 4** — 1 line change, avoids unnecessary retries

These 4 changes alone could achieve 3-5x speedup with < 30 minutes of work.

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| OpenRouter API rate limits | Medium | Add retry with backoff, use fallback model |
| Lower case quality with 1 attempt | Low | Quality gates still enforce standards |
| Parallel URL validation overloads network | Low | Cap concurrency with `p-limit` or similar |
| Breaking existing blog generation flow | Medium | Add `BLOG_FAST_MODE=true` env flag, keep old path |

---

## Success Metrics

- [ ] Single post generation < 30s (from ~240s)
- [ ] URL validation batch < 10s (from ~80s)
- [ ] AI calls complete in < 30s (from ~150s)
- [ ] Zero duplicate URL validation calls
- [ ] Max 1 case-finding attempt per post
- [ ] No regressions in blog quality score
