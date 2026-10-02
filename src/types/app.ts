/**
 * App-specific type definitions
 */

export type AppTheme = 'light' | 'dark';

/** Mermaid's built-in themes, plus 'auto' which follows the app theme */
export type MermaidTheme = 'auto' | 'default' | 'neutral' | 'dark' | 'forest' | 'base';

/** Background applied to exported SVG/PNG images */
export type ExportBackground = 'transparent' | 'white' | 'theme';

export interface AppState {
    markdown: string;
    theme: AppTheme;
    mermaidTheme: MermaidTheme;
    exportBackground: ExportBackground;
    isFullscreen: boolean;
    error: string | null;
    splitPosition: number;
}

export type StateSubscriber = (state: AppState) => void;

export interface DiagramViewControls {
    resetZoom: () => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitToView: () => void;
}

export interface FileActions {
    openFile: () => void;
    saveFile: () => void;
}
