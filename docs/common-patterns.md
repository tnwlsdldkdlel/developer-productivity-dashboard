# 공통 패턴 분석 문서

## 개요

Phase 2와 Phase 3에서 구현한 위젯들을 분석하여 발견된 공통 패턴을 정리한 문서입니다.

---

## 1. 위젯 구조 패턴

### 1.1 기본 위젯 구조

모든 위젯은 다음 구조를 따릅니다:

```
Widget (공통 래퍼)
├── Header (제목, 설정 버튼)
└── Content (위젯별 내용)
    ├── Loading State (Skeleton)
    ├── Error State (ErrorState)
    └── Success State (실제 데이터)
```

### 1.2 위젯 래퍼 패턴

**컴포넌트**: `src/components/Widget.tsx`

**역할**:
- 모든 위젯의 공통 헤더 제공
- 일관된 스타일링 (배경, 패딩, 그림자)
- 설정 버튼 통합
- 접근성 고려 (ARIA 레이블)

**사용 예시**:
```tsx
<Widget title="오늘 할 일" onSettingsClick={handleSettings}>
  {/* 위젯 내용 */}
</Widget>
```

---

## 2. 상태 관리 패턴

### 2.1 Zustand + Persist 패턴

**패턴**: Local Storage에 상태를 자동으로 저장

**구현 위치**:
- `src/stores/todoStore.ts` - 할 일 위젯
- `src/stores/dashboardStore.ts` - 대시보드 설정

**예시**:
```typescript
export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (text) => set((state) => ({ ... })),
    }),
    {
      name: 'd-prod-todo-storage', // Local Storage 키
    }
  )
)
```

**장점**:
- 세션 간 데이터 유지
- 간단한 설정
- 타입 안전성

---

## 3. 로딩 상태 패턴

### 3.1 Skeleton UI 패턴

**컴포넌트**: `src/components/Skeleton.tsx`

**역할**:
- 데이터 로딩 중 플레이스홀더 UI 표시
- PRD 요구사항: 300ms 이내 로드 표시

**사용 예시**:
```tsx
{state === 'loading' && <Skeleton />}
```

**특징**:
- 애니메이션 효과 (pulse)
- 다크 모드 지원
- 일관된 디자인

---

## 4. 에러 처리 패턴

### 4.1 ErrorState 컴포넌트

**컴포넌트**: `src/components/ErrorState.tsx`

**역할**:
- 에러 메시지 표시
- "다시 시도" 버튼 제공
- Rate Limit 특별 처리

**사용 예시**:
```tsx
{state === 'error' && (
  <ErrorState
    message={errorMessage}
    onRetry={loadActivity}
    isRateLimit={state === 'rate-limit'}
  />
)}
```

### 4.2 ErrorBoundary 컴포넌트

**컴포넌트**: `src/components/ErrorBoundary.tsx`

**역할**:
- React 컴포넌트 트리에서 발생한 JavaScript 에러 캐치
- 위젯 단위 오류 처리
- 개발 모드에서 상세 에러 정보 표시

**사용 예시**:
```tsx
<ErrorBoundary widgetName="GitHub 활동" onReset={handleReset}>
  <GitHubWidget />
</ErrorBoundary>
```

### 4.3 에러 상태 관리

**패턴**: 상태 기반 에러 처리

```typescript
type WidgetState = 'idle' | 'loading' | 'success' | 'error' | 'rate-limit'

const [state, setState] = useState<WidgetState>('idle')
const [errorMessage, setErrorMessage] = useState<string>('')
```

**에러 타입별 처리**:
- 일반 에러: `error` 상태
- Rate Limit: `rate-limit` 상태 (별도 메시지)
- 네트워크 오류: 재시도 로직

---

## 5. API 통합 패턴

### 5.1 GraphQL 통합 패턴

**파일**: `src/utils/githubApi.ts`

**패턴**:
- 한 번의 요청으로 여러 데이터 조회
- 타입 안전한 쿼리 작성
- Rate Limit 정보 포함

**예시**:
```typescript
const weekQuery = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      contributionsCollection { ... }
      pullRequests { ... }
      issues { ... }
    }
    rateLimit { ... }
  }
`
```

### 5.2 재시도 패턴

**파일**: `src/utils/api.ts`

**패턴**: 지수 백오프 재시도

```typescript
await retryWithBackoff(
  () => graphqlQuery(query, variables, token),
  {
    maxRetries: 3,
    initialDelay: 2000,
    backoffFactor: 2,
  }
)
```

**특징**:
- Rate Limit 오류는 재시도하지 않음
- 지수적으로 증가하는 대기 시간
- 최대 재시도 횟수 제한

### 5.3 캐싱 패턴

**파일**: `src/utils/cache.ts`

**패턴**: TTL 기반 메모리 캐싱

```typescript
const cacheKey = createCacheKey('github-activity', username, repos.join(','))
const cached = cache.get<GitHubActivity>(cacheKey)
if (cached) return cached

// API 호출 후 캐시 저장
cache.set(cacheKey, activity, 5 * 60 * 1000) // 5분 TTL
```

**장점**:
- API 요청 최소화
- Rate Limit 관리
- 빠른 응답 시간

---

## 6. 설정 관리 패턴

### 6.1 Modal 컴포넌트

**컴포넌트**: `src/components/Modal.tsx`

**역할**:
- 위젯 설정 패널
- 접근성 고려 (키보드 네비게이션, ARIA 레이블)
- ESC 키로 닫기
- 배경 클릭으로 닫기

**사용 예시**:
```tsx
<Modal isOpen={isModalOpen} onClose={handleClose} title="GitHub 설정">
  {/* 설정 폼 */}
</Modal>
```

### 6.2 설정 저장 패턴

**패턴**: Zustand persist로 Local Storage 저장

```typescript
updateGitHubConfig: (config) =>
  set((state) => ({
    widgetConfigs: {
      ...state.widgetConfigs,
      github: {
        ...state.widgetConfigs.github,
        ...config,
      },
    },
  }))
```

---

## 7. 접근성 패턴

### 7.1 ARIA 레이블

모든 대화형 요소에 ARIA 레이블 추가:

```tsx
<button
  onClick={handleClick}
  aria-label="설정"
>
  <Settings />
</button>
```

### 7.2 키보드 네비게이션

- Tab 키로 포커스 이동
- Enter/Space로 버튼 활성화
- ESC 키로 모달 닫기

### 7.3 포커스 관리

```tsx
className="focus:outline-none focus:ring-2 focus:ring-blue-500"
```

---

## 8. 불변성 패턴

### 8.1 상태 업데이트

**패턴**: 스프레드 연산자 사용

```typescript
// 배열 업데이트
set((state) => ({
  todos: [...state.todos, newTodo]
}))

// 객체 업데이트
set((state) => ({
  widgetConfigs: {
    ...state.widgetConfigs,
    github: {
      ...state.widgetConfigs.github,
      ...newConfig,
    },
  },
}))
```

---

## 9. 위젯별 특수 패턴

### 9.1 Todo Widget 패턴

- 로컬 상태만 사용 (API 없음)
- 즉시 반응형 UI
- 빈 상태 처리

### 9.2 GitHub Widget 패턴

- API 통합 (GraphQL + REST)
- 설정 변경 감지 및 자동 로딩
- 캐시 무효화
- 복잡한 상태 관리 (idle, loading, success, error, rate-limit)

---

## 10. 공통 컴포넌트 체크리스트

새 위젯을 만들 때 다음 컴포넌트들을 활용:

- [ ] `Widget` - 위젯 래퍼
- [ ] `Skeleton` - 로딩 상태
- [ ] `ErrorState` - 에러 상태
- [ ] `ErrorBoundary` - JavaScript 에러 처리
- [ ] `Modal` - 설정 패널
- [ ] Zustand Store - 상태 관리
- [ ] Local Storage Persist - 데이터 영속성

---

## 11. 향후 개선 사항

1. **Widget 컴포넌트 확장**
   - 로딩/에러 상태를 Widget 내부에서 처리하는 옵션 추가
   - 위젯별 커스텀 헤더 지원

2. **Skeleton 컴포넌트 개선**
   - 위젯별 맞춤형 스켈레톤 UI
   - 더 다양한 스켈레톤 패턴

3. **에러 처리 통합**
   - ErrorBoundary와 ErrorState 통합
   - 에러 리포팅 서비스 연동

4. **접근성 개선**
   - 키보드 단축키 지원
   - 스크린 리더 최적화

---

## 참고 자료

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Zustand Persist](https://github.com/pmndrs/zustand/blob/main/docs/integrations/persisting-store-data.md)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)

---

**마지막 업데이트**: 2025-12-04

