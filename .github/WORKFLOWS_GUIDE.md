# GitHub Actions Workflows Guide

> **Last updated:** 2026-04-18 — Reorganised from 12 → 5 workflows

## Overview

| Workflow | File | Replaces | Trigger |
|----------|------|----------|---------|
| 🚀 CI/CD Pipeline | `ci-cd.yml` | `deploy.yml` + `lighthouse.yml` + `manual-e2e.yml` | push/main, PR, schedule daily 2AM, manual |
| 🤖 Content Pipeline | `content.yml` | `content-generation.yml` + `manual-intake.yml` + `manual-blog.yml` | schedule hourly/daily/8AM, manual |
| 🔄 Community & Quality | `community.yml` | `issue-processing.yml` + `duplicate-check.yml` + `setup-labels.yml` | issues, schedule, push to workflow, manual |
| 📣 Social & Analytics | `social.yml` | `social-media.yml` | schedule daily 5AM/weekly Tue, manual |
| 🔧 Repo Maintenance | `maintenance.yml` | `update-readme.yml` + `generate-learning-paths.yml` | push to channels-config or script, manual |

---

## Workflow Details

### 🚀 `ci-cd.yml` — CI/CD Pipeline

**Job DAG:**
```
build
  └── quality  (E2E smoke + Lighthouse, skipped on schedule)
        └── staging  (push + manual:staging)
              └── production  (push + schedule + manual:production)
```

**Key improvements over old workflows:**
- Lighthouse reuses the build artifact — no second full build per PR
- Manual E2E is now `quality` job with `e2e_pattern`/`e2e_browser` dispatch inputs
- Single workflow for all deployment concerns

**Manual dispatch inputs:**
- `environment`: `all` / `staging` / `production`
- `reason`: free text
- `run_e2e`: boolean (default true)
- `e2e_pattern`: test file or grep pattern
- `e2e_browser`: `chromium` / `firefox` / `webkit` / `all`

---

### 🤖 `content.yml` — Content Pipeline

**Job DAG:**
```
[hourly]  quick-generate

[daily 2AM]  ingest (creator→analysis→verifier→processor sequential steps)
               └── enrich (blog+voice+intelligence+coding parallel steps)
                     └── finalize (monitor commit + summary)

[daily 8AM]  flashcards-and-maintenance

[manual mode=intake]  manual-intake
[manual mode=blog]    manual-blog
```

**Key improvements:**
- `ingest` consolidates 4 jobs → 4 sequential steps (saves ~9 min of runner spin-up)
- `enrich` consolidates 4 jobs → parallel steps (saves ~9 min of runner spin-up)
- Manual intake and blog are now dispatch modes, not separate workflow files

**Manual dispatch inputs:**
- `mode`: `quick` / `full-pipeline` / `intake` / `blog` / `specific-stage`
- `stage`: specific stage to run
- `count`, `channel`, `aggressive`, `topic`, `publish`, `question`

---

### 🔄 `community.yml` — Community & Quality

**Job DAG:**
```
setup-labels  (push to this file OR task=labels)

check-trigger → process-issues (local + external as parallel steps) → cleanup-stale → summary

duplicate-scan → reconcile  (weekly + task=duplicates)
```

**Key improvements:**
- `process-issues` handles both local and external in one job
- `setup-labels` is triggered on push to this file (self-bootstrapping)
- Duplicate scan and reconcile are in one job

**Manual dispatch inputs:**
- `task`: `issues` / `duplicates` / `labels` / `all`
- `source`, `source_repo`, `max_issues`, `force_reprocess`
- `content_type`, `channel`, `auto_fix`

---

### 📣 `social.yml` — Social & Analytics

**Job DAG:**
```
linkedin-post  (daily 5AM + manual)
poll           (weekly Tue + manual) — standard OR use-case as conditional steps
analytics      (daily 5AM + manual)
summary
```

**Key improvements:**
- 3 poll jobs (`linkedin-poll`, `linkedin-poll-usecase`, `opencode-poll-generator`) merged into 1 `poll` job with conditional steps
- `use_poll_usecase` input selects which poll variant to run

---

### 🔧 `maintenance.yml` — Repo Maintenance

**Job DAG:**
```
update-readme  ─┐
                ├─ (parallel) ─ summary
generate-paths ─┘
```

**Key improvements:**
- Both jobs run in parallel, preventing the double-commit race condition when `channels-config.ts` changes

---

## Testing Infrastructure

### Test Tiers

| Tier | Script | What it runs | When |
|------|--------|-------------|------|
| T1: Smoke | `tests/run-smoke.sh` | `e2e/core.spec.ts` only | Every push (~60s) |
| T2: Regression | `tests/run-regression.sh` | All chromium-desktop specs | Daily CI + manual |
| T3: Audit | `tests/run-audit.sh` | Accessibility, contrast, Lighthouse | Weekly CI + manual |
| T4: Unit | `tests/run-unit.sh` | Vitest unit tests for bots/scripts | Every push (~30s) |
| Integration | `tests/run-bot-integration.sh` | Bot integration tests | Manual |

### Playwright Projects

| Project | Runs | Specs |
|---------|------|-------|
| `chromium-desktop` | T1 + T2 | All functional specs |
| `lighthouse` | T3 | `lighthouse.spec.ts` |
| `iphone13-audit` | T3 | `iphone13-ui-audit.spec.ts` |
| `audit` | T3 | Accessibility, contrast, keyboard, reduced-motion specs |

### Content Quality Gate

```bash
node script/test-content-quality.js
```

Checks all questions against format rules. Exits with code 1 if >1% are invalid.

---

## Migration Summary

| Before (12 files) | After (5 files) |
|-------------------|-----------------|
| `deploy.yml` | → `ci-cd.yml` |
| `lighthouse.yml` | → `ci-cd.yml` (`quality` job) |
| `manual-e2e.yml` | → `ci-cd.yml` (`quality` job, dispatch) |
| `content-generation.yml` | → `content.yml` |
| `manual-intake.yml` | → `content.yml` (`manual-intake` job) |
| `manual-blog.yml` | → `content.yml` (`manual-blog` job) |
| `issue-processing.yml` | → `community.yml` |
| `duplicate-check.yml` | → `community.yml` (`duplicate-scan` job) |
| `setup-labels.yml` | → `community.yml` (`setup-labels` job) |
| `social-media.yml` | → `social.yml` |
| `update-readme.yml` | → `maintenance.yml` |
| `generate-learning-paths.yml` | → `maintenance.yml` |

> **Note:** `deploy-blog.yml` is unchanged (not part of this reorganisation).
