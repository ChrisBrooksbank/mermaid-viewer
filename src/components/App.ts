/**
 * Main App component - orchestrates all UI components
 */

import type { FileActions } from '@/types/app';
import { getState, initializeState, setState, subscribe } from '@core/state';
import { initKeyboardShortcuts, setDiagramControls, setFileActions } from '@core/keyboard';
import { isDiagramFile, pickFile, readDiagramFile, saveDiagramFile } from '@core/files';
import { buildShareUrl, readSharedDiagram } from '@core/share';
import { createToolbar } from './Toolbar';
import { createEditor } from './Editor';
import { createDiagramView } from './DiagramView';
import { createSplitPane } from './SplitPane';
import { showToast } from './Toast';
import { Logger } from '@utils/logger';

async function loadFile(file: File): Promise<void> {
    if (!isDiagramFile(file)) {
        showToast(`Unsupported file: ${file.name}`, 'error');
        return;
    }
    try {
        setState({ markdown: await readDiagramFile(file) });
        showToast(`Opened ${file.name}`);
    } catch (error) {
        showToast(`Could not read ${file.name}`, 'error');
        Logger.warn('Failed to read file:', String(error));
    }
}

async function copyShareLink(): Promise<void> {
    try {
        const url = await buildShareUrl(getState().markdown, window.location.href);
        await navigator.clipboard.writeText(url);
        showToast('Share link copied to clipboard');
    } catch (error) {
        showToast('Could not copy share link', 'error');
        Logger.warn('Failed to copy share link:', String(error));
    }
}

/** Remove a consumed share hash so reloading doesn't discard later edits */
export function clearShareHash(): void {
    if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }
}

function enableFileDrop(target: HTMLElement): void {
    let dragDepth = 0;

    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false;

    target.addEventListener('dragenter', e => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth++;
        target.classList.add('drop-active');
    });
    target.addEventListener('dragover', e => {
        if (hasFiles(e)) e.preventDefault();
    });
    target.addEventListener('dragleave', () => {
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) target.classList.remove('drop-active');
    });
    target.addEventListener('drop', e => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        dragDepth = 0;
        target.classList.remove('drop-active');
        const file = e.dataTransfer?.files[0];
        if (file) void loadFile(file);
    });
}

export function initApp(container: HTMLElement, sharedMarkdown?: string | null): void {
    Logger.info('Initializing Mermaid Viewer app');

    // Initialize state from localStorage (or a shared link)
    initializeState(sharedMarkdown);

    // Create app container
    const app = document.createElement('div');
    app.className = 'app';

    // Create components
    const editor = createEditor();
    const { element: diagramView, controls } = createDiagramView({
        onGoToLine: editor.goToLine,
    });

    const fileActions: FileActions = {
        openFile: () => {
            void pickFile().then(file => file && loadFile(file));
        },
        saveFile: () => saveDiagramFile(getState().markdown),
    };

    // Register actions for keyboard shortcuts
    setDiagramControls(controls);
    setFileActions(fileActions);

    const toolbar = createToolbar({
        diagram: controls,
        files: fileActions,
        share: () => void copyShareLink(),
    });
    const splitPane = createSplitPane(editor.element, diagramView);

    // Handle fullscreen state
    subscribe(newState => {
        app.classList.toggle('fullscreen', newState.isFullscreen);
    });

    // Assemble app
    app.appendChild(toolbar);
    app.appendChild(splitPane);

    // Mount to container
    container.innerHTML = '';
    container.appendChild(app);

    enableFileDrop(app);

    // Opening a share link in an already-open tab only changes the hash
    window.addEventListener('hashchange', () => {
        void readSharedDiagram(window.location.hash).then(markdown => {
            if (markdown !== null) {
                setState({ markdown });
                clearShareHash();
            }
        });
    });

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    Logger.success('Mermaid Viewer app initialized');
}
