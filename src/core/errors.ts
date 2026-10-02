/**
 * Helpers for presenting mermaid render errors
 */

export interface DiagramError {
    message: string;
    /** 1-based line number reported by mermaid, if any */
    line: number | null;
}

const LINE_PATTERN = /\bon line (\d+)/i;

export function parseMermaidError(error: unknown): DiagramError {
    const message = (error instanceof Error ? error.message : String(error)).trim();
    const match = LINE_PATTERN.exec(message);
    return {
        message,
        line: match ? Number(match[1]) : null,
    };
}

/**
 * Character offsets [start, end) of a 1-based line within text.
 * Out-of-range lines are clamped to the first/last line.
 */
export function getLineRange(text: string, line: number): { start: number; end: number } {
    const lines = text.split('\n');
    const index = Math.min(Math.max(line, 1), lines.length) - 1;

    let start = 0;
    for (let i = 0; i < index; i++) {
        start += lines[i].length + 1;
    }
    return { start, end: start + lines[index].length };
}
