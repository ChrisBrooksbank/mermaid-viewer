# CLAUDE.md

This file provides guidance to Claude Code when working with this codebase.

## Project Overview

A TypeScript web application

## Development Commands

```bash
npm run dev            # Start Vite dev server
npm run build          # Production build
npm run preview        # Preview production build
npm test               # Vitest watch mode
npm run test:run       # Run tests once
npm run test:coverage  # Coverage report
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier format all files
npm run typecheck      # TypeScript type check
npm run knip           # Find unused code
npm run check          # Run all checks
```

## Architecture

### TypeScript with ES Modules

Path aliases configured:

- `@/*` → `src/*`
- `@core/*` → `src/core/*`
- `@utils/*` → `src/utils/*`
- `@config/*` → `src/config/*`
- `@types/*` → `src/types/*`

### Key Patterns

Use Logger instead of console.log:

```typescript
import { Logger } from '@utils/logger';
Logger.info('Message');
Logger.warn('Warning');
Logger.error('Error');
Logger.success('Done');
Logger.debug('Debug'); // Only in debug mode
```

Config is loaded asynchronously and validated with Zod:

```typescript
import { loadConfig, getConfig } from '@config';

// At startup (once):
await loadConfig();

// After initialization:
const config = getConfig();
```

Retry logic for flaky operations:

```typescript
import { retryWithBackoff } from '@utils/helpers';
const data = await retryWithBackoff(() => fetchData());
```
