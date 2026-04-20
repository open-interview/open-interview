# Blog Generation Quick Start

## 🚀 Generate Your First Blog Post

```bash
# Single post
node script/generate-blog-incremental.js

# Batch of 5 posts
./script/generate-blog-batch.sh 5 30
```

## ✨ What You Get

Each blog post includes:
- **Elite content** (1200-3000 words, 8-12 min read)
- **8-12 validated sources** from real companies
- **Mermaid diagrams** for architecture
- **Production code examples**
- **SEO optimization** (meta, keywords, social snippets)
- **Real-world case studies**

## 🤖 5-Agent Pipeline

1. **Research Agent** → Finds sources & real-world examples
2. **Structure Agent** → Creates narrative flow
3. **Content Agent** → Writes engaging content
4. **Polish Agent** → Enhances readability
5. **SEO Agent** → Optimizes for search

## 💰 Cost

**$0** - Uses OpenCode free models:
- `opencode/gpt-5-nano` (research, structure, SEO)
- `opencode/big-pickle` (content, polish)

No API keys required!

## 📊 Track Progress

```bash
# View stats
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM blog_posts GROUP BY status;"

# Check logs
tail -f logs/blog-generation/$(date +%Y-%m-%d).jsonl
```

## 📁 Output

Posts saved to: `content/posts/*.mdx`

Example: `content/posts/sy-144--mastering-distributed-rate-limiting.mdx`

## 🔧 Configuration

Edit `script/ai/blog-pipeline-config.js` to adjust:
- Quality gates (min sources, word count, etc.)
- Agent prompts
- Models

## 📖 Full Documentation

See [BLOG_GENERATION_SYSTEM.md](./BLOG_GENERATION_SYSTEM.md) for complete details.
