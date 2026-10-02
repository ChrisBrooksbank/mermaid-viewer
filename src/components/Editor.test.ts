import { describe, it, expect } from 'vitest';
import { setState } from '@core/state';
import { createEditor } from './Editor';

describe('Editor', () => {
    it('syncs typing to state and state to the textarea', () => {
        const { element } = createEditor();
        element.value = 'pie';
        element.dispatchEvent(new Event('input'));

        setState({ markdown: 'graph LR' });
        expect(element.value).toBe('graph LR');
    });

    it('selects a line with goToLine', () => {
        setState({ markdown: 'graph TD\n    A --> B\n    B --> C' });
        const { element, goToLine } = createEditor();
        document.body.appendChild(element);

        goToLine(2);

        expect(document.activeElement).toBe(element);
        expect(element.value.slice(element.selectionStart, element.selectionEnd)).toBe(
            '    A --> B'
        );
        element.remove();
    });
});
