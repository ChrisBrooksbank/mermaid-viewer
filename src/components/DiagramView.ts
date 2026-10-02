/**
 * Mermaid diagram viewer with pan/zoom
 */

import mermaid from 'mermaid';
import panzoom, { type PanZoom } from 'panzoom';
import type { AppState, DiagramViewControls } from '@/types/app';
import { getState, resolveMermaidTheme, setState, subscribe } from '@core/state';
import { parseMermaidError } from '@core/errors';
import { Logger } from '@utils/logger';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

interface DiagramViewOptions {
    /** Called when the user asks to jump to the line an error points at */
    onGoToLine?: (line: number) => void;
    /** Fit the diagram to the view after each render (view-only mode) */
    fitOnRender?: boolean;
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
    let lastDocumentId = getState().activeDocumentId;
    /** Document the currently displayed diagram belongs to */
    let displayedDocumentId: string | null = null;
    let renderTimer: ReturnType<typeof setTimeout> | undefined;

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

    const clearDiagram = () => {
        panzoomInstance?.dispose();
        panzoomInstance = null;
        container.innerHTML = '';
        displayedDocumentId = null;
    };

    const renderDiagram = async (markdown: string) => {
        const renderId = ++diagramId;
        const documentId = getState().activeDocumentId;
        lastRenderedMarkdown = markdown;

        if (!markdown.trim()) {
            clearDiagram();
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
            displayedDocumentId = documentId;
            hideError();

            // Initialize panzoom on new SVG
            initPanzoom();
            if (options.fitOnRender) controls.fitToView();

            Logger.debug('Diagram rendered successfully');
        } catch (error) {
            if (renderId !== diagramId) return;
            // Keep the last good diagram only if it is this document's
            if (displayedDocumentId !== documentId) clearDiagram();
            showError(error);
        }
    };

    const scheduleRender = (markdown: string, delay: number) => {
        clearTimeout(renderTimer);
        renderTimer = setTimeout(() => void renderDiagram(markdown), delay);
    };

    // Subscribe to state changes - re-render if markdown or diagram theme changed
    subscribe(state => {
        view.classList.toggle('diagram-view--neon', usesNeonStyle(state));

        const theme = resolveMermaidTheme(state);
        const themeChanged = theme !== lastRenderedTheme;
        const markdownChanged = state.markdown !== lastRenderedMarkdown;

        if (themeChanged) {
            lastRenderedTheme = theme;
        }

        if (state.activeDocumentId !== lastDocumentId) {
            // Switching diagrams: show the new one straight away
            lastDocumentId = state.activeDocumentId;
            scheduleRender(state.markdown, 0);
        } else if (markdownChanged || themeChanged) {
            scheduleRender(state.markdown, 300);
        }
    });

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
            const svg = container.querySelector('svg');
            if (!panzoomInstance || !svg) return;

            const containerRect = container.getBoundingClientRect();
            const svgRect = svg.getBoundingClientRect();
            const transform = panzoomInstance.getTransform();
            if (svgRect.width === 0 || svgRect.height === 0) return;

            // The rect is already scaled and moved by the current transform
            const width = svgRect.width / transform.scale;
            const height = svgRect.height / transform.scale;
            const layoutLeft = svgRect.left - transform.x;
            const layoutTop = svgRect.top - transform.y;

            const scale = Math.min(
                MAX_ZOOM,
                Math.max(
                    MIN_ZOOM,
                    Math.min(containerRect.width / width, containerRect.height / height) * 0.9
                )
            );

            // Centre the scaled diagram in the container
            panzoomInstance.zoomAbs(0, 0, scale);
            panzoomInstance.moveTo(
                containerRect.left + (containerRect.width - width * scale) / 2 - layoutLeft,
                containerRect.top + (containerRect.height - height * scale) / 2 - layoutTop
            );
        },
    };

    // Initial render
    view.classList.toggle('diagram-view--neon', usesNeonStyle(getState()));
    void renderDiagram(getState().markdown);

    return { element: view, controls };
}
