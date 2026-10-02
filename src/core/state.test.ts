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
        initializeState('graph LR\n A --> B');
        expect(getState().markdown).toBe('graph LR\n A --> B');
    });

    it('persists changes after a debounce', async () => {
        vi.useFakeTimers();
        try {
            const { setState } = await loadState();
            setState({ markdown: 'journey' });
            expect(localStorage.getItem('mermaid-pwa-state')).toBeNull();
            vi.advanceTimersByTime(500);
            expect(JSON.parse(localStorage.getItem('mermaid-pwa-state')!).markdown).toBe('journey');
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
