/**
 * Generates blog sitemap entries and appends them to the existing sitemap.xml
 * Run after build-content.ts
 */
import fs from "fs";
import path from "path";

const BASE_URL = "https://open-interview.github.io";
const POSTS_FILE = path.join(process.cwd(), "client/public/data/posts.json");
const SITEMAP_FILE = path.join(process.cwd(), "client/public/sitemap.xml");

function generateBlogSitemap() {
  if (!fs.existsSync(POSTS_FILE)) {
    console.warn("posts.json not found — run build-content first");
    return;
  }

  const { posts, categories } = JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
  const today = new Date().toISOString().split("T")[0];

  const urls: string[] = [];

  // Blog index
  urls.push(`  <url><loc>${BASE_URL}/blog</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>`);

  // Blog search
  urls.push(`  <url><loc>${BASE_URL}/blog/search</loc><lastmod>${today}</lastmod><priority>0.5</priority></url>`);

  // Category pages
  for (const cat of categories) {
    urls.push(`  <url><loc>${BASE_URL}/blog/category/${cat.slug}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`);
  }

  // Post pages
  for (const post of posts) {
    const lastmod = post.publishedAt || today;
    urls.push(`  <url><loc>${BASE_URL}/blog/${post.slug}</loc><lastmod>${lastmod}</lastmod><priority>0.9</priority></url>`);
  }

  // Read existing sitemap and inject blog URLs before closing tag
  if (fs.existsSync(SITEMAP_FILE)) {
    let sitemap = fs.readFileSync(SITEMAP_FILE, "utf-8");
    if (!sitemap.includes("/blog")) {
      sitemap = sitemap.replace("</urlset>", `${urls.join("\n")}\n</urlset>`);
      fs.writeFileSync(SITEMAP_FILE, sitemap);
      console.log(`Added ${urls.length} blog URLs to sitemap.xml`);
    } else {
      console.log("Blog URLs already in sitemap");
    }
  } else {
    // Create minimal sitemap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
    fs.writeFileSync(SITEMAP_FILE, xml);
    console.log(`Created sitemap.xml with ${urls.length} blog URLs`);
  }
}

generateBlogSitemap();
