/**
 * Generates comprehensive blog sitemap with all posts, categories, and pages.
 * Reads from blog-output directory which contains all 147+ published posts.
 * Run after generate-blog.js or deploy-pages.ts.
 */
import fs from "fs";
import path from "path";

const BASE_URL = "https://open-interview.github.io";
const BLOG_OUTPUT = path.join(process.cwd(), "blog-output");
const SITEMAP_FILE = path.join(process.cwd(), "client/public/sitemap.xml");
const BLOG_SITEMAP_FILE = path.join(BLOG_OUTPUT, "sitemap.xml");

const POSTS_DIR = path.join(BLOG_OUTPUT, "posts");
const CATEGORIES_DIR = path.join(BLOG_OUTPUT, "categories");

// Priority mapping by content type
const PRIORITY = {
  homepage: "1.0",
  blogIndex: "0.9",
  categoryIndex: "0.85",
  categoryPage: "0.8",
  post: "0.8",
  search: "0.5",
} as const;

// Change frequency by content type
const CHANGEFREQ = {
  homepage: "daily",
  blogIndex: "daily",
  categoryIndex: "weekly",
  categoryPage: "weekly",
  post: "monthly",
  search: "weekly",
} as const;

interface PostMetadata {
  slug: string;
  id: string;
  title: string;
  createdAt: string;
  channel: string;
  difficulty: string;
}

interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
}

function extractPostMetadata(dirPath: string, id: string): PostMetadata | null {
  try {
    const indexPath = path.join(dirPath, "index.html");
    if (!fs.existsSync(indexPath)) return null;

    const html = fs.readFileSync(indexPath, "utf-8");

    // Extract title from <title> tag
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].replace(" - DevInsights", "") : "";

    // Extract date from meta or article content
    const dateMatch = html.match(/"datePublished":"([^"]+)"/) ||
      html.match(/"dateCreated":"([^"]+)"/);
    const createdAt = dateMatch ? dateMatch[1] : "";

    // Extract channel from content or meta
    const channelMatch = html.match(/"articleSection":"([^"]+)"/);
    const channel = channelMatch ? channelMatch[1] : "";

    // Extract difficulty
    const diffMatch = html.match(/"difficulty":"([^"]+)"/);
    const difficulty = diffMatch ? diffMatch[1] : "";

    return {
      slug: path.basename(dirPath),
      id,
      title,
      createdAt,
      channel,
      difficulty,
    };
  } catch {
    return null;
  }
}

function extractCategoryInfo(dirPath: string, name: string): CategoryInfo | null {
  try {
    const indexPath = path.join(dirPath, "index.html");
    if (!fs.existsSync(indexPath)) return null;

    const html = fs.readFileSync(indexPath, "utf-8");
    const countMatch = html.match(/(\d+)\s+(?:articles|deep dives|posts)/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;

    return {
      name,
      slug: path.basename(dirPath),
      count,
    };
  } catch {
    return null;
  }
}

function generateBlogSitemap() {
  const urls: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  // Blog index page
  urls.push(
    `  <url>` +
    `\n    <loc>${BASE_URL}/</loc>` +
    `\n    <lastmod>${today}</lastmod>` +
    `\n    <changefreq>${CHANGEFREQ.blogIndex}</changefreq>` +
    `\n    <priority>${PRIORITY.blogIndex}</priority>` +
    `\n  </url>`
  );

  // Categories index page
  if (fs.existsSync(CATEGORIES_DIR)) {
    const catIndexPath = path.join(CATEGORIES_DIR, "index.html");
    if (fs.existsSync(catIndexPath)) {
      const stat = fs.statSync(catIndexPath);
      const lastmod = new Date(stat.mtime).toISOString().split("T")[0];
      urls.push(
        `  <url>` +
        `\n    <loc>${BASE_URL}/categories/</loc>` +
        `\n    <lastmod>${lastmod}</lastmod>` +
        `\n    <changefreq>${CHANGEFREQ.categoryIndex}</changefreq>` +
        `\n    <priority>${PRIORITY.categoryIndex}</priority>` +
        `\n  </url>`
      );
    }

    // Category pages
    const categoryDirs = fs.readdirSync(CATEGORIES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => {
        const catPath = path.join(CATEGORIES_DIR, d.name);
        return extractCategoryInfo(catPath, d.name);
      })
      .filter(Boolean) as CategoryInfo[];

    for (const cat of categoryDirs) {
      if (cat.count > 0) {
        const catDirPath = path.join(CATEGORIES_DIR, cat.slug);
        const indexPath = path.join(catDirPath, "index.html");
        const lastmod = fs.existsSync(indexPath)
          ? new Date(fs.statSync(indexPath).mtime).toISOString().split("T")[0]
          : today;

        urls.push(
          `  <url>` +
          `\n    <loc>${BASE_URL}/categories/${cat.slug}/</loc>` +
          `\n    <lastmod>${lastmod}</lastmod>` +
          `\n    <changefreq>${CHANGEFREQ.categoryPage}</changefreq>` +
          `\n    <priority>${PRIORITY.categoryPage}</priority>` +
          `\n  </url>`
        );
      }
    }
  }

  // All blog post pages
  if (fs.existsSync(POSTS_DIR)) {
    const postDirs = fs.readdirSync(POSTS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory());

    let postCount = 0;
    for (const postDir of postDirs) {
      const id = postDir.name;
      const postPath = path.join(POSTS_DIR, id);

      // Each post has a subdirectory named by its slug
      const slugDirs = fs.readdirSync(postPath, { withFileTypes: true })
        .filter(d => d.isDirectory());

      for (const slugDir of slugDirs) {
        const slugPath = path.join(postPath, slugDir.name);
        const meta = extractPostMetadata(slugPath, id);
        const lastmod = meta?.createdAt
          ? new Date(meta.createdAt).toISOString().split("T")[0]
          : today;

        urls.push(
          `  <url>` +
          `\n    <loc>${BASE_URL}/posts/${id}/${slugDir.name}/</loc>` +
          `\n    <lastmod>${lastmod}</lastmod>` +
          `\n    <changefreq>${CHANGEFREQ.post}</changefreq>` +
          `\n    <priority>${PRIORITY.post}</priority>` +
          `\n  </url>`
        );
        postCount++;
      }
    }

    console.log(`  📝 Found ${postCount} blog posts`);
  }

  // Generate blog-only sitemap for blog-output
  const blogSitemapXml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>`;

  fs.writeFileSync(BLOG_SITEMAP_FILE, blogSitemapXml);
  console.log(`✅ Blog sitemap written to ${BLOG_SITEMAP_FILE}`);
  console.log(`   Total URLs: ${urls.length}`);

  // Also update client/public/sitemap.xml if it exists
  if (fs.existsSync(SITEMAP_FILE)) {
    let sitemap = fs.readFileSync(SITEMAP_FILE, "utf-8");

    // Check if blog URLs are already present
    const existingBlogUrls = (sitemap.match(/\/posts\//g) || []).length;
    const newBlogUrls = (blogSitemapXml.match(/\/posts\//g) || []).length;

    if (existingBlogUrls < newBlogUrls) {
      // Remove existing blog URLs and add updated ones
      const urlsetEnd = sitemap.lastIndexOf("</urlset>");
      if (urlsetEnd > -1) {
        // Strip out old blog post entries
        sitemap = sitemap.replace(
          /  <url>[\s\S]*?\/posts\/[^<]*?<\/url>\n?/g,
          ""
        );
        // Also strip old blog index/search entries
        sitemap = sitemap.replace(
          /  <url>[\s\S]*?\/blog[^<]*?<\/url>\n?/g,
          ""
        );
        // Insert new blog URLs before closing tag
        const insertPoint = sitemap.lastIndexOf("</urlset>");
        sitemap =
          sitemap.slice(0, insertPoint) +
          urls.join("\n") +
          "\n" +
          sitemap.slice(insertPoint);
        fs.writeFileSync(SITEMAP_FILE, sitemap);
        console.log(`✅ Updated ${SITEMAP_FILE} with ${urls.length} blog URLs`);
      }
    } else {
      console.log("  ℹ️  Client sitemap already up to date");
    }
  }
}

generateBlogSitemap();
