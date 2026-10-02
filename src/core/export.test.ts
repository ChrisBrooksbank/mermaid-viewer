import { describe, it, expect, beforeEach } from 'vitest';
import { getDiagramSvg, prepareSvgForExport, resolveBackground, serializeSvg } from './export';

function renderSvg(): SVGSVGElement {
    document.body.innerHTML = `<div id="mermaid-container"><svg viewBox="0 0 320 180" width="100%"
        style="max-width: 320px; transform: matrix(2, 0, 0, 2, 10, 10); transform-origin: 0 0;">
        <g><text>Hello</text></g></svg></div>`;
    return getDiagramSvg()!;
}

describe('resolveBackground', () => {
    it('maps export settings to colours', () => {
        expect(resolveBackground('transparent', 'dark')).toBeNull();
        expect(resolveBackground('white', 'dark')).toBe('#ffffff');
        expect(resolveBackground('theme', 'light')).toBe('#ffffff');
        expect(resolveBackground('theme', 'dark')).toBe('#0a0a0f');
    });
});

describe('prepareSvgForExport', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
    });

    it('returns null when no diagram is rendered', () => {
        expect(getDiagramSvg()).toBeNull();
    });

    it('removes the pan/zoom transform and sets explicit size', () => {
        const svg = renderSvg();
        const { svg: clone, width, height } = prepareSvgForExport(svg, null);

        expect(width).toBe(320);
        expect(height).toBe(180);
        expect(clone.getAttribute('width')).toBe('320');
        expect(clone.getAttribute('height')).toBe('180');
        expect(clone.style.transform).toBe('');
        expect(clone.style.maxWidth).toBe('');
        expect(clone.style.backgroundColor).toBe('');
        // The on-screen diagram is untouched
        expect(svg.style.transform).toContain('matrix');
    });

    it('applies a background colour', () => {
        const { svg } = prepareSvgForExport(renderSvg(), '#ffffff');
        expect(svg.style.backgroundColor).toBe('rgb(255, 255, 255)');
    });

    it('serializes with the SVG namespace', () => {
        const data = serializeSvg(renderSvg(), null);
        expect(data).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(data).toContain('Hello');
        expect(data).not.toContain('matrix');
    });
});
