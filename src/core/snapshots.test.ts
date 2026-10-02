import { describe, it, expect } from 'vitest';
import type { DiagramDocument } from '@/types/app';
import {
    AUTO_SNAPSHOT_INTERVAL,
    MAX_SNAPSHOTS,
    createDocument,
    uniqueName,
    withEdit,
    withSnapshot,
} from './snapshots';

describe('withSnapshot', () => {
    it('adds the newest snapshot first', () => {
        const doc = withSnapshot(withSnapshot(createDocument('A', ''), 'one', false), 'two', true);
        expect(doc.snapshots.map(s => [s.markdown, s.auto])).toEqual([
            ['two', true],
            ['one', false],
        ]);
    });

    it('skips duplicates of the newest snapshot', () => {
        const doc = withSnapshot(createDocument('A', ''), 'one', false);
        expect(withSnapshot(doc, 'one', false)).toBe(doc);
    });

    it('drops the oldest automatic snapshots beyond the limit', () => {
        let doc: DiagramDocument = withSnapshot(createDocument('A', ''), 'kept', false);
        for (let i = 0; i < MAX_SNAPSHOTS + 5; i++) {
            doc = withSnapshot(doc, `auto ${i}`, true);
        }
        expect(doc.snapshots).toHaveLength(MAX_SNAPSHOTS);
        expect(doc.snapshots.at(-1)!.markdown).toBe('kept');
        expect(doc.snapshots[0].markdown).toBe(`auto ${MAX_SNAPSHOTS + 4}`);
    });
});

describe('withEdit', () => {
    it('snapshots the previous content when the last snapshot is old', () => {
        const doc = { ...createDocument('A', 'old'), snapshots: [] };
        const edited = withEdit(doc, 'new', 1_000_000);
        expect(edited.markdown).toBe('new');
        expect(edited.snapshots[0]).toMatchObject({ markdown: 'old', auto: true });
    });

    it('does not snapshot again within the interval', () => {
        const first = withEdit(createDocument('A', 'v1'), 'v2', 1_000_000);
        const second = withEdit(first, 'v3', 1_000_000 + AUTO_SNAPSHOT_INTERVAL - 1);
        expect(second.snapshots).toHaveLength(1);
        const third = withEdit(second, 'v4', 1_000_000 + AUTO_SNAPSHOT_INTERVAL);
        expect(third.snapshots.map(s => s.markdown)).toEqual(['v3', 'v1']);
    });

    it('returns the same document when nothing changed', () => {
        const doc = createDocument('A', 'same');
        expect(withEdit(doc, 'same')).toBe(doc);
    });
});

describe('uniqueName', () => {
    it('numbers repeated names', () => {
        const docs = [createDocument('Untitled', ''), createDocument('Untitled 2', '')];
        expect(uniqueName('Flow', docs)).toBe('Flow');
        expect(uniqueName('Untitled', docs)).toBe('Untitled 3');
    });
});
