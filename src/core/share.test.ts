import { describe, it, expect } from 'vitest';
import {
    buildEmbedCode,
    buildShareUrl,
    decodeDiagram,
    encodeDiagram,
    readShareLink,
} from './share';

describe('share', () => {
    it('round-trips diagram source', async () => {
        const source = 'graph TD\n    A[Start] --> B{Ünïcödé ✓}';
        const encoded = await encodeDiagram(source);
        expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(await decodeDiagram(encoded)).toBe(source);
    });

    it('builds an edit link with the diagram in the hash', async () => {
        const url = await buildShareUrl('graph LR\n A-->B', 'https://example.com/app?x=1#old');
        const parsed = new URL(url);
        expect(parsed.origin + parsed.pathname + parsed.search).toBe('https://example.com/app?x=1');
        expect(await readShareLink(parsed.hash)).toEqual({
            markdown: 'graph LR\n A-->B',
            readOnly: false,
        });
    });

    it('builds a view-only link', async () => {
        const url = await buildShareUrl('pie', 'https://example.com/', { readOnly: true });
        expect(await readShareLink(new URL(url).hash)).toEqual({
            markdown: 'pie',
            readOnly: true,
        });
    });

    it('returns null for hashes without a diagram', async () => {
        expect(await readShareLink('')).toBeNull();
        expect(await readShareLink('#other=1')).toBeNull();
    });

    it('returns null for corrupt data', async () => {
        expect(await readShareLink('#code=not-valid-data')).toBeNull();
    });

    it('builds escaped iframe embed code', () => {
        const code = buildEmbedCode('https://example.com/#code=abc&mode=view');
        expect(code).toContain('src="https://example.com/#code=abc&amp;mode=view"');
        expect(code).toMatch(/^<iframe .*><\/iframe>$/);
    });
});
