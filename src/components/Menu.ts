/**
 * Toolbar dropdown menu
 */

export interface MenuItem {
    label: string;
    onSelect: () => void;
}

/**
 * Create a toolbar button that toggles a dropdown panel. The panel holds
 * either a list of items or arbitrary content.
 */
export function createMenu(
    button: HTMLButtonElement,
    content: MenuItem[] | HTMLElement
): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'menu';

    const panel = document.createElement('div');
    panel.className = 'menu__panel';
    panel.hidden = true;

    if (Array.isArray(content)) {
        panel.setAttribute('role', 'menu');
        for (const item of content) {
            const entry = document.createElement('button');
            entry.type = 'button';
            entry.className = 'menu__item';
            entry.setAttribute('role', 'menuitem');
            entry.textContent = item.label;
            entry.addEventListener('click', () => {
                close();
                item.onSelect();
            });
            panel.appendChild(entry);
        }
    } else {
        panel.appendChild(content);
    }

    button.setAttribute('aria-haspopup', 'true');
    button.setAttribute('aria-expanded', 'false');

    const onDocumentPointer = (e: Event) => {
        if (!wrapper.contains(e.target as Node)) close();
    };
    const onDocumentKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            close();
            button.focus();
        }
    };

    function open() {
        // Fixed positioning so the panel isn't clipped by a scrolling toolbar
        const rect = button.getBoundingClientRect();
        panel.style.top = `${rect.bottom + 4}px`;
        panel.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
        panel.hidden = false;
        button.setAttribute('aria-expanded', 'true');
        document.addEventListener('pointerdown', onDocumentPointer);
        document.addEventListener('keydown', onDocumentKey);
    }

    function close() {
        panel.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        document.removeEventListener('pointerdown', onDocumentPointer);
        document.removeEventListener('keydown', onDocumentKey);
    }

    button.addEventListener('click', () => (panel.hidden ? open() : close()));

    wrapper.appendChild(button);
    wrapper.appendChild(panel);
    return wrapper;
}
