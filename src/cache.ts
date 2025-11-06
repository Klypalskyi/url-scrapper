import { CacheEntry, WebsiteInfo } from './types';

class Cache {
  private store: Map<string, CacheEntry> = new Map();
  private cacheDuration: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  set(key: string, value: WebsiteInfo): void {
    this.store.set(key, {
      data: value,
      timestamp: Date.now(),
    });
  }

  get(key: string): WebsiteInfo | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > this.cacheDuration) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }
}

export const cache = new Cache();
