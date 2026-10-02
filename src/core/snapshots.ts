/**
 * Pure helpers for documents and their version snapshots
 */

import type { DiagramDocument, DiagramSnapshot } from '@/types/app';

export const MAX_SNAPSHOTS = 25;

/** Minimum time between automatic snapshots of a document */
export const AUTO_SNAPSHOT_INTERVAL = 5 * 60 * 1000;

export function createId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createDocument(name: string, markdown: string): DiagramDocument {
    return { id: createId(), name, markdown, updatedAt: Date.now(), snapshots: [] };
}

/**
 * Add a snapshot of markdown to the document, unless it matches the
 * newest snapshot. Keeps at most MAX_SNAPSHOTS, dropping the oldest
 * automatic snapshots first.
 */
export function withSnapshot(
    doc: DiagramDocument,
    markdown: string,
    auto: boolean,
    now = Date.now()
): DiagramDocument {
    if (doc.snapshots[0]?.markdown === markdown) return doc;

    const snapshot: DiagramSnapshot = { id: createId(), createdAt: now, markdown, auto };
    const snapshots = [snapshot, ...doc.snapshots];

    while (snapshots.length > MAX_SNAPSHOTS) {
        const oldestAuto = snapshots.findLastIndex(s => s.auto);
        snapshots.splice(oldestAuto === -1 ? snapshots.length - 1 : oldestAuto, 1);
    }

    return { ...doc, snapshots };
}

/**
 * Apply an edit to a document. When the last snapshot is older than
 * AUTO_SNAPSHOT_INTERVAL, the content from before the edit is kept as an
 * automatic snapshot, so there is always a recent version to go back to.
 */
export function withEdit(
    doc: DiagramDocument,
    markdown: string,
    now = Date.now()
): DiagramDocument {
    if (doc.markdown === markdown) return doc;

    const lastSnapshot = doc.snapshots[0]?.createdAt ?? 0;
    const shouldSnapshot =
        doc.markdown.trim() !== '' && now - lastSnapshot >= AUTO_SNAPSHOT_INTERVAL;
    const base = shouldSnapshot ? withSnapshot(doc, doc.markdown, true, now) : doc;

    return { ...base, markdown, updatedAt: now };
}

/**
 * A name not used by any of the documents: "Untitled", "Untitled 2", ...
 */
export function uniqueName(base: string, documents: DiagramDocument[]): string {
    const names = new Set(documents.map(d => d.name));
    if (!names.has(base)) return base;
    let n = 2;
    while (names.has(`${base} ${n}`)) n++;
    return `${base} ${n}`;
}
