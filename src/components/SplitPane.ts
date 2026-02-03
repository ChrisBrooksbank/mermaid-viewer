/**
 * Resizable split pane component
 */

import { getState, setState, subscribe } from '@core/state';

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

    const diagramPane = document.createElement('div');
    diagramPane.className = 'split-pane__diagram';
    diagramPane.appendChild(diagramContent);

    container.appendChild(editorPane);
    container.appendChild(divider);
    container.appendChild(diagramPane);

    // Set initial split position
    const updateSplitPosition = (position: number) => {
        editorPane.style.width = `${position}%`;
    };
    updateSplitPosition(getState().splitPosition);

    // Subscribe to state changes
    subscribe(state => {
        updateSplitPosition(state.splitPosition);
    });

    // Drag handling
    let isDragging = false;

    const startDrag = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        isDragging = true;
        divider.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
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

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const rect = container.getBoundingClientRect();
        const position = ((clientX - rect.left) / rect.width) * 100;

        // Clamp between 20% and 80%
        const clamped = Math.min(80, Math.max(20, position));
        setState({ splitPosition: clamped });
    };

    divider.addEventListener('mousedown', startDrag);
    divider.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);

    return container;
}
