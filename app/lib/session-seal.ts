/**
 * Seals a session secret in the browser.
 * The bot record stores only `keyMaterialRef`. Ciphertext lives in a separate
 * localStorage map. The wrap key lives in sessionStorage and is never the root key.
 */

const SEALED = "sovitrade.sealed.v1";
const WRAP = "sovitrade.wrap.v1";

function bytesToB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function readMap(storage: Storage, key: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(storage.getItem(key) || "{}") as unknown;
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

/** Returns a reference. The raw secret is not written to localStorage. */
export async function sealSessionSecret(secret: Uint8Array): Promise<string> {
  const ref = `km_${crypto.randomUUID()}`;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrap = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey("raw", wrap, "AES-GCM", false, ["encrypt"]);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, secret.slice()));
  const sealed = readMap(localStorage, SEALED);
  sealed[ref] = { alg: "AES-GCM", iv: bytesToB64(iv), ciphertext: bytesToB64(ct) };
  localStorage.setItem(SEALED, JSON.stringify(sealed));
  const wraps = readMap(sessionStorage, WRAP);
  wraps[ref] = bytesToB64(wrap);
  sessionStorage.setItem(WRAP, JSON.stringify(wraps));
  wrap.fill(0);
  secret.fill(0);
  return ref;
}
