/**
 * Main App component - orchestrates all UI components
 */

import mermaid from 'mermaid';
import { getState, initializeState, subscribe } from '@core/state';
import { initKeyboardShortcuts, setDiagramControls } from '@core/keyboard';
import { createToolbar } from './Toolbar';
import { createEditor } from './Editor';
import { createDiagramView } from './DiagramView';
import { createSplitPane } from './SplitPane';
import { Logger } from '@utils/logger';

export function initApp(container: HTMLElement): void {
    Logger.info('Initializing Mermaid Viewer app');

    // Initialize state from localStorage
    initializeState();

    // Initialize mermaid with current theme
    const state = getState();
    mermaid.initialize({
        startOnLoad: false,
        theme: state.theme === 'dark' ? 'dark' : 'default',
        securityLevel: 'loose',
    });

    // Update mermaid theme when app theme changes
    subscribe(newState => {
        mermaid.initialize({
            startOnLoad: false,
            theme: newState.theme === 'dark' ? 'dark' : 'default',
            securityLevel: 'loose',
        });
    });

    // Create app container
    const app = document.createElement('div');
    app.className = 'app';

    // Create components
    const editor = createEditor();
    const { element: diagramView, controls } = createDiagramView();

    // Register diagram controls for keyboard shortcuts
    setDiagramControls(controls);

    const toolbar = createToolbar(controls);
    const splitPane = createSplitPane(editor, diagramView);

    // Handle fullscreen state
    subscribe(newState => {
        app.classList.toggle('fullscreen', newState.isFullscreen);
    });

    // Assemble app
    app.appendChild(toolbar);
    app.appendChild(splitPane);

    // Mount to container
    container.innerHTML = '';
    container.appendChild(app);

    // Initialize keyboard shortcuts
    initKeyboardShortcuts();

    Logger.success('Mermaid Viewer app initialized');
}
