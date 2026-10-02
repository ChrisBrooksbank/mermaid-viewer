/**
 * localStorage persistence for app state
 */

import { z } from 'zod';
import type { AppState } from '@/types/app';
import { Logger } from '@utils/logger';

const STORAGE_KEY = 'mermaid-pwa-state';

// Each field falls back to undefined when invalid, so one bad value
// doesn't throw away the rest of the saved state.
const StoredStateSchema = z.object({
    markdown: z.string().optional().catch(undefined),
    theme: z.enum(['light', 'dark']).optional().catch(undefined),
    mermaidTheme: z
        .enum(['auto', 'default', 'neutral', 'dark', 'forest', 'base'])
        .optional()
        .catch(undefined),
    exportBackground: z.enum(['transparent', 'white', 'theme']).optional().catch(undefined),
    splitPosition: z.number().min(20).max(80).optional().catch(undefined),
});

type StoredState = z.infer<typeof StoredStateSchema>;

export function saveToStorage(state: AppState): void {
    try {
        const toStore: StoredState = {
            markdown: state.markdown,
            theme: state.theme,
            mermaidTheme: state.mermaidTheme,
            exportBackground: state.exportBackground,
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

        const result = StoredStateSchema.safeParse(JSON.parse(stored));
        if (!result.success) return null;

        // Drop fields that failed validation
        return Object.fromEntries(
            Object.entries(result.data).filter(([, value]) => value !== undefined)
        ) as Partial<AppState>;
    } catch (error) {
        Logger.warn('Failed to load state from localStorage:', String(error));
        return null;
    }
}
