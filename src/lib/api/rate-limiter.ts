// src/lib/api/rate-limiter.ts

// A simple in-memory rate limiter.
// In a real-world distributed environment, you'd replace the `ipCache`
// with a shared store like Redis or Memcached.

type CacheEntry = {
  count: number;
  expiry: number;
};

const ipCache = new Map<string, CacheEntry>();
const TTL = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

export class RateLimiter {
  static async limit(identifier: string): Promise<{success: boolean}> {
    const now = Date.now();
    let entry = ipCache.get(identifier);

    // Clean up expired entries occasionally
    if (Math.random() < 0.01) {
      for (const [key, value] of ipCache.entries()) {
        if (value.expiry < now) {
          ipCache.delete(key);
        }
      }
    }

    // If entry exists and is expired, reset it
    if (entry && entry.expiry < now) {
      entry = undefined;
    }

    // If no entry, create a new one
    if (!entry) {
      entry = {
        count: 0,
        expiry: now + TTL,
      };
    }

    entry.count++;
    ipCache.set(identifier, entry);

    return {success: entry.count <= MAX_REQUESTS};
  }
}
