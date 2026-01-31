# Cruit 프로젝트 가이드

## 프로젝트 개요
AI 기반 취업 추천 시스템 - 한국 구직자를 위한 맞춤형 채용공고 추천

## 기술 스택
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-3.5-turbo
- **Crawling**: Cheerio (사람인, 잡코리아, 인크루트), API (원티드, 점핏)
- **Storage**: LocalStorage (클라이언트), File-based (서버)

## 디렉토리 구조
```
src/
├── app/           # Next.js App Router
├── components/    # React 컴포넌트
├── lib/
│   ├── ai/        # AI 추천 로직
│   ├── crawler/   # 크롤러 (5개 사이트)
│   ├── dedup/     # 중복 제거
│   └── storage.ts # 스토리지 유틸
└── types/         # TypeScript 타입
```

---

# 멀티 에이전트 시스템

## 에이전트 역할

### 1. PM 에이전트 (`/pm`)
- 요구사항 분석
- GitHub 이슈 생성
- 개발자 할당

### 2. 개발자 에이전트 (`/dev-start`, `/dev-pr`, `/deploy`)
- 이슈 기반 개발
- Feature 브랜치 관리
- PR 생성 및 배포

## 사용 방법

### 새 기능 요청 (PM 에이전트)
```
/pm 사용자가 즐겨찾기한 공고를 카카오톡으로 공유할 수 있는 기능 추가
```

PM이 수행하는 작업:
1. 요구사항 분석
2. GitHub 이슈 생성 (`gh issue create`)
3. 개발자에게 할당
4. 이슈 URL 전달

### 개발 시작 (개발자 에이전트)
```
/dev-start 123
```
(123 = 이슈 번호)

개발자가 수행하는 작업:
1. 이슈 확인
2. Feature 브랜치 생성
3. 코드 구현
4. 진행 상황 보고

### PR 생성 (개발자 에이전트)
```
/dev-pr 123
```

개발자가 수행하는 작업:
1. 변경사항 커밋
2. 브랜치 푸시
3. PR 생성
4. PR URL 전달

### 배포 (개발자 에이전트)
```
/deploy 1
```
(1 = PR 번호)

개발자가 수행하는 작업:
1. PR 머지
2. main 브랜치 동기화
3. 배포 확인

### 이슈 목록 확인
```
/issues
```

## 워크플로우 예시

```
[사용자]  "검색 필터 기능 추가해줘"
    ↓
[PM]      /pm 검색 필터 기능 추가 - 지역, 경력, 학력으로 필터링
    ↓
[GitHub]  Issue #123 생성, gyuturn 할당
    ↓
[개발자]  /dev-start 123
    ↓
[개발자]  (코드 구현)
    ↓
[개발자]  /dev-pr 123
    ↓
[GitHub]  PR #1 생성
    ↓
[사용자]  "배포해줘"
    ↓
[개발자]  /deploy 1
    ↓
[완료]    프로덕션 배포 완료
```

## GitHub 연동 정보
- Repository: `gyuturn/cruit`
- Branch 전략: `main` ← `feature/issue-{번호}-{설명}`
- 자동 배포: Vercel (설정 시)

## 코드 컨벤션
- TypeScript strict 모드
- ESLint 준수
- 커밋 메시지: `[타입] 제목 (#이슈번호)`
- PR: `closes #이슈번호` 포함
