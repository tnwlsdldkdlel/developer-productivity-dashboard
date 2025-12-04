# 기여 가이드 (Contributing Guide)

## 커밋 메시지 규칙

### 커밋 메시지 형식

커밋 메시지는 다음 형식을 따라야 합니다:

```
<type>: <subject>

<body>
```

### Type (타입)

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드 추가 또는 수정
- `chore`: 빌드 업무 수정, 패키지 매니저 설정 등
- `ci`: CI/CD 설정 변경
- `perf`: 성능 개선
- `build`: 빌드 시스템 또는 외부 의존성 변경

### Subject (제목)

- 50자 이내로 작성
- 첫 글자는 대문자로 시작하지 않음
- 마침표(.)를 사용하지 않음
- 명령형으로 작성 (예: "추가" 대신 "추가함")

### Body (본문)

- 변경사항을 자세하게 나열
- 각 항목은 `-`로 시작하는 불릿 포인트
- 왜 변경했는지, 무엇을 변경했는지 명확하게 작성

### 예시

#### 좋은 예시

```
feat: GitHub Actions CI/CD 파이프라인 설정

- Vitest 테스트 자동 실행 설정
- ESLint 코드 품질 검사 추가
- TypeScript 타입 체크 추가
- 접근성 테스트 (jest-axe) 통합
- Lighthouse CI 성능 테스트 설정
- 테스트 커버리지 및 빌드 결과 아티팩트 업로드
- Node.js 18.x, 20.x 멀티 버전 테스트 지원
```

```
fix: 위젯 드래그 앤 드롭 레이아웃 저장 오류 수정

- react-grid-layout 레이아웃 변경 시 Zustand 스토어 동기화 문제 해결
- Local Storage persist 미들웨어 동작 개선
- 레이아웃 변경 이벤트 핸들러 최적화
```

```
refactor: GitHub 위젯 API 호출 로직 개선

- GraphQL 쿼리 최적화로 요청 횟수 감소
- 에러 처리 및 재시도 로직 개선
- Rate Limit 처리 로직 추가
- API 응답 캐싱 메커니즘 구현
```

#### 나쁜 예시

```
수정함
```

```
fix: 버그 수정
```

```
feat: 새로운 기능 추가
- 변경사항
```

## 커밋 및 푸시 프로세스

### ⚠️ 중요 안내

**커밋과 푸시는 직접 수행해주세요.**

다음과 같은 경우에 커밋과 푸시를 진행하세요:

1. 작업이 완료되었을 때
2. 의미 있는 단위의 변경사항이 있을 때
3. 리뷰를 받기 전에

### 커밋 전 체크리스트

- [ ] 코드가 정상적으로 작동하는지 확인
- [ ] 테스트가 통과하는지 확인 (`npm run test`)
- [ ] ESLint 오류가 없는지 확인 (`npm run lint`)
- [ ] TypeScript 타입 체크 통과 (`npx tsc --noEmit`)
- [ ] 불필요한 파일이 커밋되지 않았는지 확인

### 커밋 예시

```bash
# 변경사항 확인
git status

# 변경된 파일 스테이징
git add .

# 커밋 (위 규칙에 따라 메시지 작성)
git commit -m "feat: GitHub Actions CI/CD 파이프라인 설정

- Vitest 테스트 자동 실행 설정
- ESLint 코드 품질 검사 추가
- TypeScript 타입 체크 추가
- 접근성 테스트 (jest-axe) 통합
- Lighthouse CI 성능 테스트 설정
- 테스트 커버리지 및 빌드 결과 아티팩트 업로드"

# 푸시
git push origin <branch-name>
```

### 푸시 후 필수 확인 사항

**⚠️ 중요: 푸시 후 반드시 GitHub Actions 상태를 확인하고, 오류가 있으면 즉시 수정해야 합니다.**

1. **GitHub Actions 상태 확인**
   - GitHub 저장소의 "Actions" 탭에서 워크플로우 실행 상태 확인
   - 모든 워크플로우가 성공(✅) 상태인지 확인
   - 실패(❌) 또는 취소(⏹️) 상태가 있으면 즉시 확인

2. **오류 발생 시 즉시 대응**
   - 오류가 발생한 워크플로우 클릭하여 상세 로그 확인
   - 오류 원인 파악 및 로컬에서 재현
   - 수정 후 즉시 커밋 및 푸시
   - 다시 GitHub Actions 상태 확인

3. **체크리스트**
   - [ ] 푸시 완료 후 GitHub Actions 탭 확인
   - [ ] 모든 워크플로우가 성공 상태인지 확인
   - [ ] 오류가 있으면 로그 확인 및 원인 파악
   - [ ] 오류 수정 후 재커밋 및 재푸시
   - [ ] 재푸시 후 다시 GitHub Actions 상태 확인

4. **오류 수정 예시**
   ```bash
   # 오류 확인 후 수정
   # ... 코드 수정 ...
   
   # 수정사항 커밋
   git add .
   git commit -m "fix: GitHub Actions CI 오류 수정
   
   - ESLint 오류 수정
   - TypeScript 타입 오류 해결
   - 테스트 실패 케이스 수정"
   
   # 재푸시
   git push origin <branch-name>
   
   # GitHub Actions 상태 재확인
   ```

## 브랜치 전략

- `main`: 프로덕션 배포용 브랜치
- `develop`: 개발 통합 브랜치
- `feat/<feature-name>`: 새로운 기능 개발
- `fix/<bug-name>`: 버그 수정
- `refactor/<refactor-name>`: 리팩토링

## Pull Request 규칙

1. PR 제목도 커밋 메시지 규칙을 따릅니다
2. PR 본문에는 변경사항을 자세히 설명합니다
3. 관련 이슈가 있다면 이슈 번호를 참조합니다
4. CI가 통과해야만 머지할 수 있습니다

