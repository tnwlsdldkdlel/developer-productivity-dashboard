# 개발자 생산성 대시보드 (D-Prod)

개발자가 다양한 플랫폼에 흩어진 업무·학습·활동 정보를 하나의 대시보드에서 직관적으로 확인하고, 자신에게 맞게 구성할 수 있는 대시보드입니다.

## 기술 스택

- **언어**: TypeScript
- **프레임워크**: React 18
- **빌드 도구**: Vite
- **레이아웃**: react-grid-layout
- **상태 관리**: Zustand (persist 미들웨어)
- **스타일링**: Tailwind CSS
- **알림**: react-hot-toast
- **테스트**: Vitest, React Testing Library, jest-axe
- **성능 테스트**: Lighthouse CI

## 프로젝트 구조

```
developer-productivity-dashboard/
├── .cursor/
│   ├── CONTRIBUTING.md     # 커밋 메시지 규칙 및 기여 가이드
│   └── .gitmessage         # Git 커밋 메시지 템플릿
├── docs/
│   └── prd.md              # 제품 요구사항 문서
├── src/
│   ├── components/         # 공통 컴포넌트
│   ├── widgets/            # 위젯 컴포넌트
│   ├── stores/             # Zustand 스토어
│   ├── utils/              # 유틸리티 함수
│   ├── types/              # TypeScript 타입 정의
│   ├── test/               # 테스트 파일
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .github/
│   └── workflows/          # GitHub Actions 워크플로우
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 주요 기능 (MVP)

1. **GitHub 활동 위젯**: 개인 활동 요약 (커밋, PR, Issue)
2. **오늘 할 일 위젯**: 할 일 목록 관리 (Local Storage 저장)
3. **기술 뉴스 헤드라인 위젯**: 사용자 정의 키워드 기반 뉴스
4. **Stack Overflow 질문 위젯**: 관심 태그 기반 최신 질문

## 테스트

```bash
# 모든 테스트 실행
npm run test

# 테스트 감시 모드
npm run test:watch

# 테스트 UI 모드
npm run test:ui

# 커버리지 리포트 생성
npm run test:coverage

# Lighthouse 성능 테스트
npm run lighthouse
```

## CI/CD

GitHub Actions를 통해 다음 테스트가 자동으로 실행됩니다:

- ✅ ESLint 코드 품질 검사
- ✅ TypeScript 타입 체크
- ✅ 단위 테스트 (Vitest)
- ✅ 접근성 테스트 (jest-axe)
- ✅ Lighthouse 성능 테스트 (PR 및 main 브랜치)
- ✅ CodeQL 보안 분석

## 개발 가이드

자세한 요구사항은 `docs/prd.md`를 참고하세요.

## 기여하기

커밋 메시지 규칙 및 기여 가이드는 [.cursor/CONTRIBUTING.md](.cursor/CONTRIBUTING.md)를 참고하세요.

