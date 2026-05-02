# Workflow Orchestration Status

> Last updated: 2026-05-02T09:56 UTC

---

## Current Runs (Round 2 — post-fix)

| Run ID | Workflow | Mode | Status |
|--------|----------|------|--------|
| [25249348215](https://github.com/open-interview/open-interview/actions/runs/25249348215) | 🤖 Content | `quick` | 🔄 in_progress |
| [25249348486](https://github.com/open-interview/open-interview/actions/runs/25249348486) | 🤖 Content | `blog` | 🔄 in_progress |
| [25249348753](https://github.com/open-interview/open-interview/actions/runs/25249348753) | 📣 Social | `linkedin-post` dry_run | 🔄 in_progress |
| [25249349092](https://github.com/open-interview/open-interview/actions/runs/25249349092) | 📣 Social | `poll` dry_run | 🔄 in_progress |
| [25249349422](https://github.com/open-interview/open-interview/actions/runs/25249349422) | 📣 Social | `analytics` | 🔄 in_progress |
| [25248968173](https://github.com/open-interview/open-interview/actions/runs/25248968173) | 🤖 Content | `full-pipeline` | 🔄 in_progress (long-running) |

---

## Round 1 Results (09:32 UTC)

| Run ID | Mode | Result | Root Cause |
|--------|------|--------|------------|
| [25248967860](https://github.com/open-interview/open-interview/actions/runs/25248967860) | content `quick` | ❌ | `403` git push — missing `permissions: contents: write` |
| [25248968521](https://github.com/open-interview/open-interview/actions/runs/25248968521) | content `intake` | ✅ | — |
| [25248968873](https://github.com/open-interview/open-interview/actions/runs/25248968873) | content `blog` | ❌ | `TypeError: article.images?.find is not a function` |
| [25248969204](https://github.com/open-interview/open-interview/actions/runs/25248969204) | social `linkedin-post` | ❌ | `403` git push — missing `permissions: contents: write` |
| [25248969525](https://github.com/open-interview/open-interview/actions/runs/25248969525) | social `poll` | ❌ | `No questions found` (empty DB) + `403` on log push |
| [25248969872](https://github.com/open-interview/open-interview/actions/runs/25248969872) | social `analytics` | ❌ | `403` git push — missing `permissions: contents: write` |

---

## Fixes Applied

| Time | Fix | Commit |
|------|-----|--------|
| 09:25 | `git add -f` for gitignored `client/public/data/` in `social.yml` | `07e1540d` |
| 09:28 | `git add -f` for gitignored paths in `content.yml`, `ci-cd.yml`, `maintenance.yml` | `54d3e34e` |
| 09:32 | Export + commit generated content in `quick-generate`, `manual-intake`, `maintenance` | `0e72b188` |
| 09:56 | `permissions: contents: write` on `quick-generate`, `linkedin-post`, `poll`, `analytics` | `284c998f` |
| 09:56 | Fix `article.images?.find` crash in `generate-blog.js` — normalize to array | `284c998f` |

---

## Pending

- [ ] Verify Round 2 runs pass
- [ ] `full-pipeline` `25248968173` — check when complete
- [ ] `poll` dry_run — may still show `No questions found` (empty DB is expected in dry-run without seed)
