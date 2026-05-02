import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin: regenerate client/public/blog-data.json from data/blog-posts.json
// so the static fallback used by GitHub Pages is always up-to-date on every build.
function blogStaticDataPlugin() {
  return {
    name: 'blog-static-data',
    buildStart() {
      try {
        const input  = path.resolve(__dirname, 'data', 'blog-posts.json');
        const output = path.resolve(__dirname, 'client', 'public', 'blog-data.json');
        if (!fs.existsSync(input)) return;

        const rawData: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(input, 'utf-8'));

        function buildContent(entry: Record<string, unknown>): string {
          const blogIntro      = (entry.blogIntro      as string) || '';
          const blogSections   = (entry.blogSections   as Array<{ heading?: string; content?: string }>) || [];
          const blogConclusion = (entry.blogConclusion as string) || '';
          const diagram        = (entry.diagram        as string) || '';
          const images         = (entry.images         as Array<{ url?: string; alt?: string; caption?: string; placement?: string }>) || [];

          const parts: string[] = [];

          if (blogIntro) parts.push(blogIntro);

          for (const img of images) {
            if (img.placement === 'after-intro' && img.url) {
              const alt = img.alt || img.caption || '';
              parts.push(`![${alt}](${img.url})`);
              if (img.caption) parts.push(`*${img.caption}*`);
            }
          }

          for (const s of blogSections) {
            const h = s.heading ? `## ${s.heading}\n\n` : '';
            parts.push(`${h}${s.content || ''}`);
          }

          if (diagram && diagram.trim().length > 10) {
            parts.push(`## Architecture Diagram\n\n\`\`\`mermaid\n${diagram.trim()}\n\`\`\``);
          }

          if (blogConclusion && blogConclusion.trim().length > 10) {
            parts.push(`## Conclusion\n\n${blogConclusion.trim()}`);
          }

          return parts.join('\n\n');
        }

        const posts = rawData.map((entry) => {
          const id      = (entry.id      as string) || '';
          const blogIntro = (entry.blogIntro as string) || '';
          const channel = (entry.channel as string) || 'General';
          const difficulty = (entry.difficulty as string) || null;

          let tags: string[] = [];
          if (Array.isArray(entry.tags)) tags = entry.tags as string[];
          else if (typeof entry.tags === 'string') { try { tags = JSON.parse(entry.tags); } catch { tags = []; } }

          const content = buildContent(entry);

          let publishedAt = '';
          const m = id.match(/^blog-(\d+)-/);
          if (m) { const ts = parseInt(m[1], 10); if (!isNaN(ts)) publishedAt = new Date(ts).toISOString(); }
          if (!publishedAt) publishedAt = (entry.createdAt as string) || new Date().toISOString();

          return { id, slug: entry.blogSlug, title: entry.blogTitle,
            excerpt: blogIntro ? (blogIntro as string).slice(0, 250) : '',
            content, coverImage: null, author: 'TechExpert AI', category: channel, tags,
            publishedAt, readingTimeMinutes: Math.max(1, Math.ceil(content.length / 1000)),
            featured: false, status: 'published', difficulty };
        });

        posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        const catMap = new Map<string, { id: string; name: string; slug: string }>();
        for (const p of posts) {
          if (!catMap.has(p.category as string)) {
            const c = p.category as string;
            catMap.set(c, { id: c, name: c.charAt(0).toUpperCase() + c.slice(1), slug: c });
          }
        }
        const categories = Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name));

        const tagSet = new Set<string>();
        for (const p of posts) for (const t of (p.tags as string[])) tagSet.add(t);
        const tags = Array.from(tagSet).sort();

        fs.writeFileSync(output, JSON.stringify({ posts, categories, tags }));
        console.log(`[blog-static-data] wrote ${posts.length} posts → client/public/blog-data.json`);
      } catch (e) {
        console.warn('[blog-static-data] skipped:', e);
      }
    },
  };
}

// Plugin to stamp sw.js with build timestamp so cache busts on every deploy
function swBuildStampPlugin() {
  const buildTime = Date.now().toString();
  return {
    name: 'sw-build-stamp',
    writeBundle(opts: { dir?: string }) {
      const swPath = path.join(opts.dir || 'dist/public', 'sw.js');
      if (fs.existsSync(swPath)) {
        const content = fs.readFileSync(swPath, 'utf8');
        fs.writeFileSync(swPath, content.replace('__BUILD_TIME__', buildTime));
      }
    },
  };
}

export default defineConfig({
  base: process.env.VITE_BASE_URL || "/",
  plugins: [
    react(),
    tailwindcss(),
    blogStaticDataPlugin(),
    swBuildStampPlugin(),
  ],
  resolve: {
    conditions: ['import', 'require'],
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  optimizeDeps: {
    include: ['mermaid'],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3333,
  },
  appType: 'spa',
  // @ts-expect-error - vitest config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});
