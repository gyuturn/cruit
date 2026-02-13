'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { UserProfile, Recommendation, FavoriteJob, RatingWithJobInfo, AIFeedbackData } from '@/types';
import { getProfile, deleteProfile, getFavorites, getRatings, getRecommendations as getCachedRecommendations, saveRecommendations } from '@/lib/storage';
import ProfileForm from '@/components/ProfileForm';
import ProfileCard from '@/components/ProfileCard';
import JobList from '@/components/JobList';
import TabNavigation from '@/components/TabNavigation';
import FavoritesList from '@/components/FavoritesList';
import AIFeedbackModal from '@/components/AIFeedbackModal';
import AuthButton from '@/components/AuthButton';
import { RotateCcw } from 'lucide-react';

const PAGE_SIZE = 5;

export default function Home() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [favorites, setFavorites] = useState<FavoriteJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILearning, setIsAILearning] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'favorites'>('recommendations');
  const [aiLearningMessage, setAiLearningMessage] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [pendingRatingsWithJobInfo, setPendingRatingsWithJobInfo] = useState<RatingWithJobInfo[]>([]);

  // 프로필 및 즐겨찾기 로드
  useEffect(() => {
    const savedProfile = getProfile();
    if (savedProfile) {
      setProfile(savedProfile);
    }
    setFavorites(getFavorites());
    setIsInitialized(true);
  }, []);

  // 추천 공고 가져오기
  const fetchRecommendations = useCallback(
    async (currentPage: number, refresh: boolean = false) => {
      if (!profile) return;

      setIsLoading(true);
      try {
        const response = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile,
            page: currentPage,
            limit: PAGE_SIZE,
            refresh,
          }),
        });

        const data = await response.json();

        if (currentPage === 1) {
          setRecommendations(data.recommendations);
          // AI 학습을 위해 추천 결과 캐시
          saveRecommendations(data.recommendations);
        } else {
          setRecommendations((prev) => {
            const newRecs = [...prev, ...data.recommendations];
            // 전체 목록 캐시 업데이트
            saveRecommendations(newRecs);
            return newRecs;
          });
        }

        setHasMore(data.pagination.hasMore);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [profile]
  );

  // 프로필 설정 후 추천 로드
  useEffect(() => {
    if (profile && isInitialized) {
      setPage(1);
      setRecommendations([]);
      fetchRecommendations(1);
    }
  }, [profile, isInitialized, fetchRecommendations]);

  // 프로필 저장 완료
  const handleProfileComplete = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  // 초기화
  const handleReset = () => {
    if (confirm('프로필을 초기화하시겠습니까? 저장된 정보가 삭제됩니다.')) {
      deleteProfile();
      setProfile(null);
      setRecommendations([]);
      setFavorites([]);
      setPage(1);
      setHasMore(true);
      setActiveTab('recommendations');
    }
  };

  // AI 학습 버튼 클릭 시 - 모달 표시
  const handleAILearnAndRecommend = () => {
    if (!profile) return;

    const ratings = getRatings();

    if (ratings.length === 0) {
      alert('아직 평가한 공고가 없습니다. 먼저 추천 공고에 별점을 남겨주세요.');
      return;
    }

    // 별점과 함께 공고 정보 매핑
    const cachedRecs = getCachedRecommendations() || [];
    const ratingsWithJobInfo: RatingWithJobInfo[] = ratings
      .map(r => {
        const rec = cachedRecs.find(rec => rec.jobPosting.id === r.jobId);
        if (!rec) return null;
        return {
          jobId: r.jobId,
          rating: r.rating,
          jobTitle: rec.jobPosting.title,
          company: rec.jobPosting.company,
          skills: rec.jobPosting.skills,
          experienceLevel: rec.jobPosting.experienceLevel,
        };
      })
      .filter((r): r is RatingWithJobInfo => r !== null);

    if (ratingsWithJobInfo.length === 0) {
      alert('평가 데이터를 처리할 수 없습니다. 새로고침 후 다시 시도해주세요.');
      return;
    }

    // 피드백 모달 표시
    setPendingRatingsWithJobInfo(ratingsWithJobInfo);
    setShowFeedbackModal(true);
  };

  // 피드백 모달에서 제출 시 - 실제 AI 학습 수행
  const handleFeedbackSubmit = async (feedback: AIFeedbackData) => {
    setShowFeedbackModal(false);
    setIsAILearning(true);
    setAiLearningMessage(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          page: 1,
          limit: PAGE_SIZE,
          refresh: true,
          ratings: pendingRatingsWithJobInfo,
          useAILearning: true,
          userFeedback: feedback,
        }),
      });

      const data = await response.json();

      setPage(1);
      setRecommendations(data.recommendations);
      setHasMore(data.pagination.hasMore);
      // AI 학습 결과도 캐시
      saveRecommendations(data.recommendations);

      // 메시지 생성
      const hasFeedback = feedback.generalFeedback ||
        feedback.selectedTags.length > 0 ||
        feedback.preferenceKeywords.length > 0;

      if (data.meta?.aiLearningApplied) {
        if (hasFeedback) {
          setAiLearningMessage(
            `피드백과 ${data.meta.ratingsUsed}개의 별점 데이터를 분석하여 맞춤 추천을 생성했습니다!`
          );
        } else {
          setAiLearningMessage(
            `${data.meta.ratingsUsed}개의 별점 데이터를 분석하여 추천을 개선했습니다!`
          );
        }
      }
    } catch (error) {
      console.error('AI learning failed:', error);
      alert('AI 학습 중 오류가 발생했습니다.');
    } finally {
      setIsAILearning(false);
      setPendingRatingsWithJobInfo([]);
    }
  };

  // 즐겨찾기 변경 핸들러
  const handleFavoriteChange = () => {
    setFavorites(getFavorites());
  };

  // 즐겨찾기 삭제 핸들러
  const handleFavoriteRemove = (_jobId: string) => {
    setFavorites(getFavorites());
  };

  // 더보기
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchRecommendations(nextPage);
  };

  // 로딩 중 (초기화 전)
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            취업 공고 추천
          </h1>
          <div className="flex items-center gap-4">
            {profile && session && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md"
              >
                <RotateCcw size={16} />
                초기화
              </button>
            )}
            <AuthButton />
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {status === "loading" ? (
          // 세션 로딩 중
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : !session ? (
          // 로그인하지 않은 상태 - 로그인 유도
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI 맞춤 취업 추천</h2>
              <p className="text-gray-600 mb-6">
                카카오 계정으로 로그인하고<br />
                나에게 딱 맞는 취업 공고를 추천받으세요
              </p>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => signIn('kakao')}
                className="w-full max-w-xs mx-auto flex items-center justify-center gap-3 px-6 py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-medium rounded-lg transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 4C7.02944 4 3 7.16393 3 11.0909C3 13.5907 4.55511 15.7907 6.94628 17.0698L5.73199 21.0513C5.64503 21.3413 5.97889 21.5744 6.23061 21.4042L10.9259 18.3052C11.2776 18.3415 11.6354 18.3636 12 18.3636C16.9706 18.3636 21 15.0179 21 11.0909C21 7.16393 16.9706 4 12 4Z" fill="#191919"/>
                </svg>
                카카오로 시작하기
              </button>
            </div>
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-sm font-medium text-gray-700 mb-3">주요 기능</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> 전공 기반 맞춤 추천
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> 공공기관 채용정보 연동
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">✓</span> AI 학습으로 추천 개선
                </div>
              </div>
            </div>
          </div>
        ) : !profile ? (
          // 로그인했지만 프로필 미등록 시 입력 폼
          <ProfileForm onComplete={handleProfileComplete} />
        ) : (
          // 프로필 등록 후 추천 목록
          <div className="space-y-6">
            <ProfileCard profile={profile} />

            {/* 탭 네비게이션 */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              favoritesCount={favorites.length}
            />

            {/* AI 학습 메시지 */}
            {aiLearningMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                {aiLearningMessage}
              </div>
            )}

            {/* 탭 콘텐츠 */}
            {activeTab === 'recommendations' ? (
              <JobList
                recommendations={recommendations}
                onAILearn={handleAILearnAndRecommend}
                onLoadMore={handleLoadMore}
                onFavoriteChange={handleFavoriteChange}
                isLoading={isLoading}
                isAILearning={isAILearning}
                hasMore={hasMore}
              />
            ) : (
              <FavoritesList
                favorites={favorites}
                onFavoriteRemove={handleFavoriteRemove}
              />
            )}
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          AI 기반 취업 공고 추천 시스템
        </div>
      </footer>

      {/* AI 피드백 모달 */}
      <AIFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
        ratingsCount={pendingRatingsWithJobInfo.length}
      />
    </div>
  );
}
