/**
 * Configuration Loader
 * Loads and validates configuration from app.config.json
 */

import { Logger } from '@utils/logger';
import { ConfigSchema, ConfigValidationError } from './schema';
import type { AppConfig } from './schema';

// app.config.json is optional and gitignored, so it is bundled at build time
// when present rather than fetched (which 404s on deployments without it).
const configFiles = import.meta.glob<unknown>('/app.config.json', {
    eager: true,
    import: 'default',
});

let config: AppConfig | null = null;

/**
 * Load and validate configuration, using defaults when no config file exists.
 * Call once at app startup
 */
export async function loadConfig(
    rawConfig: unknown = Object.values(configFiles)[0]
): Promise<AppConfig> {
    if (rawConfig === undefined) {
        Logger.debug('No app.config.json, using defaults');
        config = ConfigSchema.parse({});
        return config;
    }

    const result = ConfigSchema.safeParse(rawConfig);
    if (!result.success) {
        Logger.error('Config validation errors:', result.error.format());
        throw new ConfigValidationError('Invalid configuration', result.error);
    }

    config = result.data;
    return config;
}

/**
 * Get loaded configuration
 * Throws if config not loaded yet
 * @public
 */
export function getConfig(): AppConfig {
    if (!config) {
        throw new Error('Config not loaded. Call loadConfig() first.');
    }
    return config;
}

/**
 * Check if config has been loaded
 * @public
 */
export function isConfigLoaded(): boolean {
    return config !== null;
}

/**
 * Reset config (useful for testing)
 * @public
 */
export function resetConfig(): void {
    config = null;
}

/**
 * Set config directly (useful for testing)
 * @public
 */
export function setConfig(newConfig: AppConfig): void {
    config = newConfig;
}
