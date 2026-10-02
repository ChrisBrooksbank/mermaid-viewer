/**
 * Toolbar component with file, zoom, theme, settings, and export controls
 */

import type { DiagramViewControls, ExportBackground, FileActions, MermaidTheme } from '@/types/app';
import { getState, setState, subscribe, applyTheme } from '@core/state';
import { copyPng, copySvg, downloadPng, downloadSvg, resolveBackground } from '@core/export';
import { TEMPLATES } from '@core/templates';
import { openDocument } from '@core/documents';
import { createHistoryPanel } from './HistoryPanel';
import { createMenu } from './Menu';
import { showToast } from './Toast';

// SVG icons
const icons = {
    zoomIn: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    zoomOut: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
    reset: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
    fit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`,
    fullscreen: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
    exitFullscreen: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    download: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    open: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    save: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`,
    template: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    share: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    settings: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
    undo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
    redo: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>`,
    history: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    edit: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>`,
};

export interface ShareActions {
    copyEditLink: () => void;
    copyViewLink: () => void;
    copyEmbedCode: () => void;
}

export interface ToolbarActions {
    diagram: DiagramViewControls;
    files: FileActions;
    share: ShareActions;
    undo: () => void;
    redo: () => void;
}

function createButton(icon: string, title: string, onClick?: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'toolbar__btn';
    btn.innerHTML = icon;
    btn.title = title;
    btn.setAttribute('aria-label', title);
    btn.type = 'button';
    if (onClick) btn.addEventListener('click', onClick);
    return btn;
}

function createSeparator(): HTMLElement {
    const separator = document.createElement('div');
    separator.className = 'toolbar__separator';
    return separator;
}

function createSelect<T extends string>(
    label: string,
    options: { value: T; label: string }[],
    getValue: () => T,
    onChange: (value: T) => void
): HTMLLabelElement {
    const wrapper = document.createElement('label');
    wrapper.className = 'settings__field';

    const text = document.createElement('span');
    text.textContent = label;

    const select = document.createElement('select');
    select.className = 'settings__select';
    for (const option of options) {
        const el = document.createElement('option');
        el.value = option.value;
        el.textContent = option.label;
        select.appendChild(el);
    }
    select.value = getValue();
    select.addEventListener('change', () => onChange(select.value as T));
    subscribe(() => {
        if (select.value !== getValue()) select.value = getValue();
    });

    wrapper.appendChild(text);
    wrapper.appendChild(select);
    return wrapper;
}

function createSettingsPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'settings';

    panel.appendChild(
        createSelect<MermaidTheme>(
            'Diagram theme',
            [
                { value: 'auto', label: 'Match app theme' },
                { value: 'default', label: 'Default' },
                { value: 'neutral', label: 'Neutral' },
                { value: 'dark', label: 'Dark' },
                { value: 'forest', label: 'Forest' },
                { value: 'base', label: 'Base' },
            ],
            () => getState().mermaidTheme,
            mermaidTheme => setState({ mermaidTheme })
        )
    );

    panel.appendChild(
        createSelect<ExportBackground>(
            'Export background',
            [
                { value: 'transparent', label: 'Transparent' },
                { value: 'white', label: 'White' },
                { value: 'theme', label: 'Match app theme' },
            ],
            () => getState().exportBackground,
            exportBackground => setState({ exportBackground })
        )
    );

    return panel;
}

async function runExport(action: (background: string | null) => unknown, done?: string) {
    const { exportBackground, theme } = getState();
    try {
        await action(resolveBackground(exportBackground, theme));
        if (done) showToast(done);
    } catch (error) {
        showToast(error instanceof Error ? error.message : String(error), 'error');
    }
}

function createTitle(): HTMLElement {
    const title = document.createElement('span');
    title.className = 'toolbar__title';
    title.textContent = 'Mermaid Viewer';
    return title;
}

function createZoomGroup(diagramControls: DiagramViewControls): HTMLElement {
    const zoomGroup = document.createElement('div');
    zoomGroup.className = 'toolbar__group';
    zoomGroup.appendChild(createButton(icons.zoomIn, 'Zoom In (Ctrl++)', diagramControls.zoomIn));
    zoomGroup.appendChild(
        createButton(icons.zoomOut, 'Zoom Out (Ctrl+-)', diagramControls.zoomOut)
    );
    zoomGroup.appendChild(
        createButton(icons.reset, 'Reset Zoom (Ctrl+0)', diagramControls.resetZoom)
    );
    zoomGroup.appendChild(createButton(icons.fit, 'Fit to View', diagramControls.fitToView));
    return zoomGroup;
}

function createThemeButton(): HTMLButtonElement {
    const themeBtn = createButton(
        getState().theme === 'dark' ? icons.sun : icons.moon,
        'Toggle Theme',
        () => {
            const newTheme = getState().theme === 'dark' ? 'light' : 'dark';
            setState({ theme: newTheme });
            applyTheme(newTheme);
        }
    );
    subscribe(state => {
        themeBtn.innerHTML = state.theme === 'dark' ? icons.sun : icons.moon;
    });
    return themeBtn;
}

function createFullscreenButton(): HTMLButtonElement {
    const fullscreenBtn = createButton(icons.fullscreen, 'Fullscreen (Ctrl+Enter)', () => {
        setState({ isFullscreen: !getState().isFullscreen });
    });
    subscribe(state => {
        fullscreenBtn.innerHTML = state.isFullscreen ? icons.exitFullscreen : icons.fullscreen;
        fullscreenBtn.title = state.isFullscreen
            ? 'Exit Fullscreen (Escape)'
            : 'Fullscreen (Ctrl+Enter)';
        fullscreenBtn.setAttribute('aria-label', fullscreenBtn.title);
    });
    return fullscreenBtn;
}

function createExportMenu(): HTMLElement {
    return createMenu(createButton(icons.download, 'Export'), [
        { label: 'Download SVG', onSelect: () => void runExport(downloadSvg) },
        { label: 'Download PNG', onSelect: () => void runExport(downloadPng) },
        { label: 'Copy SVG', onSelect: () => void runExport(copySvg, 'SVG copied') },
        { label: 'Copy PNG', onSelect: () => void runExport(copyPng, 'PNG copied') },
    ]);
}

export function createToolbar(actions: ToolbarActions): HTMLElement {
    const { files, share } = actions;

    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    // File controls
    const fileGroup = document.createElement('div');
    fileGroup.className = 'toolbar__group';
    fileGroup.appendChild(createButton(icons.open, 'Open File (Ctrl+O)', files.openFile));
    fileGroup.appendChild(createButton(icons.save, 'Save as .mmd (Ctrl+S)', files.saveFile));
    fileGroup.appendChild(
        createMenu(
            createButton(icons.template, 'New from Template'),
            TEMPLATES.map(template => ({
                label: template.name,
                onSelect: () => openDocument(template.name, template.code),
            }))
        )
    );
    fileGroup.appendChild(
        createMenu(createButton(icons.share, 'Share'), [
            { label: 'Copy edit link', onSelect: share.copyEditLink },
            { label: 'Copy view-only link', onSelect: share.copyViewLink },
            { label: 'Copy embed code', onSelect: share.copyEmbedCode },
        ])
    );

    // Edit history
    const historyGroup = document.createElement('div');
    historyGroup.className = 'toolbar__group';
    historyGroup.appendChild(createButton(icons.undo, 'Undo (Ctrl+Z)', actions.undo));
    historyGroup.appendChild(createButton(icons.redo, 'Redo (Ctrl+Shift+Z)', actions.redo));
    const history = createHistoryPanel();
    historyGroup.appendChild(
        createMenu(createButton(icons.history, 'Version History'), history.element, {
            onOpen: history.refresh,
        })
    );

    // View controls
    const viewGroup = document.createElement('div');
    viewGroup.className = 'toolbar__group';
    viewGroup.appendChild(createThemeButton());
    viewGroup.appendChild(createFullscreenButton());
    viewGroup.appendChild(
        createMenu(createButton(icons.settings, 'Settings'), createSettingsPanel())
    );

    toolbar.appendChild(createTitle());
    toolbar.appendChild(fileGroup);
    toolbar.appendChild(createSeparator());
    toolbar.appendChild(historyGroup);
    toolbar.appendChild(createSeparator());
    toolbar.appendChild(createZoomGroup(actions.diagram));
    toolbar.appendChild(createSeparator());
    toolbar.appendChild(viewGroup);
    toolbar.appendChild(createSeparator());
    toolbar.appendChild(createExportMenu());

    return toolbar;
}

/**
 * Compact toolbar for view-only links and embeds
 */
export function createViewerToolbar(
    diagramControls: DiagramViewControls,
    openInEditor: () => void
): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar toolbar--viewer';

    const viewGroup = document.createElement('div');
    viewGroup.className = 'toolbar__group';
    viewGroup.appendChild(createThemeButton());
    viewGroup.appendChild(createExportMenu());
    viewGroup.appendChild(createButton(icons.edit, 'Open in Editor', openInEditor));

    toolbar.appendChild(createTitle());
    toolbar.appendChild(createZoomGroup(diagramControls));
    toolbar.appendChild(createSeparator());
    toolbar.appendChild(viewGroup);

    return toolbar;
}
