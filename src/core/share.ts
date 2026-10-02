/**
 * Share diagrams via URL: the source is deflated and base64url-encoded
 * into the URL hash, so nothing is sent to a server.
 */

const HASH_KEY = 'code';

async function transform(
    data: Uint8Array<ArrayBuffer>,
    stream: CompressionStream | DecompressionStream
): Promise<Uint8Array> {
    const output = new Response(new Response(data).body!.pipeThrough(stream));
    return new Uint8Array(await output.arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): Uint8Array<ArrayBuffer> {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
    return Uint8Array.from(binary, char => char.charCodeAt(0));
}

export async function encodeDiagram(markdown: string): Promise<string> {
    const compressed = await transform(
        new TextEncoder().encode(markdown),
        new CompressionStream('deflate-raw')
    );
    return toBase64Url(compressed);
}

export async function decodeDiagram(encoded: string): Promise<string> {
    const decompressed = await transform(
        fromBase64Url(encoded),
        new DecompressionStream('deflate-raw')
    );
    return new TextDecoder().decode(decompressed);
}

export async function buildShareUrl(markdown: string, baseUrl: string): Promise<string> {
    const url = new URL(baseUrl);
    url.hash = `${HASH_KEY}=${await encodeDiagram(markdown)}`;
    return url.toString();
}

/**
 * Read a shared diagram from a URL hash. Returns null if the hash
 * holds no diagram or can't be decoded.
 */
export async function readSharedDiagram(hash: string): Promise<string | null> {
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const encoded = params.get(HASH_KEY);
    if (!encoded) return null;

    try {
        return await decodeDiagram(encoded);
    } catch {
        return null;
    }
}
