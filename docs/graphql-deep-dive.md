# GraphQL 딥다이브

## 목차
1. [GraphQL이란?](#graphql이란)
2. [REST API vs GraphQL](#rest-api-vs-graphql)
3. [GitHub GraphQL API 개요](#github-graphql-api-개요)
4. [실제 구현 코드 분석](#실제-구현-코드-분석)
5. [쿼리 작성 가이드](#쿼리-작성-가이드)
6. [타입 안전성](#타입-안전성)
7. [에러 처리](#에러-처리)
8. [최적화 팁](#최적화-팁)
9. [실전 예제](#실전-예제)

---

## GraphQL이란?

**GraphQL**은 Facebook에서 개발한 쿼리 언어이자 런타임입니다. 클라이언트가 필요한 데이터를 정확히 요청할 수 있도록 해주는 API 쿼리 언어입니다.

### 핵심 개념

1. **단일 엔드포인트**: 하나의 엔드포인트(`/graphql`)로 모든 데이터 요청 처리
2. **선언적 쿼리**: 클라이언트가 필요한 필드만 명시적으로 요청
3. **강력한 타입 시스템**: 스키마 기반 타입 검증
4. **실시간 데이터**: Subscription을 통한 실시간 업데이트 지원

### 기본 문법

```graphql
query {
  user(login: "octocat") {
    name
    email
    repositories(first: 10) {
      nodes {
        name
        description
      }
    }
  }
}
```

---

## REST API vs GraphQL

### REST API의 한계

```typescript
// REST API: 여러 엔드포인트 호출 필요
const user = await fetch('/api/users/octocat')
const repos = await fetch('/api/users/octocat/repos')
const commits = await fetch('/api/users/octocat/commits')
const prs = await fetch('/api/users/octocat/pull-requests')
// 총 4번의 네트워크 요청
```

**문제점:**
- **Over-fetching**: 필요한 데이터보다 더 많이 받음
- **Under-fetching**: 한 번의 요청으로 부족한 데이터
- **여러 번의 요청**: 여러 엔드포인트 호출 필요
- **버전 관리**: API 버전별 엔드포인트 관리 복잡

### GraphQL의 장점

```graphql
# GraphQL: 한 번의 요청으로 모든 데이터
query {
  user(login: "octocat") {
    name
    repositories(first: 10) {
      nodes {
        name
        commits(first: 5) {
          nodes {
            message
          }
        }
      }
    }
    pullRequests(first: 10) {
      nodes {
        title
        state
      }
    }
  }
}
```

**장점:**
- ✅ **정확한 데이터**: 필요한 필드만 요청
- ✅ **단일 요청**: 한 번의 네트워크 요청으로 모든 데이터
- ✅ **강력한 타입 시스템**: 컴파일 타임 타입 체크
- ✅ **자동 문서화**: 스키마가 곧 문서

---

## GitHub GraphQL API 개요

### 엔드포인트

```
POST https://api.github.com/graphql
```

### 인증

GitHub GraphQL API는 **Personal Access Token**을 사용합니다.

```typescript
const response = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ query, variables }),
})
```

### Rate Limit

- **인증된 요청**: 시간당 5,000점
- **미인증 요청**: 시간당 5점
- Rate Limit 정보는 응답에 포함됨

```graphql
query {
  rateLimit {
    remaining
    limit
    resetAt
  }
}
```

---

## 실제 구현 코드 분석

### 1. GraphQL 쿼리 실행 함수

```typescript:src/utils/githubApi.ts
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

  // 에러 처리
  if (!response.ok || json.errors) {
    const errorMessage = json.errors?.[0]?.message || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  return { data: json.data, headers: response.headers }
}
```

**핵심 포인트:**
- 제네릭 타입 `<T>`로 타입 안전성 보장
- `variables`로 동적 쿼리 파라미터 전달
- 에러 응답 처리 (`json.errors`)

### 2. 실제 사용 예제: GitHub 활동 조회

```typescript:src/utils/githubApi.ts
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
  username: config.username || 'octocat',
  from: weekAgo.toISOString(),
  to: now.toISOString(),
}

const weekResult = await retryWithBackoff(
  () => graphqlQuery<GitHubGraphQLData>(weekQuery, weekVariables, config.token),
  {
    maxRetries: 3,
    initialDelay: 2000,
    backoffFactor: 2,
  }
)
```

**분석:**
1. **변수 사용**: `$username`, `$from`, `$to`를 쿼리 변수로 전달
2. **중첩 쿼리**: `user` → `contributionsCollection` → `contributionCalendar` → `weeks`
3. **필터링**: `states`, `orderBy`로 데이터 필터링 및 정렬
4. **페이지네이션**: `first: 10`으로 결과 개수 제한
5. **재시도 로직**: `retryWithBackoff`로 네트워크 오류 처리

---

## 쿼리 작성 가이드

### 1. 기본 쿼리 구조

```graphql
query {
  # 쿼리 이름 (선택사항)
  user(login: "octocat") {
    # 필드 선택
    name
    email
    bio
  }
}
```

### 2. 변수 사용

```graphql
query($username: String!, $first: Int!) {
  user(login: $username) {
    repositories(first: $first) {
      nodes {
        name
      }
    }
  }
}
```

**변수 전달:**
```typescript
const variables = {
  username: "octocat",
  first: 10
}
```

### 3. 필터링 및 정렬

```graphql
query {
  user(login: "octocat") {
    pullRequests(
      first: 10
      states: [OPEN, CLOSED, MERGED]
      orderBy: {field: UPDATED_AT, direction: DESC}
    ) {
      nodes {
        title
        state
      }
    }
  }
}
```

### 4. 중첩 쿼리

```graphql
query {
  user(login: "octocat") {
    repositories(first: 5) {
      nodes {
        name
        owner {
          login
        }
        issues(first: 3) {
          nodes {
            title
            state
          }
        }
      }
    }
  }
}
```

### 5. 별칭(Alias) 사용

같은 필드를 여러 번 다른 조건으로 조회할 때 사용:

```graphql
query {
  user(login: "octocat") {
    openPRs: pullRequests(first: 10, states: [OPEN]) {
      totalCount
    }
    closedPRs: pullRequests(first: 10, states: [CLOSED]) {
      totalCount
    }
  }
}
```

### 6. 프래그먼트(Fragment)

재사용 가능한 필드 집합:

```graphql
fragment RepositoryInfo on Repository {
  name
  description
  stargazerCount
  forkCount
}

query {
  user(login: "octocat") {
    repositories(first: 10) {
      nodes {
        ...RepositoryInfo
      }
    }
  }
}
```

---

## 타입 안전성

### TypeScript 인터페이스 정의

```typescript:src/utils/githubApi.ts
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
```

### 제네릭 함수로 타입 안전성 보장

```typescript
async function graphqlQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  token: string
): Promise<{ data: T; headers: Headers }> {
  // ...
  return { data: json.data, headers: response.headers }
}

// 사용 시
const result = await graphqlQuery<GitHubGraphQLData>(query, variables, token)
// result.data는 GitHubGraphQLData 타입으로 추론됨
```

**장점:**
- 컴파일 타임 타입 체크
- IDE 자동완성 지원
- 런타임 에러 방지

---

## 에러 처리

### GraphQL 에러 응답 구조

```json
{
  "errors": [
    {
      "message": "Field 'invalidField' doesn't exist on type 'User'",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["user", "invalidField"]
    }
  ],
  "data": null
}
```

### 에러 처리 구현

```typescript:src/utils/githubApi.ts
interface GraphQLResponse<T> {
  data: T
  errors?: Array<{ message: string }>
}

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

  // HTTP 에러 또는 GraphQL 에러 처리
  if (!response.ok || json.errors) {
    const errorMessage = json.errors?.[0]?.message || `HTTP ${response.status}`
    throw new Error(errorMessage)
  }

  return { data: json.data, headers: response.headers }
}
```

### Rate Limit 에러 처리

```typescript
// Rate Limit 정보는 쿼리 응답에 포함
const weekResult = await graphqlQuery<GitHubGraphQLData>(weekQuery, weekVariables, config.token)
const rateLimitData = weekResult.data.rateLimit

if (rateLimitData.remaining < 100) {
  // Rate Limit 경고 표시
  console.warn(`Rate Limit 경고: ${rateLimitData.remaining}/${rateLimitData.limit} 남음`)
}
```

---

## 최적화 팁

### 1. 필요한 필드만 요청

❌ **나쁜 예:**
```graphql
query {
  user(login: "octocat") {
    # 모든 필드를 가져옴 (불필요한 데이터)
  }
}
```

✅ **좋은 예:**
```graphql
query {
  user(login: "octocat") {
    name
    email
    # 필요한 필드만 명시
  }
}
```

### 2. 페이지네이션 활용

```graphql
query($first: Int!, $after: String) {
  user(login: "octocat") {
    repositories(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        name
      }
    }
  }
}
```

### 3. 배치 처리

여러 쿼리를 한 번에 실행:

```graphql
query {
  user1: user(login: "user1") {
    name
  }
  user2: user(login: "user2") {
    name
  }
}
```

### 4. 캐싱 전략

```typescript:src/utils/cache.ts
// 클라이언트 측 캐싱으로 API 요청 최소화
const cacheKey = createCacheKey('github-activity', username, selectedRepos.join(','))

// 캐시 확인
const cached = cache.get<GitHubActivity>(cacheKey)
if (cached) {
  return cached
}

// API 호출 후 캐시 저장
const activity = await fetchGitHubActivity(config, selectedRepos)
cache.set(cacheKey, activity, 5 * 60 * 1000) // 5분 TTL
```

### 5. 재시도 로직

```typescript:src/utils/api.ts
// 지수 백오프 재시도
await retryWithBackoff(
  () => graphqlQuery<GitHubGraphQLData>(query, variables, token),
  {
    maxRetries: 3,
    initialDelay: 2000,
    backoffFactor: 2,
  }
)
```

---

## 실전 예제

### 예제 1: 사용자 정보 및 레포지토리 조회

```typescript
const query = `
  query($username: String!, $repoCount: Int!) {
    user(login: $username) {
      name
      bio
      avatarUrl
      repositories(first: $repoCount, orderBy: {field: UPDATED_AT, direction: DESC}) {
        totalCount
        nodes {
          name
          description
          stargazerCount
          forkCount
          isPrivate
          updatedAt
        }
      }
    }
    rateLimit {
      remaining
      limit
    }
  }
`

const variables = {
  username: "octocat",
  repoCount: 10
}

const result = await graphqlQuery<UserData>(query, variables, token)
```

### 예제 2: 커밋 통계 조회

```typescript
const query = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        contributionCalendar {
          totalWeeks
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`

const variables = {
  username: "octocat",
  from: new Date('2024-01-01').toISOString(),
  to: new Date('2024-12-31').toISOString()
}
```

### 예제 3: Pull Request 및 Issue 조회

```typescript
const query = `
  query($username: String!, $prCount: Int!, $issueCount: Int!) {
    user(login: $username) {
      pullRequests(first: $prCount, states: [OPEN, CLOSED, MERGED]) {
        totalCount
        nodes {
          title
          url
          state
          createdAt
          mergedAt
          repository {
            name
            owner {
              login
            }
          }
          author {
            login
          }
        }
      }
      issues(first: $issueCount, states: [OPEN, CLOSED]) {
        totalCount
        nodes {
          title
          url
          state
          createdAt
          closedAt
          repository {
            name
          }
        }
      }
    }
  }
`
```

---

## 학습 체크리스트

- [ ] GraphQL 기본 문법 이해
- [ ] REST API vs GraphQL 차이점 이해
- [ ] GitHub GraphQL API 인증 방법
- [ ] 변수를 사용한 동적 쿼리 작성
- [ ] 중첩 쿼리 및 필터링
- [ ] TypeScript로 타입 안전한 GraphQL 쿼리 작성
- [ ] 에러 처리 및 Rate Limit 관리
- [ ] 캐싱 전략 구현
- [ ] 재시도 로직 구현
- [ ] 실제 프로젝트에 GraphQL 적용

---

## 참고 자료

- [GraphQL 공식 문서](https://graphql.org/learn/)
- [GitHub GraphQL API 문서](https://docs.github.com/en/graphql)
- [GraphQL Explorer](https://docs.github.com/en/graphql/overview/explorer) - GitHub GraphQL API 테스트 도구
- [GraphQL Code Generator](https://www.the-guild.dev/graphql/codegen) - 타입 자동 생성 도구

---

## 결론

GraphQL은 **필요한 데이터만 정확히 요청**할 수 있는 강력한 도구입니다. 특히 GitHub API처럼 복잡한 데이터 구조를 다룰 때 REST API보다 훨씬 효율적입니다.

**핵심 포인트:**
1. ✅ 단일 요청으로 여러 데이터 조회
2. ✅ 타입 안전성 보장
3. ✅ 필요한 필드만 요청 (Over-fetching 방지)
4. ✅ 강력한 필터링 및 정렬 기능
5. ✅ 자동 문서화 (스키마 기반)

이 프로젝트에서 GraphQL을 사용하여 GitHub 활동 데이터를 효율적으로 조회하고, 캐싱 및 재시도 로직을 통해 안정적인 API 통합을 구현했습니다.

