import { describe, it, expect } from 'vitest';
import { TEMPLATES } from './templates';

describe('templates', () => {
    it('have unique ids and names', () => {
        expect(new Set(TEMPLATES.map(t => t.id)).size).toBe(TEMPLATES.length);
        expect(new Set(TEMPLATES.map(t => t.name)).size).toBe(TEMPLATES.length);
    });

    it('all have diagram source', () => {
        for (const template of TEMPLATES) {
            expect(template.code.trim().length).toBeGreaterThan(0);
        }
    });
});
