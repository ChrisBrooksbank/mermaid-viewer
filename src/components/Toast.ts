/**
 * Transient notification messages
 */

const TOAST_DURATION = 3000;

export function showToast(message: string, kind: 'info' | 'error' = 'info'): void {
    const toast = document.createElement('div');
    toast.className = `toast toast--${kind}`;
    toast.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), TOAST_DURATION);
}
