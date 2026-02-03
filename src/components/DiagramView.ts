/**
 * Mermaid diagram viewer with pan/zoom
 */

import mermaid from 'mermaid';
import panzoom, { type PanZoom } from 'panzoom';
import type { DiagramViewControls } from '@/types/app';
import { getState, setState, subscribe } from '@core/state';
import { debounce } from '@utils/helpers';
import { Logger } from '@utils/logger';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

export function createDiagramView(): { element: HTMLElement; controls: DiagramViewControls } {
    const view = document.createElement('div');
    view.className = 'diagram-view';

    const container = document.createElement('div');
    container.className = 'diagram-view__container';
    container.id = 'mermaid-container';

    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'diagram-view__error';
    errorDisplay.style.display = 'none';

    view.appendChild(container);
    view.appendChild(errorDisplay);

    let panzoomInstance: PanZoom | null = null;
    let diagramId = 0;
    let lastRenderedMarkdown = '';

    const initPanzoom = () => {
        if (panzoomInstance) {
            panzoomInstance.dispose();
        }

        const svg = container.querySelector('svg');
        if (svg) {
            panzoomInstance = panzoom(svg, {
                maxZoom: MAX_ZOOM,
                minZoom: MIN_ZOOM,
                smoothScroll: false,
                zoomDoubleClickSpeed: 1,
            });
        }
    };

    const renderDiagram = async (markdown: string) => {
        if (!markdown.trim()) {
            container.innerHTML = '';
            lastRenderedMarkdown = markdown;
            setState({ error: null });
            errorDisplay.style.display = 'none';
            return;
        }

        try {
            diagramId++;
            const id = `mermaid-diagram-${diagramId}`;

            const { svg } = await mermaid.render(id, markdown);

            // Only replace content after new SVG is ready (prevents flash)
            container.innerHTML = svg;
            lastRenderedMarkdown = markdown;

            setState({ error: null });
            errorDisplay.style.display = 'none';

            // Initialize panzoom on new SVG
            initPanzoom();

            Logger.debug('Diagram rendered successfully');
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            setState({ error: errorMsg });
            errorDisplay.textContent = errorMsg;
            errorDisplay.style.display = 'block';
            Logger.warn('Mermaid render error:', errorMsg);
        }
    };

    const debouncedRender = debounce((markdown: string) => {
        void renderDiagram(markdown);
    }, 300);

    // Subscribe to state changes - only re-render if markdown changed
    subscribe(state => {
        if (state.markdown !== lastRenderedMarkdown) {
            debouncedRender(state.markdown);
        }
    });

    // Initial render
    lastRenderedMarkdown = getState().markdown;
    void renderDiagram(lastRenderedMarkdown);

    const controls: DiagramViewControls = {
        resetZoom: () => {
            if (panzoomInstance) {
                panzoomInstance.moveTo(0, 0);
                panzoomInstance.zoomAbs(0, 0, 1);
            }
        },
        zoomIn: () => {
            if (panzoomInstance) {
                const transform = panzoomInstance.getTransform();
                const newZoom = Math.min(MAX_ZOOM, transform.scale + ZOOM_STEP);
                const rect = container.getBoundingClientRect();
                panzoomInstance.zoomAbs(rect.width / 2, rect.height / 2, newZoom);
            }
        },
        zoomOut: () => {
            if (panzoomInstance) {
                const transform = panzoomInstance.getTransform();
                const newZoom = Math.max(MIN_ZOOM, transform.scale - ZOOM_STEP);
                const rect = container.getBoundingClientRect();
                panzoomInstance.zoomAbs(rect.width / 2, rect.height / 2, newZoom);
            }
        },
        fitToView: () => {
            if (panzoomInstance) {
                const svg = container.querySelector('svg');
                if (svg) {
                    const containerRect = container.getBoundingClientRect();
                    const svgRect = svg.getBoundingClientRect();
                    const scale =
                        Math.min(
                            containerRect.width / svgRect.width,
                            containerRect.height / svgRect.height
                        ) * 0.9;
                    panzoomInstance.moveTo(0, 0);
                    panzoomInstance.zoomAbs(0, 0, Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale)));
                }
            }
        },
    };

    return { element: view, controls };
}
