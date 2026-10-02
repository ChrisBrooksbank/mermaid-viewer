import { describe, it, expect, vi, beforeEach } from 'vitest';

const mermaidMock = vi.hoisted(() => ({
    initialize: vi.fn(),
    parse: vi.fn(),
    render: vi.fn(),
}));

vi.mock('mermaid', () => ({ default: mermaidMock }));
vi.mock('panzoom', () => ({
    default: vi.fn(() => ({ dispose: vi.fn(), getTransform: () => ({ scale: 1 }) })),
}));

// State is module-level; each test gets fresh modules so views from
// earlier tests don't react to its state changes
let getState: typeof import('@core/state').getState;
let setState: typeof import('@core/state').setState;
let createDiagramView: typeof import('./DiagramView').createDiagramView;

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('DiagramView', () => {
    beforeEach(async () => {
        vi.resetModules();
        ({ getState, setState } = await import('@core/state'));
        ({ createDiagramView } = await import('./DiagramView'));
        vi.clearAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        mermaidMock.parse.mockResolvedValue(true);
        mermaidMock.render.mockResolvedValue({ svg: '<svg id="ok"></svg>' });
        setState({ markdown: 'graph TD\n A --> B', theme: 'light', mermaidTheme: 'auto' });
    });

    it('renders the diagram with the resolved theme', async () => {
        const { element } = createDiagramView();
        await flush();

        expect(mermaidMock.initialize).toHaveBeenCalledWith(
            expect.objectContaining({ theme: 'default' })
        );
        expect(element.querySelector('#ok')).not.toBeNull();
        expect(element.querySelector<HTMLElement>('.diagram-view__error')!.hidden).toBe(true);
    });

    it('shows syntax errors with a go-to-line button and keeps the last diagram', async () => {
        const onGoToLine = vi.fn();
        const { element } = createDiagramView({ onGoToLine });
        await flush();

        mermaidMock.parse.mockRejectedValueOnce(new Error('Parse error on line 2:\nbad'));
        setState({ markdown: 'graph TD\n A -->' });
        await vi.waitFor(() => expect(getState().error).toContain('line 2'));

        const errorBox = element.querySelector<HTMLElement>('.diagram-view__error')!;
        expect(errorBox.hidden).toBe(false);
        expect(errorBox.textContent).toContain('Syntax error on line 2');
        expect(element.querySelector('#ok')).not.toBeNull();

        errorBox.querySelector<HTMLButtonElement>('.diagram-view__error-btn')!.click();
        expect(onGoToLine).toHaveBeenCalledWith(2);
    });

    it('uses neon styling only when the diagram theme follows a dark app', () => {
        const { element } = createDiagramView();
        setState({ theme: 'dark' });
        expect(element.classList.contains('diagram-view--neon')).toBe(true);
        setState({ mermaidTheme: 'forest' });
        expect(element.classList.contains('diagram-view--neon')).toBe(false);
    });

    it('ignores results from renders that have been superseded', async () => {
        let resolveFirst: (value: { svg: string }) => void = () => {};
        mermaidMock.render.mockImplementation((_id: string, markdown: string) =>
            markdown === 'graph SLOW'
                ? new Promise(resolve => (resolveFirst = resolve))
                : Promise.resolve({ svg: '<svg id="ok"></svg>' })
        );
        setState({ markdown: 'graph SLOW' });
        const { element } = createDiagramView();
        await flush();

        // Second render (empty input) completes before the first
        setState({ markdown: '' });
        // Wait out the 300ms render debounce
        await new Promise(resolve => setTimeout(resolve, 350));
        resolveFirst({ svg: '<svg id="stale"></svg>' });
        await flush();
        expect(element.querySelector('#stale')).toBeNull();
    });

    it("doesn't show another diagram's preview when switching to a broken one", async () => {
        const { openDocument, switchDocument } = await import('@core/documents');
        const firstId = getState().activeDocumentId;
        const { element } = createDiagramView();
        await flush();
        expect(element.querySelector('#ok')).not.toBeNull();

        openDocument('Broken', 'graph TD\n A -->');
        mermaidMock.parse.mockRejectedValueOnce(new Error('Parse error on line 2:\nbad'));
        await vi.waitFor(() => expect(getState().error).toContain('line 2'));
        expect(element.querySelector('svg')).toBeNull();

        switchDocument(firstId);
        await vi.waitFor(() => expect(element.querySelector('#ok')).not.toBeNull());
    });
});
