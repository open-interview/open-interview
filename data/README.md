# data/

This directory contains the exported question data used to build the static site.

Files here are committed to the repository so GitHub Actions can build without a live database.

## Contents

| Path | Description |
|------|-------------|
| `questions/` | One JSON file per topic channel (aws.json, kubernetes.json, etc.) |
| `certifications/` | Certification metadata and question mappings |
| `learning-paths/` | Curated learning path definitions |
| `meta/` | Channel index, stats, and other metadata |

## Updating data

After adding or editing questions in the database, re-export:

```bash
pnpm run data:export
```

Then commit the changed files.

## Importing into a local database

To seed a fresh local PostgreSQL instance:

```bash
pnpm run data:import
```

See [docs/data-storage.md](../docs/data-storage.md) for the full workflow.
