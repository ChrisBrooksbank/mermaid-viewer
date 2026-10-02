/**
 * Version history (snapshots) of the active diagram
 */

import type { DiagramDocument } from '@/types/app';
import { getState, subscribe } from '@core/state';
import { deleteSnapshot, getActiveDocument, restoreSnapshot, takeSnapshot } from '@core/documents';
import { showToast } from './Toast';

const relativeTime = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
    const seconds = Math.round((timestamp - now) / 1000);
    if (Math.abs(seconds) < 45) return 'just now';
    const minutes = Math.round(seconds / 60);
    if (Math.abs(minutes) < 60) return relativeTime.format(minutes, 'minute');
    const hours = Math.round(minutes / 60);
    if (Math.abs(hours) < 24) return relativeTime.format(hours, 'hour');
    return relativeTime.format(Math.round(hours / 24), 'day');
}

function countLines(text: string): string {
    const lines = text === '' ? 0 : text.split('\n').length;
    return `${lines} line${lines === 1 ? '' : 's'}`;
}

function signature(doc: DiagramDocument, markdown: string): string {
    return JSON.stringify([doc.id, doc.snapshots.map(s => s.id), markdown]);
}

export function createHistoryPanel(): { element: HTMLElement; refresh: () => void } {
    const panel = document.createElement('div');
    panel.className = 'history';

    const render = () => {
        const doc = getActiveDocument();
        const current = getState().markdown;

        const header = document.createElement('div');
        header.className = 'history__header';

        const title = document.createElement('strong');
        title.textContent = `History: ${doc.name}`;

        const save = document.createElement('button');
        save.type = 'button';
        save.className = 'history__save';
        save.textContent = 'Save snapshot';
        save.disabled = doc.snapshots[0]?.markdown === current;
        save.addEventListener('click', () => {
            takeSnapshot();
            showToast('Snapshot saved');
        });

        header.append(title, save);

        const list = document.createElement('ul');
        list.className = 'history__list';

        if (doc.snapshots.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'history__empty';
            empty.textContent =
                'No snapshots yet. Snapshots are also taken automatically while you edit.';
            list.appendChild(empty);
        }

        for (const snapshot of doc.snapshots) {
            const item = document.createElement('li');
            item.className = 'history__item';

            const info = document.createElement('div');
            info.className = 'history__info';
            const when = document.createElement('span');
            when.textContent = formatRelativeTime(snapshot.createdAt);
            when.title = new Date(snapshot.createdAt).toLocaleString();
            const meta = document.createElement('span');
            meta.className = 'history__meta';
            const isCurrent = snapshot.markdown === current;
            meta.textContent = [
                snapshot.auto ? 'Auto' : 'Saved',
                countLines(snapshot.markdown),
                isCurrent ? 'current' : '',
            ]
                .filter(Boolean)
                .join(' · ');
            info.append(when, meta);

            const restore = document.createElement('button');
            restore.type = 'button';
            restore.className = 'history__btn';
            restore.textContent = 'Restore';
            restore.disabled = isCurrent;
            restore.addEventListener('click', () => {
                restoreSnapshot(snapshot.id);
                showToast('Snapshot restored');
            });

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'history__btn history__btn--danger';
            remove.textContent = '×';
            remove.title = 'Delete snapshot';
            remove.setAttribute('aria-label', 'Delete snapshot');
            remove.addEventListener('click', () => deleteSnapshot(snapshot.id));

            item.append(info, restore, remove);
            list.appendChild(item);
        }

        panel.replaceChildren(header, list);
    };

    let lastSignature = '';
    const update = () => {
        const next = signature(getActiveDocument(), getState().markdown);
        if (next !== lastSignature) {
            lastSignature = next;
            render();
        }
    };

    update();
    subscribe(update);

    return {
        element: panel,
        // Re-render so relative times are current
        refresh: () => {
            lastSignature = '';
            update();
        },
    };
}
