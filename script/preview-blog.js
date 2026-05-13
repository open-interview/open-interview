/**
 * Local blog preview server — renders content/posts/*.md with GitHub-style CSS + Mermaid.
 * Usage: node script/preview-blog.js [port]
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = parseInt(process.argv[2] || process.env.PORT || 3333);
const POSTS_DIR = path.resolve('content/posts');

// Minimal MD → HTML (no deps). Handles the subset we generate.
function mdToHtml(md) {
  // Strip YAML frontmatter, extract fields
  let title = '', channel = '', difficulty = '', date = '';
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (fm) {
    const block = fm[1];
    title = (block.match(/^title:\s*"?(.+?)"?\s*$/m) || [])[1] || '';
    channel = (block.match(/^channel:\s*(.+)$/m) || [])[1] || '';
    difficulty = (block.match(/^difficulty:\s*(.+)$/m) || [])[1] || '';
    date = (block.match(/^date:\s*"?(.+?)"?\s*$/m) || [])[1] || '';
    md = md.slice(fm[0].length);
  }

  let html = md
    // Fenced code blocks (preserve mermaid as-is for JS to pick up)
    .replace(/```mermaid\n([\s\S]*?)```/g, (_, code) =>
      `<div class="mermaid">${code.trim()}</div>`)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang}">${esc(code.trimEnd())}</code></pre>`)
    // Inline code
    .replace(/`([^`\n]+)`/g, (_, c) => `<code>${esc(c)}</code>`)
    // Details/summary
    .replace(/<details>\n<summary>([\s\S]*?)<\/summary>\n([\s\S]*?)<\/details>/g,
      (_, sum, body) => `<details><summary>${sum}</summary><div class="details-body">${mdToHtml(body)}</div></details>`)
    // Inline SVG passthrough
    .replace(/(<svg[\s\S]*?<\/svg>)/g, '$1')
    // div align center
    .replace(/<div align="center">([\s\S]*?)<\/div>/g,
      '<div class="center">$1</div>')
    // Headings
    .replace(/^## (.+)$/gm, (_, t) => `<h2 id="${slug(t)}">${t}</h2>`)
    .replace(/^### (.+)$/gm, (_, t) => `<h3>${t}</h3>`)
    // HR
    .replace(/^---$/gm, '<hr>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/_(.+?)_/g, '<em>$1</em>')
    // GFM table
    .replace(/((?:^\|.+\|\n)+)/gm, tableToHtml)
    // Unordered list
    .replace(/((?:^- .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    })
    // Ordered list
    .replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    })
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    // Paragraphs (lines not already wrapped)
    .replace(/^(?!<[a-z]|#|\s*$)(.+)$/gm, '<p>$1</p>')
    // Clean up multiple blank lines
    .replace(/\n{3,}/g, '\n\n');

  return html;
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}
function tableToHtml(block) {
  const rows = block.trim().split('\n').filter(r => !/^\|[-:| ]+\|$/.test(r));
  if (!rows.length) return block;
  const [head, ...body] = rows;
  const th = head.split('|').filter((_,i,a)=>i>0&&i<a.length-1).map(c=>`<th>${c.trim()}</th>`).join('');
  const trs = body.map(r => {
    const tds = r.split('|').filter((_,i,a)=>i>0&&i<a.length-1).map(c=>`<td>${c.trim()}</td>`).join('');
    return `<tr>${tds}</tr>`;
  }).join('');
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`;
}

function buildPage(slug, html, title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title || slug}</title>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
<style>
  :root{--bg:#0d1117;--bg2:#161b22;--bg3:#21262d;--text:#e6edf3;--text2:#8b949e;--accent:#58a6ff;--border:#30363d;--green:#3fb950;--yellow:#d29922;--red:#f85149;--code-bg:#161b22}
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.7}
  .layout{display:grid;grid-template-columns:220px 1fr;max-width:1200px;margin:0 auto;gap:0;min-height:100vh}
  nav{background:var(--bg2);border-right:1px solid var(--border);padding:16px;position:sticky;top:0;height:100vh;overflow-y:auto}
  nav h3{font-size:.75rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text2);margin-bottom:12px}
  nav a{display:block;font-size:.8rem;color:var(--text2);text-decoration:none;padding:4px 8px;border-radius:4px;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  nav a:hover,nav a.active{background:var(--bg3);color:var(--accent)}
  main{padding:48px 64px;max-width:860px}
  h1{font-size:2rem;font-weight:700;letter-spacing:-.03em;line-height:1.2;margin-bottom:16px;color:var(--text)}
  h2{font-size:1.4rem;font-weight:700;margin:2.5em 0 .75em;padding-left:12px;border-left:3px solid var(--accent);color:var(--text)}
  h3{font-size:1.1rem;font-weight:600;margin:1.5em 0 .5em;color:var(--text)}
  p{margin:.75em 0;color:var(--text)}
  a{color:var(--accent);text-decoration:none}
  a:hover{text-decoration:underline}
  code{font-family:'JetBrains Mono','Fira Code',monospace;font-size:.875em;background:var(--code-bg);border:1px solid var(--border);border-radius:4px;padding:.15em .4em;color:#e6edf3}
  pre{background:var(--code-bg);border:1px solid var(--border);border-radius:8px;padding:20px;overflow-x:auto;margin:1.5em 0;font-size:.875rem;line-height:1.6}
  pre code{background:none;border:none;padding:0;font-size:inherit}
  table{width:100%;border-collapse:collapse;margin:1.5em 0;font-size:.9rem;border:1px solid var(--border);border-radius:8px;overflow:hidden}
  th{background:var(--bg3);padding:10px 16px;text-align:left;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text2);border-bottom:2px solid var(--border)}
  td{padding:10px 16px;border-bottom:1px solid var(--border);color:var(--text);vertical-align:top}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:var(--bg3)}
  blockquote{border-left:4px solid var(--accent);background:rgba(88,166,255,.08);padding:12px 20px;margin:1.5em 0;border-radius:0 8px 8px 0;color:var(--text)}
  blockquote strong{color:var(--accent)}
  hr{border:none;border-top:1px solid var(--border);margin:2.5em 0}
  ul,ol{padding-left:1.5em;margin:.75em 0}
  li{margin:.3em 0;color:var(--text)}
  details{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:12px 20px;margin:1.5em 0}
  summary{cursor:pointer;font-weight:600;color:var(--text)}
  .details-body{margin-top:12px;padding-top:12px;border-top:1px solid var(--border)}
  .center{text-align:center;margin:2em 0}
  .center svg{max-width:100%;height:auto;border-radius:8px;background:var(--bg2);padding:16px}
  .center em{display:block;font-size:.875rem;color:var(--text2);margin-top:8px;font-style:italic}
  .mermaid{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:24px;margin:1.5em 0;overflow:auto;text-align:center}
  .meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px}
  .badge{display:inline-flex;align-items:center;border-radius:999px;font-size:.75rem;font-weight:600;padding:3px 10px;border:1px solid}
  .badge-channel{background:rgba(88,166,255,.15);color:var(--accent);border-color:rgba(88,166,255,.3)}
  .badge-beginner{background:rgba(63,185,80,.15);color:var(--green);border-color:rgba(63,185,80,.3)}
  .badge-intermediate{background:rgba(210,153,34,.15);color:var(--yellow);border-color:rgba(210,153,34,.3)}
  .badge-advanced{background:rgba(248,81,73,.15);color:var(--red);border-color:rgba(248,81,73,.3)}
  .toc{position:sticky;top:48px;align-self:start;background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:32px;font-size:.85rem}
  .toc-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text2);margin-bottom:8px}
  .toc a{display:block;color:var(--text2);padding:3px 0;text-decoration:none}
  .toc a:hover{color:var(--accent)}
  @media(max-width:900px){.layout{grid-template-columns:1fr}nav{display:none}main{padding:24px 20px}}
</style>
</head>
<body>
<div class="layout">
  <nav id="sidenav">
    <h3>Posts</h3>
    <div id="nav-links">Loading…</div>
  </nav>
  <main>
    <div class="meta">
      <span class="badge badge-channel" id="meta-channel"></span>
      <span class="badge" id="meta-diff"></span>
      <span style="font-size:.8rem;color:var(--text2);align-self:center" id="meta-date"></span>
    </div>
    <h1 id="post-title">${title}</h1>
    <div id="content">${html}</div>
  </main>
</div>
<script>
mermaid.initialize({startOnLoad:true,theme:'dark',themeVariables:{primaryColor:'#21262d',primaryBorderColor:'#30363d',primaryTextColor:'#e6edf3',lineColor:'#58a6ff',edgeLabelBackground:'#161b22'}});

// Load nav
fetch('/api/posts').then(r=>r.json()).then(posts=>{
  const nav = document.getElementById('nav-links');
  nav.innerHTML = posts.map(p=>\`<a href="/?post=\${p.slug}" \${p.slug==='${slug}'?'class="active"':''}>\${p.title}</a>\`).join('');
});

// Load meta
const params = new URLSearchParams(location.search);
const postSlug = params.get('post') || '${slug}';
fetch('/api/meta/'+postSlug).then(r=>r.json()).then(m=>{
  document.getElementById('meta-channel').textContent = m.channel;
  const d = document.getElementById('meta-diff');
  d.textContent = m.difficulty;
  d.className = 'badge badge-'+m.difficulty;
  document.getElementById('meta-date').textContent = m.date;
  document.getElementById('post-title').textContent = m.title;
});

// Navigate
document.addEventListener('click', e=>{
  const a = e.target.closest('a[href^="/?post="]');
  if (!a) return;
  e.preventDefault();
  const s = new URL(a.href).searchParams.get('post');
  history.pushState({},'','/?post='+s);
  loadPost(s);
});
window.addEventListener('popstate', ()=>loadPost(new URLSearchParams(location.search).get('post')));

function loadPost(s) {
  if (!s) return;
  fetch('/api/render/'+s).then(r=>r.json()).then(d=>{
    document.getElementById('content').innerHTML = d.html;
    document.getElementById('post-title').textContent = d.title;
    document.getElementById('meta-channel').textContent = d.channel;
    const diff = document.getElementById('meta-diff');
    diff.textContent = d.difficulty;
    diff.className = 'badge badge-'+d.difficulty;
    document.getElementById('meta-date').textContent = d.date;
    document.querySelectorAll('#sidenav a').forEach(a=>{
      a.classList.toggle('active', a.href.includes('post='+s));
    });
    window.scrollTo(0,0);
    mermaid.run({nodes: document.querySelectorAll('.mermaid')});
  });
}
</script>
</body>
</html>`;
}

// Parse frontmatter fields
function parseFrontmatter(md) {
  const fm = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) return {};
  const block = fm[1];
  return {
    title: (block.match(/^title:\s*"?(.+?)"?\s*$/m)||[])[1]||'',
    channel: (block.match(/^channel:\s*(.+)$/m)||[])[1]||'',
    difficulty: (block.match(/^difficulty:\s*(.+)$/m)||[])[1]||'',
    date: (block.match(/^date:\s*"?(.+?)"?\s*$/m)||[])[1]||'',
    slug: (block.match(/^slug:\s*(.+)$/m)||[])[1]||'',
  };
}

// Get all posts index
function getPostsIndex() {
  return fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const md = fs.readFileSync(path.join(POSTS_DIR, f), 'utf-8');
      const meta = parseFrontmatter(md);
      return { slug: meta.slug || f.replace('.md',''), title: meta.title || f.replace('.md','') };
    })
    .sort((a,b) => a.title.localeCompare(b.title));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // API: list posts
  if (pathname === '/api/posts') {
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(getPostsIndex()));
  }

  // API: render post
  if (pathname.startsWith('/api/render/')) {
    const s = pathname.slice('/api/render/'.length);
    const file = path.join(POSTS_DIR, s + '.md');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('{}'); }
    const md = fs.readFileSync(file, 'utf-8');
    const meta = parseFrontmatter(md);
    const html = mdToHtml(md);
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify({ html, ...meta }));
  }

  // API: meta only
  if (pathname.startsWith('/api/meta/')) {
    const s = pathname.slice('/api/meta/'.length);
    const file = path.join(POSTS_DIR, s + '.md');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('{}'); }
    const md = fs.readFileSync(file, 'utf-8');
    res.writeHead(200, {'Content-Type':'application/json'});
    return res.end(JSON.stringify(parseFrontmatter(md)));
  }

  // Main page
  const postSlug = url.searchParams.get('post');
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const firstSlug = postSlug || files[0]?.replace('.md','');
  const file = path.join(POSTS_DIR, (postSlug || files[0] || 'index') + '.md');

  if (!fs.existsSync(file)) {
    res.writeHead(404); return res.end('Not found');
  }

  const md = fs.readFileSync(file, 'utf-8');
  const meta = parseFrontmatter(md);
  const html = mdToHtml(md);
  const page = buildPage(meta.slug || firstSlug, html, meta.title);

  res.writeHead(200, {'Content-Type':'text/html'});
  res.end(page);
});

server.listen(PORT, () => {
  console.log(`\n📖 Blog preview: http://localhost:${PORT}`);
  console.log(`   ${fs.readdirSync(POSTS_DIR).filter(f=>f.endsWith('.md')).length} posts available\n`);
});
