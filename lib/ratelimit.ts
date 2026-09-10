/**
 * Instance-local In-Memory Rate Limiter
 *
 * NOTE: This rate limiter is instance-local (in-memory) and is not shared across multiple
 * serverless function containers or horizontal replicas. In a multi-instance production
 * deployment (e.g. Vercel Serverless, Kubernetes), this should be replaced with a
 * shared store like Redis or Upstash to ensure strict global rate limiting.
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

export class MemoryRateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private limit: number;
  private windowMs: number;

  constructor(limit = 30, windowMs = 60 * 1000) { // 30 requests per minute default
    this.limit = limit;
    this.windowMs = windowMs;
  }

  check(identifier: string): { allowed: boolean; remaining: number; reset: number } {
    const now = Date.now();
    let entry = this.storage.get(identifier);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
      };
    }

    entry.count++;
    this.storage.set(identifier, entry);

    // Periodically clean up expired entries to prevent memory leaks
    if (this.storage.size > 5000) {
      this.cleanup(now);
    }

    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    return {
      allowed: entry.count <= this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      reset: Math.max(1, resetSeconds),
    };
  }

  private cleanup(now: number) {
    this.storage.forEach((entry, key) => {
      if (now > entry.resetTime) {
        this.storage.delete(key);
      }
    });
  }
}

// Singleton instance for search endpoint
export const apiRateLimiter = new MemoryRateLimiter(30, 60 * 1000);

// Singleton instance for auth endpoints (Signin/Signup)
// Stricter limit: 5 attempts per minute per IP
export const authRateLimiter = new MemoryRateLimiter(5, 60 * 1000);

/**
 * Extract client IP from request headers, preferring Cloudflare's cf-connecting-ip
 * when present, with x-forwarded-for fallback and 127.0.0.1 default.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return '127.0.0.1';
}
