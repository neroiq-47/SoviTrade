import * as Sentry from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent } from "@/lib/sentry-scrub";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,
  debug: process.env.SENTRY_DEBUG === "1",
  tracesSampleRate: 0.1,
  // SDK v11 replaced sendDefaultPii with dataCollection; this is the "no PII" equivalent.
  dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false, stackFrameVariables: false },
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb,
});
