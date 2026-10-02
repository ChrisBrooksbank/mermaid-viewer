import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EditorView } from '@codemirror/view';

// State is module-level; load fresh modules per test
let state: typeof import('@core/state');
let documents: typeof import('@core/documents');
let createEditor: typeof import('./Editor').createEditor;

function getView(element: HTMLElement): EditorView {
    return EditorView.findFromDOM(element)!;
}

describe('Editor', () => {
    beforeEach(async () => {
        vi.resetModules();
        localStorage.clear();
        state = await import('@core/state');
        documents = await import('@core/documents');
        ({ createEditor } = await import('./Editor'));
        state.initializeState();
        state.setState({ markdown: 'graph TD\n    A --> B\n    B --> C' });
    });

    it('shows the active diagram', () => {
        const { element } = createEditor();
        expect(getView(element).state.doc.toString()).toBe('graph TD\n    A --> B\n    B --> C');
    });

    it('syncs typing to state and state to the editor', () => {
        const { element } = createEditor();
        const view = getView(element);

        view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: 'pie' } });
        expect(state.getState().markdown).toBe('pie');

        state.setState({ markdown: 'graph LR' });
        expect(view.state.doc.toString()).toBe('graph LR');
    });

    it('selects a line with goToLine', () => {
        const { element, goToLine } = createEditor();
        document.body.appendChild(element);
        const view = getView(element);

        goToLine(2);

        const { from, to } = view.state.selection.main;
        expect(view.state.sliceDoc(from, to)).toBe('    A --> B');
        element.remove();
    });

    it('undoes and redoes edits', () => {
        const { element, undo, redo } = createEditor();
        const view = getView(element);
        view.dispatch({ changes: { from: view.state.doc.length, insert: '\n    C --> D' } });

        undo();
        expect(state.getState().markdown).toBe('graph TD\n    A --> B\n    B --> C');
        redo();
        expect(state.getState().markdown).toContain('C --> D');
    });

    it('keeps separate undo history per diagram', () => {
        const { element, undo } = createEditor();
        const view = getView(element);
        const first = state.getState().activeDocumentId;
        view.dispatch({ changes: { from: 0, insert: '%% edited\n' } });

        documents.openDocument('Second', 'pie');
        expect(view.state.doc.toString()).toBe('pie');
        undo(); // nothing to undo in the new diagram
        expect(view.state.doc.toString()).toBe('pie');

        documents.switchDocument(first);
        expect(view.state.doc.toString()).toContain('%% edited');
        undo();
        expect(view.state.doc.toString()).toBe('graph TD\n    A --> B\n    B --> C');
    });

    it('marks the line of a syntax error', async () => {
        const { element } = createEditor();
        document.body.appendChild(element);
        state.setState({ error: 'Parse error on line 2:\nbad' });
        const { forEachDiagnostic } = await import('@codemirror/lint');
        const found: number[] = [];
        forEachDiagnostic(getView(element).state, d => found.push(d.from));
        expect(found).toEqual([9]);
        element.remove();
    });
});
