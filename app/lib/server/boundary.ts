/**
 * Browser guard that does not use the `server-only` package.
 * The Cloudflare worker has no `window`, so it can import these modules.
 * Next.js client components must not import them.
 */
export function assertNotBrowser(): void {
  if (typeof window !== "undefined") {
    throw new Error("Server-only module imported in the browser");
  }
}
