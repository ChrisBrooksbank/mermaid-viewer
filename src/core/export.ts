/**
 * Exporting the rendered diagram as SVG/PNG (download or clipboard)
 */

import type { AppTheme, ExportBackground } from '@/types/app';
import { downloadBlob } from './files';

const PNG_SCALE = 2;

const THEME_BACKGROUNDS: Record<AppTheme, string> = {
    light: '#ffffff',
    dark: '#0a0a0f',
};

export function resolveBackground(background: ExportBackground, theme: AppTheme): string | null {
    if (background === 'transparent') return null;
    if (background === 'white') return '#ffffff';
    return THEME_BACKGROUNDS[theme];
}

export function getDiagramSvg(): SVGSVGElement | null {
    return document.querySelector<SVGSVGElement>('#mermaid-container svg');
}

function getSvgSize(svg: SVGSVGElement): { width: number; height: number } {
    const [, , width, height] = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
    if (width > 0 && height > 0) {
        return { width, height };
    }
    return { width: svg.clientWidth || 800, height: svg.clientHeight || 600 };
}

/**
 * Clone the rendered SVG for export: drop the pan/zoom transform,
 * give it explicit dimensions and optionally a background colour.
 */
export function prepareSvgForExport(
    svg: SVGSVGElement,
    background: string | null
): { svg: SVGSVGElement; width: number; height: number } {
    const { width, height } = getSvgSize(svg);
    const clone = svg.cloneNode(true) as SVGSVGElement;

    clone.style.removeProperty('transform');
    clone.style.removeProperty('transform-origin');
    clone.style.removeProperty('max-width');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(height));
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    if (background) {
        clone.style.backgroundColor = background;
    } else {
        clone.style.removeProperty('background-color');
    }

    return { svg: clone, width, height };
}

export function serializeSvg(svg: SVGSVGElement, background: string | null): string {
    return new XMLSerializer().serializeToString(prepareSvgForExport(svg, background).svg);
}

export function svgToPngBlob(svg: SVGSVGElement, background: string | null): Promise<Blob> {
    const { svg: clone, width, height } = prepareSvgForExport(svg, background);
    const svgData = new XMLSerializer().serializeToString(clone);
    const svgUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);

    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width * PNG_SCALE;
            canvas.height = height * PNG_SCALE;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas is not supported'));
                return;
            }

            if (background) {
                ctx.fillStyle = background;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.scale(PNG_SCALE, PNG_SCALE);
            ctx.drawImage(img, 0, 0, width, height);

            try {
                canvas.toBlob(blob => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to create PNG'));
                }, 'image/png');
            } catch (error) {
                reject(error instanceof Error ? error : new Error(String(error)));
            }
        };
        img.onerror = () => reject(new Error('Failed to load SVG for PNG export'));
        img.src = svgUri;
    });
}

function requireSvg(): SVGSVGElement {
    const svg = getDiagramSvg();
    if (!svg) throw new Error('There is no diagram to export');
    return svg;
}

export function downloadSvg(background: string | null): void {
    const data = serializeSvg(requireSvg(), background);
    downloadBlob(new Blob([data], { type: 'image/svg+xml' }), 'diagram.svg');
}

export async function downloadPng(background: string | null): Promise<void> {
    downloadBlob(await svgToPngBlob(requireSvg(), background), 'diagram.png');
}

export async function copySvg(background: string | null): Promise<void> {
    await navigator.clipboard.writeText(serializeSvg(requireSvg(), background));
}

export async function copyPng(background: string | null): Promise<void> {
    if (typeof ClipboardItem === 'undefined') {
        throw new Error('Copying images is not supported in this browser');
    }
    // Pass the blob as a promise so Safari keeps the user-gesture context
    const blob = svgToPngBlob(requireSvg(), background);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
