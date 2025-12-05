/**
 * Stack Overflow API 통합
 * Stack Exchange API를 사용하여 질문 조회
 */

import { cache, createCacheKey } from './cache'
import { retryWithBackoff } from './api'

const STACK_EXCHANGE_API_ENDPOINT = 'https://api.stackexchange.com/2.3/questions'

export interface StackOverflowQuestion {
  questionId: number
  title: string
  link: string
  score: number
  answerCount: number
  viewCount: number
  tags: string[]
  isAnswered: boolean
  creationDate: number
  owner: {
    displayName: string
    reputation: number
  }
}

export interface StackOverflowConfig {
  tags: string[]
  apiKey?: string
}

/**
 * Stack Exchange API에서 태그 기반 질문 조회
 */
async function fetchStackOverflowQuestions(
  tags: string[],
  apiKey?: string
): Promise<StackOverflowQuestion[]> {
  if (tags.length === 0) {
    return []
  }

  // 태그를 세미콜론으로 구분하여 조회
  const tagString = tags.join(';')
  const url = new URL(STACK_EXCHANGE_API_ENDPOINT)
  url.searchParams.set('order', 'desc')
  url.searchParams.set('sort', 'activity')
  url.searchParams.set('tagged', tagString)
  url.searchParams.set('site', 'stackoverflow')
  url.searchParams.set('pagesize', '5')
  url.searchParams.set('filter', 'default')
  
  if (apiKey) {
    url.searchParams.set('key', apiKey)
  }

  const response = await retryWithBackoff(
      () => fetch(url.toString()),
      {
        maxRetries: 3,
        initialDelay: 2000,
        backoffFactor: 2,
      }
    )

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error_message?.includes('throttle')) {
          throw new Error('API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.')
        }
      }
      if (response.status === 429) {
        throw new Error('API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.')
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Stack Exchange API 응답 타입
    interface StackExchangeQuestion {
      question_id: number
      title: string
      link: string
      score: number
      answer_count: number
      view_count: number
      tags: string[]
      is_answered: boolean
      creation_date: number
      owner?: {
        display_name: string
        reputation: number
      }
    }

    interface StackExchangeResponse {
      items: StackExchangeQuestion[]
    }

    // Stack Exchange API 응답을 StackOverflowQuestion 형식으로 변환
    return (data as StackExchangeResponse).items?.map((item) => ({
      questionId: item.question_id,
      title: item.title,
      link: item.link,
      score: item.score || 0,
      answerCount: item.answer_count || 0,
      viewCount: item.view_count || 0,
      tags: item.tags || [],
      isAnswered: item.is_answered || false,
      creationDate: item.creation_date || 0,
      owner: {
        displayName: item.owner?.display_name || 'Unknown',
        reputation: item.owner?.reputation || 0,
      },
    })) || []
}

/**
 * Stack Overflow 질문 가져오기
 */
export async function fetchStackOverflowQuestionsData(
  config: StackOverflowConfig,
  skipCache: boolean = false
): Promise<StackOverflowQuestion[]> {
  const cacheKey = createCacheKey('stackoverflow', config.tags.join(','), config.apiKey || 'no-key')

  // 캐시 확인 (skipCache가 true면 캐시 무시)
  if (!skipCache) {
    const cached = cache.get<StackOverflowQuestion[]>(cacheKey)
    if (cached) {
      return cached
    }
  }

  const questions = await fetchStackOverflowQuestions(config.tags, config.apiKey)

  // 캐시에 저장 (10분 TTL)
  cache.set(cacheKey, questions, 10 * 60 * 1000)

  return questions
}

/**
 * Stack Overflow 캐시 무효화
 */
export function invalidateStackOverflowCache(tags: string[], apiKey?: string): void {
  const cacheKey = createCacheKey('stackoverflow', tags.join(','), apiKey || 'no-key')
  cache.delete(cacheKey)
}

