/**
 * Mermaid diagram viewer with pan/zoom
 */

import mermaid from 'mermaid';
import panzoom, { type PanZoom } from 'panzoom';
import type { AppState, DiagramViewControls } from '@/types/app';
import { getState, resolveMermaidTheme, setState, subscribe } from '@core/state';
import { parseMermaidError } from '@core/errors';
import { debounce } from '@utils/helpers';
import { Logger } from '@utils/logger';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

interface DiagramViewOptions {
    /** Called when the user asks to jump to the line an error points at */
    onGoToLine?: (line: number) => void;
}

/** The app's neon styling only applies when the diagram theme follows the app theme */
function usesNeonStyle(state: AppState): boolean {
    return state.theme === 'dark' && state.mermaidTheme === 'auto';
}

export function createDiagramView(options: DiagramViewOptions = {}): {
    element: HTMLElement;
    controls: DiagramViewControls;
} {
    const view = document.createElement('div');
    view.className = 'diagram-view';

    const container = document.createElement('div');
    container.className = 'diagram-view__container';
    container.id = 'mermaid-container';

    const errorDisplay = document.createElement('div');
    errorDisplay.className = 'diagram-view__error';
    errorDisplay.setAttribute('role', 'alert');
    errorDisplay.hidden = true;

    view.appendChild(container);
    view.appendChild(errorDisplay);

    let panzoomInstance: PanZoom | null = null;
    let diagramId = 0;
    let lastRenderedMarkdown = '';
    let lastRenderedTheme = resolveMermaidTheme(getState());

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

    const hideError = () => {
        setState({ error: null });
        errorDisplay.hidden = true;
        errorDisplay.replaceChildren();
    };

    const showError = (error: unknown) => {
        const { message, line } = parseMermaidError(error);
        setState({ error: message });

        const header = document.createElement('div');
        header.className = 'diagram-view__error-header';

        const label = document.createElement('strong');
        label.textContent = line ? `Syntax error on line ${line}` : 'Syntax error';
        header.appendChild(label);

        if (line && options.onGoToLine) {
            const goTo = document.createElement('button');
            goTo.type = 'button';
            goTo.className = 'diagram-view__error-btn';
            goTo.textContent = 'Go to line';
            goTo.addEventListener('click', () => options.onGoToLine?.(line));
            header.appendChild(goTo);
        }

        const details = document.createElement('pre');
        details.className = 'diagram-view__error-message';
        details.textContent = message;

        errorDisplay.replaceChildren(header, details);
        errorDisplay.hidden = false;
        Logger.warn('Mermaid render error:', message);
    };

    const renderDiagram = async (markdown: string) => {
        const renderId = ++diagramId;
        lastRenderedMarkdown = markdown;

        if (!markdown.trim()) {
            container.innerHTML = '';
            hideError();
            return;
        }

        try {
            mermaid.initialize({
                startOnLoad: false,
                theme: resolveMermaidTheme(getState()),
                securityLevel: 'loose',
            });

            // Parse first so invalid input doesn't leave error SVGs in the page
            await mermaid.parse(markdown);
            const { svg } = await mermaid.render(`mermaid-diagram-${renderId}`, markdown);

            // A newer render started while this one was in progress
            if (renderId !== diagramId) return;

            // Only replace content after new SVG is ready (prevents flash);
            // on error the last good diagram stays visible
            container.innerHTML = svg;
            hideError();

            // Initialize panzoom on new SVG
            initPanzoom();

            Logger.debug('Diagram rendered successfully');
        } catch (error) {
            if (renderId !== diagramId) return;
            showError(error);
        }
    };

    const debouncedRender = debounce((markdown: string) => {
        void renderDiagram(markdown);
    }, 300);

    // Subscribe to state changes - re-render if markdown or diagram theme changed
    subscribe(state => {
        view.classList.toggle('diagram-view--neon', usesNeonStyle(state));

        const theme = resolveMermaidTheme(state);
        const themeChanged = theme !== lastRenderedTheme;
        const markdownChanged = state.markdown !== lastRenderedMarkdown;

        if (themeChanged) {
            lastRenderedTheme = theme;
        }

        if (markdownChanged || themeChanged) {
            debouncedRender(state.markdown);
        }
    });

    // Initial render
    view.classList.toggle('diagram-view--neon', usesNeonStyle(getState()));
    void renderDiagram(getState().markdown);

    const zoomTo = (scale: number) => {
        if (!panzoomInstance) return;
        // Use screen coordinates (center of container on screen)
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        panzoomInstance.zoomAbs(centerX, centerY, scale);
    };

    const controls: DiagramViewControls = {
        resetZoom: () => {
            if (panzoomInstance) {
                panzoomInstance.moveTo(0, 0);
                panzoomInstance.zoomAbs(0, 0, 1);
            }
        },
        zoomIn: () => {
            if (panzoomInstance) {
                zoomTo(Math.min(MAX_ZOOM, panzoomInstance.getTransform().scale + ZOOM_STEP));
            }
        },
        zoomOut: () => {
            if (panzoomInstance) {
                zoomTo(Math.max(MIN_ZOOM, panzoomInstance.getTransform().scale - ZOOM_STEP));
            }
        },
        fitToView: () => {
            if (panzoomInstance) {
                const svg = container.querySelector('svg');
                if (svg) {
                    const containerRect = container.getBoundingClientRect();
                    const svgRect = svg.getBoundingClientRect();
                    // The rect is already scaled by the current zoom level
                    const currentScale = panzoomInstance.getTransform().scale;
                    const scale =
                        Math.min(
                            containerRect.width / (svgRect.width / currentScale),
                            containerRect.height / (svgRect.height / currentScale)
                        ) * 0.9;
                    panzoomInstance.moveTo(0, 0);
                    panzoomInstance.zoomAbs(0, 0, Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scale)));
                }
            }
        },
    };

    return { element: view, controls };
}
