/**
 * Instance-local In-Memory TTL Cache
 *
 * NOTE: This cache is instance-local (in-memory) and is not shared across multiple
 * serverless function containers or horizontal replicas. In a multi-instance production
 * deployment (e.g. Vercel Serverless, Kubernetes), this should be replaced with a
 * shared store like Redis or Upstash.
 */

type CacheEntry<T> = {
  value: T;
  expiry: number;
};

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 1000, defaultTTL = 15 * 60 * 1000) { // 15 minutes default TTL
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.cache.size >= this.maxSize) {
      // Evict the oldest item (first inserted key) safely without for...of iterators
      let firstKey: string | undefined;
      this.cache.forEach((_, key) => {
        if (firstKey === undefined) {
          firstKey = key;
        }
      });
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl ?? this.defaultTTL),
    });
  }
}

// Singleton instance for search results
export const searchCache = new MemoryCache<any>(1000, 15 * 60 * 1000);
