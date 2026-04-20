# Development Guide

## Project Structure

```
packages/tech-svg-generator/
├── src/                    # TypeScript source files
│   ├── index.ts           # Main exports
│   ├── generator.ts       # Core generation logic & scene detection
│   ├── scenes.ts          # 14 scene type definitions
│   ├── primitives.ts      # SVG building blocks (card, metric, arrow, etc)
│   ├── themes.ts          # 4 color themes
│   ├── icons.ts           # 30+ Lucide-style icon paths
│   └── types.ts           # TypeScript type definitions
├── dist/                  # Compiled JavaScript & type definitions
├── examples/
│   ├── demo.js           # Demo script showing all features
│   └── output/           # Generated SVG examples
├── package.json
├── tsconfig.json
└── README.md
```

## Development Workflow

### Install Dependencies
```bash
npm install
```

### Build
```bash
npm run build
```

Compiles TypeScript to JavaScript in `dist/` directory with source maps and type definitions.

### Watch Mode
```bash
npm run dev
```

Automatically recompiles on file changes.

### Run Demo
```bash
npm run demo
```

Generates example SVGs for all 14 scene types and 4 themes in `examples/output/`.

## Key Design Decisions

### 1. **Zero Dependencies**
- Pure TypeScript with no runtime dependencies
- Only dev dependency is TypeScript itself
- Minimal bundle size (~15KB gzipped)

### 2. **Type Safety**
- Full TypeScript support with strict mode
- Exported type definitions for consumers
- Clear interfaces for all public APIs

### 3. **Modular Architecture**
- `types.ts` - All type definitions
- `themes.ts` - Color themes (easy to add new ones)
- `icons.ts` - Icon library (easy to add new icons)
- `primitives.ts` - Reusable SVG components
- `scenes.ts` - Scene definitions (easy to add new scenes)
- `generator.ts` - Main logic & keyword detection

### 4. **Scene Detection**
- Keyword-based automatic scene selection
- Configurable via `KEYWORDS` map
- Can be overridden with `scene` option

### 5. **Extensibility**
- Add new themes by extending `THEMES` object
- Add new icons by extending `ICONS` object
- Add new scenes by extending `SCENES` object
- Add new keywords by extending `KEYWORDS` map

## Adding New Features

### Add a New Theme
1. Create theme object in `src/themes.ts`
2. Add to `THEMES` export
3. Test with demo

### Add New Icons
1. Add SVG path to `ICONS` in `src/icons.ts`
2. Use in scenes via `icon()` primitive

### Add New Scene Type
1. Create renderer function in `src/scenes.ts`
2. Add to `SCENES` export
3. Add keywords to `KEYWORDS` in `src/generator.ts`
4. Test with demo

### Add New Primitive Component
1. Create function in `src/primitives.ts`
2. Export and use in scenes

## Publishing

### To NPM
```bash
npm run build
npm publish
```

### Version Bumping
```bash
npm version patch   # 1.0.0 → 1.0.1
npm version minor   # 1.0.0 → 1.1.0
npm version major   # 1.0.0 → 2.0.0
```

## Testing

Currently no automated tests. To add:
1. Create `src/__tests__/` directory
2. Add test files with `.test.ts` extension
3. Run: `npm test`

## Performance Notes

- SVG generation is synchronous and fast (~1ms per illustration)
- No external API calls
- Suitable for server-side rendering
- Can generate thousands of SVGs per second

## Browser Compatibility

- Generated SVGs work in all modern browsers
- SVG 1.1 compatible
- No JavaScript required to display SVGs
- Responsive via viewBox attribute

## License

MIT © Satishkumar Dhule
