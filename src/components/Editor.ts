/**
 * Markdown editor component (textarea)
 */

import { getState, setState, subscribe } from '@core/state';
import { getLineRange } from '@core/errors';

export interface EditorHandle {
    element: HTMLTextAreaElement;
    /** Focus the editor and select a 1-based line */
    goToLine: (line: number) => void;
}

export function createEditor(): EditorHandle {
    const textarea = document.createElement('textarea');
    textarea.className = 'editor';
    textarea.placeholder = 'Enter mermaid diagram syntax...';
    textarea.spellcheck = false;
    textarea.setAttribute('aria-label', 'Diagram source');
    textarea.value = getState().markdown;

    // Update state on input
    textarea.addEventListener('input', () => {
        setState({ markdown: textarea.value });
    });

    // Sync with state (for external updates)
    subscribe(state => {
        if (textarea.value !== state.markdown) {
            textarea.value = state.markdown;
        }
    });

    const goToLine = (line: number) => {
        const { start, end } = getLineRange(textarea.value, line);
        textarea.focus();
        textarea.setSelectionRange(start, end);

        // Scroll the selected line into view
        const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 21;
        textarea.scrollTop = Math.max(0, (line - 3) * lineHeight);
    };

    return { element: textarea, goToLine };
}
