/**
 * API 유틸리티 함수
 * 지수 백오프 재시도, Rate Limit 처리, 에러 핸들링
 */

export interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
}

export interface RateLimitInfo {
  remaining: number
  reset: number
  limit: number
}

/**
 * 지수 백오프 재시도 로직
 * PRD 요구사항: 1차 실패 2초, 2차 실패 4초, 3차 실패 후 오류 UI
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 2000,
    maxDelay = 16000,
    backoffFactor = 2,
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      // Rate Limit 오류는 재시도하지 않음
      if (
        error instanceof Error &&
        (error.message.includes('403') || error.message.includes('429'))
      ) {
        throw error
      }

      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('재시도 실패')
}

/**
 * Rate Limit 정보 추출
 */
export function extractRateLimit(headers: Headers): RateLimitInfo | null {
  const remaining = headers.get('x-ratelimit-remaining')
  const reset = headers.get('x-ratelimit-reset')
  const limit = headers.get('x-ratelimit-limit')

  if (remaining && reset && limit) {
    return {
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
      limit: parseInt(limit, 10),
    }
  }

  return null
}

/**
 * Rate Limit 오류 확인
 */
export function isRateLimitError(status: number, headers: Headers): boolean {
  if (status === 403 || status === 429) {
    return true
  }

  const retryAfter = headers.get('retry-after')
  return retryAfter !== null
}

/**
 * 에러 메시지 생성
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return '알 수 없는 오류가 발생했습니다.'
}

/**
 * Rate Limit 오류 메시지 생성
 */
export function getRateLimitMessage(rateLimit: RateLimitInfo | null): string {
  if (!rateLimit) {
    return 'API 요청 한도가 초과되었습니다. 잠시 후 다시 시도해주세요.'
  }

  const resetDate = new Date(rateLimit.reset * 1000)
  const resetTime = resetDate.toLocaleTimeString('ko-KR')

  return `API 요청 한도가 초과되었습니다. ${resetTime}에 재설정됩니다. (${rateLimit.remaining}/${rateLimit.limit} 남음)`
}

