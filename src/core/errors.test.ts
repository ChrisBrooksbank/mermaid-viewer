import { describe, it, expect } from 'vitest';
import { getLineRange, parseMermaidError } from './errors';

describe('parseMermaidError', () => {
    it('extracts the line number from parse errors', () => {
        const error = new Error(
            "Parse error on line 3:\n...B -->\n------^\nExpecting 'NODE_STRING'"
        );
        expect(parseMermaidError(error)).toEqual({
            message: error.message,
            line: 3,
        });
    });

    it('extracts the line number from lexical errors', () => {
        expect(parseMermaidError('Lexical error on line 12. Unrecognized text.').line).toBe(12);
    });

    it('returns a null line when none is reported', () => {
        expect(parseMermaidError(new Error('No diagram type detected')).line).toBeNull();
    });
});

describe('getLineRange', () => {
    const text = 'graph TD\n    A --> B\n    B --> C';

    it('returns offsets for a line', () => {
        const { start, end } = getLineRange(text, 2);
        expect(text.slice(start, end)).toBe('    A --> B');
    });

    it('handles the first and last lines', () => {
        expect(getLineRange(text, 1)).toEqual({ start: 0, end: 8 });
        const { start, end } = getLineRange(text, 3);
        expect(text.slice(start, end)).toBe('    B --> C');
    });

    it('clamps out-of-range lines', () => {
        expect(getLineRange(text, 0)).toEqual(getLineRange(text, 1));
        expect(getLineRange(text, 99)).toEqual(getLineRange(text, 3));
    });
});
