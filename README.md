# Mermaid Viewer

[![Netlify Status](https://api.netlify.com/api/v1/badges/5b307190-037a-4f87-bfca-fe03d16784ff/deploy-status)](https://app.netlify.com/sites/mermaid-viewer-app/deploys)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Progressive Web App for viewing and editing [Mermaid](https://mermaid.js.org/) diagrams with pan, zoom, and drag support.

**[Live Demo](https://mermaid-viewer-app.netlify.app)**

## Features

- **Live Preview** - See your diagram update as you type (300ms debounce)
- **Code Editor** - CodeMirror with Mermaid syntax highlighting, autocomplete (diagram types, keywords, and node names), line numbers, search, and error markers on the failing line
- **Multiple Diagrams** - Work on several diagrams in tabs; double-click a tab to rename it
- **Undo & Version History** - Per-diagram undo/redo, plus snapshots you can save and restore (taken automatically every few minutes while you edit)
- **Helpful Errors** - Syntax errors show the line number, with a button to jump to it; the last good diagram stays visible
- **Pan & Zoom** - Mouse wheel to zoom, click and drag to pan; diagrams stay centred until you take over, and your zoom is kept while you edit. The zoom badge shows the current level (click it to fit)
- **Touch Support** - Pinch to zoom, drag to pan on mobile; the editor/diagram divider can be dragged (or moved with the arrow keys)
- **Starter Templates** - Open a new tab from a template: flowchart, sequence, class, state, ER, Gantt, pie, mindmap, timeline, git graph, and user journey
- **Share Links** - Copy an edit link, a view-only link, or `<iframe>` embed code; the diagram is compressed into the URL (nothing is sent to a server). View-only links open a read-only viewer that doesn't touch the recipient's saved diagrams
- **Open & Save Files** - Open (into a new tab) `.mmd`, `.mermaid`, `.md`, or `.txt` files (or drag and drop them); markdown files load their first ` ```mermaid ` block. Save as `.mmd`
- **Export** - Download or copy to clipboard as SVG or PNG, with a transparent, white, or theme-matched background
- **Themes** - Light and neon dark app themes (following your system setting on first visit), plus any of Mermaid's diagram themes (default, neutral, dark, forest, base)
- **Fullscreen** - Focus on the diagram with fullscreen mode
- **Persistent State** - Your diagrams, history, and settings are saved to localStorage
- **PWA** - Install as a standalone app, works offline

## Keyboard Shortcuts

| Shortcut           | Action            |
| ------------------ | ----------------- |
| `Ctrl + O`         | Open file         |
| `Ctrl + S`         | Save as `.mmd`    |
| `Ctrl + Z`         | Undo              |
| `Ctrl + Shift + Z` | Redo              |
| `Ctrl + F`         | Find in editor    |
| `Ctrl + Space`     | Autocomplete      |
| `Ctrl + +`         | Zoom in           |
| `Ctrl + -`         | Zoom out          |
| `Ctrl + 0`         | Reset zoom        |
| `Ctrl + Enter`     | Toggle fullscreen |
| `Escape`           | Exit fullscreen   |

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
- **[CodeMirror](https://codemirror.net/)** - Code editor
- **[Panzoom](https://github.com/anvaka/panzoom)** - Pan and zoom interactions
- **[Vite](https://vitejs.dev/)** - Build tool with PWA plugin
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety

## Project Structure

```
src/
├── main.ts              # Entry point (loads config, shared links, PWA updates)
├── components/
│   ├── App.ts           # Main orchestrator (editor and view-only layouts)
│   ├── Editor.ts        # CodeMirror editor
│   ├── Tabs.ts          # Diagram tabs
│   ├── HistoryPanel.ts  # Version snapshots
│   ├── DiagramView.ts   # Mermaid + panzoom + error display
│   ├── Toolbar.ts       # Controls, templates, settings, export menu
│   ├── Menu.ts          # Dropdown menus
│   ├── Toast.ts         # Notifications
│   └── SplitPane.ts     # Resizable layout
├── core/
│   ├── state.ts         # Observable state
│   ├── documents.ts     # Tab and snapshot actions
│   ├── snapshots.ts     # Document/snapshot helpers
│   ├── mermaidLanguage.ts # Syntax highlighting and completions
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
