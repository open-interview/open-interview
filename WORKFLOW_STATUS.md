# Workflow Orchestration Status

> Last updated: 2026-05-02T10:07 UTC

---

## Current Runs (Round 3)

| Run ID | Workflow | Mode | Status |
|--------|----------|------|--------|
| [25249538292](https://github.com/open-interview/open-interview/actions/runs/25249538292) | 🤖 Content | `quick` | 🔄 in_progress |
| [25249538622](https://github.com/open-interview/open-interview/actions/runs/25249538622) | 🤖 Content | `blog` | 🔄 in_progress |
| [25249538996](https://github.com/open-interview/open-interview/actions/runs/25249538996) | 📣 Social | `linkedin-post` dry_run | 🔄 in_progress |
| [25249539349](https://github.com/open-interview/open-interview/actions/runs/25249539349) | 📣 Social | `poll` dry_run | 🔄 queued |
| [25249539704](https://github.com/open-interview/open-interview/actions/runs/25249539704) | 📣 Social | `analytics` | 🔄 in_progress |

---

## All Fixes Applied (cumulative)

| Commit | Fix |
|--------|-----|
| `07e1540d` | `git add -f` for gitignored `client/public/data/` in `social.yml` |
| `54d3e34e` | `git add -f` for gitignored paths in `content.yml`, `ci-cd.yml`, `maintenance.yml` |
| `0e72b188` | Export + commit generated content in `quick-generate`, `manual-intake`, `maintenance` |
| `284c998f` | `permissions: contents: write` on `quick-generate`, `linkedin-post`, `poll`, `analytics` |
| `284c998f` | Fix `article.images?.find` crash — normalize to array in `generate-blog.js` |
| `67c96c51` | Fix SQLite `json()` → PostgreSQL `=` in `session-builder-bot.js` |
| `67c96c51` | Fix `coding_challenges` export — remove non-existent columns (`category`, `companies`, etc.) |
| `67c96c51` | Fix `fetch-bot-monitor-data.js` — `main()` was called but never defined |
| `67c96c51` | Fix `git pull --rebase` "unstaged changes" — add `git stash && ... && git stash pop` in all 10 log event steps across 4 workflows |

---

## Round History

| Round | Trigger | Key Failures |
|-------|---------|--------------|
| 1 (09:32) | Manual test | `git add` gitignored, `403` push, `images.find` crash |
| 2 (09:55) | Post-fix | `403` push (permissions missing), `unstaged changes` on pull |
| 3 (10:07) | Post-fix | Pending results |

---

## Known Non-Errors (expected)

- `poll` dry_run → `No questions found` — empty DB in dry-run, not a bug
- Vector DB unavailable → `ℹ️ No related questions found` — Qdrant not in CI, gracefully handled
- `NOTICE: trigger does not exist, skipping` — harmless SCHEMA.sql idempotency notices
