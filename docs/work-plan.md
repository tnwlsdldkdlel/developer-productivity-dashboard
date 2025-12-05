# 📋 작업 계획 (Work Plan) - 개발자 생산성 대시보드 (D-Prod)

## 프로젝트 개요

- **프로젝트명**: 개발자 생산성 대시보드 (D-Prod)
- **목표**: 다양한 플랫폼의 업무·학습·활동 정보를 하나의 대시보드에서 확인하고 커스터마이징
- **기술 스택**: React 18 + TypeScript + Vite + Zustand + react-grid-layout + Tailwind CSS

---

## Phase 1: 프로젝트 초기 설정 ✅ (완료)

### 완료된 작업
- [x] Vite + React + TypeScript 프로젝트 초기화
- [x] Tailwind CSS 설정
- [x] Zustand 상태 관리 라이브러리 설정
- [x] react-grid-layout 드래그 앤 드롭 라이브러리 설정
- [x] ESLint, TypeScript 설정
- [x] Vitest 테스트 프레임워크 설정
- [x] GitHub Actions CI/CD 파이프라인 구축
- [x] 접근성 테스트 (jest-axe) 통합
- [x] Lighthouse CI 성능 테스트 설정

---

## Phase 2: 할 일 위젯 구현 (가장 간단한 위젯부터) ✅ (완료)

### 2.1 기본 상태 관리 구조
- [x] **Todo Store** (Zustand)
  - 할 일 목록 관리
  - Local Storage persist 설정
  - 추가/삭제/완료 토글 기능

### 2.2 할 일 위젯 구현
- [x] **기본 UI 구현**
  - 할 일 목록 표시
  - 체크박스 (완료/미완료)
  - 추가/삭제 기능
  - 기본 스타일링
  - Enter 키로 추가 기능
  - 미완료/완료 구분 표시

- [x] **기본 위젯 래퍼 필요성 확인**
  - 위젯을 만들면서 공통 패턴 발견
  - 헤더 영역 필요성 확인
  - Widget 컴포넌트 생성 완료

- [x] **테스트**
  - 단위 테스트 작성 (6개 테스트 케이스)
  - 접근성 테스트

**예상 소요 시간**: 1-2일

**목표**: 가장 간단한 위젯을 먼저 완성하여 기본 패턴과 구조를 확립

### 완료된 작업 상세
- ✅ `src/stores/todoStore.ts`: Zustand store with persist 미들웨어
- ✅ `src/components/Widget.tsx`: 공통 위젯 래퍼 컴포넌트
- ✅ `src/widgets/TodoWidget.tsx`: 할 일 위젯 구현
- ✅ `src/widgets/TodoWidget.test.tsx`: 단위 테스트
- ✅ `src/widgets/TodoWidget.accessibility.test.tsx`: 접근성 테스트
- ✅ `src/App.tsx`: 할 일 위젯 통합

### 발견된 공통 패턴
1. **위젯 래퍼 패턴**: 모든 위젯이 공통 헤더와 스타일이 필요함
2. **상태 관리 패턴**: Zustand + persist로 Local Storage 저장
3. **접근성 패턴**: ARIA 레이블과 키보드 네비게이션 필요
4. **불변성 패턴**: 배열/객체 업데이트 시 스프레드 연산자 사용

---

## Phase 3: GitHub 활동 위젯 구현 ✅ (완료)

### 3.1 API 통합 및 유틸리티
- [x] **GitHub API 통합**
  - Personal Access Token 기반 인증 (`src/utils/githubApi.ts`)
  - GraphQL 쿼리 작성 (커밋, PR, Issue) - `contributionsCollection`, `pullRequests`, `issues` 쿼리
  - Repository 필터링 기능 (클라이언트 측 필터링)

- [x] **API 유틸리티 개발**
  - 지수 백오프 재시도 로직 (`src/utils/api.ts` - `retryWithBackoff`)
  - Rate Limit 처리 (`extractRateLimit`, `getRateLimitMessage`)
  - 에러 핸들링 헬퍼 (`getErrorMessage`)
  - 클라이언트 측 캐싱 메커니즘 (`src/utils/cache.ts` - 5분 TTL)

### 3.2 GitHub 위젯 구현
- [x] **UI 구현** (`src/widgets/GitHubWidget.tsx`)
  - 오늘/최근 7일 커밋 수 표시 (통계 카드)
  - PR 목록 (제목, 상태, 링크, Repository)
  - Issue 목록 (제목, 상태, 링크, Repository)
  - 설정 UI (Personal Access Token 및 사용자명 입력)

- [x] **에러 처리 및 로딩 상태**
  - 에러 상태 UI (`src/components/ErrorState.tsx` - 공통 컴포넌트)
  - 로딩 상태 UI (`src/components/Skeleton.tsx` - 스켈레톤 UI)
  - Rate Limit 처리 (별도 상태 및 메시지)
  - 재시도 로직 (에러 상태에서 "다시 시도" 버튼)

- [x] **최적화**
  - 캐싱 메커니즘 (5분 TTL로 API 요청 최소화)
  - GraphQL 쿼리 최적화 (한 번의 요청으로 모든 데이터 가져오기)

- [x] **테스트**
  - 단위 테스트 (`src/widgets/GitHubWidget.test.tsx` - 6개 테스트 통과)
  - 접근성 테스트 (`src/widgets/GitHubWidget.accessibility.test.tsx`)
  - 에러 시나리오 테스트 (일반 에러, Rate Limit 에러)

**예상 소요 시간**: 3-4일 (실제 완료: 2025-12-04)

**목표**: 복잡한 위젯을 구현하면서 에러 처리, 로딩 상태 등 공통 패턴 발견

### 완료된 Phase 3 요약
- **구현 파일**: 
  - `src/utils/api.ts` - API 유틸리티 (재시도, Rate Limit 처리)
  - `src/utils/cache.ts` - 클라이언트 측 캐싱
  - `src/utils/githubApi.ts` - GitHub GraphQL API 통합
  - `src/stores/dashboardStore.ts` - 대시보드 설정 관리 (위젯 설정, 레이아웃)
  - `src/components/Skeleton.tsx` - 스켈레톤 UI 컴포넌트
  - `src/components/ErrorState.tsx` - 에러 상태 컴포넌트
  - `src/widgets/GitHubWidget.tsx` - GitHub 활동 위젯
  - `src/widgets/GitHubWidget.test.tsx` - 단위 테스트
  - `src/widgets/GitHubWidget.accessibility.test.tsx` - 접근성 테스트
- **주요 기능**: 
  - GitHub GraphQL API 통합 (커밋, PR, Issue)
  - Personal Access Token 기반 인증
  - Repository 필터링
  - 지수 백오프 재시도 (최대 3회, 2초/4초/8초)
  - Rate Limit 처리 및 경고
  - 클라이언트 측 캐싱 (5분 TTL)
- **테스트 결과**: 모든 단위 및 접근성 테스트 통과
- **발견된 공통 패턴**:
  1. **에러 처리 패턴**: 모든 위젯이 공통 에러 상태 UI가 필요함. `ErrorState.tsx`로 추출.
  2. **로딩 상태 패턴**: 모든 위젯이 스켈레톤 UI가 필요함. `Skeleton.tsx`로 추출.
  3. **API 통합 패턴**: GraphQL을 사용하여 여러 데이터를 한 번에 가져오는 것이 효율적.
  4. **재시도 패턴**: 지수 백오프를 사용한 재시도 로직이 API 안정성 향상에 효과적.
  5. **캐싱 패턴**: 클라이언트 측 캐싱으로 API 요청 최소화 및 Rate Limit 관리.
  6. **설정 관리 패턴**: Zustand persist로 위젯별 설정을 Local Storage에 저장.

---

## Phase 4: 공통 컴포넌트 추출 및 리팩토링 ✅ (완료)

### 4.1 공통 패턴 분석
- [x] **위젯 공통 패턴 정리**
  - 할 일 위젯과 GitHub 위젯 비교
  - 공통 요소 식별 (헤더, 에러 처리, 로딩 상태 등)
  - 공통 패턴 문서화 (`docs/common-patterns.md`)

### 4.2 공통 컴포넌트 개발
- [x] **Widget 컴포넌트** (기본 위젯 래퍼)
  - 헤더 영역 (제목, 설정 아이콘)
  - 일관된 스타일링
  - 접근성 개선 (ARIA 레이블)
  
- [x] **Skeleton 컴포넌트**
  - 위젯 로딩 시 플레이스홀더 UI
  - PRD 요구사항: 300ms 이내 로드 표시

- [x] **ErrorBoundary 컴포넌트**
  - 위젯 단위 오류 처리
  - "다시 시도" 버튼 포함
  - 개발 모드에서 상세 에러 정보 표시

- [x] **Modal 컴포넌트**
  - 위젯 설정 패널용
  - 접근성 고려 (키보드 네비게이션, ARIA 레이블)
  - ESC 키로 닫기, 배경 클릭으로 닫기

### 4.3 상태 관리 구조 확장
- [x] **Dashboard Store** (Zustand)
  - 레이아웃 정보 관리
  - 위젯 설정 관리 (GitHub, Tech News, Stack Overflow)
  - Local Storage persist 설정

### 4.4 리팩토링
- [x] **기존 위젯에 공통 컴포넌트 적용**
  - 할 일 위젯: Widget 컴포넌트 사용 확인
  - GitHub 위젯: Widget, Skeleton, ErrorState, Modal 사용 확인
  - ErrorBoundary를 App.tsx에 적용하여 위젯 단위 오류 처리

**예상 소요 시간**: 2-3일 (실제 완료: 2025-12-04)

**목표**: 공통 패턴을 컴포넌트로 추출하여 재사용성과 일관성 확보

### 완료된 Phase 4 요약
- **구현 파일**:
  - `src/components/ErrorBoundary.tsx` - React Error Boundary 컴포넌트
  - `src/components/Widget.tsx` - 위젯 래퍼 컴포넌트 (개선)
  - `docs/common-patterns.md` - 공통 패턴 분석 문서
- **주요 기능**:
  - ErrorBoundary로 위젯 단위 JavaScript 에러 처리
  - 공통 패턴 문서화 (위젯 구조, 상태 관리, 에러 처리, API 통합 등)
  - 모든 위젯에 ErrorBoundary 적용
- **발견된 공통 패턴**:
  1. **위젯 구조 패턴**: Widget 래퍼 → Header + Content 구조
  2. **상태 관리 패턴**: Zustand + Persist로 Local Storage 저장
  3. **로딩 상태 패턴**: Skeleton UI로 일관된 로딩 표시
  4. **에러 처리 패턴**: ErrorState (비즈니스 로직 에러) + ErrorBoundary (JavaScript 에러)
  5. **설정 관리 패턴**: Modal 컴포넌트로 위젯 설정 UI 통일
  6. **API 통합 패턴**: GraphQL + REST API 혼용, 재시도 로직, 캐싱
  7. **접근성 패턴**: ARIA 레이블, 키보드 네비게이션, 포커스 관리
  8. **불변성 패턴**: 스프레드 연산자로 상태 업데이트

---

## Phase 5: 나머지 위젯 구현 (공통 컴포넌트 재사용)

### 5.1 기술 뉴스 헤드라인 위젯 (우선순위: 중간)
- [ ] **기본 UI 구현**
  - 할 일 목록 표시
  - 체크박스 (완료/미완료)
  - 추가/삭제 기능
  
- [ ] **상태 관리**
  - Zustand store 연동
  - Local Storage 저장 확인

- [ ] **테스트**
  - 단위 테스트 작성
  - 접근성 테스트

**예상 소요 시간**: 1-2일

### 3.2 GitHub 활동 위젯 (우선순위: 높음)
- [ ] **API 통합**
  - GitHub OAuth 인증 설정 (초기에는 Personal Access Token)
  - GraphQL 쿼리 작성 (커밋, PR, Issue)
  - Repository 필터링 기능

- [ ] **UI 구현**
  - 오늘/최근 7일 커밋 수 표시
  - PR 목록 (제목, 상태, 링크)
  - Issue 목록 (제목, 상태, 링크)
  - Repository 선택 UI

- [ ] **에러 처리**
  - Rate Limit 처리
  - 재시도 로직
  - 에러 상태 UI

- [ ] **최적화**
  - 캐싱 메커니즘
  - GraphQL 쿼리 최적화

- [ ] **테스트**
  - API 모킹 (MSW)
  - 단위 테스트
  - 에러 시나리오 테스트

**예상 소요 시간**: 3-4일

- [ ] **API 선택 및 통합**
  - RSS 피드 파싱 또는 뉴스 API 선택
  - 키워드 기반 필터링

- [ ] **UI 구현**
  - 헤드라인 목록 (5-10개)
  - 출처 표시
  - 링크 클릭 기능

- [ ] **설정 UI**
  - 키워드 추가/삭제
  - Drawer에서 관리

- [ ] **에러 처리**
  - API 실패 처리
  - 재시도 로직

- [ ] **테스트**
  - API 모킹
  - 단위 테스트

**예상 소요 시간**: 2-3일

### 5.2 Stack Overflow 질문 위젯 (우선순위: 중간)
- [ ] **API 통합**
  - Stack Exchange API 연동
  - API 키 설정
  - 태그 기반 질문 조회

- [ ] **UI 구현**
  - 질문 목록 (5개)
  - 제목, 점수, 답변 수 표시
  - 클릭 시 SO 페이지 이동

- [ ] **설정 UI**
  - 태그 추가/삭제
  - 정렬 옵션 (Hot, Unanswered 등)

- [ ] **에러 처리**
  - Rate Limit 처리
  - 재시도 로직

- [ ] **테스트**
  - API 모킹
  - 단위 테스트

**예상 소요 시간**: 2-3일

---

## Phase 6: 대시보드 레이아웃 및 통합

### 6.1 대시보드 레이아웃
- [ ] **react-grid-layout 통합**
  - 기본 레이아웃 설정
  - 드래그 앤 드롭 기능
  - 리사이즈 기능
  - 반응형 레이아웃 (데스크톱, 태블릿, 모바일)

- [ ] **레이아웃 저장**
  - Zustand persist로 Local Storage 저장
  - 세션 간 레이아웃 유지

### 6.2 위젯 통합
- [ ] **모든 위젯을 대시보드에 통합**
  - 기본 배치 설정
  - 위젯 간 일관성 유지

### 6.3 반응형 디자인
- [ ] **데스크톱 (1280px+)**
  - 그리드 레이아웃 최적화

- [ ] **태블릿 (768px+)**
  - 그리드 레이아웃 재배치

- [ ] **모바일**
  - 1열 스크롤 모드

---

## Phase 7: UI/UX 개선

### 7.1 알림 시스템
- [ ] **react-hot-toast 통합**
  - 할 일 완료 알림
  - 레이아웃 저장 알림
  - API 호출 실패 알림

### 7.2 접근성 개선
- [ ] **키보드 네비게이션**
  - Tab 키 포커스 이동
  - 위젯 간 이동

- [ ] **ARIA 레이블**
  - 모든 대화형 요소에 레이블 추가
  - 스크린 리더 지원

- [ ] **명암 대비**
  - WCAG 2.1 AA 기준 준수

### 7.3 성능 최적화
- [ ] **코드 분할**
  - React.lazy를 사용한 위젯 지연 로딩

- [ ] **렌더링 최적화**
  - React.memo 활용
  - 불필요한 리렌더링 방지

- [ ] **FCP 최적화**
  - 첫 페이지 로딩 2초 이하 목표

---

## Phase 8: 테스트 및 품질 보증

### 8.1 단위 테스트
- [ ] 각 위젯 컴포넌트 테스트
- [ ] Zustand store 테스트
- [ ] 유틸리티 함수 테스트

### 8.2 통합 테스트
- [ ] API 통합 테스트 (MSW 사용)
- [ ] 에러 처리 시나리오 테스트
- [ ] 재시도 로직 테스트

### 8.3 E2E 테스트 (선택사항)
- [ ] 드래그 앤 드롭 동작 테스트
- [ ] 위젯 설정 저장/불러오기 테스트
- [ ] 반응형 레이아웃 테스트

### 8.4 접근성 테스트
- [ ] jest-axe를 사용한 자동화 테스트
- [ ] 키보드 네비게이션 테스트
- [ ] 스크린 리더 테스트

---

## Phase 9: 문서화 및 배포

### 9.1 문서화
- [ ] API 통합 가이드
- [ ] 위젯 개발 가이드
- [ ] 사용자 가이드

### 9.2 배포
- [ ] Vercel 배포 설정
- [ ] 환경 변수 설정
- [ ] 프로덕션 빌드 최적화

---

## 우선순위 및 일정

### MVP 완료 목표
1. **Phase 2** (할 일 위젯): ✅ 완료
2. **Phase 3** (GitHub 위젯): 3-4일
3. **Phase 4** (공통 컴포넌트 추출): 2-3일
4. **Phase 5.1** (기술 뉴스 위젯): 2-3일
5. **Phase 5.2** (Stack Overflow 위젯): 2-3일
6. **Phase 6** (대시보드 통합): 2-3일
7. **Phase 7** (UI/UX 개선): 2-3일
8. **Phase 8** (테스트): 2-3일

**총 예상 소요 시간**: 약 3-4주

**현재 진행률**: Phase 2 완료 (12.5%)

### 접근 방법의 장점
- ✅ **실용적**: 실제 필요에 맞는 컴포넌트만 개발
- ✅ **피드백 루프**: 위젯을 만들면서 패턴 발견
- ✅ **리팩토링 기회**: 공통 패턴을 발견한 후 추출
- ✅ **빠른 결과물**: 간단한 위젯부터 완성하여 조기 검증 가능

---

## 기술적 고려사항

### API 통합
- **GitHub API**: OAuth 인증 또는 Personal Access Token
- **Stack Exchange API**: API 키 필요
- **기술 뉴스**: RSS 피드 또는 뉴스 API (예: NewsAPI, Dev.to API)

### 성능 목표
- 위젯 데이터 로딩: 300ms 이내
- FCP (First Contentful Paint): 2초 이하
- Lighthouse 성능 점수: 80점 이상

### 에러 처리 전략
- 지수 백오프 재시도 (2초 → 4초 → 실패)
- Rate Limit 처리 (403/429)
- 위젯 단위 독립적 에러 처리

---

## 향후 확장 계획 (Post-MVP)

1. **사용자 인증**: OAuth 기반 GitHub 로그인
2. **레이아웃 관리**: 여러 레이아웃 저장/불러오기
3. **다크 모드**: 테마 토글 기능
4. **AI 통찰**: GitHub 활동 요약, 뉴스 요약
5. **위젯 마켓플레이스**: 커뮤니티 위젯 확장

---

## 진행 상황 추적

각 Phase 완료 시 체크박스를 업데이트하고, 이슈나 PR에 연결하여 진행 상황을 추적합니다.

**마지막 업데이트**: 2025-12-04

## 완료된 Phase 요약

### Phase 2 완료 (2025-12-04)
- Todo Store 구현 및 Local Storage persist 설정
- 할 일 위젯 UI 구현 (추가, 삭제, 완료 토글)
- 기본 위젯 래퍼 컴포넌트 생성
- 단위 테스트 및 접근성 테스트 작성
- 공통 패턴 발견 및 문서화

