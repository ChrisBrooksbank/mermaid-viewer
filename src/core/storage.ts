/**
 * localStorage persistence for app state
 */

import type { AppState } from '@/types/app';
import { Logger } from '@utils/logger';

const STORAGE_KEY = 'mermaid-pwa-state';

interface StoredState {
    markdown: string;
    theme: 'light' | 'dark';
    splitPosition: number;
}

export function saveToStorage(state: AppState): void {
    try {
        const toStore: StoredState = {
            markdown: state.markdown,
            theme: state.theme,
            splitPosition: state.splitPosition,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
        Logger.warn('Failed to save state to localStorage:', String(error));
    }
}

export function loadFromStorage(): Partial<AppState> | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const parsed = JSON.parse(stored) as StoredState;
        return {
            markdown: parsed.markdown,
            theme: parsed.theme,
            splitPosition: parsed.splitPosition,
        };
    } catch (error) {
        Logger.warn('Failed to load state from localStorage:', String(error));
        return null;
    }
}

export function clearStorage(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        Logger.warn('Failed to clear localStorage:', String(error));
    }
}
