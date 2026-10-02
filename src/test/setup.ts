/**
 * Vitest setup: fill gaps in jsdom's browser APIs
 */

if (!Blob.prototype.text) {
    Blob.prototype.text = function (this: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(this);
        });
    };
}

// CodeMirror measures text ranges, which jsdom doesn't lay out
if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
    Range.prototype.getBoundingClientRect = () => new DOMRect();
}
