import { PostHog } from "posthog-node"

// Server-side PostHog analytics. When the key is absent, capture() is a no-op so
// the app runs without analytics configured.
const hasPostHog = !!process.env.NEXT_PUBLIC_POSTHOG_KEY

const client = hasPostHog
  ? new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    })
  : null

export type AnalyticsEvent =
  | "cv_uploaded"
  | "resume_generated"
  | "resume_tailored"
  | "cover_letter_generated"
  | "cv_analyzed"

/**
 * Capture a server-side product event. Safe to call without PostHog configured.
 * Awaited flush keeps events from being dropped in short-lived serverless calls.
 */
export async function trackEvent(
  distinctId: string,
  event: AnalyticsEvent,
  properties?: Record<string, unknown>
): Promise<void> {
  if (!client) return
  try {
    client.capture({ distinctId, event, properties })
    await client.flush()
  } catch (err) {
    console.error("PostHog capture error:", err)
  }
}
