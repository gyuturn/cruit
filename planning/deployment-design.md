# 배포 및 코드 관리 설계

## 1. 제약 조건

- 예산: 무료 (Free Tier만 사용)
- 저장소: GitHub Private Repository
- 배포: GitHub 제공 무료 기능 활용

## 2. GitHub 무료 기능 현황

| 기능 | Private Repo 지원 | 제한사항 |
|---|---|---|
| GitHub Actions | O | 월 2,000분 (Linux) |
| GitHub Pages | X | Public repo만 무료 |
| GitHub Packages | O | 500MB 스토리지 |
| Dependabot | O | 무제한 |

> ⚠️ GitHub Pages는 Private repo에서 유료(Pro 플랜)이므로 다른 방안 필요

## 3. 무료 배포 전략

### 3.1 아키텍처 (무료 조합)

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Private Repo                       │
│                    (소스 코드 관리)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                    GitHub Actions (CI/CD)
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
┌─────────────────────┐             ┌─────────────────────────┐
│   Vercel (Free)     │             │   Render (Free)         │
│   - Frontend        │    API      │   - Backend API         │
│   - React App       │◄───────────►│   - 크롤링 서버         │
│   - 정적 파일       │             │   - Cron Jobs           │
└─────────────────────┘             └─────────────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────────┐
                                    │   Supabase (Free)       │
                                    │   - PostgreSQL DB       │
                                    │   - 파일 스토리지       │
                                    └─────────────────────────┘
```

### 3.2 서비스별 무료 티어 상세

| 서비스 | 용도 | 무료 제한 |
|---|---|---|
| **Vercel** | Frontend 호스팅 | 100GB 대역폭/월, Serverless 10만 실행/월 |
| **Render** | Backend API | 750시간/월, 자동 슬립(15분 비활성) |
| **Supabase** | DB + Storage | 500MB DB, 1GB 스토리지, 2GB 대역폭 |
| **GitHub Actions** | CI/CD | 2,000분/월 |

### 3.3 대안 조합

#### Option A: Vercel 풀스택 (추천)
```
Frontend: Vercel
Backend: Vercel Serverless Functions (API Routes)
DB: Supabase
```
- 장점: 단일 플랫폼, 간편한 배포
- 단점: Serverless 함수 실행 시간 제한 (10초)

#### Option B: 분리 배포
```
Frontend: Vercel
Backend: Render
DB: Supabase
```
- 장점: 백엔드 자유도 높음, 긴 크롤링 작업 가능
- 단점: 관리 포인트 증가

#### Option C: Cloudflare 기반
```
Frontend: Cloudflare Pages
Backend: Cloudflare Workers
DB: Supabase
```
- 장점: 빠른 엣지 배포
- 단점: Workers 런타임 제약

## 4. 브랜치 전략

### 4.1 Git Flow (간소화)

```
main ──────────────────────────────────────────► Production
  │
  └── develop ─────────────────────────────────► Staging (선택)
        │
        ├── feature/user-profile
        ├── feature/crawling
        ├── feature/recommendation
        └── fix/bug-description
```

### 4.2 브랜치 규칙

| 브랜치 | 용도 | 배포 환경 |
|---|---|---|
| `main` | 프로덕션 코드 | Production |
| `develop` | 개발 통합 | Staging (선택) |
| `feature/*` | 기능 개발 | Preview |
| `fix/*` | 버그 수정 | Preview |

### 4.3 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드, 설정 변경
```

## 5. CI/CD 파이프라인

### 5.1 GitHub Actions 워크플로우

```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel Preview 배포 (자동)

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel Production 배포 (자동)
```

### 5.2 파이프라인 흐름

```
PR 생성 ──► Lint ──► Test ──► Preview 배포 ──► 코드 리뷰
                                                   │
                                                   ▼
                                              PR Merge
                                                   │
                                                   ▼
main push ──► Lint ──► Test ──► Production 배포
```

## 6. 환경 변수 관리

### 6.1 환경 구분

```
.env.local          # 로컬 개발 (git 제외)
.env.development    # 개발 환경
.env.production     # 프로덕션 환경
```

### 6.2 필요한 환경 변수

```bash
# Database (Supabase + Prisma)
DATABASE_URL=postgresql://...?pgbouncer=true  # Pooling 연결
DIRECT_URL=postgresql://...                    # 직접 연결 (마이그레이션용)

# AI (OpenAI)
OPENAI_API_KEY=sk-xxx

# 인증 (NextAuth)
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
KAKAO_CLIENT_ID=xxx
KAKAO_CLIENT_SECRET=xxx
```

### 6.3 시크릿 관리

```
GitHub Secrets (CI/CD + 배치 크롤링용)
├── DATABASE_URL          # Prisma DB 연결
├── DIRECT_URL            # Prisma 직접 연결
├── VERCEL_TOKEN
└── OPENAI_API_KEY

Vercel Environment Variables (런타임용)
├── DATABASE_URL
├── DIRECT_URL
├── NEXTAUTH_SECRET
├── NEXTAUTH_URL
├── KAKAO_CLIENT_ID
├── KAKAO_CLIENT_SECRET
└── OPENAI_API_KEY
```

## 7. 프로젝트 구조

```
cruit/
├── .github/
│   └── workflows/
│       ├── deploy.yml        # 배포 워크플로우
│       ├── ci.yml            # CI (린트/빌드)
│       └── crawl-jobs.yml    # 배치 크롤링 (매 시간)
├── scripts/
│   └── crawl-jobs.ts         # 배치 크롤링 스크립트
├── prisma/
│   └── schema.prisma         # DB 스키마 (Prisma)
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── api/              # API Routes (Serverless)
│   │   │   ├── auth/         # NextAuth 인증
│   │   │   ├── recommendations/ # AI 추천
│   │   │   ├── jobs/         # 공고 조회 (DB)
│   │   │   ├── crawl/        # 크롤링 트리거
│   │   │   └── debug/        # 디버그
│   │   ├── auth/             # 로그인/에러 페이지
│   │   ├── page.tsx          # 메인 페이지
│   │   └── layout.tsx
│   ├── components/           # React 컴포넌트
│   ├── lib/                  # 유틸리티
│   │   ├── prisma.ts         # Prisma 클라이언트 (싱글톤)
│   │   ├── auth/             # NextAuth 설정
│   │   ├── crawler/          # 크롤링 모듈 + DB 조회
│   │   ├── ai/               # AI 추천 모듈
│   │   └── dedup/            # 중복 제거
│   └── types/                # TypeScript 타입
├── public/                   # 정적 파일
├── planning/                 # 설계 문서
├── .env.example              # 환경 변수 템플릿
├── .gitignore
├── package.json
└── README.md
```

## 8. 배포 설정

### 8.1 Vercel 연동

1. GitHub repo 연결
2. Framework: Next.js 자동 감지
3. Root Directory: `/`
4. Build Command: `npm run build`
5. Output Directory: `.next`

### 8.2 자동 배포 트리거

| 이벤트 | 배포 환경 |
|---|---|
| Push to `main` | Production |
| Push to `develop` | Preview |
| PR 생성 | Preview (PR별 고유 URL) |

### 8.3 배치 크롤링 (GitHub Actions)

```yaml
# .github/workflows/crawl-jobs.yml

name: Crawl Jobs (Batch)

on:
  schedule:
    - cron: '0 * * * *'  # 매 시간
  workflow_dispatch:       # 수동 실행

jobs:
  crawl:
    runs-on: ubuntu-latest
    environment: prd
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx prisma generate
      - name: Run Crawler
        run: npx tsx scripts/crawl-jobs.ts
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

> 기존 API 트리거 방식에서 **직접 DB 저장 방식**으로 변경됨.
> 크롤링 결과는 `JobPosting` 테이블에 upsert되며,
> API 요청 시 DB 조회 (< 500ms)로 응답합니다.

## 9. 모니터링 (무료)

| 도구 | 용도 | 무료 제한 |
|---|---|---|
| Vercel Analytics | 트래픽, 성능 | 기본 제공 |
| Supabase Dashboard | DB 모니터링 | 기본 제공 |
| GitHub Actions | 빌드 로그 | 기본 제공 |
| Sentry (선택) | 에러 추적 | 5K 이벤트/월 |

## 10. 체크리스트

### 초기 설정
- [ ] GitHub Private Repo 생성
- [ ] Vercel 계정 생성 및 연동
- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정

### CI/CD 설정
- [ ] GitHub Actions 워크플로우 작성
- [ ] Branch protection 규칙 설정
- [ ] 자동 배포 확인

### 보안
- [ ] .gitignore 설정 (.env, node_modules 등)
- [ ] GitHub Secrets 등록
- [ ] API 키 노출 방지 확인
