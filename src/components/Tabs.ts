/**
 * Tab bar for switching between open diagrams
 */

import type { AppState } from '@/types/app';
import { getState, subscribe } from '@core/state';
import { closeDocument, openDocument, renameDocument, switchDocument } from '@core/documents';

function signature(state: AppState): string {
    return JSON.stringify([state.activeDocumentId, state.documents.map(d => [d.id, d.name])]);
}

function startRename(label: HTMLElement, id: string, name: string): void {
    const input = document.createElement('input');
    input.className = 'tabs__rename';
    input.value = name;
    input.setAttribute('aria-label', 'Diagram name');

    let done = false;
    const finish = (save: boolean) => {
        if (done) return;
        done = true;
        if (save && input.value.trim() && input.value.trim() !== name) {
            renameDocument(id, input.value);
        } else {
            input.replaceWith(label);
        }
    };

    input.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('click', e => e.stopPropagation());

    label.replaceWith(input);
    input.focus();
    input.select();
}

export function createTabs(): HTMLElement {
    const bar = document.createElement('div');
    bar.className = 'tabs';
    bar.setAttribute('role', 'tablist');
    bar.setAttribute('aria-label', 'Open diagrams');

    const render = () => {
        const { documents, activeDocumentId } = getState();
        bar.replaceChildren();

        for (const doc of documents) {
            const isActive = doc.id === activeDocumentId;

            const tab = document.createElement('div');
            tab.className = 'tabs__tab';
            tab.classList.toggle('tabs__tab--active', isActive);
            tab.setAttribute('role', 'tab');
            tab.setAttribute('aria-selected', String(isActive));
            tab.tabIndex = isActive ? 0 : -1;
            tab.title = `${doc.name} (double-click to rename)`;
            tab.addEventListener('click', () => switchDocument(doc.id));
            tab.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    switchDocument(doc.id);
                } else if (e.key === 'F2') {
                    startRename(label, doc.id, doc.name);
                }
            });

            const label = document.createElement('span');
            label.className = 'tabs__label';
            label.textContent = doc.name;
            tab.addEventListener('dblclick', () => startRename(label, doc.id, doc.name));

            const close = document.createElement('button');
            close.type = 'button';
            close.className = 'tabs__close';
            close.textContent = '×';
            close.title = `Close ${doc.name}`;
            close.setAttribute('aria-label', `Close ${doc.name}`);
            close.addEventListener('click', e => {
                e.stopPropagation();
                const hasContent = doc.markdown.trim() !== '';
                if (
                    !hasContent ||
                    window.confirm(`Close "${doc.name}"? Its content will be deleted.`)
                ) {
                    closeDocument(doc.id);
                }
            });

            tab.appendChild(label);
            tab.appendChild(close);
            bar.appendChild(tab);

            if (isActive) {
                // Keep the active tab visible when there are many
                queueMicrotask(() => tab.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }));
            }
        }

        const add = document.createElement('button');
        add.type = 'button';
        add.className = 'tabs__add';
        add.textContent = '+';
        add.title = 'New diagram';
        add.setAttribute('aria-label', 'New diagram');
        add.addEventListener('click', () => openDocument('Untitled'));
        bar.appendChild(add);
    };

    let lastSignature = signature(getState());
    render();

    subscribe(state => {
        const next = signature(state);
        if (next !== lastSignature) {
            lastSignature = next;
            render();
        }
    });

    return bar;
}
