/**
 * App-specific type definitions
 */

export type AppTheme = 'light' | 'dark';

/** Mermaid's built-in themes, plus 'auto' which follows the app theme */
export type MermaidTheme = 'auto' | 'default' | 'neutral' | 'dark' | 'forest' | 'base';

/** Background applied to exported SVG/PNG images */
export type ExportBackground = 'transparent' | 'white' | 'theme';

export interface DiagramSnapshot {
    id: string;
    createdAt: number;
    markdown: string;
    /** Taken automatically (periodically or before a restore) rather than by the user */
    auto: boolean;
}

export interface DiagramDocument {
    id: string;
    name: string;
    markdown: string;
    updatedAt: number;
    /** Newest first */
    snapshots: DiagramSnapshot[];
}

export interface AppState {
    /** Source of the active document */
    markdown: string;
    documents: DiagramDocument[];
    activeDocumentId: string;
    /** View-only mode (opened from a view/embed link); nothing is persisted */
    readOnly: boolean;
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
