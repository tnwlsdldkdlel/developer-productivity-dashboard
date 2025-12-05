/**
 * GitHub API 통합
 * GraphQL을 사용하여 여러 데이터 유형을 한 번의 요청으로 가져오기
 */

import { retryWithBackoff, getRateLimitMessage } from './api'
import { cache, createCacheKey } from './cache'

export interface GitHubConfig {
  token: string
  username?: string
}

export interface Commit {
  date: string
  count: number
}

export interface PullRequest {
  title: string
  url: string
  state: string
  createdAt: string
  repository: string
}

export interface Issue {
  title: string
  url: string
  state: string
  createdAt: string
  repository: string
}

export interface GitHubActivity {
  todayCommits: number
  weekCommits: number
  pullRequests: PullRequest[]
  issues: Issue[]
  rateLimit?: {
    remaining: number
    reset: number
    limit: number
  }
}

const GITHUB_GRAPHQL_ENDPOINT = 'https://api.github.com/graphql'
const GITHUB_REST_API_ENDPOINT = 'https://api.github.com'

/**
 * GitHub GraphQL 응답 타입
 */
interface GraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

/**
 * GitHub Events API를 사용하여 오늘 커밋 개수 조회 (최적화)
 * 한 번의 API 호출로 모든 레포지토리의 커밋 조회
 */
async function fetchTodayCommitsFromEvents(
  config: GitHubConfig,
  selectedRepos: string[] = []
): Promise<number> {
  if (!config.username) {
    return 0
  }

  const now = new Date()
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayStart = todayUTC.toISOString()
  const todayDateStr = todayUTC.toISOString().split('T')[0] // YYYY-MM-DD

  const url = `${GITHUB_REST_API_ENDPOINT}/users/${config.username}/events?per_page=100`

  try {
    // Events API 응답 타입
    interface PushEvent {
      type: string
      created_at: string
      repo: {
        name: string
      }
      payload: {
        size: number // PushEvent의 커밋 개수
        commits?: Array<{
          sha: string
          message: string
          author: {
            name: string
            email: string
          }
        }>
      }
    }

    let allPushEvents: PushEvent[] = []
    let page = 1
    let hasMore = true

    // 최대 5페이지까지 조회 (500개 이벤트)
    while (hasMore && page <= 5) {
      const response = await retryWithBackoff(
        () => fetch(`${url}&page=${page}`, {
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
        {
          maxRetries: 2,
          initialDelay: 1000,
          backoffFactor: 2,
        }
      )

      if (!response.ok) {
        if (response.status === 403 || response.status === 429) {
          throw new Error(getRateLimitMessage(null))
        }
        break
      }

      const events = await response.json()

      // PushEvent만 필터링하고 오늘 날짜 이후의 이벤트만 수집
      const pushEvents = (events as PushEvent[]).filter(
        (event) => event.type === 'PushEvent' && event.created_at >= todayStart
      )

      allPushEvents = allPushEvents.concat(pushEvents)

      // 오늘 날짜를 넘어서면 중단
      if (events.length > 0) {
        const lastEvent = events[events.length - 1] as PushEvent
        if (lastEvent && new Date(lastEvent.created_at) < todayUTC) {
          hasMore = false
        }
      }

      // Link 헤더 확인
      const linkHeader = response.headers.get('Link')
      hasMore = linkHeader?.includes('rel="next"') ?? false
      page++
    }

    // 오늘 날짜로 필터링 및 레포지토리 필터링
    const todayPushEvents = allPushEvents.filter((event) => {
      const eventDate = new Date(event.created_at).toISOString().split('T')[0]
      if (eventDate !== todayDateStr) return false

      if (selectedRepos.length > 0) {
        const repoName = event.repo.name.split('/')[1] // owner/repo 형식에서 repo만 추출
        return selectedRepos.includes(repoName)
      }

      return true
    })

    // 각 PushEvent의 payload.size는 해당 push의 커밋 개수
    // payload.size가 없으면 payload.commits 배열의 길이 사용
    return todayPushEvents.reduce((sum, event) => {
      const commitCount = event.payload.size || event.payload.commits?.length || 1
      return sum + commitCount
    }, 0)
  } catch (error) {
    // Events API 실패 시 0 반환
    return 0
  }
}

/**
 * GitHub GraphQL 쿼리 실행
 */
async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(GITHUB_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })

  const json: GraphQLResponse<T> = await response.json()

  if (!response.ok || json.errors) {
    const errorMessage = json.errors?.[0]?.message || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  return { data: json.data, headers: response.headers }
}

/**
 * GitHub 활동 데이터 캐시 무효화
 */
export function invalidateGitHubActivityCache(username?: string, selectedRepos: string[] = []): void {
  const cacheKey = createCacheKey('github-activity', username || 'user', selectedRepos.join(','))
  cache.delete(cacheKey)
}

/**
 * GitHub 활동 데이터 가져오기
 */
export async function fetchGitHubActivity(
  config: GitHubConfig,
  selectedRepos: string[] = [],
  skipCache: boolean = false
): Promise<GitHubActivity> {
  const cacheKey = createCacheKey('github-activity', config.username || 'user', selectedRepos.join(','))
  
  // 캐시 확인 (skipCache가 true면 캐시 무시)
  if (!skipCache) {
    const cached = cache.get<GitHubActivity>(cacheKey)
    if (cached) {
      return cached
    }
  }

  // 현재 시간 (로컬 타임존 기준)
  const now = new Date()
  
  // 오늘 00:00:00 (로컬 타임존)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  // 7일 전 00:00:00 (로컬 타임존)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)
  
  // GitHub API는 UTC 기준이므로 UTC로 변환
  // 하지만 contributionCalendar의 date는 YYYY-MM-DD 형식의 문자열이므로
  // 로컬 날짜 문자열을 사용

  // 최근 7일 커밋 수를 위한 쿼리
  const weekQuery = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
        pullRequests(first: 10, states: [OPEN, CLOSED, MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            title
            url
            state
            createdAt
            repository {
              name
            }
          }
        }
        issues(first: 10, states: [OPEN, CLOSED], orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            title
            url
            state
            createdAt
            repository {
              name
            }
          }
        }
      }
      rateLimit {
        remaining
        resetAt
        limit
      }
    }
  `

  const weekVariables = {
    username: config.username || 'octocat', // 기본값
    from: weekAgo.toISOString(),
    to: now.toISOString(),
  }

  try {
    interface GitHubGraphQLData {
      user: {
        contributionsCollection: {
          totalCommitContributions: number
          contributionCalendar: {
            weeks: Array<{
              contributionDays: Array<{
                date: string
                contributionCount: number
              }>
            }>
          }
        }
        pullRequests: {
          nodes: Array<{
            title: string
            url: string
            state: string
            createdAt: string
            repository: {
              name: string
            }
          }>
        }
        issues: {
          nodes: Array<{
            title: string
            url: string
            state: string
            createdAt: string
            repository: {
              name: string
            }
          }>
        }
      }
      rateLimit: {
        remaining: number
        resetAt: string
        limit: number
      }
    }

    // 최근 7일 데이터 조회
    const weekResult = await retryWithBackoff(
      () => graphqlQuery<GitHubGraphQLData>(weekQuery, weekVariables, config.token),
      {
        maxRetries: 3,
        initialDelay: 2000,
        backoffFactor: 2,
      }
    )

    const { data: weekData } = weekResult

    // Rate Limit 정보 추출 (GraphQL 응답에서)
    const rateLimitData = weekData.rateLimit
    const rateLimitInfo: { remaining: number; reset: number; limit: number } | null = rateLimitData
      ? {
          remaining: rateLimitData.remaining,
          reset: Math.floor(new Date(rateLimitData.resetAt).getTime() / 1000),
          limit: rateLimitData.limit,
        }
      : null

    // 데이터 변환
    const contributions = weekData.user?.contributionsCollection
    const calendar = contributions?.contributionCalendar
    const weeks = calendar?.weeks || []

    // 최근 7일 커밋 수 계산 (Contribution Calendar 사용)
    let weekCommits = 0
    const allDays: Array<{ date: string; count: number }> = []
    
    weeks.forEach((week) => {
      week.contributionDays.forEach((day) => {
        allDays.push({ date: day.date, count: day.contributionCount })
        weekCommits += day.contributionCount
      })
    })

    // 오늘 커밋 수 계산
    // Events API를 사용하여 한 번의 호출로 모든 레포지토리의 오늘 커밋 개수 조회
    let todayCommits = 0
    try {
      todayCommits = await fetchTodayCommitsFromEvents(config, selectedRepos)
    } catch (error) {
      // Events API 실패 시 contributionCalendar 사용 (폴백)
      const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const todayDateUTC = todayUTC.toISOString().split('T')[0]
      const todayMatch = allDays.find((day) => day.date === todayDateUTC)
      todayCommits = todayMatch?.count || 0
    }

    // PR 목록 변환 (Repository 필터링)
    const pullRequests: PullRequest[] =
      weekData.user?.pullRequests?.nodes
        ?.filter((pr) => {
          if (selectedRepos.length === 0) return true
          return selectedRepos.includes(pr.repository.name)
        })
        .map((pr) => ({
          title: pr.title,
          url: pr.url,
          state: pr.state,
          createdAt: pr.createdAt,
          repository: pr.repository.name,
        })) || []

    // Issue 목록 변환 (Repository 필터링)
    const issues: Issue[] =
      weekData.user?.issues?.nodes
        ?.filter((issue) => {
          if (selectedRepos.length === 0) return true
          return selectedRepos.includes(issue.repository.name)
        })
        .map((issue) => ({
          title: issue.title,
          url: issue.url,
          state: issue.state,
          createdAt: issue.createdAt,
          repository: issue.repository.name,
        })) || []

    const activity: GitHubActivity = {
      todayCommits,
      weekCommits,
      pullRequests,
      issues,
      rateLimit: rateLimitInfo || undefined,
    }

    // 캐시에 저장 (5분)
    cache.set(cacheKey, activity, 5 * 60 * 1000)

    return activity
  } catch (error) {
    // Rate Limit 오류 확인
    if (error instanceof Error && (error.message.includes('403') || error.message.includes('429'))) {
      throw new Error(getRateLimitMessage(null))
    }
    throw error
  }
}

/**
 * 사용자의 Repository 목록 가져오기
 */
export async function fetchUserRepositories(
  config: GitHubConfig
): Promise<Array<{ name: string; fullName: string }>> {
  const cacheKey = createCacheKey('github-repos', config.username || 'user')
  
  const cached = cache.get<Array<{ name: string; fullName: string }>>(cacheKey)
  if (cached) {
    return cached
  }

  const query = `
    query($username: String!) {
      user(login: $username) {
        repositories(first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            name
            nameWithOwner
          }
        }
      }
    }
  `

  interface RepositoriesGraphQLData {
    user: {
      repositories: {
        nodes: Array<{
          name: string
          nameWithOwner: string
        }>
      }
    }
  }

  const result = await retryWithBackoff(
    () =>
      graphqlQuery<RepositoriesGraphQLData>(
        query,
        { username: config.username || 'octocat' },
        config.token
      )
  )

  const repos =
    result.data.user?.repositories?.nodes?.map((repo) => ({
      name: repo.name,
      fullName: repo.nameWithOwner,
    })) || []

  // 캐시에 저장 (10분)
  cache.set(cacheKey, repos, 10 * 60 * 1000)

  return repos
}

