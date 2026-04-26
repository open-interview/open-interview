import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
