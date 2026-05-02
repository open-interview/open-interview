import { db } from "./db";
import { blogPosts, blogCategories } from "@shared/schema";
import { eq, like, and, or, desc, asc, isNull, inArray } from "drizzle-orm";

function loadBlogDataSafe(): import("./blog-storage").BlogPost[] {
  try {
    if (typeof require === "undefined") return [];
    const fs = require("fs");
    const path = require("path");
    const dataPath = path.join(process.cwd(), "client/public/data/posts.json");
    if (!fs.existsSync(dataPath)) return [];
    const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
    return data.posts || [];
  } catch {
    return [];
  }
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  author: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readingTimeMinutes: number;
  featured?: boolean;
  status?: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface GetPostsOptions {
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

function safeParseJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapRow(row: typeof blogPosts.$inferSelect): BlogPost {
  const sections = safeParseJson<Array<{ heading?: string; body?: string }>>(
    row.sections,
    []
  );
  const tags = safeParseJson<string[]>(row.tags, []);
  const sources = safeParseJson<unknown[]>(row.sources, []);
  const images = safeParseJson<unknown[]>(row.images, []);

  const contentParts: string[] = [];
  if (row.introduction) contentParts.push(row.introduction);
  for (const s of sections) {
    const heading = s.heading ? `## ${s.heading}\n\n` : "";
    contentParts.push(`${heading}${s.body ?? ""}`);
  }
  if (row.conclusion) contentParts.push(row.conclusion);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.summary ?? row.introduction ?? "",
    content: contentParts.join("\n\n"),
    coverImage: row.imageUrl ?? undefined,
    author: "TechExpert AI",
    category: row.channel ?? "General",
    tags,
    publishedAt: row.publishedAt ?? row.createdAt,
    readingTimeMinutes: Math.max(
      1,
      Math.ceil((row.summary?.length ?? 0 + (row.introduction?.length ?? 0)) / 1000)
    ),
    featured: false,
    status: row.status ?? "published",
  };
}

function mapCategoryRow(
  row: typeof blogCategories.$inferSelect
): BlogCategory {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
  };
}

const STATIC_BUILD = process.env.STATIC_BUILD === "true";

function loadStaticData() {
  const posts = loadBlogDataSafe();
  
  const categoryMap = new Map<string, BlogCategory>();
  const tagSet = new Set<string>();
  
  for (const post of posts) {
    const cat = post.category || "General";
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, {
        id: cat.toLowerCase(),
        name: cat,
        slug: cat.toLowerCase(),
        description: undefined,
      });
    }
    for (const tag of post.tags || []) {
      tagSet.add(tag);
    }
  }
  
  return {
    posts,
    categories: Array.from(categoryMap.values()),
    tags: Array.from(tagSet).sort(),
  };
}

async function queryAllPosts(): Promise<BlogPost[]> {
  if (STATIC_BUILD) return loadStaticData().posts;
  const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
  return rows.map(mapRow);
}

async function tryPostgres<T>(pgFn: () => Promise<T>, fallbackFn: () => Promise<T>): Promise<T> {
  try {
    return await pgFn();
  } catch (error) {
    console.warn('[BlogStorage] PostgreSQL unavailable, falling back to local storage:', error);
    return await fallbackFn();
  }
}

export const blogStorage = {
  async getAllPosts(options: GetPostsOptions = {}): Promise<BlogPost[]> {
    if (STATIC_BUILD) {
      let { posts } = loadStaticData();
      posts = posts.filter((p) => p.status === "published" || !p.status);
      if (options.category)
        posts = posts.filter(
          (p) => p.category.toLowerCase() === options.category!.toLowerCase()
        );
      if (options.tag)
        posts = posts.filter((p) => p.tags?.includes(options.tag!));
      const offset = options.offset ?? 0;
      const limit = options.limit ?? posts.length;
      return posts.slice(offset, offset + limit);
    }

    return tryPostgres(
      async () => {
        let rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.publishedAt));
        let posts = rows.map(mapRow);
        posts = posts.filter((p) => p.status === "published" || !p.status);

        if (options.category) {
          posts = posts.filter(
            (p) => p.category.toLowerCase() === options.category!.toLowerCase()
          );
        }
        if (options.tag) {
          posts = posts.filter((p) => p.tags?.includes(options.tag!));
        }

        const offset = options.offset ?? 0;
        const limit = options.limit ?? posts.length;
        return posts.slice(offset, offset + limit);
      },
      async () => {
        const { posts } = loadStaticData();
        let filtered = posts.filter((p) => p.status === "published" || !p.status);
        if (options.category)
          filtered = filtered.filter(
            (p) => p.category.toLowerCase() === options.category!.toLowerCase()
          );
        if (options.tag)
          filtered = filtered.filter((p) => p.tags?.includes(options.tag!));
        const offset = options.offset ?? 0;
        const limit = options.limit ?? filtered.length;
        return filtered.slice(offset, offset + limit);
      }
    );
  },

  async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    if (STATIC_BUILD) {
      return loadStaticData().posts.find((p) => p.slug === slug);
    }
    return tryPostgres(
      async () => {
        const rows = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.slug, slug))
          .limit(1);
        if (rows.length === 0) return undefined;
        return mapRow(rows[0]);
      },
      async () => {
        return loadStaticData().posts.find((p) => p.slug === slug);
      }
    );
  },

  async getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
    if (STATIC_BUILD) {
      return loadStaticData()
        .posts.filter((p) => p.featured && (p.status === "published" || !p.status))
        .slice(0, limit);
    }
    return tryPostgres(
      async () => {
        const rows = await db
          .select()
          .from(blogPosts)
          .orderBy(desc(blogPosts.publishedAt))
          .limit(limit);
        return rows.map(mapRow);
      },
      async () => {
        return loadStaticData()
          .posts.filter((p) => p.featured && (p.status === "published" || !p.status))
          .slice(0, limit);
      }
    );
  },

  async getAllCategories(): Promise<BlogCategory[]> {
    if (STATIC_BUILD) {
      return loadStaticData().categories;
    }
    return tryPostgres(
      async () => {
        const rows = await db
          .select()
          .from(blogCategories)
          .orderBy(asc(blogCategories.name));
        return rows.map(mapCategoryRow);
      },
      async () => loadStaticData().categories
    );
  },

  async getAllTags(): Promise<string[]> {
    if (STATIC_BUILD) {
      return loadStaticData().tags;
    }
    return tryPostgres(
      async () => {
        const rows = await db.select({ tags: blogPosts.tags }).from(blogPosts);
        const tagSet = new Set<string>();
        for (const row of rows) {
          const tags = safeParseJson<string[]>(row.tags, []);
          for (const t of tags) tagSet.add(t);
        }
        return Array.from(tagSet).sort();
      },
      async () => loadStaticData().tags
    );
  },

  async searchPosts(query: string): Promise<BlogPost[]> {
    if (STATIC_BUILD) {
      const q = query.toLowerCase();
      return loadStaticData().posts.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    return tryPostgres(
      async () => {
        const pattern = `%${query}%`;
        const rows = await db
          .select()
          .from(blogPosts)
          .where(
            or(
              like(blogPosts.title, pattern),
              like(blogPosts.introduction, pattern)
            ) as any
          )
          .orderBy(desc(blogPosts.publishedAt));
        return rows.map(mapRow);
      },
      async () => {
        const q = query.toLowerCase();
        return loadStaticData().posts.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.excerpt.toLowerCase().includes(q) ||
            p.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
    );
  },

  async getRelatedPosts(postId: string, limit = 3): Promise<BlogPost[]> {
    if (STATIC_BUILD) {
      const { posts } = loadStaticData();
      const post = posts.find((p) => p.id === postId);
      if (!post) return [];
      return posts
        .filter(
          (p) =>
            p.id !== postId &&
            (p.category === post.category ||
              p.tags?.some((t) => post.tags?.includes(t)))
        )
        .slice(0, limit);
    }

    return tryPostgres(
      async () => {
        const currentRows = await db
          .select()
          .from(blogPosts)
          .where(eq(blogPosts.id, postId))
          .limit(1);
        if (currentRows.length === 0) return [];

        const current = currentRows[0];
        const currentTags = safeParseJson<string[]>(current.tags, []);
        const currentChannel = current.channel;

        const rows = await db
          .select()
          .from(blogPosts)
          .orderBy(desc(blogPosts.publishedAt));

        return rows
          .map(mapRow)
          .filter(
            (p) =>
              p.id !== postId &&
              (p.category === (currentChannel ?? "General") ||
                p.tags?.some((t) => currentTags.includes(t)))
          )
          .slice(0, limit);
      },
      () => localBlogStorage.getRelatedPosts(postId, limit)
    );
  },

  async getPrevNextPosts(postId: string): Promise<{ prev?: BlogPost; next?: BlogPost }> {
    const allPosts = await queryAllPosts();
    const index = allPosts.findIndex((p) => p.id === postId);
    if (index === -1) return {};
    
    return {
      prev: index > 0 ? allPosts[index - 1] : undefined,
      next: index < allPosts.length - 1 ? allPosts[index + 1] : undefined,
    };
  },

  async getAdminPosts(): Promise<BlogPost[]> {
    if (STATIC_BUILD) {
      return loadStaticData().posts;
    }
    const rows = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt));
    return rows.map(mapRow);
  },

  async updateLinkedInInfo(id: string, linkedinPostId: string | null, sharedAt: string): Promise<void> {
    if (STATIC_BUILD) return;
    await db
      .update(blogPosts)
      .set({
        linkedinPostId: linkedinPostId || null,
        linkedinSharedAt: sharedAt,
        lastUpdated: new Date().toISOString(),
      })
      .where(eq(blogPosts.id, id));
  },
};
