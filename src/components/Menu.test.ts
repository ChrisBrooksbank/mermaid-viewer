import { describe, it, expect, vi, afterEach } from 'vitest';
import { createMenu } from './Menu';

function setup() {
    const button = document.createElement('button');
    const onSelect = vi.fn();
    const menu = createMenu(button, [{ label: 'Download SVG', onSelect }]);
    document.body.appendChild(menu);
    const panel = menu.querySelector<HTMLElement>('.menu__panel')!;
    return { button, onSelect, menu, panel };
}

describe('Menu', () => {
    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('toggles the panel from its button', () => {
        const { button, panel } = setup();
        expect(panel.hidden).toBe(true);

        button.click();
        expect(panel.hidden).toBe(false);
        expect(button.getAttribute('aria-expanded')).toBe('true');

        button.click();
        expect(panel.hidden).toBe(true);
    });

    it('runs an item and closes', () => {
        const { button, onSelect, panel } = setup();
        button.click();
        panel.querySelector<HTMLButtonElement>('.menu__item')!.click();
        expect(onSelect).toHaveBeenCalledOnce();
        expect(panel.hidden).toBe(true);
    });

    it('closes on Escape and outside clicks', () => {
        const { button, panel } = setup();
        button.click();
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(panel.hidden).toBe(true);

        button.click();
        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
        expect(panel.hidden).toBe(true);
    });

    it('can hold custom content', () => {
        const content = document.createElement('div');
        content.textContent = 'Settings';
        const menu = createMenu(document.createElement('button'), content);
        expect(menu.querySelector('.menu__panel')!.textContent).toBe('Settings');
    });
});
