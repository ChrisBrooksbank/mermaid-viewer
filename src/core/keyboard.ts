/**
 * Keyboard shortcuts handler
 */

import type { DiagramViewControls } from '@/types/app';
import { getState, setState } from './state';

let diagramControls: DiagramViewControls | null = null;

export function setDiagramControls(controls: DiagramViewControls): void {
    diagramControls = controls;
}

export function initKeyboardShortcuts(): () => void {
    function handleKeyDown(e: KeyboardEvent): void {
        const isMod = e.ctrlKey || e.metaKey;

        if (!isMod) return;

        switch (e.key) {
            case '=':
            case '+':
                e.preventDefault();
                diagramControls?.zoomIn();
                break;
            case '-':
                e.preventDefault();
                diagramControls?.zoomOut();
                break;
            case '0':
                e.preventDefault();
                diagramControls?.resetZoom();
                break;
            case 'Enter':
                e.preventDefault();
                setState({ isFullscreen: !getState().isFullscreen });
                break;
        }

        // Escape to exit fullscreen (no modifier needed)
        if (e.key === 'Escape' && getState().isFullscreen) {
            setState({ isFullscreen: false });
        }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}
