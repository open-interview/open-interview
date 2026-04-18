import fs from "fs";
import path from "path";

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
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface PostsData {
  posts: BlogPost[];
  categories: BlogCategory[];
  tags: string[];
}

function loadData(): PostsData {
  const dataPath = path.join(process.cwd(), "client/public/data/posts.json");
  if (!fs.existsSync(dataPath)) return { posts: [], categories: [], tags: [] };
  return JSON.parse(fs.readFileSync(dataPath, "utf-8"));
}

export interface GetPostsOptions {
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}

export const blogStorage = {
  getAllPosts(options: GetPostsOptions = {}): BlogPost[] {
    let { posts } = loadData();
    if (options.category)
      posts = posts.filter(
        (p) => p.category.toLowerCase() === options.category!.toLowerCase()
      );
    if (options.tag) posts = posts.filter((p) => p.tags?.includes(options.tag!));
    const offset = options.offset ?? 0;
    const limit = options.limit ?? posts.length;
    return posts.slice(offset, offset + limit);
  },

  getPostBySlug(slug: string): BlogPost | undefined {
    return loadData().posts.find((p) => p.slug === slug);
  },

  getFeaturedPosts(limit = 3): BlogPost[] {
    return loadData()
      .posts.filter((p) => p.featured)
      .slice(0, limit);
  },

  getAllCategories(): BlogCategory[] {
    return loadData().categories;
  },

  getAllTags(): string[] {
    return loadData().tags;
  },

  searchPosts(query: string): BlogPost[] {
    const q = query.toLowerCase();
    return loadData().posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  },

  getRelatedPosts(postId: string, limit = 3): BlogPost[] {
    const { posts } = loadData();
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
  },
};
