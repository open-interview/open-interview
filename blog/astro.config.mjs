import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

const SITE = process.env.BLOG_BASE_URL || 'https://open-interview.github.io';

// Known HTML tags that are valid in MDX prose
const HTML_TAGS = new Set([
  'a','abbr','address','article','aside','audio','b','blockquote','body',
  'br','button','canvas','caption','cite','code','col','colgroup','data',
  'datalist','dd','del','details','dfn','dialog','div','dl','dt','em',
  'embed','fieldset','figcaption','figure','footer','form','h1','h2','h3',
  'h4','h5','h6','head','header','hr','html','i','iframe','img','input',
  'ins','kbd','label','legend','li','link','main','map','mark','menu',
  'meta','meter','nav','noscript','object','ol','optgroup','option','output',
  'p','picture','pre','progress','q','rp','rt','ruby','s','samp','script',
  'section','select','small','source','span','strong','style','sub','summary',
  'sup','table','tbody','td','template','textarea','tfoot','th','thead',
  'time','title','tr','track','u','ul','var','video','wbr',
]);

const TAG_LIKE = /<(\/?)([\w][\w:.-]*)([^>]*?)(\/??)>/g;

function escapeMdxProseContent(code) {
  const lines = code.split('\n');
  let inFence = false;
  let fenceChar = '';
  const out = [];

  for (const line of lines) {
    const stripped = line.trimStart();
    if (!inFence) {
      const m = stripped.match(/^(`{3,}|~{3,})/);
      if (m) { inFence = true; fenceChar = m[1][0]; out.push(line); continue; }
    } else {
      const m = stripped.match(/^(`{3,}|~{3,})$/);
      if (m && m[1][0] === fenceChar) { inFence = false; fenceChar = ''; out.push(line); continue; }
    }

    if (inFence) { out.push(line); continue; }

    // Split on inline code spans
    const segs = line.split(/(`[^`\n]+`)/);
    const fixed = segs.map(seg => {
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length > 1) return seg;

      // Escape <Tag> that are not real HTML
      let s = seg.replace(TAG_LIKE, (full, slash, tag, attrs, selfclose) => {
        const base = tag.toLowerCase().split(/[:.]/)[0];
        if (HTML_TAGS.has(base) && !attrs.trim()) return full;
        return `&lt;${slash}${tag}${attrs}${selfclose}&gt;`;
      });
      // Escape remaining bare < not already escaped
      s = s.replace(/<(?![A-Za-z/_!]|&lt;)/g, '&lt;');
      // Escape { and } not already escaped
      s = s.replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');
      return s;
    });
    out.push(fixed.join(''));
  }
  return out.join('\n');
}

/** Vite plugin: sanitize MDX prose before the MDX transformer runs */
function mdxProseSanitizer() {
  return {
    name: 'mdx-prose-sanitizer',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('.mdx')) return null;

      // Split out frontmatter
      if (!code.startsWith('---')) {
        return { code: escapeMdxProseContent(code), map: null };
      }
      const secondDash = code.indexOf('---', 3);
      if (secondDash === -1) {
        return { code: escapeMdxProseContent(code), map: null };
      }
      const fm = code.slice(0, secondDash + 3);
      const body = code.slice(secondDash + 3);
      return { code: fm + escapeMdxProseContent(body), map: null };
    },
  };
}

const BASE = process.env.BLOG_BASE_PATH || '';

export default defineConfig({
  site: SITE,
  base: BASE,
  outDir: '../blog-output',
  trailingSlash: 'always',
  server: {
    port: 3000,
    host: true,
  },
  vite: {
    plugins: [mdxProseSanitizer()],
  },
  integrations: [
    mdx({
      optimize: false,
    }),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
  },
  build: {
    format: 'directory',
  },
});
