# Mermaid Viewer

[![Netlify Status](https://api.netlify.com/api/v1/badges/5b307190-037a-4f87-bfca-fe03d16784ff/deploy-status)](https://app.netlify.com/sites/mermaid-viewer-app/deploys)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Progressive Web App for viewing and editing [Mermaid](https://mermaid.js.org/) diagrams with pan, zoom, and drag support.

**[Live Demo](https://mermaid-viewer-app.netlify.app)**

## Features

- **Live Preview** - See your diagram update as you type (300ms debounce)
- **Pan & Zoom** - Mouse wheel to zoom, click and drag to pan
- **Touch Support** - Pinch to zoom, drag to pan on mobile
- **Dark Mode** - Toggle between light and dark themes
- **Fullscreen** - Focus on the diagram with fullscreen mode
- **Download SVG** - Export your diagram as an SVG file
- **Persistent State** - Your work is saved to localStorage
- **PWA** - Install as a standalone app, works offline

## Keyboard Shortcuts

| Shortcut       | Action            |
| -------------- | ----------------- |
| `Ctrl + +`     | Zoom in           |
| `Ctrl + -`     | Zoom out          |
| `Ctrl + 0`     | Reset zoom        |
| `Ctrl + Enter` | Toggle fullscreen |
| `Escape`       | Exit fullscreen   |

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
├── main.ts              # Entry point
├── components/
│   ├── App.ts           # Main orchestrator
│   ├── Editor.ts        # Markdown textarea
│   ├── DiagramView.ts   # Mermaid + panzoom
│   ├── Toolbar.ts       # Controls
│   └── SplitPane.ts     # Resizable layout
├── core/
│   ├── state.ts         # Observable state
│   ├── storage.ts       # localStorage
│   └── keyboard.ts      # Shortcuts
├── styles/
│   └── main.css         # Themes + layout
└── types/
    └── app.ts           # Type definitions
```

## License

MIT
