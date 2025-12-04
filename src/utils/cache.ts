/**
 * 클라이언트 측 캐싱 메커니즘
 * GitHub API 요청 최적화를 위한 캐싱
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class Cache {
  private storage = new Map<string, CacheEntry<unknown>>()

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // 기본 TTL: 5분
    this.storage.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.storage.get(key) as CacheEntry<T> | undefined

    if (!entry) {
      return null
    }

    // TTL 확인
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.storage.delete(key)
      return null
    }

    return entry.data
  }

  clear(): void {
    this.storage.clear()
  }

  delete(key: string): void {
    this.storage.delete(key)
  }
}

export const cache = new Cache()

/**
 * 캐시 키 생성 헬퍼
 */
export function createCacheKey(prefix: string, ...args: (string | number)[]): string {
  return `${prefix}:${args.join(':')}`
}

