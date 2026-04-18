import fs from "fs";
import path from "path";

const POSTS_DIR = path.join(process.cwd(), "content/posts");
const OUTPUT_FILE = path.join(process.cwd(), "client/public/data/posts.json");

interface PostFrontmatter {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  featured?: boolean;
}

function parseFrontmatter(raw: string): { data: PostFrontmatter; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Invalid frontmatter");
  const yamlStr = match[1];
  const content = match[2].trim();

  const data: Record<string, unknown> = {};
  for (const line of yamlStr.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();

    // Parse arrays like [a, b, c]
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim());
    }
    // Parse booleans
    if (value === "true") value = true;
    if (value === "false") value = false;
    // Parse numbers
    if (typeof value === "string" && !isNaN(Number(value)) && value !== "") {
      value = Number(value);
    }
    data[key] = value;
  }

  return { data: data as PostFrontmatter, content };
}

function buildContent() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error(`Posts directory not found: ${POSTS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx"));
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf-8");
    const { data, content } = parseFrontmatter(raw);
    return { ...data, content, id: data.slug };
  });

  // Sort by publishedAt descending
  posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const categoryMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const post of posts) {
    const slug = post.category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!categoryMap.has(slug)) {
      categoryMap.set(slug, { id: slug, name: post.category, slug });
    }
  }
  const categories = Array.from(categoryMap.values());
  const tags = [...new Set(posts.flatMap((p) => p.tags || []))];

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ posts, categories, tags }, null, 2));
  console.log(
    `Built ${posts.length} posts, ${categories.length} categories, ${tags.length} tags → ${OUTPUT_FILE}`
  );
}

buildContent();
