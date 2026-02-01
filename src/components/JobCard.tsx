'use client';

import { useState } from 'react';
import { Recommendation } from '@/types';
import { Building2, MapPin, Calendar, ExternalLink, Star, Heart } from 'lucide-react';
import { saveRating, getRating, isFavorite, toggleFavorite } from '@/lib/storage';

interface JobCardProps {
  recommendation: Recommendation;
  onRatingChange?: (jobId: string, rating: number) => void;
  onFavoriteChange?: (jobId: string, isFavorite: boolean) => void;
}

export default function JobCard({ recommendation, onRatingChange, onFavoriteChange }: JobCardProps) {
  const { jobPosting, matchScore, matchReasons } = recommendation;
  const [rating, setRating] = useState<number>(() => getRating(jobPosting.id) || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isFav, setIsFav] = useState<boolean>(() => isFavorite(jobPosting.id));

  const handleFavoriteToggle = () => {
    const newState = toggleFavorite(jobPosting, matchScore, matchReasons);
    setIsFav(newState);
    onFavoriteChange?.(jobPosting.id, newState);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleRating = (value: number) => {
    setRating(value);
    saveRating(jobPosting.id, value);
    onRatingChange?.(jobPosting.id, value);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            {jobPosting.title}
          </h3>
          <div className="flex items-center gap-2 text-gray-600">
            <Building2 size={16} />
            <span>{jobPosting.company}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(matchScore)}`}
          >
            매칭 {matchScore}%
          </span>
          <button
            onClick={handleFavoriteToggle}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          >
            <Heart
              size={20}
              className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-400'}
            />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          <span>{jobPosting.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
            {jobPosting.experienceLevel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={14} />
          <span>~{jobPosting.deadline}</span>
        </div>
        {/* 출처 표시 */}
        <div className="flex items-center gap-1">
          <span className={`px-2 py-0.5 rounded text-xs ${
            jobPosting.source === 'saramin'
              ? 'bg-blue-100 text-blue-700'
              : jobPosting.source === 'jobkorea'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {jobPosting.source === 'saramin' ? '사람인' :
             jobPosting.source === 'jobkorea' ? '잡코리아' :
             jobPosting.source}
          </span>
        </div>
      </div>

      {jobPosting.summary && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {jobPosting.summary}
        </p>
      )}

      {matchReasons.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {matchReasons.map((reason, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* 평점 및 링크 */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        {/* 별점 평가 */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">추천 평가:</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
                title={`${value}점`}
              >
                <Star
                  size={18}
                  className={
                    value <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-xs text-gray-500">({rating}점)</span>
          )}
        </div>

        {/* 공고 링크 */}
        <a
          href={jobPosting.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          공고 보기
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
