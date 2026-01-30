# 기능 개선 설계서

## 개요
이 문서는 취업 추천 시스템의 기능 개선 요구사항과 설계를 정리합니다.

---

## 1. 즐겨찾기(Favorites) 기능

### 1.1 요구사항
- 사용자가 관심 있는 공고를 즐겨찾기로 저장할 수 있어야 함
- 즐겨찾기된 공고는 별도 탭에서 확인 가능
- 공고 표시 형식은 기존 JobCard와 동일하게 유지
- LocalStorage에 저장하여 세션 간 유지

### 1.2 UI/UX 설계

#### 1.2.1 JobCard 수정
```
┌─────────────────────────────────────────┐
│ [회사명]                    [♡ 즐겨찾기] │
│ 공고제목                                 │
│ 위치 | 경력 | 학력                       │
│ [기술1] [기술2] [기술3]                  │
│ ─────────────────────────────────────── │
│ 매칭점수: 85점                          │
│ ✓ 이유1  ✓ 이유2                        │
│ ★★★★☆ 별점                            │
└─────────────────────────────────────────┘
```
- 하트 아이콘(♡)을 JobCard 우측 상단에 추가
- 클릭 시 ♥(채워진 하트)로 변경되며 즐겨찾기에 추가
- 다시 클릭 시 즐겨찾기에서 제거

#### 1.2.2 탭 네비게이션
```
┌────────────────┬────────────────┐
│   추천 공고    │   즐겨찾기 (3)  │
└────────────────┴────────────────┘
```
- 메인 페이지 상단에 탭 UI 추가
- "추천 공고" 탭: 기존 추천 목록
- "즐겨찾기" 탭: 저장된 공고 목록 (개수 표시)

### 1.3 데이터 구조

#### 1.3.1 Types 추가 (`/src/types/index.ts`)
```typescript
// 즐겨찾기 공고
export interface FavoriteJob {
  jobPosting: JobPosting;
  matchScore?: number;      // 추천 시 점수 (선택)
  matchReasons?: string[];  // 추천 시 이유 (선택)
  savedAt: string;          // 저장 일시
}
```

#### 1.3.2 Storage 함수 추가 (`/src/lib/storage.ts`)
```typescript
// 즐겨찾기 저장
export function saveFavorite(job: FavoriteJob): void;

// 즐겨찾기 삭제
export function removeFavorite(jobId: string): void;

// 즐겨찾기 목록 조회
export function getFavorites(): FavoriteJob[];

// 즐겨찾기 여부 확인
export function isFavorite(jobId: string): boolean;
```

### 1.4 구현 파일 목록
1. `/src/types/index.ts` - FavoriteJob 인터페이스 추가
2. `/src/lib/storage.ts` - 즐겨찾기 관련 함수 추가
3. `/src/components/JobCard.tsx` - 즐겨찾기 버튼 추가
4. `/src/components/FavoritesList.tsx` - 즐겨찾기 목록 컴포넌트 (신규)
5. `/src/components/TabNavigation.tsx` - 탭 네비게이션 컴포넌트 (신규)
6. `/src/app/page.tsx` - 탭 상태 관리 및 UI 통합

---

## 2. AI 학습 기반 재추천 기능

### 2.1 요구사항
- 기존 "갱신하기" 버튼을 "AI에게 학습후 재추천" 버튼으로 변경
- 사용자가 부여한 별점 데이터를 서버로 전송
- AI가 별점 패턴을 분석하여 더 나은 추천 제공

### 2.2 현재 상태 분석

#### 2.2.1 현재 별점 시스템
- 별점은 LocalStorage에만 저장됨 (`/src/lib/storage.ts`)
- 서버로 전송되지 않음
- AI 추천 시 활용되지 않음

#### 2.2.2 현재 AI 시스템
- OpenAI GPT-3.5-turbo 사용
- 프롬프트 기반 추천 (학습 기능 없음)
- 매 요청마다 독립적으로 동작

### 2.3 AI 학습 구현 방안

#### 2.3.1 방안 A: 프롬프트 엔지니어링 (권장 - 즉시 구현 가능)
GPT 모델은 자체 학습 기능이 없지만, 별점 데이터를 프롬프트에 포함시켜 "학습된 것처럼" 동작하게 할 수 있습니다.

**구현 방법:**
```typescript
const prompt = `
## 사용자 프로필
- 경력: ${profile.experienceLevel}
- 학력: ${universityInfo}
- 전공: ${profile.major}
...

## 사용자 선호도 피드백 (별점 기록)
${ratings.map(r => `- ${r.jobTitle} (${r.company}): ${r.rating}점 - ${r.matchReasons.join(', ')}`).join('\n')}

## 선호도 분석 요청
위 별점 기록을 분석하여:
1. 높은 별점(4-5점)을 준 공고의 공통점을 파악하세요
2. 낮은 별점(1-2점)을 준 공고의 공통점을 파악하세요
3. 이를 바탕으로 아래 공고들을 재평가하세요

## 채용 공고 목록
${jobs.map(...).join('\n')}
`;
```

**장점:**
- 추가 비용 없음 (기존 API 사용)
- 즉시 구현 가능
- 실시간 피드백 반영

**단점:**
- 토큰 사용량 증가 (별점 데이터 포함)
- 세션 간 학습 지속되지 않음 (매번 별점 전송 필요)

#### 2.3.2 방안 B: Fine-tuning (고급 - 추가 개발 필요)
OpenAI Fine-tuning API를 사용하여 사용자별 맞춤 모델 생성

**필요 사항:**
- 최소 10-100개의 학습 데이터 필요
- Fine-tuning 비용 발생 (학습 데이터당 과금)
- 학습 완료까지 수분-수시간 소요
- 사용자별 모델 관리 필요

**비용:**
- GPT-3.5-turbo Fine-tuning: $0.008/1K tokens (학습)
- Fine-tuned 모델 사용: $0.012/1K tokens (추론)

#### 2.3.3 방안 C: 벡터 DB + RAG (고급)
사용자 피드백을 벡터 DB에 저장하고 검색 증강 생성(RAG) 활용

**필요 사항:**
- Pinecone, Supabase Vector 등 벡터 DB
- 임베딩 생성 비용
- 복잡한 시스템 구축

### 2.4 권장 구현: 방안 A (프롬프트 엔지니어링)

#### 2.4.1 API 수정 (`/src/app/api/recommendations/route.ts`)
```typescript
export async function POST(request: Request) {
  const { profile, ratings } = await request.json();

  // ratings 데이터를 AI 추천에 전달
  const recommendations = await getRecommendations(
    profile,
    jobs,
    true, // useAI
    ratings // 새로운 파라미터
  );

  return Response.json({ recommendations });
}
```

#### 2.4.2 AI 모듈 수정 (`/src/lib/ai/index.ts`)
```typescript
// 별점 데이터를 포함한 프롬프트 생성
function buildPromptWithRatings(
  profile: UserProfile,
  jobs: JobPosting[],
  ratings: Array<{jobId: string; rating: number; jobInfo: JobPosting}>
): string {
  let ratingContext = '';

  if (ratings.length > 0) {
    const highRated = ratings.filter(r => r.rating >= 4);
    const lowRated = ratings.filter(r => r.rating <= 2);

    ratingContext = `
## 사용자 피드백 분석
### 선호하는 공고 (4-5점)
${highRated.map(r => `- ${r.jobInfo.company} - ${r.jobInfo.title}`).join('\n')}

### 비선호 공고 (1-2점)
${lowRated.map(r => `- ${r.jobInfo.company} - ${r.jobInfo.title}`).join('\n')}

위 피드백을 참고하여 사용자가 선호할 것 같은 공고에 더 높은 점수를 부여하세요.
`;
  }

  return `
${ratingContext}
... 기존 프롬프트 ...
`;
}
```

#### 2.4.3 클라이언트 수정 (`/src/app/page.tsx`)
```typescript
// "AI에게 학습후 재추천" 버튼 핸들러
const handleAILearnAndRecommend = async () => {
  const ratings = getRatings(); // LocalStorage에서 별점 가져오기

  const response = await fetch('/api/recommendations', {
    method: 'POST',
    body: JSON.stringify({
      profile,
      ratings: ratings.map(r => ({
        jobId: r.jobId,
        rating: r.rating,
        // 해당 공고 정보도 함께 전송
      }))
    })
  });

  // 새로운 추천 결과 표시
};
```

### 2.5 UI 변경사항

#### 2.5.1 버튼 텍스트 변경
```
변경 전: [갱신하기]
변경 후: [🧠 AI에게 학습후 재추천]
```

#### 2.5.2 학습 진행 표시
```
[🧠 AI 학습 중...] (로딩 상태)
```

#### 2.5.3 학습 결과 피드백
```
"3개의 별점 데이터를 분석하여 추천을 개선했습니다!"
```

---

## 3. AI 학습 기능의 한계 및 대안

### 3.1 GPT 모델의 특성
- GPT는 사전 학습된 모델로, 실시간 학습이 불가능
- 각 API 호출은 독립적이며 이전 호출을 기억하지 않음
- "학습"은 Fine-tuning을 통해서만 가능하며 비용과 시간 소요

### 3.2 진정한 AI 학습을 위해 필요한 것들

#### 3.2.1 Fine-tuning 파이프라인
```
1. 데이터 수집
   - 사용자별 별점 데이터 축적
   - 최소 50-100개 이상의 학습 데이터 필요

2. 데이터 전처리
   - JSONL 형식으로 변환
   - 학습용/검증용 분리

3. Fine-tuning 실행
   - OpenAI Fine-tuning API 호출
   - 학습 완료까지 대기 (수분-수시간)

4. 모델 배포
   - Fine-tuned 모델 ID 저장
   - 사용자별 모델 관리

5. 주기적 재학습
   - 새로운 피드백 축적 시 재학습
   - 배치 작업으로 처리
```

#### 3.2.2 인프라 요구사항
- **백엔드 DB**: 별점 데이터 영구 저장 (Supabase, PostgreSQL 등)
- **배치 시스템**: 주기적 Fine-tuning 실행 (GitHub Actions, AWS Lambda 등)
- **모델 관리**: 사용자별 Fine-tuned 모델 ID 저장

#### 3.2.3 비용 예측
| 항목 | 비용 |
|------|------|
| Fine-tuning 학습 | ~$0.008/1K tokens |
| Fine-tuned 모델 추론 | ~$0.012/1K tokens |
| 월 예상 비용 (100명 사용자) | ~$20-50 |

### 3.3 현실적인 대안: 하이브리드 접근법

```
Phase 1 (즉시 구현): 프롬프트 엔지니어링
- 별점 데이터를 프롬프트에 포함
- 추가 비용 최소화
- 즉각적인 피드백 반영

Phase 2 (향후 구현): 규칙 기반 가중치
- 높은 별점 공고의 특성 분석
- 회사 규모, 기술 스택, 위치 등 선호도 추출
- 규칙 기반 점수에 가중치 적용

Phase 3 (고도화): Fine-tuning
- 충분한 데이터 축적 후
- 사용자 그룹별 Fine-tuned 모델
- 개인화된 추천 제공
```

---

## 4. 구현 우선순위

### Phase 1 (높은 우선순위) - **구현 완료**
1. ✅ 즐겨찾기 기능 구현 - **완료**
2. ✅ 별점 데이터 서버 전송 구현 - **완료**
3. ✅ 프롬프트 기반 AI 학습 효과 구현 - **완료**
4. ✅ "AI에게 학습후 재추천" 버튼 구현 - **완료**

### Phase 2 (중간 우선순위)
1. 별점 데이터 DB 저장 (Supabase)
2. 별점 패턴 분석 및 선호도 추출
3. 규칙 기반 가중치 시스템

### Phase 3 (낮은 우선순위)
1. Fine-tuning 파이프라인 구축
2. 사용자 그룹별 모델 관리
3. A/B 테스트 시스템

---

## 5. 파일 수정 목록

| 파일 | 수정 내용 |
|------|----------|
| `/src/types/index.ts` | FavoriteJob 인터페이스 추가 |
| `/src/lib/storage.ts` | 즐겨찾기 함수, 별점 조회 함수 추가 |
| `/src/lib/ai/index.ts` | 별점 기반 프롬프트 생성 로직 추가 |
| `/src/components/JobCard.tsx` | 즐겨찾기 버튼 추가 |
| `/src/components/FavoritesList.tsx` | 신규 생성 |
| `/src/components/TabNavigation.tsx` | 신규 생성 |
| `/src/app/page.tsx` | 탭 UI, AI 학습 버튼 추가 |
| `/src/app/api/recommendations/route.ts` | 별점 데이터 처리 추가 |

---

## 6. 예상 작업량

- 즐겨찾기 기능: 컴포넌트 3개, storage 함수 4개
- AI 학습 기능: API 수정 1개, AI 모듈 수정 1개, UI 수정 1개
- 테스트 및 검증: 전체 기능 통합 테스트

---

*작성일: 2026-01-31*
*버전: 1.0*
