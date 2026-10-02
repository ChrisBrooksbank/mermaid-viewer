/**
 * Actions on the open diagram documents (tabs) and their snapshots
 */

import type { DiagramDocument } from '@/types/app';
import { getState, setState } from './state';
import { createDocument, uniqueName, withSnapshot } from './snapshots';

export function getActiveDocument(): DiagramDocument {
    const { documents, activeDocumentId } = getState();
    return documents.find(d => d.id === activeDocumentId) ?? documents[0];
}

function updateDocument(id: string, update: (doc: DiagramDocument) => DiagramDocument): void {
    setState({
        documents: getState().documents.map(doc => (doc.id === id ? update(doc) : doc)),
    });
}

/** Open a new document in a tab and switch to it */
export function openDocument(name: string, markdown = ''): DiagramDocument {
    const doc = createDocument(uniqueName(name, getState().documents), markdown);
    setState({
        documents: [...getState().documents, doc],
        activeDocumentId: doc.id,
        markdown: doc.markdown,
    });
    return doc;
}

export function switchDocument(id: string): void {
    const doc = getState().documents.find(d => d.id === id);
    if (!doc || id === getState().activeDocumentId) return;
    setState({ activeDocumentId: id, markdown: doc.markdown, error: null });
}

export function renameDocument(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    updateDocument(id, doc => ({ ...doc, name: trimmed }));
}

/** Close a document. Closing the last one leaves a new empty document. */
export function closeDocument(id: string): void {
    const { documents, activeDocumentId } = getState();
    const index = documents.findIndex(d => d.id === id);
    if (index === -1) return;

    const remaining = documents.filter(d => d.id !== id);
    if (remaining.length === 0) {
        remaining.push(createDocument('Untitled', ''));
    }

    if (id !== activeDocumentId) {
        setState({ documents: remaining });
        return;
    }

    const next = remaining[Math.min(index, remaining.length - 1)];
    setState({
        documents: remaining,
        activeDocumentId: next.id,
        markdown: next.markdown,
        error: null,
    });
}

/** Save the active document's current content as a named version */
export function takeSnapshot(): void {
    const doc = getActiveDocument();
    updateDocument(doc.id, d => withSnapshot(d, d.markdown, false));
}

/**
 * Restore a snapshot of the active document. The current content is
 * snapshotted first so the restore can itself be undone.
 */
export function restoreSnapshot(snapshotId: string): void {
    const doc = getActiveDocument();
    const snapshot = doc.snapshots.find(s => s.id === snapshotId);
    if (!snapshot || snapshot.markdown === doc.markdown) return;

    const updated = {
        ...withSnapshot(doc, doc.markdown, true),
        markdown: snapshot.markdown,
        updatedAt: Date.now(),
    };
    setState({
        documents: getState().documents.map(d => (d.id === doc.id ? updated : d)),
        markdown: snapshot.markdown,
    });
}

export function deleteSnapshot(snapshotId: string): void {
    const doc = getActiveDocument();
    updateDocument(doc.id, d => ({
        ...d,
        snapshots: d.snapshots.filter(s => s.id !== snapshotId),
    }));
}
