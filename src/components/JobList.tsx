'use client';

import { Recommendation } from '@/types';
import JobCard from './JobCard';
import { ChevronDown, Loader2, Brain } from 'lucide-react';

interface JobListProps {
  recommendations: Recommendation[];
  onAILearn?: () => void;
  onLoadMore: () => void;
  onFavoriteChange?: () => void;
  isLoading: boolean;
  isAILearning?: boolean;
  hasMore: boolean;
}

export default function JobList({
  recommendations,
  onAILearn,
  onLoadMore,
  onFavoriteChange,
  isLoading,
  isAILearning = false,
  hasMore,
}: JobListProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">추천 공고</h2>
        {/* AI 학습 후 재추천 버튼 */}
        {onAILearn && (
          <button
            onClick={onAILearn}
            disabled={isLoading || isAILearning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAILearning ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Brain size={16} />
            )}
            {isAILearning ? 'AI 학습 중...' : 'AI에게 학습후 재추천'}
          </button>
        )}
      </div>

      {(isLoading || isAILearning) && recommendations.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">
            {isAILearning ? 'AI가 별점 데이터를 학습하고 있습니다...' : '추천 공고를 분석중입니다...'}
          </span>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          추천할 공고가 없습니다. 잠시 후 다시 시도해주세요.
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <JobCard
                key={rec.jobPosting.id || idx}
                recommendation={rec}
                onFavoriteChange={onFavoriteChange ? (_jobId, _isFav) => onFavoriteChange() : undefined}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 text-center">
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ChevronDown size={16} />
                )}
                더보기
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
