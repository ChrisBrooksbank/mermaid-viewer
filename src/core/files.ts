/**
 * Opening and saving diagram source files
 */

const DIAGRAM_EXTENSIONS = ['.mmd', '.mermaid', '.md', '.markdown', '.txt'];

export const DIAGRAM_FILE_ACCEPT = DIAGRAM_EXTENSIONS.join(',');

export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    // Revoke on the next tick so the download has started
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function saveDiagramFile(markdown: string, filename = 'diagram.mmd'): void {
    downloadBlob(new Blob([markdown], { type: 'text/plain;charset=utf-8' }), filename);
}

export function isDiagramFile(file: File): boolean {
    const name = file.name.toLowerCase();
    return DIAGRAM_EXTENSIONS.some(ext => name.endsWith(ext)) || file.type.startsWith('text/');
}

/**
 * If text is a markdown document containing a ```mermaid code block,
 * return the first block's contents; otherwise return the text as-is.
 */
export function extractMermaid(text: string): string {
    const match = /^(`{3,}|~{3,})\s*mermaid\s*\r?\n([\s\S]*?)\r?\n\1\s*$/m.exec(text);
    return match ? match[2] : text;
}

export async function readDiagramFile(file: File): Promise<string> {
    return extractMermaid(await file.text());
}

/**
 * Show the browser's file picker and resolve with the chosen file,
 * or null if nothing was picked.
 */
export function pickFile(accept = DIAGRAM_FILE_ACCEPT): Promise<File | null> {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.addEventListener('change', () => resolve(input.files?.[0] ?? null));
        input.addEventListener('cancel', () => resolve(null));
        input.click();
    });
}
