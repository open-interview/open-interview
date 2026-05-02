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
        const posts = rawData.map((entry) => {
          const id           = (entry.id as string) || '';
          const blogIntro    = (entry.blogIntro as string) || '';
          const blogSections = (entry.blogSections as Array<{ heading?: string; content?: string }>) || [];
          const channel      = (entry.channel as string) || 'General';

          let tags: string[] = [];
          if (Array.isArray(entry.tags)) tags = entry.tags as string[];
          else if (typeof entry.tags === 'string') { try { tags = JSON.parse(entry.tags); } catch { tags = []; } }

          const contentParts: string[] = [];
          if (blogIntro) contentParts.push(blogIntro);
          for (const s of blogSections) {
            const h = s.heading ? `## ${s.heading}\n\n` : '';
            contentParts.push(`${h}${s.content || ''}`);
          }
          const content = contentParts.join('\n\n');

          let publishedAt = '';
          const m = id.match(/^blog-(\d+)-/);
          if (m) { const ts = parseInt(m[1], 10); if (!isNaN(ts)) publishedAt = new Date(ts).toISOString(); }
          if (!publishedAt) publishedAt = new Date().toISOString();

          return { id, slug: entry.blogSlug, title: entry.blogTitle, excerpt: blogIntro,
            content, author: 'TechExpert AI', category: channel, tags,
            publishedAt, readingTimeMinutes: Math.max(1, Math.ceil(content.length / 1000)),
            featured: false, status: 'published' };
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
