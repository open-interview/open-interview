import { getCollection } from 'astro:content';

function escapeXml(str) {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(context) {
  const allPosts = await getCollection('blog');
  const sorted = allPosts
    .filter(p => p.data.publishedAt || p.data.createdAt)
    .sort((a, b) => {
      const da = new Date(a.data.publishedAt ?? a.data.createdAt ?? 0).getTime();
      const db = new Date(b.data.publishedAt ?? b.data.createdAt ?? 0).getTime();
      return db - da;
    })
    .slice(0, 100);

  const siteUrl = (context.site?.toString() ?? 'https://open-interview.github.io').replace(/\/$/, '');

  const items = sorted.map(post => {
    const d = post.data;
    const pubDate = new Date(d.publishedAt ?? d.createdAt ?? 0).toUTCString();
    const desc = escapeXml((d.excerpt ?? d.funFact ?? d.title ?? '').replace(/\[\d+\]/g, '').substring(0, 300));
    const link = `${siteUrl}/posts/${d.id}/${d.slug}/`;
    const cats = [d.channel, ...(d.tags ?? [])].filter(Boolean)
      .map(c => `      <category>${escapeXml(c)}</category>`).join('\n');
    const cover = (d.images ?? []).find(i => i.placement === 'after-intro') ?? d.images?.[0];
    const mediaTag = cover
      ? `      <media:content url="${escapeXml(cover.url.startsWith('http') ? cover.url : siteUrl + cover.url)}" medium="image"/>`
      : '';

    return `    <item>
      <title>${escapeXml(d.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
      <dc:creator>${escapeXml(d.author ?? 'DevInsights')}</dc:creator>
${cats}
${mediaTag}
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>DevInsights — Engineering Knowledge That Ships</title>
    <description>Real-world engineering insights for developers building at scale.</description>
    <link>${siteUrl}</link>
    <language>en-us</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
