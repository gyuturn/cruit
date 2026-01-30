// 경력사항
export interface CareerHistory {
  company: string; // 회사명
  position: string; // 직무/직책
  startDate: string; // 시작일 (YYYY-MM)
  endDate: string; // 종료일 (YYYY-MM) 또는 '재직중'
  description?: string; // 업무 내용 (선택)
}

// 대학교 지역
export type UniversityRegion =
  | '서울'
  | '경기'
  | '인천'
  | '강원'
  | '충북'
  | '충남/대전'
  | '전북'
  | '전남/광주'
  | '경북/대구'
  | '경남/부산/울산'
  | '제주';

// 사용자 프로필
export interface UserProfile {
  id: string;
  experienceLevel: 'junior' | 'experienced'; // 신입/경력
  isFourYearUniv: boolean; // 4년제 여부
  universityRegion?: UniversityRegion; // 대학교 지역
  universityName?: string; // 대학교명
  major: string; // 전공
  certifications: string[]; // 자격증 리스트
  careerHistory?: CareerHistory[]; // 경력사항 (경력자만)
  createdAt: string;
  updatedAt: string;
}

// 취업 공고
export interface JobPosting {
  id: string;
  title: string; // 공고 제목
  company: string; // 회사명
  location: string; // 근무지
  experienceLevel: string; // 경력 조건
  education: string; // 학력 조건
  skills: string[]; // 필요 기술/자격증
  salary: string; // 급여 정보
  deadline: string; // 마감일
  url: string; // 원본 링크
  source: string; // 크롤링 출처
  summary: string; // 간략 요약
  createdAt: string;
}

// 추천 결과
export interface Recommendation {
  jobPosting: JobPosting;
  matchScore: number; // 매칭 점수 (0-100)
  matchReasons: string[]; // 매칭 이유
  userRating?: number; // 사용자 평점 (1-5)
}

// 프로필 입력 폼
export interface ProfileFormData {
  experienceLevel: 'junior' | 'experienced';
  isFourYearUniv: boolean;
  universityRegion?: UniversityRegion;
  universityName?: string;
  major: string;
  certifications: string[];
  careerHistory?: CareerHistory[];
}

// 공고 평점
export interface JobRating {
  jobId: string;
  rating: number; // 1-5 별점
  createdAt: string;
}

// 즐겨찾기 공고
export interface FavoriteJob {
  jobPosting: JobPosting;
  matchScore?: number;      // 추천 시 점수 (선택)
  matchReasons?: string[];  // 추천 시 이유 (선택)
  savedAt: string;          // 저장 일시
}

// AI 학습용 별점 데이터
export interface RatingWithJobInfo {
  jobId: string;
  rating: number;
  jobTitle: string;
  company: string;
  skills: string[];
  experienceLevel: string;
}

// AI 피드백 데이터
export interface AIFeedbackData {
  generalFeedback: string;      // 종합 의견
  selectedTags: string[];       // 선택한 빠른 태그
  preferenceKeywords: string[]; // 선호 키워드
  avoidKeywords: string[];      // 비선호 키워드
}
