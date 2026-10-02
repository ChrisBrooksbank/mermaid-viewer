import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getState, setState } from './state';
import { initKeyboardShortcuts, setDiagramControls, setFileActions } from './keyboard';

function press(key: string, modifiers: KeyboardEventInit = { ctrlKey: true }): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, cancelable: true, ...modifiers });
    document.dispatchEvent(event);
    return event;
}

describe('keyboard shortcuts', () => {
    const controls = {
        zoomIn: vi.fn(),
        zoomOut: vi.fn(),
        resetZoom: vi.fn(),
        fitToView: vi.fn(),
    };
    const files = { openFile: vi.fn(), saveFile: vi.fn() };
    let dispose: () => void;

    beforeEach(() => {
        vi.clearAllMocks();
        setDiagramControls(controls);
        setFileActions(files);
        setState({ isFullscreen: false });
        dispose = initKeyboardShortcuts();
    });

    afterEach(() => {
        dispose();
    });

    it('zooms with Ctrl/Cmd + = - 0', () => {
        expect(press('=').defaultPrevented).toBe(true);
        press('+', { metaKey: true });
        press('-');
        press('0');
        expect(controls.zoomIn).toHaveBeenCalledTimes(2);
        expect(controls.zoomOut).toHaveBeenCalledOnce();
        expect(controls.resetZoom).toHaveBeenCalledOnce();
    });

    it('toggles fullscreen with Ctrl+Enter and exits with Escape', () => {
        press('Enter');
        expect(getState().isFullscreen).toBe(true);
        press('Escape', {});
        expect(getState().isFullscreen).toBe(false);
    });

    it('saves and opens files', () => {
        expect(press('s').defaultPrevented).toBe(true);
        press('O', { ctrlKey: true, shiftKey: true });
        expect(files.saveFile).toHaveBeenCalledOnce();
        expect(files.openFile).toHaveBeenCalledOnce();
    });

    it('ignores keys without a modifier', () => {
        const event = press('s', {});
        expect(event.defaultPrevented).toBe(false);
        expect(files.saveFile).not.toHaveBeenCalled();
    });

    it('stops listening once disposed', () => {
        dispose();
        press('s');
        expect(files.saveFile).not.toHaveBeenCalled();
        dispose = () => {};
    });
});
