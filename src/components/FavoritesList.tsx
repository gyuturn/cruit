'use client';

import { FavoriteJob } from '@/types';
import { Building2, MapPin, Calendar, ExternalLink, Heart, Trash2 } from 'lucide-react';
import { removeFavorite } from '@/lib/storage';

interface FavoritesListProps {
  favorites: FavoriteJob[];
  onFavoriteRemove: (jobId: string) => void;
}

export default function FavoritesList({ favorites, onFavoriteRemove }: FavoritesListProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleRemove = (jobId: string) => {
    removeFavorite(jobId);
    onFavoriteRemove(jobId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500 text-lg mb-2">즐겨찾기한 공고가 없습니다</p>
        <p className="text-gray-400 text-sm">관심 있는 공고의 하트 버튼을 눌러 저장하세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {favorites.map((favorite) => {
        const { jobPosting, matchScore, matchReasons, savedAt } = favorite;

        return (
          <div
            key={jobPosting.id}
            className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
          >
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
                {matchScore && (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(matchScore)}`}
                  >
                    매칭 {matchScore}%
                  </span>
                )}
                <button
                  onClick={() => handleRemove(jobPosting.id)}
                  className="p-1.5 rounded-full hover:bg-red-50 transition-colors group"
                  title="즐겨찾기 해제"
                >
                  <Trash2
                    size={18}
                    className="text-gray-400 group-hover:text-red-500"
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

            {matchReasons && matchReasons.length > 0 && (
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

            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-400">
                저장일: {formatDate(savedAt)}
              </span>
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
      })}
    </div>
  );
}
