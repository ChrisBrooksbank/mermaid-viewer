import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, retryWithBackoff } from './helpers';

describe('helpers', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('debounce only runs the last call', () => {
        const fn = vi.fn();
        const debounced = debounce(fn, 100);
        debounced('a');
        debounced('b');
        vi.advanceTimersByTime(99);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledOnce();
        expect(fn).toHaveBeenCalledWith('b');
    });

    it('retryWithBackoff retries until success', async () => {
        const fn = vi
            .fn<() => Promise<string>>()
            .mockRejectedValueOnce(new Error('fail'))
            .mockResolvedValue('ok');
        const result = retryWithBackoff(fn, 3, 100);
        await vi.runAllTimersAsync();
        await expect(result).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retryWithBackoff gives up after max attempts', async () => {
        const fn = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('nope'));
        const result = retryWithBackoff(fn, 2, 100);
        const assertion = expect(result).rejects.toThrow('nope');
        await vi.runAllTimersAsync();
        await assertion;
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
