/**
 * Toolbar component with zoom, theme, and fullscreen controls
 */

import type { DiagramViewControls } from '@/types/app';
import { getState, setState, subscribe, applyTheme } from '@core/state';

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
};

function createButton(icon: string, title: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'toolbar__btn';
    btn.innerHTML = icon;
    btn.title = title;
    btn.type = 'button';
    btn.addEventListener('click', onClick);
    return btn;
}

function downloadSvg() {
    const svg = document.querySelector('#mermaid-container svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    link.click();

    URL.revokeObjectURL(url);
}

export function createToolbar(diagramControls: DiagramViewControls): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'toolbar';

    const title = document.createElement('span');
    title.className = 'toolbar__title';
    title.textContent = 'Mermaid Viewer';

    // Zoom controls
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

    const separator1 = document.createElement('div');
    separator1.className = 'toolbar__separator';

    // Theme toggle
    const themeBtn = createButton(
        getState().theme === 'dark' ? icons.sun : icons.moon,
        'Toggle Theme',
        () => {
            const newTheme = getState().theme === 'dark' ? 'light' : 'dark';
            setState({ theme: newTheme });
            applyTheme(newTheme);
        }
    );

    // Fullscreen toggle
    const fullscreenBtn = createButton(icons.fullscreen, 'Fullscreen (Ctrl+Enter)', () => {
        setState({ isFullscreen: !getState().isFullscreen });
    });

    const separator2 = document.createElement('div');
    separator2.className = 'toolbar__separator';

    // Download button
    const downloadBtn = createButton(icons.download, 'Download SVG', downloadSvg);

    // Update button states on state change
    subscribe(state => {
        themeBtn.innerHTML = state.theme === 'dark' ? icons.sun : icons.moon;
        fullscreenBtn.innerHTML = state.isFullscreen ? icons.exitFullscreen : icons.fullscreen;
        fullscreenBtn.title = state.isFullscreen
            ? 'Exit Fullscreen (Escape)'
            : 'Fullscreen (Ctrl+Enter)';
    });

    toolbar.appendChild(title);
    toolbar.appendChild(zoomGroup);
    toolbar.appendChild(separator1);
    toolbar.appendChild(themeBtn);
    toolbar.appendChild(fullscreenBtn);
    toolbar.appendChild(separator2);
    toolbar.appendChild(downloadBtn);

    return toolbar;
}
