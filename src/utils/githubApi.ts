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
 * REST API로 특정 레포지토리의 오늘 커밋 개수 조회
 */
async function fetchTodayCommitsFromRepo(
  owner: string,
  repo: string,
  username: string,
  token: string
): Promise<number> {
  const now = new Date()
  // UTC 기준 오늘 00:00:00
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayStart = todayUTC.toISOString()

  // until 파라미터는 제거하고 since만 사용 (GitHub API의 until이 제대로 작동하지 않을 수 있음)
  // 대신 클라이언트 측에서 오늘 날짜로 필터링
  const url = `${GITHUB_REST_API_ENDPOINT}/repos/${owner}/${repo}/commits?author=${username}&since=${todayStart}&per_page=100`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // 레포지토리가 없거나 접근 권한이 없는 경우
        return 0
      }
      if (response.status === 403 || response.status === 429) {
        throw new Error(getRateLimitMessage(null))
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // 첫 페이지 커밋 개수
    const commits = await response.json()
    
    // 오늘 날짜로 필터링 (클라이언트 측에서)
    // 커밋 날짜는 author.date 또는 committer.date를 사용
    const todayDateStr = todayUTC.toISOString().split('T')[0] // YYYY-MM-DD 형식
    
    const todayCommits = commits.filter((commit: any) => {
      const commitDate = commit.commit?.author?.date || commit.commit?.committer?.date
      if (!commitDate) return false
      
      // 커밋 날짜를 YYYY-MM-DD 형식으로 변환
      const commitDateStr = new Date(commitDate).toISOString().split('T')[0]
      
      // 오늘 날짜와 일치하는지 확인
      return commitDateStr === todayDateStr
    })
    
    let count = todayCommits.length

    // Link 헤더에서 페이지네이션 확인
    const linkHeader = response.headers.get('Link')
    const hasNextPage = linkHeader?.includes('rel="next"') ?? false

    // 다음 페이지가 있으면 추가 조회 (최대 10페이지까지, 즉 최대 1000개 커밋)
    if (hasNextPage && count === 100) {
      let page = 2
      while (page <= 10) {
        const nextPageUrl = `${url}&page=${page}`
        const nextResponse = await fetch(nextPageUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        })

        if (!nextResponse.ok) {
          break
        }

        const nextCommits = await nextResponse.json()
        
        // 오늘 날짜로 필터링
        const todayDateStr = todayUTC.toISOString().split('T')[0]
        const nextTodayCommits = nextCommits.filter((commit: any) => {
          const commitDate = commit.commit?.author?.date || commit.commit?.committer?.date
          if (!commitDate) return false
          const commitDateStr = new Date(commitDate).toISOString().split('T')[0]
          return commitDateStr === todayDateStr
        })
        
        count += nextTodayCommits.length

        // 다음 페이지가 없거나 100개 미만이면 종료
        const nextLinkHeader = nextResponse.headers.get('Link')
        const hasMorePages = nextLinkHeader?.includes('rel="next"') ?? false
        if (!hasMorePages || nextCommits.length < 100) {
          break
        }

        page++
      }
    }

    return count
  } catch (error) {
    // 오류 발생 시 0 반환 (해당 레포지토리만 실패)
    return 0
  }
}

/**
 * REST API로 모든 레포지토리의 오늘 커밋 개수 합계 조회
 */
async function fetchTodayCommitsFromREST(
  config: GitHubConfig,
  selectedRepos: string[] = []
): Promise<number> {
  if (!config.username) {
    return 0
  }

  try {
    // 레포지토리 목록 가져오기
    const repos = await fetchUserRepositories(config)
    
    // 필터링: selectedRepos가 있으면 선택된 레포만, 없으면 모든 레포
    const reposToCheck = selectedRepos.length > 0
      ? repos.filter((repo) => selectedRepos.includes(repo.name))
      : repos

    if (reposToCheck.length === 0) {
      return 0
    }

    // 병렬로 각 레포지토리의 커밋 개수 조회 (Rate Limit 고려하여 배치 처리)
    // 한 번에 너무 많은 요청을 보내면 Rate Limit에 걸릴 수 있으므로
    // 배치 크기를 10개로 제한
    const BATCH_SIZE = 10
    let totalCommits = 0

    for (let i = 0; i < reposToCheck.length; i += BATCH_SIZE) {
      const batch = reposToCheck.slice(i, i + BATCH_SIZE)
      
      const batchPromises = batch.map(async (repo) => {
        const [owner, repoName] = repo.fullName.split('/')
        return fetchTodayCommitsFromRepo(owner, repoName, config.username!, config.token)
      })

      const batchResults = await Promise.all(batchPromises)
      totalCommits += batchResults.reduce((sum, count) => sum + count, 0)

      // 배치 간 짧은 딜레이 (Rate Limit 방지)
      if (i + BATCH_SIZE < reposToCheck.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return totalCommits
  } catch (error) {
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
    // REST API로 모든 레포지토리의 실제 커밋 개수 합계 조회
    let todayCommits = 0
    try {
      todayCommits = await fetchTodayCommitsFromREST(config, selectedRepos)
    } catch (error) {
      // REST API 실패 시 contributionCalendar 사용 (폴백)
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

  try {
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
  } catch (error) {
    throw error
  }
}

