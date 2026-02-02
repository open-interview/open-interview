import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin: regenerate client/public/data/learning-paths.json from data/learning-paths.json
// so the static fallback used by GitHub Pages is always up-to-date on every build.
function learningPathsStaticDataPlugin() {
  return {
    name: 'learning-paths-static-data',
    buildStart() {
      try {
        const rawInput  = path.resolve(__dirname, 'data', 'learning-paths.json');
        const pubInput  = path.resolve(__dirname, 'client', 'public', 'data', 'learning-paths.json');
        const output    = pubInput;
        if (!fs.existsSync(rawInput)) return;

        const rawData: Array<Record<string, unknown>> = JSON.parse(fs.readFileSync(rawInput, 'utf-8'));
        const pubData: Array<Record<string, unknown>> = fs.existsSync(pubInput)
          ? JSON.parse(fs.readFileSync(pubInput, 'utf-8'))
          : [];

        const existingIds = new Set(pubData.map((p: any) => p.id as string));

        const newPaths = rawData
          .filter((p: any) => !existingIds.has(p.id as string))
          .map((p: any) => {
            const parts = (p.id as string).split('-');
            const pathType = parts[0];
            const difficulty = parts[parts.length - 1];
            const companySlug = parts.slice(1, -1).join('-');
            const targetCompany = companySlug.split('-')
              .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const tags = Array.isArray(p.tags) ? p.tags : [];
            const questionIds = Array.isArray(p.questionIds) ? p.questionIds : [];
            return {
              id: p.id, title: p.title, description: p.description,
              pathType, targetCompany, targetJobTitle: null,
              difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
              estimatedHours: p.estimatedHours || 10,
              questionIds: JSON.stringify(questionIds),
              channels: JSON.stringify(tags),
              tags: JSON.stringify(tags),
              prerequisites: '[]', learningObjectives: '[]', milestones: '[]',
              popularity: 0, completionRate: 0, averageRating: 0, metadata: '{}',
              status: 'active',
              createdAt: p.createdAt || new Date().toISOString(),
              lastUpdated: new Date().toISOString(),
              lastGenerated: new Date().toISOString(),
            };
          });

        if (newPaths.length > 0) {
          const merged = [...pubData, ...newPaths];
          fs.writeFileSync(output, JSON.stringify(merged, null, 2));
          console.log(`[learning-paths-static-data] merged ${newPaths.length} new paths → ${merged.length} total`);
        } else {
          console.log(`[learning-paths-static-data] ${pubData.length} paths already up-to-date`);
        }
      } catch (e) {
        console.warn('[learning-paths-static-data] skipped:', e);
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
    learningPathsStaticDataPlugin(),
    swBuildStampPlugin(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom', 'react-dom/client'],
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
    port: 5000,
    allowedHosts: true,
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
