/**
 * App-specific type definitions
 */

export interface AppState {
    markdown: string;
    theme: 'light' | 'dark';
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
