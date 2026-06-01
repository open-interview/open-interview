# GitHub Actions Setup Guide

> **Status: OBSOLETE** — This project uses file-based JSON storage. No database setup is needed in CI.

All scripts use `getDb()` which reads/writes JSON files under `data/` and `client/public/data/`. The `DATABASE_URL` environment variable is not required by any active code path.
