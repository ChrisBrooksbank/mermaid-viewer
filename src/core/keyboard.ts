/**
 * Keyboard shortcuts handler
 */

import type { DiagramViewControls, FileActions } from '@/types/app';
import { getState, setState } from './state';

let diagramControls: DiagramViewControls | null = null;
let fileActions: FileActions | null = null;

export function setDiagramControls(controls: DiagramViewControls): void {
    diagramControls = controls;
}

export function setFileActions(actions: FileActions): void {
    fileActions = actions;
}

export function initKeyboardShortcuts(): () => void {
    function handleKeyDown(e: KeyboardEvent): void {
        // Escape to exit fullscreen (no modifier needed)
        if (e.key === 'Escape' && getState().isFullscreen) {
            setState({ isFullscreen: false });
            return;
        }

        const isMod = e.ctrlKey || e.metaKey;

        if (!isMod) return;

        switch (e.key.toLowerCase()) {
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
            case 'enter':
                e.preventDefault();
                setState({ isFullscreen: !getState().isFullscreen });
                break;
            case 's':
                e.preventDefault();
                fileActions?.saveFile();
                break;
            case 'o':
                e.preventDefault();
                fileActions?.openFile();
                break;
        }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}
