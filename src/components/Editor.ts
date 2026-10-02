/**
 * Diagram source editor (CodeMirror) with per-diagram undo history
 */

import { EditorState, Prec, type Extension } from '@codemirror/state';
import {
    EditorView,
    drawSelection,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
    placeholder,
} from '@codemirror/view';
import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
    redo as redoCommand,
    undo as undoCommand,
} from '@codemirror/commands';
import { bracketMatching, syntaxHighlighting } from '@codemirror/language';
import {
    autocompletion,
    closeBrackets,
    closeBracketsKeymap,
    completionKeymap,
} from '@codemirror/autocomplete';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { lintGutter, lintKeymap, setDiagnostics, type Diagnostic } from '@codemirror/lint';
import { classHighlighter } from '@lezer/highlight';
import { getState, setState, subscribe } from '@core/state';
import { parseMermaidError } from '@core/errors';
import { mermaidCompletions, mermaidLanguage } from '@core/mermaidLanguage';

export interface EditorHandle {
    element: HTMLElement;
    /** Focus the editor and select a 1-based line */
    goToLine: (line: number) => void;
    undo: () => void;
    redo: () => void;
}

// Ctrl+Enter toggles fullscreen app-wide (handled on document), so the
// editor must not insert a line for it. Returning true stops other bindings.
const appShortcuts = Prec.highest(keymap.of([{ key: 'Mod-Enter', run: () => true }]));

function errorDiagnostics(view: EditorView, error: string | null): Diagnostic[] {
    if (!error) return [];
    const { line, message } = parseMermaidError(error);
    const doc = view.state.doc;
    const target = doc.line(Math.min(Math.max(line ?? 1, 1), doc.lines));
    return [{ from: target.from, to: target.to, severity: 'error', message }];
}

export function createEditor(): EditorHandle {
    const element = document.createElement('div');
    element.className = 'editor';

    const extensions: Extension[] = [
        appShortcuts,
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({ override: [mermaidCompletions] }),
        highlightActiveLine(),
        highlightSelectionMatches(),
        lintGutter(),
        mermaidLanguage,
        syntaxHighlighting(classHighlighter),
        EditorView.lineWrapping,
        placeholder('Enter mermaid diagram syntax...'),
        EditorView.contentAttributes.of({ 'aria-label': 'Diagram source' }),
        keymap.of([
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...completionKeymap,
            ...lintKeymap,
            indentWithTab,
        ]),
        EditorView.updateListener.of(update => {
            if (update.docChanged) {
                const markdown = update.state.doc.toString();
                if (markdown !== getState().markdown) {
                    setState({ markdown });
                }
            }
        }),
    ];

    const createState = (doc: string) => EditorState.create({ doc, extensions });

    // Keep each diagram's editor state (and so its undo history) while switching tabs
    const states = new Map<string, EditorState>();
    let activeId = getState().activeDocumentId;

    const view = new EditorView({ state: createState(getState().markdown), parent: element });

    const showError = (error: string | null) => {
        view.dispatch(setDiagnostics(view.state, errorDiagnostics(view, error)));
    };

    subscribe(state => {
        if (state.activeDocumentId !== activeId) {
            states.set(activeId, view.state);
            activeId = state.activeDocumentId;

            const saved = states.get(activeId);
            view.setState(
                saved && saved.doc.toString() === state.markdown
                    ? saved
                    : createState(state.markdown)
            );

            // Forget closed diagrams
            const open = new Set(state.documents.map(d => d.id));
            for (const id of states.keys()) {
                if (!open.has(id)) states.delete(id);
            }
        } else if (view.state.doc.toString() !== state.markdown) {
            // External change (snapshot restore, shared link): undoable edit
            view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: state.markdown },
            });
        }
    });

    // Mark the line a syntax error points at
    let lastError: string | null = null;
    subscribe(state => {
        if (state.error !== lastError) {
            lastError = state.error;
            showError(state.error);
        }
    });

    const goToLine = (line: number) => {
        const doc = view.state.doc;
        const target = doc.line(Math.min(Math.max(line, 1), doc.lines));
        view.dispatch({
            selection: { anchor: target.from, head: target.to },
            scrollIntoView: true,
        });
        view.focus();
    };

    return {
        element,
        goToLine,
        undo: () => {
            undoCommand(view);
            view.focus();
        },
        redo: () => {
            redoCommand(view);
            view.focus();
        },
    };
}
