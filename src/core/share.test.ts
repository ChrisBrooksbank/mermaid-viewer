import { describe, it, expect } from 'vitest';
import { buildShareUrl, decodeDiagram, encodeDiagram, readSharedDiagram } from './share';

describe('share', () => {
    it('round-trips diagram source', async () => {
        const source = 'graph TD\n    A[Start] --> B{Ünïcödé ✓}';
        const encoded = await encodeDiagram(source);
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(await decodeDiagram(encoded)).toBe(source);
    });

    it('builds a URL with the diagram in the hash', async () => {
        const url = await buildShareUrl('graph LR\n A-->B', 'https://example.com/app?x=1#old');
        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname + parsed.search).toBe('https://example.com/app?x=1');
        expect(await readSharedDiagram(parsed.hash)).toBe('graph LR\n A-->B');
    });

    it('returns null for hashes without a diagram', async () => {
        expect(await readSharedDiagram('')).toBeNull();
        expect(await readSharedDiagram('#other=1')).toBeNull();
    });

    it('returns null for corrupt data', async () => {
        expect(await readSharedDiagram('#code=not-valid-data')).toBeNull();
    });
});
