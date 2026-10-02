/**
 * localStorage persistence for app state
 */

import { z } from 'zod';
import type { AppState, DiagramDocument } from '@/types/app';
import { Logger } from '@utils/logger';

const STORAGE_KEY = 'mermaid-pwa-state';

const SnapshotSchema = z.object({
    id: z.string(),
    createdAt: z.number(),
    markdown: z.string(),
    auto: z.boolean().catch(false),
});

const DocumentSchema = z.object({
    id: z.string().min(1),
    name: z.string(),
    markdown: z.string(),
    updatedAt: z.number().catch(0),
    snapshots: z
        .array(z.unknown())
        .catch([])
        .transform(items =>
            items.flatMap(item => {
                const result = SnapshotSchema.safeParse(item);
                return result.success ? [result.data] : [];
            })
        ),
});

// Each field falls back to undefined when invalid, so one bad value
// doesn't throw away the rest of the saved state.
const StoredStateSchema = z.object({
    /** Legacy (single diagram) format; migrated into a document on load */
    markdown: z.string().optional().catch(undefined),
    documents: z
        .array(z.unknown())
        .optional()
        .catch(undefined)
        .transform(items =>
            items?.flatMap(item => {
                const result = DocumentSchema.safeParse(item);
                return result.success ? [result.data] : [];
            })
        ),
    activeDocumentId: z.string().optional().catch(undefined),
    theme: z.enum(['light', 'dark']).optional().catch(undefined),
    mermaidTheme: z
        .enum(['auto', 'default', 'neutral', 'dark', 'forest', 'base'])
        .optional()
        .catch(undefined),
    exportBackground: z.enum(['transparent', 'white', 'theme']).optional().catch(undefined),
    splitPosition: z.number().min(20).max(80).optional().catch(undefined),
});

type StoredState = z.input<typeof StoredStateSchema>;

export function saveToStorage(state: AppState): void {
    try {
        const toStore: StoredState = {
            documents: state.documents,
            activeDocumentId: state.activeDocumentId,
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

        const data: Partial<AppState> & { documents?: DiagramDocument[] } = result.data;
        if (data.documents?.length === 0) delete data.documents;

        // Drop fields that failed validation
        return Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined)
        ) as Partial<AppState>;
    } catch (error) {
        Logger.warn('Failed to load state from localStorage:', String(error));
        return null;
    }
}
