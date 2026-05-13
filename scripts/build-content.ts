import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const OUTPUT_FILE = path.join(process.cwd(), "client/public/data/posts.json");

function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("Invalid frontmatter");
  const yamlStr = match[1];
  const content = match[2].trim();

  const data: Record<string, unknown> = {};
  const lines = yamlStr.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) { i++; continue; }
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Multi-line list (tags:\n  - item) — collect items into array
    if (value === "" && i + 1 < lines.length && lines[i + 1].trimStart().startsWith("-")) {
      i++;
      const items: string[] = [];
      while (i < lines.length && lines[i].trimStart().startsWith("-")) {
        items.push(lines[i].trimStart().slice(1).trim().replace(/^["']|["']$/g, ""));
        i++;
      }
      data[key] = items;
      continue;
    }

    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (typeof value === "string" && !isNaN(Number(value)) && value !== "") value = Number(value);
    else if (typeof value === "string") value = value.replace(/^["']|["']$/g, "");

    data[key] = value;
    i++;
  }

  return { data, content };
}

function normalizePost(data: Record<string, unknown>, content: string, file: string) {
  const slug = (data.slug as string) || path.basename(file, path.extname(file));

  // Normalize publishedAt: accept publishedAt, date, createdAt
  const rawDate = (data.publishedAt || data.date || data.createdAt || "2026-01-01") as string;
  const publishedAt = rawDate.replace(/^"(.*)"$/, "$1");

  // Normalize readingTimeMinutes: accept readingTimeMinutes or readingTime (may be "8 min read")
  const rawRT = data.readingTimeMinutes || data.readingTime;
  const parsedRT = rawRT ? parseInt(String(rawRT), 10) : NaN;
  const readingTimeMinutes = !isNaN(parsedRT) ? parsedRT : Math.max(3, Math.ceil(content.split(/\s+/).length / 200));

  // Normalize excerpt: accept excerpt or description
  const excerpt = ((data.excerpt || data.description || "") as string).slice(0, 300) || slug.replace(/-/g, " ");

  // Normalize category: accept category or channel
  const rawCategory = ((data.category || data.channel || "Engineering") as string).trim();
  const category = rawCategory || "Engineering";

  // Normalize tags
  let tags: string[] = [];
  if (Array.isArray(data.tags)) tags = data.tags as string[];
  else if (typeof data.tags === "string") tags = [data.tags];

  const author = ((data.author || "Open Interview Team") as string).replace(/^["']|["']$/g, "");
  const title = ((data.title || slug) as string).replace(/^["']|["']$/g, "");

  return {
    id: slug,
    slug,
    title,
    excerpt,
    content,
    coverImage: (data.coverImage as string) || undefined,
    author,
    category,
    tags,
    publishedAt,
    readingTimeMinutes,
    featured: Boolean(data.featured),
  };
}

function buildContent() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  const posts: ReturnType<typeof normalizePost>[] = [];
  let errors = 0;

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
      const { data, content } = parseFrontmatter(raw);
      posts.push(normalizePost(data, content, file));
    } catch (e) {
      errors++;
      console.warn(`Skipping ${file}: ${(e as Error).message}`);
    }
  }

  posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const post of posts) {
    const slug = post.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!categoryMap.has(slug)) categoryMap.set(slug, { id: slug, name: post.category, slug });
  }
  const categories = Array.from(categoryMap.values());
  const tags = [...new Set(posts.flatMap((p) => p.tags))];

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ posts, categories, tags }, null, 2));
  console.log(`Built ${posts.length} posts (${errors} skipped), ${categories.length} categories, ${tags.length} tags → ${OUTPUT_FILE}`);
}

buildContent();
