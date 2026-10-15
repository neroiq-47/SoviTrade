"use client";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return <html lang="en"><body style={{ background: "#0B0A14", color: "#EDEBF7", fontFamily: "system-ui", display: "grid", placeItems: "center", minHeight: "100vh" }}>
    <div style={{ textAlign: "center" }}><h1>Something went wrong</h1><p style={{ color: "#9A96B5" }}>The error has been reported. Please reload the page.</p></div>
  </body></html>;
}
