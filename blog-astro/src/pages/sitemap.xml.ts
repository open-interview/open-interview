import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site }) => {
  const base = site ? site.toString().replace(/\/$/, '') : 'https://open-interview.github.io';

  const posts = await getCollection('blog');
  posts.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());

  const staticRoutes = ['/', '/tags/'];
  const allTags = [...new Set(posts.flatMap(p => p.data.tags))];

  const urls: string[] = [
    ...staticRoutes.map(path => `
  <url>
    <loc>${base}${path}</loc>
    <changefreq>daily</changefreq>
    <priority>${path === '/' ? '1.0' : '0.5'}</priority>
  </url>`),

    ...allTags.map(tag => `
  <url>
    <loc>${base}/tag/${encodeURIComponent(tag)}/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.4</priority>
  </url>`),

    ...posts.map(post => `
  <url>
    <loc>${base}/blog/${post.slug}/</loc>
    <lastmod>${post.data.publishedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`.trim();

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
