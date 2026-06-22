import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Upstash-backed rate limiting. When the environment is not configured the
// limiter degrades to a no-op so local development and CI keep working.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

const redis = hasUpstash ? Redis.fromEnv() : null

// Allow 10 AI/upload actions per minute per user — enough for normal use,
// low enough to blunt abuse of the (paid) AI endpoints.
const limiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "tailorcv",
    })
  : null

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

/**
 * Check the rate limit for an identifier (typically the user id).
 * Returns success: true when Upstash is not configured.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 }
  }
  return limiter.limit(identifier)
}
