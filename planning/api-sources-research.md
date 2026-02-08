# 채용공고 공식 API 원천 조사 결과

> 작성일: 2026-02-08
> 목적: 크롤링 → 공식 API 전환을 위한 원천 시스템 조사

---

## 1. 사용 가능한 공식 API 요약

| API | 공식 API | 무료 | 개인 접근 | 일일 제한 | 한국 채용공고 | 실용성 |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|
| **워크넷 (공공데이터포털)** | O | O | O | ~1,000건/일 | 매우 많음 | **최상** |
| **공공기관 채용정보** | O | O | O | ~1,000건/일 | 공공기관 한정 | **상** |
| **사람인 API** | O | O | O (승인) | 500건/일 | 매우 많음 | **상** |
| **원티드 OpenAPI** | O | O | O (승인) | 미공개 | 많음 (IT 특화) | **상** |
| **잡코리아 API** | O | 비공개 | 제한적 | 비공개 | 매우 많음 | 중 |
| **점핏** | X | - | - | - | 개발자 특화 | 불가 |
| **인크루트** | X | - | - | - | 많음 | 불가 |

---

## 2. 상세 분석

### 2.1 워크넷 API (1순위 - 즉시 도입 권장)

- **제공처**: 한국고용정보원 (공공데이터)
- **API 문서**: https://openapi.work.go.kr/
- **공공데이터포털**: https://www.data.go.kr/data/3038225/openapi.do
- **인증 방식**: API Key (회원가입 후 발급)
- **비용**: 무료
- **호출 제한**: 일 1,000건 (운영계정 전환 시 증가 가능)
- **응답 형식**: XML, JSON
- **법적 리스크**: 없음 (공공데이터)

#### 요청 파라미터
| 파라미터 | 설명 | 필수 |
|---------|------|:---:|
| `authKey` | 인증키 | O |
| `callTp` | 호출 유형 | O |
| `returnType` | 반환 형식 (XML/JSON) | O |
| `keyword` | 검색 키워드 | |
| `regionCd` | 근무지역 코드 | |
| `jobCd` | 직종 코드 | |
| `career` | 경력 구분 | |
| `eduLvl` | 학력 | |
| `empTp` | 고용형태 | |
| `startPage` / `display` | 페이지네이션 | |
| `minPay` / `maxPay` | 급여 범위 | |

#### 응답 필드
| 필드 | 설명 | 현재 JobPosting 매핑 |
|------|------|---------------------|
| `wantedAuthNo` | 구인인증번호 | `externalId` |
| `company` | 회사명 | `company` |
| `title` | 채용제목 | `title` |
| `sal` | 급여 | `salary` |
| `region` | 근무지역 | `location` |
| `career` | 경력 | `experienceLevel` |
| `minEdubg` / `maxEdubg` | 학력 | `education` |
| `regDt` | 등록일자 | `crawledAt` |
| `closeDt` | 마감일자 | `deadline` |
| `wantedInfoUrl` | 채용정보 URL | `url` |
| `jobCd` | 직종코드 | `category` |

#### 추가 API 서비스
- 공채속보 API (공채기업목록, 공채속보목록)
- 채용행사 API (채용박람회 등)
- 공통코드 API (지역, 직종, 자격면허 코드)

---

### 2.2 사람인 오픈 API (2순위)

- **API 문서**: https://oapi.saramin.co.kr/
- **채용공고 가이드**: https://oapi.saramin.co.kr/guide/job-search
- **인증 방식**: API Key (`access-key` 파라미터)
- **비용**: 무료 (승인 필요)
- **신청**: api@saramin.co.kr 문의
- **호출 제한**: 일 500건
- **응답 형식**: XML (기본), JSON (`Accept: application/json` 헤더)

#### 요청 파라미터
| 파라미터 | 설명 |
|---------|------|
| `keywords` | 검색 키워드 |
| `loc_cd` | 지역코드 |
| `job_type` | 고용형태코드 |
| `ind_cd` | 산업코드 |
| `job_mid_cd` / `job_cd` | 직종 중분류/소분류 |
| `edu_lv` | 학력 |
| `exp_cd` | 경력 |
| `sal_cd` | 연봉 |
| `start` / `count` | 페이지네이션 |

#### 응답 필드
- 채용공고 URL, 활성 상태
- 회사 정보 (회사명, 상세정보 링크)
- 직무 정보 (직급, 산업, 지역, 고용형태, 경력수준, 요구학력)
- 키워드 정보, 연봉 정보

---

### 2.3 원티드 OpenAPI (3순위)

- **API 문서**: https://openapi.wanted.jobs/
- **V2 문서**: https://openapi.wanted.jobs/api-docs/v2/
- **인증 방식**: API Key (신청 후 메일 발급, 3영업일 이내)
- **비용**: 무료 (파트너 승인)
- **호출 제한**: 미공개
- **응답 형식**: JSON
- **특징**: IT/개발 분야 특화, 테스트/운영 키 별도 제공

---

### 2.4 공공기관 채용정보 API (보조)

- **API 문서**: https://www.data.go.kr/data/15125273/openapi.do
- **제공처**: 기획재정부
- **인증 방식**: API Key (공공데이터포털)
- **비용**: 무료
- **특징**: 공공기관(정부출연, 공기업) 채용 전용

---

### 2.5 잡코리아 API (접근 제한적)

- **API 안내**: https://www.jobkorea.co.kr/service/api
- **인증 방식**: 신청서 작성 후 내부 검토 승인
- **비용**: 비공개
- **접근**: 기업/기관 대상, 개인 개발자 접근 어려움
- **필요 정보**: 이용기관, 서버 정보, 오픈일, 사용 목적

---

### 2.6 공식 API 없는 사이트

| 사이트 | 비고 |
|--------|------|
| 점핏 (Jumpit) | 사람인 자회사, 별도 API 없음. 사람인 API로 일부 대체 가능 |
| 인크루트 (Incruit) | 외부 API 없음 |

---

## 3. 전환 계획

### Phase 1: 워크넷 API 연동 (즉시)
1. 공공데이터포털 회원가입 및 API Key 발급
2. 워크넷 채용정보 API 연동 모듈 구현
3. 기존 `fetchJobsFromDb()` 대체 또는 병행
4. 배치 스크립트를 API 호출 방식으로 전환

### Phase 2: 사람인 API 연동
1. oapi.saramin.co.kr API Key 신청 (api@saramin.co.kr)
2. 승인 후 사람인 API 연동 모듈 구현
3. 일 500건 제한 내에서 데이터 수집

### Phase 3: 원티드 API 연동
1. openapi.wanted.jobs 인증 신청
2. 3영업일 내 키 발급 후 연동
3. IT/개발 분야 공고 보강

### 데이터 소스 구조 변경
```
[현재 - 크롤링 방식]
GitHub Actions → crawl-jobs.ts → 5개 사이트 크롤링 → DB

[목표 - API 방식]
GitHub Actions → fetch-jobs-api.ts → 공식 API 호출 → DB
  ├─ 워크넷 API (공공데이터)
  ├─ 사람인 API (oapi.saramin.co.kr)
  └─ 원티드 API (openapi.wanted.jobs)
```

---

## 4. API Key 발급 절차

### 워크넷 (공공데이터포털)
1. https://www.data.go.kr 회원가입
2. "워크넷 채용정보" 검색 → 활용신청
3. 즉시 또는 1~2일 내 승인
4. 마이페이지에서 API Key 확인

### 사람인
1. https://oapi.saramin.co.kr/ 회원가입
2. API Key 신청 (사용 목적 기재)
3. api@saramin.co.kr 로 문의 가능
4. 승인 후 access-key 발급

### 원티드
1. https://openapi.wanted.jobs/ 접속
2. 인증 신청 (서비스 정보 기재)
3. 3영업일 이내 인증키 메일 발급
4. 테스트 키 / 운영 키 별도 발급
