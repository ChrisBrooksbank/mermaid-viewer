# Mermaid Viewer

[![Netlify Status](https://api.netlify.com/api/v1/badges/5b307190-037a-4f87-bfca-fe03d16784ff/deploy-status)](https://app.netlify.com/sites/mermaid-viewer-app/deploys)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Progressive Web App for viewing and editing [Mermaid](https://mermaid.js.org/) diagrams with pan, zoom, and drag support.

**[Live Demo](https://mermaid-viewer-app.netlify.app)**

## Features

- **Live Preview** - See your diagram update as you type (300ms debounce)
- **Helpful Errors** - Syntax errors show the line number, with a button to jump to it; the last good diagram stays visible
- **Pan & Zoom** - Mouse wheel to zoom, click and drag to pan
- **Touch Support** - Pinch to zoom, drag to pan on mobile
- **Starter Templates** - Flowchart, sequence, class, state, ER, Gantt, pie, mindmap, timeline, git graph, and user journey
- **Share Links** - Copy a link with the diagram compressed into the URL (nothing is sent to a server)
- **Open & Save Files** - Open `.mmd`, `.mermaid`, `.md`, or `.txt` files (or drag and drop them); markdown files load their first ` ```mermaid ` block. Save as `.mmd`
- **Export** - Download or copy to clipboard as SVG or PNG, with a transparent, white, or theme-matched background
- **Themes** - Light and neon dark app themes, plus any of Mermaid's diagram themes (default, neutral, dark, forest, base)
- **Fullscreen** - Focus on the diagram with fullscreen mode
- **Persistent State** - Your work and settings are saved to localStorage
- **PWA** - Install as a standalone app, works offline

## Keyboard Shortcuts

| Shortcut       | Action            |
| -------------- | ----------------- |
| `Ctrl + O`     | Open file         |
| `Ctrl + S`     | Save as `.mmd`    |
| `Ctrl + +`     | Zoom in           |
| `Ctrl + -`     | Zoom out          |
| `Ctrl + 0`     | Reset zoom        |
| `Ctrl + Enter` | Toggle fullscreen |
| `Escape`       | Exit fullscreen   |

On macOS, use `Cmd` instead of `Ctrl`.

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Scripts

| Command             | Description              |
| ------------------- | ------------------------ |
| `npm run dev`       | Start development server |
| `npm run build`     | Production build         |
| `npm run preview`   | Preview production build |
| `npm test`          | Run tests in watch mode  |
| `npm run test:run`  | Run tests once           |
| `npm run lint`      | Check for lint errors    |
| `npm run typecheck` | TypeScript type checking |
| `npm run check`     | Run all checks           |

## Tech Stack

- **[Mermaid](https://mermaid.js.org/)** - Diagram rendering
- **[Panzoom](https://github.com/anvaka/panzoom)** - Pan and zoom interactions
- **[Vite](https://vitejs.dev/)** - Build tool with PWA plugin
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

## Project Structure

```
src/
├── main.ts              # Entry point (loads config, shared links, PWA updates)
├── components/
│   ├── App.ts           # Main orchestrator (file drop, sharing)
│   ├── Editor.ts        # Markdown textarea
│   ├── DiagramView.ts   # Mermaid + panzoom + error display
│   ├── Toolbar.ts       # Controls, templates, settings, export menu
│   ├── Menu.ts          # Dropdown menus
│   ├── Toast.ts         # Notifications
│   └── SplitPane.ts     # Resizable layout
├── core/
│   ├── state.ts         # Observable state
│   ├── storage.ts       # localStorage (validated with Zod)
│   ├── keyboard.ts      # Shortcuts
│   ├── errors.ts        # Mermaid error parsing
│   ├── export.ts        # SVG/PNG export and clipboard
│   ├── files.ts         # Open/save diagram files
│   ├── share.ts         # Share-link encoding
│   └── templates.ts     # Starter templates
├── config/              # App config loading (Zod schema)
├── utils/               # Logger and helpers
├── styles/
│   └── main.css         # Themes + layout
└── types/
    └── app.ts           # Type definitions
```

## License

MIT
