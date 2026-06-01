# PostgreSQL Infrastructure Migration Plan

> **Status: OBSOLETE** — This project uses file-based JSON storage. No PostgreSQL infrastructure exists or is planned.

All generation scripts and data pipelines read/write JSON files under `client/public/data/` and `data/`. Vector similarity uses in-memory cosine similarity from `data/vectors/questions.json`.

See `script/pipeline/` for the consolidated content generation pipeline.
