# CMS Options for openstackdaily GitHub Pages Blog

## Executive Summary

Eleven CMS options were evaluated for the openstackdaily GitHub Pages blog, which uses an AI-driven LangGraph pipeline to generate structured JSON content deployed as static HTML. The primary recommendation is **GitHub Actions workflow_dispatch** — it requires zero new infrastructure, uses native GitHub auth, and integrates directly with the existing pipeline. The secondary recommendation is a **Custom HTML Admin Page** using the GitHub Contents API, for teams that need a browser-based CRUD interface without external dependencies.

The key insight driving this recommendation: the blog's content is ~100% AI-generated. The "CMS problem" is not about editing rich text — it is about triggering generation, making minor metadata corrections, and deleting bad posts. The existing `workflow_dispatch` UI already solves the first problem. A ~250-line HTML page solves the rest. No third-party CMS is warranted.

---

## Project Context

### Blog Setup

- **Live site**: https://openstackdaily.github.io
- **Source repo**: open-interview/open-interview
- **Pages repo**: openstackdaily/openstackdaily.github.io (branch: main)
- **Content store**: `data/blog-posts.json` — 121 posts, root-level JSON array
- **Static generator**: `script/generate-blog.js` (Node.js, LangGraph)
- **Output**: `blog-output/posts/{id}/{slug}/index.html`

### AI Generation Pipeline

Triggered by GitHub Actions (`🤖 Content Pipeline` workflow). Selects topics round-robin by channel, finds a real-world case, validates sources (min 8), generates content via LangGraph nodes, stores to PostgreSQL, exports to `data/blog-posts.json`, then triggers deploy.

Channels: sre, devops, kubernetes, aws, terraform, docker, linux, unix, generative-ai, llm-ops, machine-learning, prompt-engineering.

### Deploy Pipeline

`deploy-blog.yml` → spins up Postgres 15 → seeds from JSON → runs `blog:generate --html-only` → pushes to pages repo via `git push --force`. Full wipe on every deploy (~399 files, ~77s).

### Blog Post Schema (key fields)

| Field | Type | Human-editable? |
|-------|------|----------------|
| id | string (UUID) | No |
| blogTitle | string | Yes |
| blogSlug | string | Yes |
| blogIntro | string | Yes |
| blogSections | array of objects | Low value |
| blogConclusion | string | Yes |
| channel | string (enum) | Yes |
| difficulty | beginner/intermediate/advanced | Yes |
| tags | string[] | Yes |
| sources | array of {url, title} | Yes |
| svgContent | object (SVG pixel art) | No — AI-generated |
| diagram | object (Mermaid) | No — AI-generated |
| createdAt | ISO timestamp | No |

### Pain Points Driving CMS Need

1. No UI to trigger generation for a specific topic
2. No way to review/approve AI output before it goes live
3. Minor text corrections require direct JSON editing
4. Deleting a bad post requires manual JSON editing + redeploy
5. No draft/scheduling workflow
6. Full-wipe deploy on every change (399-file commits)

### Constraints

- Must be free (no paid SaaS)
- Must work with GitHub Pages (static hosting only)
- Must not break the existing `generate-blog.js` pipeline
- Editors are developers — no non-technical users today
- Single-developer project; one admin user is sufficient

---

## Options Evaluated

### 1. GitHub Actions workflow_dispatch

The existing `content.yml` workflow already accepts `mode=blog` + `topic` inputs via the GitHub Actions UI. Any user with repo write access can trigger blog generation from the browser.

**Pros:** Zero setup, native GitHub auth, full audit trail, free forever, perfect pipeline integration, handles complex schema via JSON inputs.

**Cons:** GitHub's workflow UI is not a polished CMS, multi-field edits require typing JSON, no visual preview, requires repo write access.

**Verdict:** ✅ Already works. Best fit for this project as-is. Extend with an `editorial-override` mode to support metadata patching.

---

### 2. Custom HTML Admin Page

A single self-contained `admin/index.html` using `@octokit/rest` (CDN) and the GitHub Contents API. PAT-based auth stored in localStorage. Full CRUD: list posts, edit metadata fields, delete posts, trigger workflow dispatch.

**Pros:** Zero external dependencies, full control over schema, works on GitHub Pages, no OAuth server needed, integrates directly with `data/blog-posts.json`.

**Cons:** PAT in localStorage is an XSS risk on shared machines, must be built and maintained, no rich text editor without embedding a library, last-write-wins on concurrent edits.

**Verdict:** ✅ Strong secondary option. ~250 lines of code. Best choice when a browser UI is needed without third-party CMS overhead.

---

### 3. Sveltia CMS

A modern, actively maintained fork of Decap/Netlify CMS. Pure static SPA (~300KB JS bundle) served from `/admin/`. Requires a GitHub OAuth App + one Cloudflare Worker for the OAuth proxy (free tier).

**Pros:** No server required, GitHub OAuth (no implicit flow), modern UI with dark mode and mobile support, config-driven via `config.yml`, actively maintained (v0.156.1, April 2026).

**Cons:** Cannot manage `data/blog-posts.json` as individual entries (must migrate to `content/posts/*.json` + add a merge script), cannot trigger AI generation pipeline, requires GitHub OAuth App setup (~10 min), external CDN dependency.

**Verdict:** ⚠️ Good option if a polished form-based UI is needed. Requires content migration and a merge step in the deploy pipeline.

---

### 4. Decap CMS (formerly Netlify CMS)

Client-side SPA that commits directly to GitHub. Requires Netlify as OAuth broker (or self-hosted proxy) since GitHub removed implicit grant flow.

**Pros:** Free OSS, git-backed, rich widget library, editorial workflow via PRs.

**Cons:** Auth requires Netlify account or self-hosted OAuth proxy, cannot edit root-level JSON arrays natively (requires schema change), development has slowed since Netlify handed it off, implicit flow deprecated.

**Verdict:** ⚠️ Viable but Sveltia CMS is a strictly better maintained fork with the same config format. Prefer Sveltia over Decap.

---

### 5. TinaCMS

Git-backed headless CMS with a form-based admin UI. Requires Tina Cloud (managed backend) or a self-hosted Node.js server. Free tier: 2 users, 1 project.

**Pros:** Framework-agnostic, JSON format support (no pipeline changes), clean form UI, open source.

**Cons:** Requires Tina Cloud account + `TINA_PUBLIC_CLIENT_ID`/`TINA_TOKEN` secrets, `npx tinacms build` step added to CI, free tier capped at 2 users, no visual editing without React, third-party dependency for auth/git layer.

**Verdict:** ❌ Eliminated. Adds third-party dependency and CI complexity for marginal benefit over workflow_dispatch.

---

### 6. Keystatic

TypeScript-first git-backed CMS by Thinkmill. Excellent schema DX. Requires a Node.js server for the admin UI in GitHub mode.

**Pros:** Best-in-class schema definition (TypeScript), excellent UI, branch management, free OSS.

**Cons:** Requires a separate Node.js server (Vercel/Netlify) for the admin UI — GitHub Pages cannot host it. Adds Vercel deployment, GitHub OAuth App, and env var management. Content stored as individual files per post (not compatible with monolithic `data/blog-posts.json`).

**Verdict:** ❌ Eliminated. Server requirement makes it incompatible with a pure GitHub Pages setup.

---

### 7. Static CMS

A fork of Netlify CMS with improved UI.

**Pros:** Was free OSS, GitHub Pages compatible, same config format as Decap.

**Cons:** **ARCHIVED September 9, 2024. No longer maintained.** Do not use for new projects.

**Verdict:** ❌ Eliminated. Abandoned project.

---

### 8. Prose.io

Hosted web app at prose.io that connects to any GitHub repo via OAuth.

**Pros:** Zero setup, free, no server needed.

**Cons:** Markdown only, no structured schema support, no field widgets or validation, essentially a GitHub web editor with markdown preview. Cannot enforce the blog post schema.

**Verdict:** ❌ Eliminated. Too primitive for structured JSON content.

---

### 9. CloudCannon

Managed CMS platform with best-in-class visual editing. Syncs with GitHub repos.

**Pros:** Best visual editing UI, WYSIWYG, component-based editing, no OAuth proxy needed.

**Cons:** **Paid only — starts at ~$55/month.** No permanent free tier. Violates budget constraint.

**Verdict:** ❌ Eliminated. Cost-prohibitive.

---

### 10. Sanity.io

Headless CMS with a hosted Studio UI. Free tier: 10,000 documents, 1M CDN API requests/month, 20 users.

**Pros:** Generous free tier (121 posts = 1.2% of limit), powerful GROQ query language, TypeScript schema, 20 user seats.

**Cons:** Requires migrating content out of `data/blog-posts.json` into Sanity's database, adds API call at build time, webhook → GitHub Actions integration requires GROQ projection to format payload for `repository_dispatch`, creates dual-source-of-truth problem with the existing AI pipeline.

**Verdict:** ❌ Eliminated. Adds API dependency and dual-source-of-truth complexity with no benefit for a developer-only team.

---

### 11. Contentful

Enterprise headless CMS. Free Starter Space: 10,000 records, 100K API calls/month, 2 roles.

**Pros:** Polished UI, good SDKs, webhook support, fits within free tier for current scale.

**Cons:** Same dual-source-of-truth problem as Sanity, 100K API call limit is 2.5× tighter than Sanity, more enterprise-oriented and less developer-friendly schema definition, no advantage over Sanity for this use case.

**Verdict:** ❌ Eliminated. Same reasons as Sanity, with fewer free-tier benefits.

---

## Comparison Matrix

| Option | GH Pages Compatible | Free | Setup Complexity | Editorial UX | Pipeline Integration | Maintenance | Security | Verdict |
|--------|--------------------|----|-----------------|-------------|---------------------|-------------|----------|---------|
| workflow_dispatch | ✅ | ✅ | ⭐ Trivial | ⭐⭐ Basic | ✅ Native | None | ✅ GitHub auth | ✅ Recommended |
| Custom HTML admin | ✅ | ✅ | ⭐⭐⭐ Medium | ⭐⭐⭐ Good | ✅ Direct API | Low | ⚠️ PAT/localStorage | ✅ Secondary |
| Sveltia CMS | ✅ | ✅ | ⭐⭐ Low-Med | ⭐⭐⭐⭐ Modern | Medium (merge script) | Low | ✅ OAuth | ⚠️ Conditional |
| Decap CMS | ⚠️ Partial | ✅ | ⭐⭐⭐ Medium | ⭐⭐⭐ OK | Medium | Medium | ⚠️ Implicit flow risk | ⚠️ Use Sveltia instead |
| TinaCMS | ❌ Needs server | ⚠️ 2-user cap | ⭐⭐⭐⭐⭐ High | ⭐⭐⭐⭐ Good | Low | High | ✅ | ❌ Eliminated |
| Keystatic | ❌ Needs server | ✅ | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐⭐ Excellent | Low | High | ✅ | ❌ Eliminated |
| Static CMS | ✅ (archived) | ✅ | ⭐⭐⭐ Medium | ⭐⭐⭐ OK | Medium | ❌ Dead | ⚠️ | ❌ Abandoned |
| Prose.io | ✅ | ✅ | ⭐ Trivial | ⭐ Minimal | None | None | ✅ | ❌ Too primitive |
| CloudCannon | ✅ | ❌ $55+/mo | ⭐⭐ Low | ⭐⭐⭐⭐⭐ Best | Medium | Low | ✅ | ❌ Paid |
| Sanity.io | ⚠️ Build-time | ⚠️ Limited | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐⭐ Excellent | Low (dual source) | High | ✅ | ❌ Eliminated |
| Contentful | ⚠️ Build-time | ⚠️ Limited | ⭐⭐⭐⭐ High | ⭐⭐⭐⭐⭐ Excellent | Low (dual source) | High | ✅ | ❌ Eliminated |

---

## Recommendation

### Primary: GitHub Actions workflow_dispatch

#### Why Chosen

The blog is ~100% AI-generated. The editorial problem is not "how do I write and format content" — it is "how do I trigger generation, fix a typo, or delete a bad post." The `workflow_dispatch` UI already handles generation. Extending it with an `editorial-override` mode covers the remaining gaps in ~2 hours with zero new dependencies.

Every alternative introduces auth infrastructure, external services, content migration, or ongoing maintenance — for a use case that represents less than 5% of content operations. The cost/benefit does not justify any third-party CMS.

#### Complete Setup Guide

**Step 1: Add `editorial-override` mode to `.github/workflows/content.yml`**

Add these inputs to the existing `workflow_dispatch` block:

```yaml
workflow_dispatch:
  inputs:
    mode:
      description: 'Operation mode'
      type: choice
      options:
        - quick
        - full-pipeline
        - intake
        - blog
        - specific-stage
        - editorial-override   # NEW
    post_id:
      description: 'Post ID to patch (editorial-override mode)'
      required: false
      type: string
    override_fields:
      description: 'JSON fields to patch, e.g. {"blogTitle":"New Title","tags":["aws","devops"]}'
      required: false
      type: string
    post_id_delete:
      description: 'Post ID to delete (editorial-override mode)'
      required: false
      type: string
```

**Step 2: Add the `editorial-override` job to `content.yml`**

```yaml
  editorial-override:
    if: inputs.mode == 'editorial-override'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Apply editorial override
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const path = 'data/blog-posts.json';
            const posts = JSON.parse(fs.readFileSync(path, 'utf8'));

            const postId = '${{ inputs.post_id }}';
            const deleteId = '${{ inputs.post_id_delete }}';
            const overrideRaw = `${{ inputs.override_fields }}`;

            if (deleteId) {
              const before = posts.length;
              const filtered = posts.filter(p => p.id !== deleteId);
              if (filtered.length === before) core.setFailed(`Post ${deleteId} not found`);
              fs.writeFileSync(path, JSON.stringify(filtered, null, 2));
              core.info(`Deleted post ${deleteId}`);
            } else if (postId && overrideRaw) {
              const fields = JSON.parse(overrideRaw);
              const idx = posts.findIndex(p => p.id === postId);
              if (idx === -1) core.setFailed(`Post ${postId} not found`);
              posts[idx] = { ...posts[idx], ...fields };
              fs.writeFileSync(path, JSON.stringify(posts, null, 2));
              core.info(`Patched post ${postId}: ${Object.keys(fields).join(', ')}`);
            } else {
              core.setFailed('Provide either post_id+override_fields or post_id_delete');
            }

      - name: Commit changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/blog-posts.json
          git commit -m "editorial: override post ${{ inputs.post_id }}${{ inputs.post_id_delete }}"
          git push

      - name: Trigger deploy
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.actions.createWorkflowDispatch({
              owner: context.repo.owner,
              repo: context.repo.repo,
              workflow_id: 'deploy-blog.yml',
              ref: 'main'
            });
```

#### Integration with Existing Pipeline

- Reads and writes `data/blog-posts.json` directly — same file the deploy pipeline reads
- Triggers `deploy-blog.yml` after every change via `workflow_dispatch` API call
- Post IDs from the AI pipeline use `sy-*` prefix; manual posts use `manual-{timestamp}` prefix — no collision
- The existing `mode=blog` + `topic` input already handles generation; no changes needed there

#### Editor Workflow

**To generate a post on a specific topic:**
1. Go to Actions → `🤖 Content Pipeline` → Run workflow
2. Set `mode=blog`, enter topic in the `topic` field, set `publish=true`
3. Click Run — post is generated, committed, and deployed automatically

**To fix a typo or update metadata:**
1. Go to Actions → `🤖 Content Pipeline` → Run workflow
2. Set `mode=editorial-override`
3. Enter the post ID in `post_id` (find it in `data/blog-posts.json`)
4. Enter the fields to change as JSON in `override_fields`: `{"blogTitle": "Corrected Title"}`
5. Click Run — change is committed and deploy triggered

**To delete a bad post:**
1. Same as above but use `post_id_delete` instead of `post_id` + `override_fields`

**To find a post ID:** Browse `data/blog-posts.json` in the GitHub UI, or search by slug.

---

### Secondary: Custom HTML Admin Page

#### Why as Fallback

If the team needs a browser-based UI that does not require navigating GitHub's Actions interface, a self-contained `admin/index.html` is the right next step. It uses the same GitHub Contents API that workflow_dispatch uses internally, adds a post list view, and provides form fields for the editable metadata — all without any external CMS dependency.

Use this when: non-technical editors need access, or the workflow_dispatch JSON input UX is too friction-heavy for frequent edits.

#### Setup Guide

**Step 1: Create `admin/index.html` in the source repo**

The page uses `@octokit/rest` from CDN. Auth is a GitHub fine-grained PAT scoped to `contents: write` on `open-interview/open-interview` only. The PAT is entered once per session and stored in `sessionStorage` (not `localStorage`) to reduce XSS exposure window.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Blog Admin</title>
  <script src="https://cdn.jsdelivr.net/npm/@octokit/rest@20/dist-web/rest.js"></script>
  <style>
    body { font-family: system-ui; max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
    input, textarea, select { width: 100%; margin: 0.25rem 0 0.75rem; padding: 0.4rem; box-sizing: border-box; }
    button { padding: 0.5rem 1rem; cursor: pointer; }
    #posts-list a { display: block; padding: 0.3rem 0; }
    .error { color: red; }
    .success { color: green; }
  </style>
</head>
<body>
  <h1>Blog Admin</h1>

  <div id="auth-section">
    <label>GitHub PAT (contents:write scope): <input type="password" id="pat-input"></label>
    <button onclick="initOctokit()">Connect</button>
  </div>

  <div id="main" style="display:none">
    <h2>Posts <button onclick="loadPosts()">Refresh</button></h2>
    <div id="posts-list"></div>

    <h2>Edit Post</h2>
    <label>Post ID: <input id="edit-id" placeholder="sy-..."></label>
    <button onclick="loadPost()">Load</button>
    <div id="edit-form" style="display:none">
      <label>Title: <input id="f-title"></label>
      <label>Intro: <textarea id="f-intro" rows="3"></textarea></label>
      <label>Conclusion: <textarea id="f-conclusion" rows="3"></textarea></label>
      <label>Channel: <input id="f-channel"></label>
      <label>Difficulty:
        <select id="f-difficulty">
          <option>beginner</option><option>intermediate</option><option>advanced</option>
        </select>
      </label>
      <label>Tags (comma-separated): <input id="f-tags"></label>
      <button onclick="savePost()">Save &amp; Deploy</button>
      <button onclick="deletePost()" style="background:red;color:white">Delete Post</button>
    </div>

    <h2>Generate Post</h2>
    <label>Topic: <input id="gen-topic" placeholder="e.g. Kubernetes pod disruption budgets"></label>
    <label>Channel: <input id="gen-channel" placeholder="e.g. kubernetes"></label>
    <button onclick="generatePost()">Generate &amp; Publish</button>

    <p id="status"></p>
  </div>

  <script>
    const OWNER = 'open-interview', REPO = 'open-interview', FILE = 'data/blog-posts.json';
    let octokit, posts = [], fileSha;

    function initOctokit() {
      const pat = document.getElementById('pat-input').value.trim();
      if (!pat) return;
      sessionStorage.setItem('gh_pat', pat);
      octokit = new Octokit({ auth: pat });
      document.getElementById('auth-section').style.display = 'none';
      document.getElementById('main').style.display = 'block';
      loadPosts();
    }

    async function loadPosts() {
      setStatus('Loading...');
      const { data } = await octokit.repos.getContent({ owner: OWNER, repo: REPO, path: FILE });
      fileSha = data.sha;
      posts = JSON.parse(atob(data.content.replace(/\n/g, '')));
      const list = document.getElementById('posts-list');
      list.innerHTML = posts.slice(0, 50).map(p =>
        `<a href="#" onclick="document.getElementById('edit-id').value='${p.id}';loadPost();return false">
          [${p.channel}] ${p.blogTitle} <small>(${p.id})</small>
        </a>`
      ).join('');
      setStatus(`Loaded ${posts.length} posts`);
    }

    async function loadPost() {
      const id = document.getElementById('edit-id').value.trim();
      const post = posts.find(p => p.id === id);
      if (!post) return setStatus('Post not found', true);
      document.getElementById('f-title').value = post.blogTitle || '';
      document.getElementById('f-intro').value = post.blogIntro || '';
      document.getElementById('f-conclusion').value = post.blogConclusion || '';
      document.getElementById('f-channel').value = post.channel || '';
      document.getElementById('f-difficulty').value = post.difficulty || 'intermediate';
      document.getElementById('f-tags').value = (post.tags || []).join(', ');
      document.getElementById('edit-form').style.display = 'block';
    }

    async function savePost() {
      const id = document.getElementById('edit-id').value.trim();
      const idx = posts.findIndex(p => p.id === id);
      if (idx === -1) return setStatus('Post not found', true);
      posts[idx] = {
        ...posts[idx],
        blogTitle: document.getElementById('f-title').value,
        blogIntro: document.getElementById('f-intro').value,
        blogConclusion: document.getElementById('f-conclusion').value,
        channel: document.getElementById('f-channel').value,
        difficulty: document.getElementById('f-difficulty').value,
        tags: document.getElementById('f-tags').value.split(',').map(t => t.trim()).filter(Boolean),
      };
      await commitPosts(`editorial: patch post ${id}`);
      await triggerDeploy();
      setStatus('Saved and deploy triggered');
    }

    async function deletePost() {
      const id = document.getElementById('edit-id').value.trim();
      if (!confirm(`Delete post ${id}?`)) return;
      posts = posts.filter(p => p.id !== id);
      await commitPosts(`editorial: delete post ${id}`);
      await triggerDeploy();
      document.getElementById('edit-form').style.display = 'none';
      setStatus('Deleted and deploy triggered');
      loadPosts();
    }

    async function commitPosts(message) {
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(posts, null, 2))));
      const { data } = await octokit.repos.createOrUpdateFileContents({
        owner: OWNER, repo: REPO, path: FILE, message, content, sha: fileSha
      });
      fileSha = data.content.sha;
    }

    async function triggerDeploy() {
      await octokit.actions.createWorkflowDispatch({
        owner: OWNER, repo: REPO, workflow_id: 'deploy-blog.yml', ref: 'main'
      });
    }

    async function generatePost() {
      const topic = document.getElementById('gen-topic').value.trim();
      const channel = document.getElementById('gen-channel').value.trim();
      await octokit.actions.createWorkflowDispatch({
        owner: OWNER, repo: REPO, workflow_id: 'content.yml', ref: 'main',
        inputs: { mode: 'blog', topic, channel, publish: 'true' }
      });
      setStatus('Generation triggered — check Actions tab for progress');
    }

    function setStatus(msg, isError = false) {
      const el = document.getElementById('status');
      el.textContent = msg;
      el.className = isError ? 'error' : 'success';
    }

    // Restore session
    const saved = sessionStorage.getItem('gh_pat');
    if (saved) { document.getElementById('pat-input').value = saved; initOctokit(); }
  </script>
</body>
</html>
```

**Step 2: Add `/admin/` to `robots.txt`**

```
User-agent: *
Disallow: /admin/
```

**Step 3: Create a fine-grained GitHub PAT**

- Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
- Repository access: `open-interview/open-interview` only
- Permissions: `Contents: Read and write`, `Actions: Read and write`
- Store the token securely (password manager); never commit it

**Step 4: Deploy**

The `admin/index.html` file is committed to the source repo and deployed to GitHub Pages as part of the normal build. It is accessible at `https://openstackdaily.github.io/admin/`.

---

## Implementation Plan

Steps are ordered; each builds on the previous.

**Phase 1 — Extend workflow_dispatch (2 hours)**

1. Open `.github/workflows/content.yml`
2. Add `editorial-override` to the `mode` input options
3. Add `post_id`, `override_fields`, and `post_id_delete` inputs
4. Add the `editorial-override` job (patch/delete logic using `actions/github-script`)
5. Test: run the workflow with `mode=editorial-override`, a known post ID, and `{"blogTitle":"Test Title"}` — verify the commit appears and deploy triggers
6. Test delete: run with `post_id_delete` set to a test post ID

**Phase 2 — Custom HTML Admin Page (1 day, optional)**

7. Create `admin/index.html` with the code from the Secondary recommendation above
8. Add `Disallow: /admin/` to `robots.txt`
9. Commit and push — the file deploys automatically with the next blog build
10. Create a fine-grained PAT (Contents + Actions write, this repo only)
11. Open `https://openstackdaily.github.io/admin/`, enter PAT, verify post list loads
12. Test edit: change a post title, verify commit + deploy trigger
13. Test generate: enter a topic, verify Actions workflow fires

**Phase 3 — Issues-based community requests (optional, low priority)**

14. Add `.github/ISSUE_TEMPLATE/blog-post.yml` with fields: title, channel, difficulty, tags
15. Add `blog-request` label to the repo
16. In `community.yml`, add a handler: when an issue is labeled `blog-request`, call `workflow_dispatch` on `content.yml` with `mode=blog`, `topic=issue.title`, `channel=parsed_channel`
17. Add a comment to the issue with the triggered run URL, then close the issue

---

## Trade-offs & Risks

### Risk 1: PAT exposure in admin page

**What could go wrong:** The PAT stored in `sessionStorage` is readable by any JavaScript running on the page. An XSS vulnerability in a CDN-loaded script (`@octokit/rest`) could exfiltrate it.

**Mitigation:** Use a fine-grained PAT scoped to this repo only with `contents:write` and `actions:write` — minimum permissions. Rotate the PAT every 90 days. Add `robots.txt` disallow. Do not use the admin page on shared/public machines. Consider adding a `Content-Security-Policy` header if the Pages host supports it.

### Risk 2: Concurrent edits overwrite each other

**What could go wrong:** Two editors load the post list simultaneously, both edit different posts, and the second commit overwrites the first because the SHA check only prevents conflicts on the same file version at load time.

**Mitigation:** The `createOrUpdateFileContents` API call uses the SHA from the last `getContent` call. If another commit has happened since, the API returns a 409 conflict error. The admin page should catch this error and prompt the user to reload before retrying. For a single-developer project this is low risk.

### Risk 3: workflow_dispatch JSON input errors

**What could go wrong:** An editor types malformed JSON in the `override_fields` input. The `actions/github-script` step calls `JSON.parse()` and throws, failing the workflow run.

**Mitigation:** The job uses `core.setFailed()` on parse errors, which marks the run as failed without corrupting `data/blog-posts.json`. The file is only written after successful parse. Add a `try/catch` around the parse call and output a clear error message.

### Risk 4: Deploy triggered on bad data

**What could go wrong:** An editorial override introduces a schema-invalid value (e.g., `difficulty: "expert"` instead of `"advanced"`), which causes `generate-blog.js` to fail or produce broken HTML.

**Mitigation:** Add a lightweight schema validation step in the `editorial-override` job before committing. Check that `difficulty` is one of the allowed values, `tags` is an array, etc. The existing `quality_gates` node in the LangGraph pipeline already validates AI-generated content — the same checks can be extracted into a shared validation script.

### Risk 5: `data/blog-posts.json` grows too large for the GitHub Contents API

**What could go wrong:** The Contents API has a 1MB file size limit for reading via the API (larger files require the Git Data API). At 121 posts the file is well under this limit, but at ~1000 posts with full `svgContent` (base64 SVGs) it could exceed it.

**Mitigation:** The incremental deploy plan (already designed in `docs/INCREMENTAL_BLOG_DEPLOY_PLAN.md`) addresses this by moving to individual post files. If the admin page hits the 1MB limit, switch to the Git Data API (`getBlob`) for reading. This is a future concern, not an immediate one.

### Risk 6: Sveltia CMS CDN dependency (if Phase 2 is adopted)

**What could go wrong:** The Sveltia CMS CDN goes down or the project is abandoned, breaking the admin UI.

**Mitigation:** Pin to a specific version tag in the script src URL rather than `@latest`. Keep a local copy of the bundle in the repo as a fallback. Monitor the project's GitHub for activity.

### Risk 7: workflow_dispatch 10-input limit

**What could go wrong:** GitHub's workflow_dispatch UI supports a maximum of 10 inputs. The existing `content.yml` already has 8 inputs; adding 3 more for editorial override hits the limit.

**Mitigation:** Combine `post_id` and `post_id_delete` into a single `target_post_id` input with a separate `action` dropdown (`patch` vs `delete`). This keeps the total at 10 inputs. Alternatively, use a single `payload` JSON input that carries all editorial parameters.
