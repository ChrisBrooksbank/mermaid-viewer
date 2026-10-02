/**
 * Mermaid diagram viewer with pan/zoom
 */

import mermaid from 'mermaid';
import panzoom, { type PanZoom } from 'panzoom';
import type { AppState, DiagramViewControls } from '@/types/app';
import { getState, resolveMermaidTheme, setState, subscribe } from '@core/state';
import { parseMermaidError } from '@core/errors';
import { TEMPLATES } from '@core/templates';
import { Logger } from '@utils/logger';

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

/** Templates offered when the diagram is empty */
const QUICK_TEMPLATES = ['flowchart', 'sequence', 'class', 'gantt', 'mindmap'];

/**
 * How the diagram is kept in view until the user pans or zooms:
 * 'auto' centres it (shrinking it to fit if needed), 'fill' scales it to fit.
 */
type FitMode = 'auto' | 'fill' | null;

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

    const zoomBadge = document.createElement('button');
    zoomBadge.type = 'button';
    zoomBadge.className = 'diagram-view__zoom';
    zoomBadge.title = 'Fit to view';
    zoomBadge.hidden = true;

    const emptyState = createEmptyState(getState().readOnly);

    view.appendChild(container);
    view.appendChild(emptyState);
    view.appendChild(zoomBadge);
    view.appendChild(errorDisplay);

    let panzoomInstance: PanZoom | null = null;
    let diagramId = 0;
    let lastRenderedMarkdown = '';
    let lastRenderedTheme = resolveMermaidTheme(getState());
    let lastDocumentId = getState().activeDocumentId;
    /** Document the currently displayed diagram belongs to */
    let displayedDocumentId: string | null = null;
    let renderTimer: ReturnType<typeof setTimeout> | undefined;
    let fitMode: FitMode = 'auto';

    const updateZoomBadge = () => {
        zoomBadge.hidden = !panzoomInstance;
        if (panzoomInstance) {
            zoomBadge.textContent = `${Math.round(panzoomInstance.getTransform().scale * 100)}%`;
        }
    };

    const initPanzoom = () => {
        // Keep the user's zoom and pan when the same diagram re-renders
        const previous = panzoomInstance?.getTransform();
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
            // Once the user drags, stop re-fitting the diagram for them
            panzoomInstance.on('panstart', () => (fitMode = null));
            panzoomInstance.on('transform', updateZoomBadge);
            if (previous && !fitMode) {
                panzoomInstance.zoomAbs(0, 0, previous.scale);
                panzoomInstance.moveTo(previous.x, previous.y);
            }
        }
        updateZoomBadge();
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
        updateZoomBadge();
    };

    const renderDiagram = async (markdown: string) => {
        const renderId = ++diagramId;
        const documentId = getState().activeDocumentId;
        lastRenderedMarkdown = markdown;

        emptyState.hidden = markdown.trim() !== '';
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
            applyFit();

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
            fitMode = 'auto';
            scheduleRender(state.markdown, 0);
        } else if (markdownChanged || themeChanged) {
            scheduleRender(state.markdown, 300);
        }
    });

    /** Zoom about the centre of the view */
    const zoomTo = (scale: number) => {
        const svg = container.querySelector('svg');
        if (!panzoomInstance || !svg) return;
        // panzoom takes the pivot relative to the SVG's untransformed position
        const rect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const { x, y } = panzoomInstance.getTransform();
        panzoomInstance.zoomAbs(
            rect.left + rect.width / 2 - (svgRect.left - x),
            rect.top + rect.height / 2 - (svgRect.top - y),
            scale
        );
        updateZoomBadge();
    };

    /**
     * Centre the diagram, scaled to fit the container (up to maxScale)
     */
    const fit = (maxScale: number) => {
        const svg = container.querySelector('svg');
        if (!panzoomInstance || !svg) return;

        const containerRect = container.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        const transform = panzoomInstance.getTransform();
        if (svgRect.width === 0 || svgRect.height === 0 || containerRect.width === 0) return;

        // The rect is already scaled and moved by the current transform
        const width = svgRect.width / transform.scale;
        const height = svgRect.height / transform.scale;
        const layoutLeft = svgRect.left - transform.x;
        const layoutTop = svgRect.top - transform.y;

        const scale = Math.min(
            maxScale,
            Math.max(
                MIN_ZOOM,
                Math.min(containerRect.width / width, containerRect.height / height) * 0.9
            )
        );

        panzoomInstance.zoomAbs(0, 0, scale);
        panzoomInstance.moveTo(
            containerRect.left + (containerRect.width - width * scale) / 2 - layoutLeft,
            containerRect.top + (containerRect.height - height * scale) / 2 - layoutTop
        );
        updateZoomBadge();
    };

    const applyFit = () => {
        if (fitMode) fit(fitMode === 'fill' ? MAX_ZOOM : 1);
    };

    const controls: DiagramViewControls = {
        resetZoom: () => {
            fitMode = null;
            fit(1);
            if (panzoomInstance && panzoomInstance.getTransform().scale !== 1) zoomTo(1);
        },
        zoomIn: () => {
            if (panzoomInstance) {
                fitMode = null;
                zoomTo(Math.min(MAX_ZOOM, panzoomInstance.getTransform().scale + ZOOM_STEP));
            }
        },
        zoomOut: () => {
            if (panzoomInstance) {
                fitMode = null;
                zoomTo(Math.max(MIN_ZOOM, panzoomInstance.getTransform().scale - ZOOM_STEP));
            }
        },
        fitToView: () => {
            fitMode = 'fill';
            applyFit();
        },
    };

    zoomBadge.addEventListener('click', controls.fitToView);

    // Wheel and pinch zooms are the user's choice too
    container.addEventListener('wheel', () => (fitMode = null), { passive: true });
    container.addEventListener('touchstart', e => {
        if (e.touches.length > 1) fitMode = null;
    });
    container.addEventListener('dblclick', () => (fitMode = null));

    // Keep the diagram fitted as the pane resizes (split drag, fullscreen, window)
    if (typeof ResizeObserver !== 'undefined') {
        let resizeFrame = 0;
        new ResizeObserver(() => {
            cancelAnimationFrame(resizeFrame);
            resizeFrame = requestAnimationFrame(applyFit);
        }).observe(container);
    }

    // Initial render
    view.classList.toggle('diagram-view--neon', usesNeonStyle(getState()));
    emptyState.hidden = getState().markdown.trim() !== '';
    void renderDiagram(getState().markdown);

    return { element: view, controls };
}

function createEmptyState(readOnly: boolean): HTMLElement {
    const empty = document.createElement('div');
    empty.className = 'diagram-view__empty';

    const message = document.createElement('p');
    message.textContent = readOnly
        ? 'This diagram is empty.'
        : 'Type Mermaid syntax in the editor, or start from a template:';
    empty.appendChild(message);

    if (!readOnly) {
        const buttons = document.createElement('div');
        buttons.className = 'diagram-view__empty-templates';
        for (const template of TEMPLATES.filter(t => QUICK_TEMPLATES.includes(t.id))) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = template.name;
            btn.addEventListener('click', () => setState({ markdown: template.code }));
            buttons.appendChild(btn);
        }
        empty.appendChild(buttons);
    }

    return empty;
}
