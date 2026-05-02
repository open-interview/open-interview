const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const API_URL = 'http://localhost:5000';
const POSTS_FILE = path.join(__dirname, '..', 'data', 'blog-posts.json');
const CLIENT_POSTS_FILE = path.join(__dirname, '..', 'client', 'public', 'data', 'posts.json');

let hasFailures = false;
let passCount = 0;
let failCount = 0;
let serverProcess = null;

function log(message) {
  console.log(message);
}

function passCheck(name, detail) {
  passCount++;
  log('✓ ' + name + ': ' + detail);
}

function failCheck(name, error) {
  hasFailures = true;
  failCount++;
  log('✗ ' + name + ': ' + error);
}

async function fileExists(filePath) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}

async function readJsonFile(filePath) {
  const content = await fs.promises.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

async function checkServer(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function startServer() {
  log('Starting API server...');
  const serverCwd = path.join(__dirname, '..');

  serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    cwd: serverCwd,
    stdio: 'pipe',
    env: Object.assign({}, process.env, { NODE_ENV: 'development', PORT: '5000' }),
    detached: false,
  });

  serverProcess.stderr.on('data', () => {});

  log('Waiting for API server...');
  const apiReady = await checkServer(API_URL + '/api/blog/health', 30000);
  if (!apiReady) {
    throw new Error('API server failed to start within 30 seconds');
  }
  log('API server started.');
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.status + ' ' + response.statusText);
  }
  return await response.json();
}

function parsePostsFromSourceData(postsData) {
  return postsData.map(p => {
    const tags = Array.isArray(p.tags) ? p.tags : [];
    let content = p.content || '';
    if (!content && p.blogSections) {
      content = p.blogSections.map(s => (s.content || s.body || '')).join('\n');
    }
    return {
      id: p.id || p.blogId || '',
      slug: p.slug || p.blogSlug || '',
      title: p.title || p.blogTitle || '',
      content: content,
      category: p.category || p.channel || '',
      tags: tags,
    };
  });
}

async function main() {
  log('Blog System Verification');
  log('========================');

  // 1. Check data/blog-posts.json
  let sourcePosts = [];
  try {
    if (!await fileExists(POSTS_FILE)) {
      failCheck('data/blog-posts.json', 'File does not exist');
    } else {
      const rawData = await readJsonFile(POSTS_FILE);
      sourcePosts = Array.isArray(rawData) ? rawData : (rawData.posts || []);
      if (sourcePosts.length === 0) {
        failCheck('data/blog-posts.json', 'No posts found or invalid format');
      } else {
        passCheck('data/blog-posts.json', sourcePosts.length + ' posts');
      }
    }
  } catch (error) {
    failCheck('data/blog-posts.json', error.message);
  }

  // 2. Check client/public/data/posts.json
  let clientPosts = [];
  try {
    if (await fileExists(CLIENT_POSTS_FILE)) {
      const data = await readJsonFile(CLIENT_POSTS_FILE);
      clientPosts = data.posts || (Array.isArray(data) ? data : []);
      if (clientPosts.length === 0) {
        failCheck('client/public/data/posts.json', 'No posts found or invalid format');
      } else {
        passCheck('client/public/data/posts.json', clientPosts.length + ' posts');
      }
    } else {
      log('- client/public/data/posts.json: Not found (skipping)');
    }
  } catch (error) {
    failCheck('client/public/data/posts.json', error.message);
  }

  // 3. Start server if not running
  const apiRunning = await checkServer(API_URL + '/api/blog/health', 2000);
  if (!apiRunning) {
    await startServer();
  } else {
    log('API server already running.');
  }

  // Use client posts if available, otherwise parse from source
  const posts = clientPosts.length > 0 ? clientPosts : parsePostsFromSourceData(sourcePosts);

  if (posts.length === 0) {
    failCheck('Post data', 'No valid post data available for testing');
    process.exit(1);
  }

  // 4. Test API: GET /api/blog/posts
  try {
    const response = await fetch(API_URL + '/api/blog/posts');
    if (!response.ok) {
      failCheck('GET /api/blog/posts', response.status + ' ' + response.statusText);
    } else {
      const result = await response.json();
      const apiPosts = result.data || result;
      const count = Array.isArray(apiPosts) ? apiPosts.length : (result.meta ? result.meta.total : 0);
      if (count === 0) {
        failCheck('GET /api/blog/posts', 'No posts returned');
      } else {
        passCheck('GET /api/blog/posts', '200 OK, ' + count + ' posts');
      }
    }
  } catch (error) {
    failCheck('GET /api/blog/posts', error.message);
  }

  // 5. Test API: GET /api/blog/posts/:slug
  const testPost = posts.find(p => p.slug) || posts[0];
  if (testPost && testPost.slug) {
    try {
      const response = await fetch(API_URL + '/api/blog/posts/' + testPost.slug);
      if (!response.ok) {
        failCheck('GET /api/blog/posts/:slug', response.status + ' ' + response.statusText);
      } else {
        const result = await response.json();
        const post = result.data || result;
        if (!post.slug && !post.id) {
          failCheck('GET /api/blog/posts/:slug', 'Invalid response format');
        } else {
          passCheck('GET /api/blog/posts/:slug', '200 OK');
        }
      }
    } catch (error) {
      failCheck('GET /api/blog/posts/:slug', error.message);
    }
  }

  // 6. Test API: GET /api/blog/categories
  let apiCategories = [];
  try {
    const response = await fetch(API_URL + '/api/blog/categories');
    if (!response.ok) {
      failCheck('GET /api/blog/categories', response.status + ' ' + response.statusText);
    } else {
      const result = await response.json();
      apiCategories = result.data || result;
      passCheck('GET /api/blog/categories', '200 OK, ' + apiCategories.length + ' categories');
    }
  } catch (error) {
    failCheck('GET /api/blog/categories', error.message);
  }

  // 7. Test API: GET /api/blog/tags
  let apiTags = [];
  try {
    const response = await fetch(API_URL + '/api/blog/tags');
    if (!response.ok) {
      failCheck('GET /api/blog/tags', response.status + ' ' + response.statusText);
    } else {
      const result = await response.json();
      apiTags = result.data || result;
      passCheck('GET /api/blog/tags', '200 OK, ' + apiTags.length + ' tags');
    }
  } catch (error) {
    failCheck('GET /api/blog/tags', error.message);
  }

  // 8. Test API: GET /api/blog/search?q=docker
  try {
    const response = await fetch(API_URL + '/api/blog/search?q=docker');
    if (!response.ok) {
      failCheck('GET /api/blog/search?q=docker', response.status + ' ' + response.statusText);
    } else {
      const result = await response.json();
      const results = result.data || result;
      passCheck('GET /api/blog/search?q=docker', '200 OK, ' + results.length + ' results');
    }
  } catch (error) {
    failCheck('GET /api/blog/search?q=docker', error.message);
  }

  // 9. Check required fields
  const requiredFields = ['title', 'slug', 'content', 'category', 'tags'];
  let allHaveFields = true;
  const missingFields = [];
  for (const post of posts) {
    for (const field of requiredFields) {
      if (!post[field] || (field === 'tags' && !Array.isArray(post[field]))) {
        missingFields.push((post.slug || post.id || 'unknown') + ': missing/invalid ' + field);
        allHaveFields = false;
      }
    }
  }
  if (allHaveFields) {
    passCheck('All posts have required fields', 'Passed');
  } else {
    const msg = missingFields.slice(0, 5).join(', ') + (missingFields.length > 5 ? '... (' + missingFields.length + ' total)' : '');
    failCheck('All posts have required fields', msg);
  }

  // 10. Check unique slugs
  const slugs = posts.map(p => p.slug).filter(Boolean);
  const uniqueSlugs = new Set(slugs);
  if (uniqueSlugs.size === slugs.length) {
    passCheck('All slugs are unique', 'Passed');
  } else {
    failCheck('All slugs are unique', 'Duplicate slugs found');
  }

  // 11. Check categories are valid
  if (apiCategories.length > 0) {
    const validCategoryNames = apiCategories.map(c => {
      if (typeof c === 'string') return c.toLowerCase();
      return (c.name || c.slug || '').toLowerCase();
    }).filter(Boolean);

    let categoriesOk = true;
    const errors = [];
    for (const post of posts) {
      if (post.category) {
        const postCat = post.category.toLowerCase();
        if (!validCategoryNames.includes(postCat)) {
          errors.push(post.slug + ': "' + post.category + '" not in valid categories');
          categoriesOk = false;
        }
      }
    }
    if (categoriesOk) {
      passCheck('Categories are valid', 'All match API categories (' + validCategoryNames.length + ' valid)');
    } else {
      const msg = errors.slice(0, 3).join(', ') + (errors.length > 3 ? '... (' + errors.length + ' total)' : '');
      failCheck('Categories are valid', msg);
    }
  }

  // 12. Check tags are valid
  if (apiTags.length > 0) {
    const validTagNames = apiTags.map(t => typeof t === 'string' ? t : (t.name || t)).filter(Boolean);

    let tagsOk = true;
    const errors = [];
    for (const post of posts) {
      if (Array.isArray(post.tags)) {
        for (const tag of post.tags) {
          if (!validTagNames.includes(tag)) {
            errors.push(post.slug + ': invalid tag "' + tag + '"');
            tagsOk = false;
          }
        }
      }
    }
    if (tagsOk) {
      passCheck('Tags are valid', 'All match API tags (' + validTagNames.length + ' valid)');
    } else {
      const msg = errors.slice(0, 3).join(', ') + (errors.length > 3 ? '... (' + errors.length + ' total)' : '');
      failCheck('Tags are valid', msg);
    }
  }

  // 13. Check related posts (no self-references)
  let relatedOk = true;
  const relatedErrors = [];
  const samplePosts = posts.slice(0, Math.min(5, posts.length));
  for (const post of samplePosts) {
    if (!post.slug) continue;
    try {
      const result = await getJson(API_URL + '/api/blog/posts/' + post.slug);
      const postData = result.data || result;
      if (postData.relatedPosts && Array.isArray(postData.relatedPosts)) {
        for (const rel of postData.relatedPosts) {
          const relSlug = rel.slug || rel;
          if (relSlug === post.slug) {
            relatedErrors.push(post.slug + ': self-reference in related posts');
            relatedOk = false;
          }
        }
      }
    } catch (e) {}
  }
  if (relatedOk) {
    passCheck('Related posts work', 'No self-references detected');
  } else {
    failCheck('Related posts work', relatedErrors.join(', '));
  }

  // 14. Check prev/next posts
  let prevNextOk = true;
  const prevNextErrors = [];
  const slugSet = new Set(posts.map(p => p.slug).filter(Boolean));

  for (const post of samplePosts) {
    if (!post.slug) continue;
    try {
      const result = await getJson(API_URL + '/api/blog/posts/' + post.slug);
      const postData = result.data || result;
      if (postData.prev && postData.prev.slug && !slugSet.has(postData.prev.slug)) {
        prevNextErrors.push(post.slug + ': prev slug "' + postData.prev.slug + '" not found');
        prevNextOk = false;
      }
      if (postData.next && postData.next.slug && !slugSet.has(postData.next.slug)) {
        prevNextErrors.push(post.slug + ': next slug "' + postData.next.slug + '" not found');
        prevNextOk = false;
      }
    } catch (e) {}
  }
  if (prevNextOk) {
    passCheck('Prev/next posts work', 'No gaps detected');
  } else {
    failCheck('Prev/next posts work', prevNextErrors.join(', '));
  }

  // 15. Check blog page loads
  try {
    const response = await fetch(API_URL + '/blog');
    if (!response.ok) {
      failCheck('Blog page loads', response.status + ' ' + response.statusText);
    } else {
      const text = await response.text();
      if (text.toLowerCase().includes('blog') || text.includes('post')) {
        passCheck('Blog page loads', '200 OK, expected content found');
      } else {
        failCheck('Blog page loads', 'Expected content not found');
      }
    }
  } catch (error) {
    failCheck('Blog page loads', error.message);
  }

  // 16. Check API health endpoint
  try {
    const result = await getJson(API_URL + '/api/blog/health');
    const postCount = result.postCount || (result.data && result.data.postCount) || 0;
    passCheck('Blog health check', '200 OK, ' + postCount + ' posts');
  } catch (error) {
    failCheck('Blog health check', error.message);
  }

  log('========================');
  log('Results: ' + passCount + ' passed, ' + failCount + ' failed');

  if (hasFailures) {
    log('Some checks failed!');
    process.exit(1);
  } else {
    log('All checks passed!');
    process.exit(0);
  }
}

process.on('exit', () => {
  if (serverProcess && !serverProcess.killed) {
    try {
      process.kill(serverProcess.pid);
    } catch (e) {}
  }
});

process.on('SIGINT', () => {
  log('\nInterrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  process.exit(1);
});

main().catch(error => {
  log('Fatal error: ' + error.message);
  process.exit(1);
});
