const TTL_MS = 24 * 60 * 60 * 1000;

function toBase64url(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

function fromBase64url(str: string): ArrayBuffer {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0)).buffer as ArrayBuffer;
}

async function importKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        [usage],
    );
}

export async function createToken(email: string, secret: string): Promise<string> {
    const payloadJson = JSON.stringify({ email, exp: Date.now() + TTL_MS });
    const payload = toBase64url(new TextEncoder().encode(payloadJson));
    const key = await importKey(secret, "sign");
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return `${payload}.${toBase64url(new Uint8Array(sig))}`;
}

export type VerifyResult =
    | { ok: true; email: string }
    | { ok: false; reason: "expired" | "invalid" };

export async function verifyToken(token: string, secret: string): Promise<VerifyResult> {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return { ok: false, reason: "invalid" };

    const payload = token.slice(0, dot);
    const sigStr = token.slice(dot + 1);

    let parsed: { email: string; exp: number };
    try {
        parsed = JSON.parse(new TextDecoder().decode(fromBase64url(payload)));
    } catch {
        return { ok: false, reason: "invalid" };
    }

    const key = await importKey(secret, "verify");
    const valid = await crypto.subtle.verify(
        "HMAC",
        key,
        fromBase64url(sigStr),
        new TextEncoder().encode(payload),
    );

    if (!valid) return { ok: false, reason: "invalid" };
    if (Date.now() > parsed.exp) return { ok: false, reason: "expired" };

    return { ok: true, email: parsed.email };
}
