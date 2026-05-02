const DATA_URL = "/data/blog-posts.json";

let _cache: any[] | null = null;

async function loadPosts(): Promise<any[]> {
  if (!_cache) {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`Failed to fetch ${DATA_URL}: ${res.status}`);
    _cache = await res.json();
  }
  return _cache;
}

function mapPost(post: any): Record<string, unknown> {
  return {
    slug: post.blogSlug,
    title: post.blogTitle,
    excerpt: post.blogIntro?.substring(0, 200) || "",
    content: post.blogSections?.map((s: any) => `## ${s.heading}\n\n${s.content}`).join("\n\n") || "",
    coverImage: post.images?.[0] || undefined,
    category: post.channel || "Uncategorized",
    tags: post.tags || [],
    difficulty: post.difficulty || "beginner",
    author: "Open Interview",
    publishedAt: post.createdAt || new Date().toISOString(),
    readingTimeMinutes: Math.max(1, Math.round((post.blogIntro?.length || 0 + (post.blogSections?.reduce((acc: number, s: any) => acc + (s.content?.length || 0), 0) || 0)) / 1000)),
  };
}

export async function getFeaturedPosts(limit = 3): Promise<Record<string, unknown>[]> {
  const posts = await loadPosts();
  return posts.slice(0, limit).map(mapPost);
}

export async function getPosts({
  limit = 20,
  page = 1,
  category,
  tag,
}: { limit?: number; page?: number; category?: string; tag?: string } = {}): Promise<{ data: Record<string, unknown>[]; meta: { total: number } }> {
  const posts = await loadPosts();
  let filtered = posts;
  if (category) {
    filtered = filtered.filter((p) => p.channel?.toLowerCase() === category.toLowerCase());
  }
  if (tag) {
    filtered = filtered.filter((p) => p.tags?.some((t: string) => t.toLowerCase() === tag.toLowerCase()));
  }
  const total = filtered.length;
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + limit);
  return { data: paged.map(mapPost), meta: { total } };
}

export async function getCategories(): Promise<{ id: string; name: string; slug: string }[]> {
  const posts = await loadPosts();
  const map = new Map<string, { id: string; name: string; slug: string }>();
  for (const post of posts) {
    const slug = (post.channel || "uncategorized").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!map.has(slug)) {
      map.set(slug, { id: slug, name: post.channel.charAt(0).toUpperCase() + post.channel.slice(1), slug });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getTags(): Promise<{ id: string; name: string; slug: string }[]> {
  const posts = await loadPosts();
  const map = new Map<string, { id: string; name: string; slug: string }>();
  for (const post of posts) {
    for (const tag of post.tags || []) {
      const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (!map.has(slug)) {
        map.set(slug, { id: slug, name: tag, slug });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export async function searchPosts(query: string): Promise<Record<string, unknown>[]> {
  const posts = await loadPosts();
  const q = query.toLowerCase();
  const results = posts.filter(
    (p) =>
      p.blogTitle?.toLowerCase().includes(q) ||
      p.blogIntro?.toLowerCase().includes(q) ||
      p.tags?.some((t: string) => t.toLowerCase().includes(q)) ||
      p.channel?.toLowerCase().includes(q) ||
      p.blogSections?.some((s: any) => s.heading?.toLowerCase().includes(q) || s.content?.toLowerCase().includes(q))
  );
  return results.slice(0, 20).map(mapPost);
}

export async function getPostWithContext(slug: string): Promise<{ data: Record<string, unknown>; related: Record<string, unknown>[]; prev: Record<string, unknown> | null; next: Record<string, unknown> | null } | null> {
  const posts = await loadPosts();
  const idx = posts.findIndex((p) => p.blogSlug === slug);
  if (idx === -1) return null;

  const post = posts[idx];
  const data = mapPost(post);

  const related = posts
    .filter((p, i) => i !== idx && (p.channel === post.channel || p.tags?.some((t: string) => post.tags?.includes(t))))
    .slice(0, 3)
    .map(mapPost);

  const prev = idx > 0 ? mapPost(posts[idx - 1]) : null;
  const next = idx < posts.length - 1 ? mapPost(posts[idx + 1]) : null;

  return { data: data as Record<string, unknown>, related, prev, next };
}
