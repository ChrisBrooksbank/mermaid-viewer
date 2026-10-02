import { describe, it, expect, beforeEach } from 'vitest';
import type { AppState } from '@/types/app';
import { loadFromStorage, saveToStorage } from './storage';

const STORAGE_KEY = 'mermaid-pwa-state';

const doc = {
    id: 'doc-1',
    name: 'Flow',
    markdown: 'graph TD',
    updatedAt: 1,
    snapshots: [{ id: 's1', createdAt: 1, markdown: 'graph', auto: true }],
};

const state: AppState = {
    markdown: 'graph TD',
    documents: [doc],
    activeDocumentId: 'doc-1',
    readOnly: false,
    theme: 'dark',
    mermaidTheme: 'forest',
    exportBackground: 'white',
    isFullscreen: true,
    error: 'boom',
    splitPosition: 55,
};

describe('storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns null when nothing is saved', () => {
        expect(loadFromStorage()).toBeNull();
    });

    it('round-trips persisted fields only', () => {
        saveToStorage(state);
        expect(loadFromStorage()).toEqual({
            documents: [doc],
            activeDocumentId: 'doc-1',
            theme: 'dark',
            mermaidTheme: 'forest',
            exportBackground: 'white',
            splitPosition: 55,
        });
    });

    it('returns null for corrupt JSON', () => {
        localStorage.setItem(STORAGE_KEY, '{not json');
        expect(loadFromStorage()).toBeNull();
    });

    it('drops invalid fields but keeps valid ones', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ markdown: 'pie', theme: 'purple', splitPosition: 500 })
        );
        expect(loadFromStorage()).toEqual({ markdown: 'pie' });
    });

    it('drops invalid documents and snapshots', () => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                documents: [
                    { ...doc, snapshots: [{ bad: true }, doc.snapshots[0]] },
                    { id: 'no-markdown', name: 'Broken' },
                ],
            })
        );
        expect(loadFromStorage()).toEqual({ documents: [doc] });
    });
});
