import { UserProfile, Recommendation, JobRating, FavoriteJob, JobPosting } from '@/types';

const PROFILE_KEY = 'cruit_user_profile';
const RECOMMENDATIONS_KEY = 'cruit_recommendations';
const RATINGS_KEY = 'cruit_job_ratings';
const FAVORITES_KEY = 'cruit_favorites';

// 프로필 저장
export function saveProfile(profile: UserProfile): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
}

// 프로필 조회
export function getProfile(): UserProfile | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

// 프로필 삭제 (초기화)
export function deleteProfile(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(RECOMMENDATIONS_KEY);
    localStorage.removeItem(RATINGS_KEY);
  }
}

// 프로필 존재 여부 확인
export function hasProfile(): boolean {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem(PROFILE_KEY);
  }
  return false;
}

// 추천 결과 캐시 저장
export function saveRecommendations(recommendations: Recommendation[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(recommendations));
  }
}

// 추천 결과 캐시 조회
export function getRecommendations(): Recommendation[] | null {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(RECOMMENDATIONS_KEY);
    return data ? JSON.parse(data) : null;
  }
  return null;
}

// 평점 저장
export function saveRating(jobId: string, rating: number): void {
  if (typeof window !== 'undefined') {
    const ratings = getRatings();
    const existingIndex = ratings.findIndex(r => r.jobId === jobId);

    const newRating: JobRating = {
      jobId,
      rating,
      createdAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      ratings[existingIndex] = newRating;
    } else {
      ratings.push(newRating);
    }

    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  }
}

// 특정 공고 평점 조회
export function getRating(jobId: string): number | null {
  if (typeof window !== 'undefined') {
    const ratings = getRatings();
    const found = ratings.find(r => r.jobId === jobId);
    return found ? found.rating : null;
  }
  return null;
}

// 전체 평점 조회
export function getRatings(): JobRating[] {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(RATINGS_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

// 평점 삭제
export function deleteRating(jobId: string): void {
  if (typeof window !== 'undefined') {
    const ratings = getRatings().filter(r => r.jobId !== jobId);
    localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings));
  }
}

// ========== 즐겨찾기 관련 함수 ==========

// 즐겨찾기 저장
export function saveFavorite(
  jobPosting: JobPosting,
  matchScore?: number,
  matchReasons?: string[]
): void {
  if (typeof window !== 'undefined') {
    const favorites = getFavorites();

    // 이미 즐겨찾기에 있는지 확인
    if (favorites.some(f => f.jobPosting.id === jobPosting.id)) {
      return;
    }

    const newFavorite: FavoriteJob = {
      jobPosting,
      matchScore,
      matchReasons,
      savedAt: new Date().toISOString(),
    };

    favorites.push(newFavorite);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

// 즐겨찾기 삭제
export function removeFavorite(jobId: string): void {
  if (typeof window !== 'undefined') {
    const favorites = getFavorites().filter(f => f.jobPosting.id !== jobId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }
}

// 즐겨찾기 목록 조회
export function getFavorites(): FavoriteJob[] {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  }
  return [];
}

// 즐겨찾기 여부 확인
export function isFavorite(jobId: string): boolean {
  if (typeof window !== 'undefined') {
    const favorites = getFavorites();
    return favorites.some(f => f.jobPosting.id === jobId);
  }
  return false;
}

// 즐겨찾기 토글 (추가/삭제)
export function toggleFavorite(
  jobPosting: JobPosting,
  matchScore?: number,
  matchReasons?: string[]
): boolean {
  if (isFavorite(jobPosting.id)) {
    removeFavorite(jobPosting.id);
    return false; // 제거됨
  } else {
    saveFavorite(jobPosting, matchScore, matchReasons);
    return true; // 추가됨
  }
}
