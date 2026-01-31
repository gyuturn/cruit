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

## 핵심 사용법 (원클릭 개발)

### 기능 요청 → 개발 → PR 자동화
```
/feature 즐겨찾기 공고를 카카오톡으로 공유하는 기능
```

이 한 줄이면 자동으로:
1. **PM**: 요구사항 분석 → GitHub 이슈 생성
2. **개발자**: 브랜치 생성 → 코드 구현 → PR 생성

### 배포
```
/deploy [PR번호]
```

### 현황 확인
```
./dashboard.sh
```

---

## 개별 커맨드 (필요시)

| 커맨드 | 설명 |
|--------|------|
| `/feature [요구사항]` | **통합** - 이슈 생성부터 PR까지 자동 |
| `/pm [요구사항]` | PM만 - 이슈 생성만 |
| `/dev-start [이슈번호]` | 개발 시작 - 브랜치 생성 |
| `/dev-pr [이슈번호]` | PR 생성 |
| `/deploy [PR번호]` | 배포 |
| `/issues` | 이슈 목록 |

---

## 워크플로우 예시

### 일반적인 사용 (권장)
```
[나]     "검색 필터 기능 추가해줘"
    ↓
         /feature 검색 필터 기능 - 지역, 경력, 학력 필터링
    ↓
[자동]   Issue #1 생성 → 브랜치 생성 → 코드 구현 → PR #1 생성
    ↓
[나]     "배포해줘"
    ↓
         /deploy 1
    ↓
[완료]   main 머지 → 배포 완료
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
