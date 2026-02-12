# Cruit DB 스키마 문서

> 기준: `prisma/schema.prisma` | DB: PostgreSQL (Supabase) | ORM: Prisma

## ER 다이어그램

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o| UserProfile : has
    User ||--o{ JobRating : rates
    User ||--o{ Favorite : bookmarks
    User ||--o{ SeenJob : views
    User ||--o{ AIFeedback : submits
    UserProfile ||--o{ CareerHistory : has

    User {
        string id PK
        string name
        string email UK
        datetime emailVerified
        string image
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string userId FK
        string type
        string provider
        string providerAccountId
        string refresh_token
        string access_token
        int expires_at
        string token_type
        string scope
        string id_token
        string session_state
        int refresh_token_expires_in
    }

    Session {
        string id PK
        string sessionToken UK
        string userId FK
        datetime expires
    }

    VerificationToken {
        string identifier
        string token UK
        datetime expires
    }

    UserProfile {
        string id PK
        string userId FK_UK
        string experienceLevel
        boolean isFourYearUniv
        string universityRegion
        string universityName
        string major
        string[] certifications
        datetime createdAt
        datetime updatedAt
    }

    CareerHistory {
        string id PK
        string profileId FK
        string company
        string position
        string startDate
        string endDate
        string description
    }

    JobRating {
        string id PK
        string userId FK
        string jobId
        int rating
        datetime createdAt
    }

    Favorite {
        string id PK
        string userId FK
        string jobId
        json jobData
        int matchScore
        string[] matchReasons
        datetime savedAt
    }

    SeenJob {
        string id PK
        string userId FK
        string jobKey
        datetime seenAt
    }

    AIFeedback {
        string id PK
        string userId FK
        string generalFeedback
        string[] selectedTags
        string[] preferenceKeywords
        string[] avoidKeywords
        datetime createdAt
    }

    JobPosting {
        string id PK
        string externalId
        string source
        string title
        string company
        string location
        string experienceLevel
        string education
        string[] skills
        string salary
        string deadline
        string url
        string summary
        float[] embedding
        string category
        string[] keywords
        datetime crawledAt
        datetime updatedAt
        boolean isActive
    }

    CrawlLog {
        string id PK
        string source
        string status
        int jobsFound
        int jobsCreated
        int jobsUpdated
        int duration
        string errorMsg
        datetime startedAt
        datetime finishedAt
    }
```

---

## 모델 상세

### 1. NextAuth.js 인증 모델

#### Account
OAuth 연결 정보 (카카오 로그인).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `userId` | String (FK→User) | 사용자 |
| `type` | String | OAuth 타입 |
| `provider` | String | 제공자 (kakao) |
| `providerAccountId` | String | 제공자측 ID |
| `refresh_token` | String? | 리프레시 토큰 |
| `access_token` | String? | 액세스 토큰 |
| `expires_at` | Int? | 만료 시점 |
| `token_type` | String? | 토큰 타입 |
| `scope` | String? | 권한 범위 |
| `id_token` | String? | ID 토큰 |
| `session_state` | String? | 세션 상태 |
| `refresh_token_expires_in` | Int? | 리프레시 토큰 만료 (카카오 전용) |

- **Unique**: `[provider, providerAccountId]`
- **관계**: `User` (Cascade 삭제)

#### Session
사용자 세션.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `sessionToken` | String (UK) | 세션 토큰 |
| `userId` | String (FK→User) | 사용자 |
| `expires` | DateTime | 만료 시점 |

#### VerificationToken
이메일 인증 토큰.

| 필드 | 타입 | 설명 |
|------|------|------|
| `identifier` | String | 식별자 |
| `token` | String (UK) | 토큰 |
| `expires` | DateTime | 만료 시점 |

- **Unique**: `[identifier, token]`

---

### 2. 사용자 모델

#### User
서비스 사용자.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `name` | String? | 이름 |
| `email` | String? (UK) | 이메일 |
| `emailVerified` | DateTime? | 이메일 인증일 |
| `image` | String? | 프로필 이미지 URL |
| `createdAt` | DateTime | 가입일 |
| `updatedAt` | DateTime | 수정일 |

- **관계**: Account[], Session[], UserProfile?, JobRating[], Favorite[], SeenJob[], AIFeedback[]

#### UserProfile
취업 프로필 (1:1).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `userId` | String (FK→User, UK) | 사용자 |
| `experienceLevel` | String | `junior` / `experienced` |
| `isFourYearUniv` | Boolean | 4년제 여부 (기본: true) |
| `universityRegion` | String? | 대학 지역 |
| `universityName` | String? | 대학명 |
| `major` | String | 전공 |
| `certifications` | String[] | 자격증 목록 |
| `createdAt` | DateTime | 생성일 |
| `updatedAt` | DateTime | 수정일 |

- **관계**: CareerHistory[]

#### CareerHistory
경력 사항 (경력자용).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `profileId` | String (FK→UserProfile) | 프로필 |
| `company` | String | 회사명 |
| `position` | String | 직책 |
| `startDate` | String | 시작일 (YYYY-MM) |
| `endDate` | String | 종료일 (YYYY-MM / 재직중) |
| `description` | String? | 업무 설명 |

---

### 3. 사용자 활동 모델

#### JobRating
공고 평점 (1~5).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `userId` | String (FK→User) | 사용자 |
| `jobId` | String | 공고 ID |
| `rating` | Int | 평점 (1-5) |
| `createdAt` | DateTime | 평가일 |

- **Unique**: `[userId, jobId]`

#### Favorite
즐겨찾기.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `userId` | String (FK→User) | 사용자 |
| `jobId` | String | 공고 ID |
| `jobData` | Json | 공고 전체 데이터 스냅샷 |
| `matchScore` | Int? | AI 매칭 점수 |
| `matchReasons` | String[] | AI 매칭 이유 |
| `savedAt` | DateTime | 저장일 |

- **Unique**: `[userId, jobId]`

#### SeenJob
조회 기록 (중복 추천 방지).

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `userId` | String (FK→User) | 사용자 |
| `jobKey` | String | 정규화된 키 (`company_title`) |
| `seenAt` | DateTime | 조회 시점 |

- **Unique**: `[userId, jobKey]`
- **Index**: `[userId, seenAt]`

#### AIFeedback
AI 추천 피드백.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `userId` | String (FK→User) | 사용자 |
| `generalFeedback` | String? (Text) | 자유 피드백 |
| `selectedTags` | String[] | 선택한 태그 |
| `preferenceKeywords` | String[] | 선호 키워드 |
| `avoidKeywords` | String[] | 기피 키워드 |
| `createdAt` | DateTime | 제출일 |

---

### 4. 채용공고 모델

#### JobPosting
배치 수집된 채용공고.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `externalId` | String | 원본 ID (예: `recruitment_12345`) |
| `source` | String | 수집 소스 (recruitment 등) |
| `title` | String | 공고 제목 |
| `company` | String | 회사/기관명 |
| `location` | String? | 근무지 |
| `experienceLevel` | String? | 경력 조건 |
| `education` | String? | 학력 조건 |
| `skills` | String[] | 기술 스택 / NCS |
| `salary` | String? | 급여 |
| `deadline` | String? | 마감일 |
| `url` | String | 원본 공고 URL |
| `summary` | String? (Text) | 우대조건 등 요약 |
| `crawledAt` | DateTime | 수집 시점 |
| `updatedAt` | DateTime | 갱신 시점 |
| `isActive` | Boolean | 활성 상태 (기본: true) |
| `embedding` | Float[] | 임베딩 벡터 (미사용) |
| `category` | String? | 직군 카테고리 (미사용) |
| `keywords` | String[] | 추출 키워드 (미사용) |

- **Unique**: `[source, externalId]`
- **Index**: `source`, `crawledAt`, `isActive`, `company`, `experienceLevel`

#### CrawlLog
배치 수집 실행 기록.

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String (PK) | cuid |
| `source` | String | 소스명 |
| `status` | String | success / failed / partial |
| `jobsFound` | Int | 발견 건수 |
| `jobsCreated` | Int | 신규 저장 건수 |
| `jobsUpdated` | Int | 업데이트 건수 |
| `duration` | Int | 소요 시간 (ms) |
| `errorMsg` | String? (Text) | 에러 메시지 |
| `startedAt` | DateTime | 시작 시점 |
| `finishedAt` | DateTime | 종료 시점 |

- **Index**: `source`, `finishedAt`

---

## 데이터 흐름

```
[배치 수집 - GitHub Actions 매일 2회]
  API(data.go.kr) → JobPosting 테이블 (upsert)
                   → CrawlLog 테이블 (실행 기록)

[사용자 회원가입]
  카카오 OAuth → User + Account 테이블

[프로필 등록]
  User → UserProfile → CareerHistory (경력자)

[추천 요청]
  JobPosting 조회 → AI 매칭 → SeenJob 기록

[사용자 활동]
  즐겨찾기 → Favorite
  평점     → JobRating
  피드백   → AIFeedback
```
