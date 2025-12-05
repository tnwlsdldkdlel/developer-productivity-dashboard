/**
 * 기술 뉴스 API 통합
 * Dev.to API를 사용하여 기술 뉴스 헤드라인 조회
 */

import { cache, createCacheKey } from './cache'
import { retryWithBackoff } from './api'

const DEV_TO_API_ENDPOINT = 'https://dev.to/api/articles'

export interface NewsArticle {
  id: number
  title: string
  url: string
  description: string
  publishedAt: string
  author: {
    name: string
    username: string
  }
  tags: string[]
  readingTimeMinutes: number
}

export interface NewsConfig {
  keywords: string[]
}

/**
 * Dev.to API에서 키워드 기반 기사 조회
 */
async function fetchDevToArticles(keywords: string[]): Promise<NewsArticle[]> {
  if (keywords.length === 0) {
    return []
  }

  // 여러 키워드에 대해 병렬로 조회
  const keywordPromises = keywords.map(async (keyword) => {
    const url = `${DEV_TO_API_ENDPOINT}?tag=${encodeURIComponent(keyword)}&per_page=10&top=7`
    
    try {
      const response = await retryWithBackoff(
        () => fetch(url),
        {
          maxRetries: 3,
          initialDelay: 2000,
          backoffFactor: 2,
        }
      )

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.')
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const articles = await response.json()
      
      // Dev.to API 응답 타입
      interface DevToArticle {
        id: number
        title: string
        url: string
        description: string
        published_at: string
        user?: {
          name: string
          username: string
        }
        tag_list: string[]
        reading_time_minutes: number
      }
      
      // Dev.to API 응답을 NewsArticle 형식으로 변환
      return (articles as DevToArticle[]).map((article) => ({
        id: article.id,
        title: article.title,
        url: article.url,
        description: article.description || '',
        publishedAt: article.published_at,
        author: {
          name: article.user?.name || 'Unknown',
          username: article.user?.username || 'unknown',
        },
        tags: article.tag_list || [],
        readingTimeMinutes: article.reading_time_minutes || 0,
      }))
    } catch (error) {
      // 개별 키워드 실패는 무시하고 빈 배열 반환
      console.error(`Failed to fetch articles for keyword "${keyword}":`, error)
      return []
    }
  })

  const results = await Promise.all(keywordPromises)
  
  // 모든 결과를 합치고 중복 제거 (같은 ID의 기사)
  const allArticles = results.flat()
  const uniqueArticles = Array.from(
    new Map(allArticles.map((article) => [article.id, article])).values()
  )

  // 최신순으로 정렬
  return uniqueArticles.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  ).slice(0, 10) // 최대 10개만 반환
}

/**
 * 기술 뉴스 기사 가져오기
 */
export async function fetchTechNews(
  config: NewsConfig,
  skipCache: boolean = false
): Promise<NewsArticle[]> {
  const cacheKey = createCacheKey('tech-news', config.keywords.join(','))

  // 캐시 확인 (skipCache가 true면 캐시 무시)
  if (!skipCache) {
    const cached = cache.get<NewsArticle[]>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const articles = await fetchDevToArticles(config.keywords)

  // 캐시에 저장 (10분 TTL)
  cache.set(cacheKey, articles, 10 * 60 * 1000)

  return articles
}

/**
 * 기술 뉴스 캐시 무효화
 */
export function invalidateTechNewsCache(keywords: string[]): void {
  const cacheKey = createCacheKey('tech-news', keywords.join(','))
  cache.delete(cacheKey)
}

