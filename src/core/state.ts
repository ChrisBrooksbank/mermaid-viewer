/**
 * Observable state management
 */

import type { AppState, AppTheme, StateSubscriber } from '@/types/app';
import { debounce } from '@utils/helpers';
import { loadFromStorage, saveToStorage } from './storage';

const DEFAULT_MARKDOWN = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;

const DEFAULT_STATE: AppState = {
    markdown: DEFAULT_MARKDOWN,
    theme: 'light',
    mermaidTheme: 'auto',
    exportBackground: 'transparent',
    isFullscreen: false,
    error: null,
    splitPosition: 40,
};

let state: AppState = { ...DEFAULT_STATE };
const subscribers: Set<StateSubscriber> = new Set();

const debouncedSave = debounce((newState: AppState) => {
    saveToStorage(newState);
}, 500);

export function getState(): AppState {
    return state;
}

export function setState(partial: Partial<AppState>): void {
    state = { ...state, ...partial };
    subscribers.forEach(fn => fn(state));
    debouncedSave(state);
}

export function subscribe(fn: StateSubscriber): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}

/**
 * Load saved state. A diagram opened from a share link takes
 * precedence over the one saved in localStorage.
 */
export function initializeState(initialMarkdown?: string | null): void {
    const saved = loadFromStorage();
    if (saved) {
        state = { ...DEFAULT_STATE, ...saved, error: null, isFullscreen: false };
    }

    if (initialMarkdown) {
        state = { ...state, markdown: initialMarkdown };
        saveToStorage(state);
    }

    // Apply theme to document
    applyTheme(state.theme);
}

export function applyTheme(theme: AppTheme): void {
    document.documentElement.setAttribute('data-theme', theme);
}

/**
 * The mermaid theme actually used for rendering
 */
export function resolveMermaidTheme(
    s: Pick<AppState, 'theme' | 'mermaidTheme'>
): Exclude<AppState['mermaidTheme'], 'auto'> {
    if (s.mermaidTheme !== 'auto') return s.mermaidTheme;
    return s.theme === 'dark' ? 'dark' : 'default';
}
