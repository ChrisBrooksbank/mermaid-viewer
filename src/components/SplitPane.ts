/**
 * Resizable split pane component
 */

import { getState, setState, subscribe } from '@core/state';

// Matches the stacked (editor above diagram) layout in main.css
const STACKED_LAYOUT = '(max-width: 768px)';

export function createSplitPane(
    editorContent: HTMLElement,
    diagramContent: HTMLElement
): HTMLElement {
    const container = document.createElement('div');
    container.className = 'split-pane';

    const editorPane = document.createElement('div');
    editorPane.className = 'split-pane__editor';
    editorPane.appendChild(editorContent);

    const divider = document.createElement('div');
    divider.className = 'split-pane__divider';
    divider.setAttribute('role', 'separator');
    divider.setAttribute('aria-label', 'Resize editor');
    divider.tabIndex = 0;

    const diagramPane = document.createElement('div');
    diagramPane.className = 'split-pane__diagram';
    diagramPane.appendChild(diagramContent);

    container.appendChild(editorPane);
    container.appendChild(divider);
    container.appendChild(diagramPane);

    // Set initial split position
    // CSS uses this as the editor's width (side by side) or height (stacked)
    const updateSplitPosition = (position: number) => {
        container.style.setProperty('--split-position', `${position}%`);
        divider.setAttribute('aria-valuenow', String(Math.round(position)));
    };
    updateSplitPosition(getState().splitPosition);

    // Subscribe to state changes
    subscribe(state => {
        updateSplitPosition(state.splitPosition);
    });

    // Drag handling
    let isDragging = false;
    const isStacked = () => window.matchMedia?.(STACKED_LAYOUT).matches ?? false;

    const startDrag = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDragging = true;
        divider.classList.add('dragging');
        document.body.style.cursor = isStacked() ? 'row-resize' : 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const stopDrag = () => {
        if (!isDragging) return;
        isDragging = false;
        divider.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    };

    const onDrag = (e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;

        const point = 'touches' in e ? e.touches[0] : e;
        const rect = container.getBoundingClientRect();
        const position = isStacked()
            ? ((point.clientY - rect.top) / rect.height) * 100
            : ((point.clientX - rect.left) / rect.width) * 100;

        // Clamp between 20% and 80%
        const clamped = Math.min(80, Math.max(20, position));
        setState({ splitPosition: clamped });
    };

    // Arrow keys resize too
    divider.addEventListener('keydown', e => {
        const step = { ArrowLeft: -5, ArrowUp: -5, ArrowRight: 5, ArrowDown: 5 }[e.key];
        if (step === undefined) return;
        e.preventDefault();
        setState({ splitPosition: Math.min(80, Math.max(20, getState().splitPosition + step)) });
    });

    divider.addEventListener('mousedown', startDrag);
    divider.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    return container;
}
