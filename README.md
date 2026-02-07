# Cruit - AI 기반 취업 추천 시스템

한국 구직자를 위한 맞춤형 채용공고 추천 서비스

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **AI**: OpenAI GPT-3.5-turbo (매칭 + 학습)
- **DB**: PostgreSQL (Supabase) + Prisma ORM
- **Crawling**: Cheerio (사람인, 잡코리아, 인크루트), REST API (원티드, 점핏)
- **배치 시스템**: GitHub Actions (매 시간 자동 크롤링)
- **인증**: NextAuth.js (카카오 로그인)
- **배포**: Vercel

## 시작하기

```bash
# 의존성 설치
npm install

# Prisma 클라이언트 생성
npx prisma generate

# 개발 서버 실행
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인

### 환경 변수

`.env.local` 파일에 다음 변수를 설정하세요:

```bash
DATABASE_URL=postgresql://...        # Supabase 연결 (Pooling)
DIRECT_URL=postgresql://...          # Supabase 직접 연결
OPENAI_API_KEY=sk-...                # OpenAI API 키
NEXTAUTH_SECRET=...                  # NextAuth 시크릿
NEXTAUTH_URL=http://localhost:3000   # 앱 URL
KAKAO_CLIENT_ID=...                  # 카카오 로그인
KAKAO_CLIENT_SECRET=...              # 카카오 로그인
```

## 디렉토리 구조

```
cruit/
├── .github/workflows/
│   ├── deploy.yml              # CI/CD 배포
│   ├── ci.yml                  # 린트/빌드 체크
│   └── crawl-jobs.yml          # 배치 크롤링 (매 시간)
├── scripts/
│   └── crawl-jobs.ts           # 배치 크롤링 스크립트
├── prisma/
│   └── schema.prisma           # DB 스키마
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # NextAuth 인증
│   │   │   ├── recommendations/# AI 추천 API
│   │   │   ├── jobs/           # 공고 조회 API (DB)
│   │   │   ├── crawl/          # 크롤링 트리거
│   │   │   └── debug/          # 디버그 API
│   │   ├── auth/               # 로그인/에러 페이지
│   │   └── page.tsx            # 메인 페이지
│   ├── components/             # React 컴포넌트
│   ├── lib/
│   │   ├── ai/                 # AI 추천 엔진 (Rule + GPT)
│   │   ├── crawler/            # 크롤러 (5개 사이트)
│   │   ├── dedup/              # 중복 제거
│   │   ├── auth/               # NextAuth 설정
│   │   ├── prisma.ts           # Prisma 클라이언트 싱글톤
│   │   └── storage.ts          # 클라이언트 스토리지
│   └── types/                  # TypeScript 타입 정의
└── planning/                   # 설계 문서
```

## 아키텍처

### 데이터 흐름

```
[GitHub Actions - 매 시간]
    │
    ▼
[배치 크롤러] ──► 사람인, 원티드, 점핏 크롤링
    │
    ▼
[PostgreSQL - JobPosting 테이블] ◄── upsert (중복 방지)
    │
    ▼
[API 요청] ──► DB 조회 (< 500ms) ──► AI 매칭 ──► 추천 결과
                  │
                  └── DB 결과 부족 시 실시간 크롤링 폴백
```

### API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/recommendations` | AI 추천 (프로필 기반) |
| GET | `/api/jobs` | 공고 목록 조회 (필터링/페이지네이션) |
| POST | `/api/crawl` | 수동 크롤링 트리거 |

#### GET /api/jobs 쿼리 파라미터

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `source` | string | 소스 필터 (saramin, wanted, jumpit) |
| `keyword` | string | 키워드 검색 (제목, 회사명, 스킬) |
| `experienceLevel` | string | 경력 필터 (신입, 경력) |
| `page` | number | 페이지 번호 (기본: 1) |
| `limit` | number | 페이지당 개수 (기본: 20) |

### DB 스키마 (주요 모델)

| 모델 | 설명 |
|------|------|
| `User` | 사용자 (NextAuth) |
| `UserProfile` | 취업 프로필 (전공, 자격증, 경력) |
| `JobPosting` | 채용공고 (배치 크롤링 데이터) |
| `CrawlLog` | 크롤링 실행 기록 |
| `Favorite` | 즐겨찾기 |
| `JobRating` | 공고 평점 (AI 학습용) |
| `AIFeedback` | 사용자 피드백 (AI 학습용) |

## 배치 크롤링

GitHub Actions로 매 시간 자동 크롤링을 실행합니다.

```bash
# 수동 실행
npx tsx scripts/crawl-jobs.ts

# GitHub Actions에서 수동 트리거
gh workflow run "Crawl Jobs (Batch)"
```

- 10개 키워드 x 3개 소스 (사람인, 원티드, 점핏) 병렬 크롤링
- 중복 제거 후 DB upsert
- 7일 이상 미업데이트 공고 자동 비활성화
- 실행 기록 `CrawlLog` 테이블에 저장
