/**
 * Observable state management
 */

import type { AppState, AppTheme, StateSubscriber } from '@/types/app';
import { debounce } from '@utils/helpers';
import { loadFromStorage, saveToStorage } from './storage';
import { createDocument, uniqueName, withEdit } from './snapshots';

export const DEFAULT_MARKDOWN = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B`;

function createDefaultState(): AppState {
    const doc = createDocument('Untitled', DEFAULT_MARKDOWN);
    return {
        markdown: doc.markdown,
        documents: [doc],
        activeDocumentId: doc.id,
        readOnly: false,
        theme: 'light',
        mermaidTheme: 'auto',
        exportBackground: 'transparent',
        isFullscreen: false,
        error: null,
        splitPosition: 40,
    };
}

let state: AppState = createDefaultState();
const subscribers: Set<StateSubscriber> = new Set();

const debouncedSave = debounce((newState: AppState) => {
    saveToStorage(newState);
}, 500);

export function getState(): AppState {
    return state;
}

/**
 * Update state. Setting `markdown` alone also updates the active document.
 */
export function setState(partial: Partial<AppState>): void {
    const next = { ...state, ...partial };

    if (partial.markdown !== undefined && partial.documents === undefined) {
        const markdown = partial.markdown;
        next.documents = next.documents.map(doc =>
            doc.id === next.activeDocumentId ? withEdit(doc, markdown) : doc
        );
    }

    state = next;
    subscribers.forEach(fn => fn(state));
    if (!state.readOnly) debouncedSave(state);
}

export function subscribe(fn: StateSubscriber): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}

interface InitOptions {
    /** Diagram from a share link; opened in a new tab */
    sharedMarkdown?: string | null;
    /** View-only mode: show only the shared diagram and persist nothing */
    readOnly?: boolean;
}

/**
 * Load saved state, migrating the single-diagram format if needed.
 */
export function initializeState({ sharedMarkdown, readOnly = false }: InitOptions = {}): void {
    const defaults = createDefaultState();
    const saved = loadFromStorage() ?? {};
    const { markdown: legacyMarkdown, documents: savedDocuments, ...settings } = saved;

    let documents = savedDocuments ?? defaults.documents;
    if (!savedDocuments && legacyMarkdown !== undefined) {
        documents = [createDocument('Untitled', legacyMarkdown)];
    }
    let active = documents.find(d => d.id === saved.activeDocumentId) ?? documents[0];

    if (readOnly) {
        active = createDocument('Shared diagram', sharedMarkdown ?? '');
        documents = [active];
    } else if (sharedMarkdown) {
        active = createDocument(uniqueName('Shared diagram', documents), sharedMarkdown);
        documents = [...documents, active];
    }

    state = {
        ...defaults,
        // First visit: follow the system colour scheme
        theme: prefersDarkScheme() ? 'dark' : 'light',
        ...settings,
        documents,
        activeDocumentId: active.id,
        markdown: active.markdown,
        readOnly,
        error: null,
        isFullscreen: false,
    };

    if (!readOnly && (sharedMarkdown || legacyMarkdown !== undefined)) {
        saveToStorage(state);
    }

    // Apply theme to document
    applyTheme(state.theme);
}

function prefersDarkScheme(): boolean {
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
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
