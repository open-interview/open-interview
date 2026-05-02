import type { BlogPost, BlogCategory, GetPostsOptions } from './blog-storage';
import * as fs from 'fs';
import * as path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'blog-posts.json');

let cachedPosts: BlogPost[] = [];
let cachedCategories: BlogCategory[] = [];
let cachedTags: string[] = [];

interface RawImage {
  url?: string;
  alt?: string;
  caption?: string;
  placement?: string;
}

function buildContent(entry: Record<string, unknown>): string {
  const blogIntro   = (entry.blogIntro   as string) || '';
  const blogSections = (entry.blogSections as Array<{ heading?: string; content?: string }>) || [];
  const blogConclusion = (entry.blogConclusion as string) || '';
  const diagram     = (entry.diagram     as string) || '';
  const images      = (entry.images      as RawImage[]) || [];

  const contentParts: string[] = [];

  // 1. Intro
  if (blogIntro) contentParts.push(blogIntro);

  // 2. After-intro images
  const afterIntroImgs = images.filter((img) => img.placement === 'after-intro' && img.url);
  for (const img of afterIntroImgs) {
    const alt = img.alt || img.caption || '';
    contentParts.push(`![${alt}](${img.url})`);
    if (img.caption) contentParts.push(`*${img.caption}*`);
  }

  // 3. Sections
  for (const section of blogSections) {
    const heading = section.heading ? `## ${section.heading}\n\n` : '';
    const sectionContent = section.content || '';
    contentParts.push(`${heading}${sectionContent}`);
  }

  // 4. Architecture diagram (Mermaid)
  if (diagram && diagram.trim().length > 10) {
    contentParts.push(`## Architecture Diagram\n\n\`\`\`mermaid\n${diagram.trim()}\n\`\`\``);
  }

  // 5. Conclusion
  if (blogConclusion && blogConclusion.trim().length > 10) {
    contentParts.push(`## Conclusion\n\n${blogConclusion.trim()}`);
  }

  return contentParts.join('\n\n');
}

function loadLocalData() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      console.warn(`Local blog data not found at ${DATA_PATH}`);
      return;
    }

    const rawData = fs.readFileSync(DATA_PATH, 'utf-8');
    const jsonEntries = JSON.parse(rawData) as Array<Record<string, unknown>>;

    cachedPosts = jsonEntries.map((entry) => {
      const id = (entry.id as string) || '';
      const blogTitle = (entry.blogTitle as string) || '';
      const blogSlug = (entry.blogSlug as string) || '';
      const blogIntro = (entry.blogIntro as string) || '';
      const channel = (entry.channel as string) || 'General';
      const tagsRaw = entry.tags as string[] | string | undefined;
      const difficulty = (entry.difficulty as string) || undefined;

      // Parse tags (handle JSON string or array)
      let tags: string[] = [];
      if (Array.isArray(tagsRaw)) {
        tags = tagsRaw;
      } else if (typeof tagsRaw === 'string') {
        try {
          tags = JSON.parse(tagsRaw) as string[];
        } catch {
          tags = [];
        }
      }

      // Build full content: intro + images + sections + diagram + conclusion
      const content = buildContent(entry);

      // PublishedAt from blog ID timestamp (format: blog-<timestamp>-<random>)
      let publishedAt = '';
      const idMatch = id.match(/^blog-(\d+)-/);
      if (idMatch) {
        const timestamp = parseInt(idMatch[1], 10);
        if (!isNaN(timestamp)) {
          publishedAt = new Date(timestamp).toISOString();
        }
      }
      if (!publishedAt) {
        const createdAt = entry.createdAt as string | undefined;
        publishedAt = createdAt || new Date().toISOString();
      }

      // Reading time: ~200 words/min, ~5 chars/word
      const readingTimeMinutes = Math.max(1, Math.ceil(content.length / 1000));

      return {
        id,
        slug: blogSlug,
        title: blogTitle,
        excerpt: blogIntro ? blogIntro.slice(0, 250) : '',
        content,
        coverImage: undefined,
        author: 'TechExpert AI',
        category: channel,
        tags,
        publishedAt,
        readingTimeMinutes,
        featured: false,
        status: 'published',
        difficulty: difficulty as BlogPost['difficulty'],
      } as BlogPost;
    });

    // Sort by publishedAt descending (newest first)
    cachedPosts.sort((a, b) => {
      const aTime = new Date(a.publishedAt).getTime();
      const bTime = new Date(b.publishedAt).getTime();
      return bTime - aTime;
    });

    // Generate categories from unique channels
    const categoryMap = new Map<string, BlogCategory>();
    for (const post of cachedPosts) {
      const channel = post.category;
      if (!categoryMap.has(channel)) {
        const name = channel.charAt(0).toUpperCase() + channel.slice(1);
        categoryMap.set(channel, {
          id: channel,
          name,
          slug: channel,
        });
      }
    }
    cachedCategories = Array.from(categoryMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    // Generate unique tags
    const tagSet = new Set<string>();
    for (const post of cachedPosts) {
      for (const tag of post.tags) {
        tagSet.add(tag);
      }
    }
    cachedTags = Array.from(tagSet).sort();

    console.log(`Loaded ${cachedPosts.length} local blog posts`);
  } catch (error) {
    console.error('Failed to load local blog data:', error);
    cachedPosts = [];
    cachedCategories = [];
    cachedTags = [];
  }
}

loadLocalData();

export const localBlogStorage = {
  async getAllPosts(options: GetPostsOptions = {}): Promise<BlogPost[]> {
    let posts = [...cachedPosts];
    posts = posts.filter((p) => p.status === 'published' || !p.status);

    if (options.category) {
      const catLower = options.category.toLowerCase();
      posts = posts.filter((p) => p.category.toLowerCase() === catLower);
    }
    if (options.tag) {
      const tagLower = options.tag.toLowerCase();
      posts = posts.filter((p) => p.tags.some((t) => t.toLowerCase() === tagLower));
    }

    const offset = options.offset ?? 0;
    const limit = options.limit ?? posts.length;
    return posts.slice(offset, offset + limit);
  },

  async getPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return cachedPosts.find((p) => p.slug === slug);
  },

  async getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
    return cachedPosts
      .filter((p) => p.featured && (p.status === 'published' || !p.status))
      .slice(0, limit);
  },

  async getAllCategories(): Promise<BlogCategory[]> {
    return cachedCategories;
  },

  async getAllTags(): Promise<string[]> {
    return cachedTags;
  },

  async searchPosts(query: string): Promise<BlogPost[]> {
    const q = query.toLowerCase();
    return cachedPosts.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.tags.some((t) => t.toLowerCase().includes(q))
    );
  },

  async getRelatedPosts(postId: string, limit = 3): Promise<BlogPost[]> {
    const post = cachedPosts.find((p) => p.id === postId);
    if (!post) return [];
    return cachedPosts
      .filter((p) =>
        p.id !== postId &&
        (p.category === post.category || p.tags.some((t) => post.tags.includes(t)))
      )
      .slice(0, limit);
  },

  async getPrevNextPosts(postId: string): Promise<{ prev: BlogPost | null; next: BlogPost | null }> {
    const index = cachedPosts.findIndex((p) => p.id === postId);
    if (index === -1) return { prev: null, next: null };
    return {
      prev: index > 0 ? cachedPosts[index - 1] : null,
      next: index < cachedPosts.length - 1 ? cachedPosts[index + 1] : null,
    };
  },

  async getAdminPosts(): Promise<BlogPost[]> {
    return cachedPosts;
  },

  async updateLinkedInInfo(id: string, _linkedinPostId: string | null, _sharedAt: string): Promise<void> {
    console.log(`LinkedIn info update skipped for local storage: ${id}`);
  },
};

export { localBlogStorage as blogStorage };
