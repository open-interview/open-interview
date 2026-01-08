# Tech SVG Generator

Generate clean, professional SVG illustrations for technical content. Perfect for blogs, documentation, presentations, and README files.

## Features

- 🎨 **14 Scene Types** - Architecture, scaling, database, deployment, security, debugging, testing, performance, API, monitoring, frontend, success, error, and default
- 🔍 **Auto-Detection** - Automatically selects the best scene based on title keywords
- 🌙 **Multiple Themes** - GitHub Dark (default), Dracula, Nord, One Dark
- 📦 **Zero Dependencies** - Pure TypeScript, no external runtime dependencies
- 🖼️ **Consistent Style** - Professional, clean illustrations every time
- ✏️ **Monospace Fonts** - All text uses developer-friendly monospace fonts

## Installation

```bash
npm install tech-svg-generator
```

## Quick Start

```typescript
import { generateSVG } from 'tech-svg-generator';

// Auto-detect scene from title
const result = generateSVG('Database Replication Strategies');
console.log(result.svg);   // SVG string
console.log(result.scene); // 'database'

// Save to file
import fs from 'fs';
fs.writeFileSync('illustration.svg', result.svg);
```

## API

### `generateSVG(title, content?, options?)`

Generate an SVG illustration.

**Parameters:**
- `title` (string) - The title/topic for the illustration
- `content` (string, optional) - Additional content for better scene detection
- `options` (object, optional):
  - `width` (number) - SVG width (default: 700)
  - `height` (number) - SVG height (default: 420)
  - `theme` (string) - Theme name: 'github-dark', 'dracula', 'nord', 'one-dark'
  - `scene` (string) - Force a specific scene type

**Returns:** `GenerateResult`
- `svg` (string) - The generated SVG string
- `scene` (string) - The detected/used scene type
- `width` (number) - SVG width
- `height` (number) - SVG height

### `detectScene(title, content?)`

Detect the best scene type for given text.

```typescript
import { detectScene } from 'tech-svg-generator';

detectScene('Kubernetes Pod Scheduling'); // 'scaling'
detectScene('JWT Authentication Flow');   // 'security'
detectScene('React Performance Tips');    // 'frontend'
```

### `getAvailableScenes()`

Get list of all available scene types.

```typescript
import { getAvailableScenes } from 'tech-svg-generator';

console.log(getAvailableScenes());
// ['architecture', 'scaling', 'database', 'deployment', 'security', ...]
```

## Scene Types

| Scene | Keywords | Description |
|-------|----------|-------------|
| `architecture` | architecture, design, pattern, system, microservice | System architecture diagrams |
| `scaling` | scale, kubernetes, docker, cluster, load | Horizontal scaling visualization |
| `database` | database, sql, postgres, redis, cache | Database with replication |
| `deployment` | deploy, ci, cd, pipeline, release | CI/CD pipeline flow |
| `security` | security, auth, jwt, oauth, firewall | Security flow diagram |
| `debugging` | debug, bug, error, fix, trace | Code debugging scene |
| `testing` | test, jest, coverage, unit, e2e | Test results dashboard |
| `performance` | performance, optimize, latency, cpu | Performance metrics |
| `api` | api, rest, graphql, endpoint, http | API request/response |
| `monitoring` | monitor, metric, log, alert, grafana | Monitoring dashboard |
| `frontend` | frontend, react, vue, css, component | Web vitals metrics |
| `success` | success, complete, launch, shipped | Success celebration |
| `error` | fail, crash, outage, incident, 503 | Error/incident scene |
| `default` | - | Generic system overview |

## Themes

```typescript
import { generateSVG, THEMES } from 'tech-svg-generator';

// Use a specific theme
const result = generateSVG('API Gateway Design', '', { theme: 'dracula' });

// Available themes
console.log(Object.keys(THEMES)); // ['github-dark', 'dracula', 'nord', 'one-dark']
```

## License

MIT © Satishkumar Dhule
