import { describe, it, expect, beforeEach, vi } from 'vitest';

// State is module-level, so load a fresh copy for each test
async function loadState() {
    vi.resetModules();
    return import('./state');
}

describe('state', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
    });

    it('starts with defaults', async () => {
        const { getState, initializeState } = await loadState();
        initializeState();
        expect(getState()).toMatchObject({
            theme: 'light',
            mermaidTheme: 'auto',
            exportBackground: 'transparent',
            isFullscreen: false,
            error: null,
        });
        expect(getState().markdown).toContain('graph TD');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it('notifies subscribers and supports unsubscribing', async () => {
        const { setState, subscribe } = await loadState();
        const listener = vi.fn();
        const unsubscribe = subscribe(listener);

        setState({ markdown: 'pie' });
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({ markdown: 'pie' }));

        unsubscribe();
        setState({ markdown: 'graph LR' });
        expect(listener).toHaveBeenCalledOnce();
    });

    it('restores saved state but not transient fields', async () => {
        localStorage.setItem(
            'mermaid-pwa-state',
            JSON.stringify({ markdown: 'pie', theme: 'dark', splitPosition: 60 })
        );
        const { getState, initializeState } = await loadState();
        initializeState();
        expect(getState()).toMatchObject({
            markdown: 'pie',
            theme: 'dark',
            splitPosition: 60,
            isFullscreen: false,
            error: null,
        });
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    it('prefers a shared diagram over saved state', async () => {
        localStorage.setItem('mermaid-pwa-state', JSON.stringify({ markdown: 'pie' }));
        const { getState, initializeState } = await loadState();
        initializeState({ sharedMarkdown: 'graph LR\n A --> B' });
        expect(getState().markdown).toBe('graph LR\n A --> B');
    });

    it('opens a shared diagram in a new tab alongside saved ones', async () => {
        const { getState, initializeState } = await loadState();
        initializeState();
        const original = getState().documents[0];
        (await import('./storage')).saveToStorage(getState());

        vi.resetModules();
        const fresh = await import('./state');
        fresh.initializeState({ sharedMarkdown: 'pie' });
        const { documents, activeDocumentId } = fresh.getState();
        expect(documents.map(d => d.name)).toEqual(['Untitled', 'Shared diagram']);
        expect(documents[0].id).toBe(original.id);
        expect(activeDocumentId).toBe(documents[1].id);
    });

    it('migrates the single-diagram storage format', async () => {
        localStorage.setItem('mermaid-pwa-state', JSON.stringify({ markdown: 'journey' }));
        const { getState, initializeState } = await loadState();
        initializeState();
        expect(getState().documents).toHaveLength(1);
        expect(getState().documents[0]).toMatchObject({ name: 'Untitled', markdown: 'journey' });
        expect(JSON.parse(localStorage.getItem('mermaid-pwa-state')!).documents).toHaveLength(1);
    });

    it('restores the previously active document', async () => {
        const { getState, initializeState, setState } = await loadState();
        initializeState();
        const { openDocument } = await import('./documents');
        openDocument('Second', 'pie');
        const { saveToStorage } = await import('./storage');
        saveToStorage(getState());
        setState({});

        vi.resetModules();
        const fresh = await import('./state');
        fresh.initializeState();
        expect(fresh.getState().markdown).toBe('pie');
        expect(fresh.getState().documents).toHaveLength(2);
    });

    it('does not read or write saved diagrams in view-only mode', async () => {
        vi.useFakeTimers();
        try {
            localStorage.setItem(
                'mermaid-pwa-state',
                JSON.stringify({ markdown: 'journey', theme: 'dark' })
            );
            const { getState, initializeState, setState } = await loadState();
            initializeState({ sharedMarkdown: 'pie', readOnly: true });
            expect(getState()).toMatchObject({ markdown: 'pie', readOnly: true, theme: 'dark' });
            expect(getState().documents).toHaveLength(1);

            setState({ markdown: 'graph LR' });
            vi.advanceTimersByTime(1000);
            expect(JSON.parse(localStorage.getItem('mermaid-pwa-state')!)).toEqual({
                markdown: 'journey',
                theme: 'dark',
            });
        } finally {
            vi.useRealTimers();
        }
    });

    it('keeps the active document in sync with edits', async () => {
        const { getState, initializeState, setState } = await loadState();
        initializeState();
        setState({ markdown: 'pie' });
        expect(getState().documents[0].markdown).toBe('pie');
    });

    it('persists changes after a debounce', async () => {
        vi.useFakeTimers();
        try {
            const { setState } = await loadState();
            setState({ markdown: 'journey' });
            expect(localStorage.getItem('mermaid-pwa-state')).toBeNull();
            vi.advanceTimersByTime(500);
            const saved = JSON.parse(localStorage.getItem('mermaid-pwa-state')!);
            expect(saved.documents[0].markdown).toBe('journey');
        } finally {
            vi.useRealTimers();
        }
    });
});

describe('resolveMermaidTheme', () => {
    it('follows the app theme when set to auto', async () => {
        const { resolveMermaidTheme } = await loadState();
        expect(resolveMermaidTheme({ theme: 'light', mermaidTheme: 'auto' })).toBe('default');
        expect(resolveMermaidTheme({ theme: 'dark', mermaidTheme: 'auto' })).toBe('dark');
    });

    it('uses an explicit diagram theme', async () => {
        const { resolveMermaidTheme } = await loadState();
        expect(resolveMermaidTheme({ theme: 'dark', mermaidTheme: 'forest' })).toBe('forest');
    });
});
