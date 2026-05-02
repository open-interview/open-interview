# Workflow Orchestration Status

> Last updated: 2026-05-02T09:54 UTC  
> Tracking test run triggered at 09:32 UTC

---

## Run Summary

| Run ID | Workflow | Job/Mode | Status | Duration | Notes |
|--------|----------|----------|--------|----------|-------|
| [25248967860](https://github.com/open-interview/open-interview/actions/runs/25248967860) | 🤖 Content Pipeline | `quick` | ❌ failure | 7m28s | |
| [25248968173](https://github.com/open-interview/open-interview/actions/runs/25248968173) | 🤖 Content Pipeline | `full-pipeline` | 🔄 in_progress | 21m+ | |
| [25248968521](https://github.com/open-interview/open-interview/actions/runs/25248968521) | 🤖 Content Pipeline | `intake` | ✅ success | 4m27s | |
| [25248968873](https://github.com/open-interview/open-interview/actions/runs/25248968873) | 🤖 Content Pipeline | `blog` | ❌ failure | 7m14s | |
| [25248969204](https://github.com/open-interview/open-interview/actions/runs/25248969204) | 📣 Social & Analytics | `linkedin-post` (dry_run) | ❌ failure | 1m11s | |
| [25248969525](https://github.com/open-interview/open-interview/actions/runs/25248969525) | 📣 Social & Analytics | `poll` (dry_run) | ❌ failure | 1m13s | |
| [25248969872](https://github.com/open-interview/open-interview/actions/runs/25248969872) | 📣 Social & Analytics | `analytics` | ❌ failure | 1m7s | |

---

## Pending Investigation

- [ ] `25248967860` — content `quick` failure
- [ ] `25248968873` — content `blog` failure
- [ ] `25248969204` — social `linkedin-post` failure
- [ ] `25248969525` — social `poll` failure
- [ ] `25248969872` — social `analytics` failure
- [ ] `25248968173` — content `full-pipeline` still running
- [ ] CI/CD pipeline failures on recent pushes

---

## Fixes Applied

| Time | Fix | Commit |
|------|-----|--------|
| 09:25 | `git add -f` for gitignored `client/public/data/events.json` in `social.yml` | `07e1540d` |
| 09:28 | `git add -f` for gitignored paths in `content.yml`, `ci-cd.yml`, `maintenance.yml` | `54d3e34e` |
| 09:32 | Export + commit generated content back to repo in `quick-generate`, `manual-intake`, `maintenance` jobs | `0e72b188` |

---

## Debug Log

<!-- Entries added as jobs complete -->
