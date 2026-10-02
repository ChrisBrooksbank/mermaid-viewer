/**
 * Main App component - orchestrates all UI components
 */

import type { FileActions } from '@/types/app';
import { getState, initializeState, setState, subscribe } from '@core/state';
import { initKeyboardShortcuts, setDiagramControls, setFileActions } from '@core/keyboard';
import { isDiagramFile, pickFile, readDiagramFile, saveDiagramFile } from '@core/files';
import { buildEmbedCode, buildShareUrl, readShareLink, type ShareLink } from '@core/share';
import { getActiveDocument, openDocument } from '@core/documents';
import { createToolbar, createViewerToolbar } from './Toolbar';
import { createEditor } from './Editor';
import { createDiagramView } from './DiagramView';
import { createSplitPane } from './SplitPane';
import { createTabs } from './Tabs';
import { showToast } from './Toast';
import { Logger } from '@utils/logger';

/** File name without its extension, for use as a diagram name */
function baseName(fileName: string): string {
    return fileName.replace(/\.[^.]+$/, '') || fileName;
}

/** A diagram name made safe for use as a file name */
function fileNameFor(name: string): string {
    const safe = name
        .trim()
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, ' ');
    return `${safe || 'diagram'}.mmd`;
}

async function loadFile(file: File): Promise<void> {
    if (!isDiagramFile(file)) {
        showToast(`Unsupported file: ${file.name}`, 'error');
        return;
    }
    try {
        openDocument(baseName(file.name), await readDiagramFile(file));
        showToast(`Opened ${file.name}`);
    } catch (error) {
        showToast(`Could not read ${file.name}`, 'error');
        Logger.warn('Failed to read file:', String(error));
    }
}

async function copyToClipboard(
    build: () => Promise<string>,
    success: string,
    failure: string
): Promise<void> {
    try {
        await navigator.clipboard.writeText(await build());
        showToast(success);
    } catch (error) {
        showToast(failure, 'error');
        Logger.warn(failure, String(error));
    }
}

/** The page URL without any hash, as the base for share links */
function appUrl(): string {
    return window.location.href.split('#')[0];
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

function createEditorLayout(app: HTMLElement): void {
    const editor = createEditor();
    const { element: diagramView, controls } = createDiagramView({
        onGoToLine: editor.goToLine,
    });

    const fileActions: FileActions = {
        openFile: () => {
            void pickFile().then(file => file && loadFile(file));
        },
        saveFile: () => saveDiagramFile(getState().markdown, fileNameFor(getActiveDocument().name)),
    };

    // Register actions for keyboard shortcuts
    setDiagramControls(controls);
    setFileActions(fileActions);

    const shareUrl = (readOnly: boolean) =>
        buildShareUrl(getState().markdown, appUrl(), { readOnly });

    const toolbar = createToolbar({
        diagram: controls,
        files: fileActions,
        undo: editor.undo,
        redo: editor.redo,
        share: {
            copyEditLink: () =>
                void copyToClipboard(
                    () => shareUrl(false),
                    'Edit link copied',
                    'Could not copy link'
                ),
            copyViewLink: () =>
                void copyToClipboard(
                    () => shareUrl(true),
                    'View-only link copied',
                    'Could not copy link'
                ),
            copyEmbedCode: () =>
                void copyToClipboard(
                    async () => buildEmbedCode(await shareUrl(true)),
                    'Embed code copied',
                    'Could not copy embed code'
                ),
        },
    });

    app.appendChild(toolbar);
    app.appendChild(createTabs());
    app.appendChild(createSplitPane(editor.element, diagramView));

    enableFileDrop(app);

    // Opening a share link in an already-open tab only changes the hash
    window.addEventListener('hashchange', () => {
        void readShareLink(window.location.hash).then(link => {
            if (link && !link.readOnly) {
                openDocument('Shared diagram', link.markdown);
                clearShareHash();
            }
        });
    });
}

function createViewerLayout(app: HTMLElement): void {
    app.classList.add('app--viewer');

    const { element: diagramView, controls } = createDiagramView({ fitOnRender: true });
    setDiagramControls(controls);

    const openInEditor = () => {
        void buildShareUrl(getState().markdown, appUrl()).then(url => {
            window.open(url, '_blank', 'noopener');
        });
    };

    app.appendChild(createViewerToolbar(controls, openInEditor));
    app.appendChild(diagramView);

    window.addEventListener('hashchange', () => {
        void readShareLink(window.location.hash).then(link => {
            if (link) setState({ markdown: link.markdown });
        });
    });
}

export function initApp(container: HTMLElement, shareLink?: ShareLink | null): void {
    Logger.info('Initializing Mermaid Viewer app');

    const readOnly = shareLink?.readOnly ?? false;

    // Initialize state from localStorage (or a shared link)
    initializeState({ sharedMarkdown: shareLink?.markdown, readOnly });

    // Create app container
    const app = document.createElement('div');
    app.className = 'app';

    if (readOnly) {
        createViewerLayout(app);
    } else {
        createEditorLayout(app);
    }

    // Handle fullscreen state
    subscribe(newState => {
        app.classList.toggle('fullscreen', newState.isFullscreen);
    });

    // Mount to container
    container.innerHTML = '';
    container.appendChild(app);

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    Logger.success('Mermaid Viewer app initialized');
}
