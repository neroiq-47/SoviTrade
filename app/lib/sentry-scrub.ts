import type { Breadcrumb, Event } from "@sentry/nextjs";
const BASE58 = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;
export function scrubEvent(event: Event) {
  if (event.message) event.message = event.message.replace(BASE58, (m) => m.slice(0, 4) + "…" + m.slice(-4));
  return event;
}
export function scrubBreadcrumb(b: Breadcrumb) {
  if (b.message) b.message = b.message.replace(BASE58, (m) => m.slice(0, 4) + "…" + m.slice(-4));
  return b;
}
