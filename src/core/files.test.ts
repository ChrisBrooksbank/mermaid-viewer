import { describe, it, expect, vi, afterEach } from 'vitest';
import { extractMermaid, isDiagramFile, readDiagramFile, saveDiagramFile } from './files';

describe('extractMermaid', () => {
    it('returns plain diagram source unchanged', () => {
        expect(extractMermaid('graph TD\n  A --> B')).toBe('graph TD\n  A --> B');
    });

    it('extracts the first mermaid block from markdown', () => {
        const markdown = [
            '# Docs',
            '',
            '```js',
            'const x = 1;',
            '```',
            '',
            '```mermaid',
            'sequenceDiagram',
            '    A->>B: Hi',
            '```',
            '',
            '```mermaid',
            'graph TD',
            '```',
        ].join('\n');
        expect(extractMermaid(markdown)).toBe('sequenceDiagram\n    A->>B: Hi');
    });

    it('supports tilde fences and CRLF line endings', () => {
        expect(extractMermaid('~~~mermaid\r\npie\r\n~~~')).toBe('pie');
    });
});

describe('isDiagramFile', () => {
    it.each(['diagram.mmd', 'flow.MERMAID', 'README.md', 'notes.txt'])('accepts %s', name => {
        expect(isDiagramFile(new File([''], name))).toBe(true);
    });

    it('accepts text files by MIME type', () => {
        expect(isDiagramFile(new File([''], 'diagram', { type: 'text/plain' }))).toBe(true);
    });

    it('rejects other files', () => {
        expect(isDiagramFile(new File([''], 'photo.png', { type: 'image/png' }))).toBe(false);
    });
});

describe('readDiagramFile', () => {
    it('reads the file and extracts mermaid from markdown', async () => {
        const file = new File(['# Title\n\n```mermaid\ngraph LR\n```\n'], 'doc.md');
        expect(await readDiagramFile(file)).toBe('graph LR');
    });
});

describe('saveDiagramFile', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('downloads the source as a .mmd file', async () => {
        let saved: Blob | undefined;
        URL.createObjectURL = vi.fn((blob: Blob) => {
            saved = blob;
            return 'blob:test';
        });
        URL.revokeObjectURL = vi.fn();
        const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

        saveDiagramFile('graph TD');

        expect(click).toHaveBeenCalledOnce();
        const link = click.mock.contexts[0] as HTMLAnchorElement;
        expect(link.download).toBe('diagram.mmd');
        expect(await saved?.text()).toBe('graph TD');
    });
});
