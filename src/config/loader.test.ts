import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConfig, isConfigLoaded, loadConfig, resetConfig } from './loader';
import { ConfigValidationError } from './schema';

describe('config loader', () => {
    beforeEach(() => {
        resetConfig();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('uses defaults when there is no config file', async () => {
        expect(await loadConfig(undefined)).toEqual({ debug: false });
        expect(isConfigLoaded()).toBe(true);
    });

    it('validates and stores a config', async () => {
        await loadConfig({ debug: true });
        expect(getConfig()).toEqual({ debug: true });
    });

    it('rejects an invalid config', async () => {
        await expect(loadConfig({ debug: 'yes' })).rejects.toBeInstanceOf(ConfigValidationError);
    });

    it('throws if read before loading', () => {
        expect(() => getConfig()).toThrow('Config not loaded');
    });
});
