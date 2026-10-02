import { describe, it, expect, beforeEach, vi } from 'vitest';

let state: typeof import('./state');
let docs: typeof import('./documents');

describe('documents', () => {
    beforeEach(async () => {
        vi.resetModules();
        localStorage.clear();
        state = await import('./state');
        docs = await import('./documents');
        state.initializeState();
    });

    it('opens documents in new tabs with unique names', () => {
        docs.openDocument('Flow', 'graph TD');
        docs.openDocument('Flow', 'graph LR');
        const { documents, markdown } = state.getState();
        expect(documents.map(d => d.name)).toEqual(['Untitled', 'Flow', 'Flow 2']);
        expect(markdown).toBe('graph LR');
        expect(docs.getActiveDocument().name).toBe('Flow 2');
    });

    it('switches documents and keeps their content', () => {
        const first = state.getState().activeDocumentId;
        docs.openDocument('Pie', 'pie');
        state.setState({ markdown: 'pie title Edited' });

        docs.switchDocument(first);
        expect(state.getState().markdown).toContain('graph TD');

        const pie = state.getState().documents[1];
        expect(pie.markdown).toBe('pie title Edited');
        docs.switchDocument(pie.id);
        expect(state.getState().markdown).toBe('pie title Edited');
    });

    it('renames documents, ignoring blank names', () => {
        const id = state.getState().activeDocumentId;
        docs.renameDocument(id, '  My flow ');
        docs.renameDocument(id, '   ');
        expect(docs.getActiveDocument().name).toBe('My flow');
    });

    it('closes documents and activates a neighbour', () => {
        const first = state.getState().activeDocumentId;
        const second = docs.openDocument('B', 'b').id;
        docs.openDocument('C', 'c');

        docs.switchDocument(second);
        docs.closeDocument(second);
        expect(docs.getActiveDocument().name).toBe('C');

        docs.closeDocument(first);
        expect(state.getState().documents.map(d => d.name)).toEqual(['C']);
    });

    it('leaves an empty document when the last one is closed', () => {
        docs.closeDocument(state.getState().activeDocumentId);
        expect(state.getState().documents).toHaveLength(1);
        expect(state.getState().markdown).toBe('');
    });

    it('takes, restores and deletes snapshots', () => {
        state.setState({ markdown: 'v1' });
        docs.takeSnapshot();
        state.setState({ markdown: 'v2' });

        const [snapshot] = docs.getActiveDocument().snapshots.filter(s => !s.auto);
        docs.restoreSnapshot(snapshot.id);

        expect(state.getState().markdown).toBe('v1');
        // The content before the restore was kept
        expect(docs.getActiveDocument().snapshots[0]).toMatchObject({
            markdown: 'v2',
            auto: true,
        });

        docs.deleteSnapshot(snapshot.id);
        expect(docs.getActiveDocument().snapshots.some(s => s.id === snapshot.id)).toBe(false);
    });
});
