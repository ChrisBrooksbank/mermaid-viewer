/**
 * Markdown editor component (textarea)
 */

import { getState, setState, subscribe } from '@core/state';

export function createEditor(): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.className = 'editor';
    textarea.placeholder = 'Enter mermaid diagram syntax...';
    textarea.spellcheck = false;
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

    return textarea;
}
