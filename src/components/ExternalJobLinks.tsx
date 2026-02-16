'use client';

import { useState } from 'react';
import { ExternalLink, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface ExternalJobSite {
  name: string;
  buildSearchUrl: (keyword: string) => string;
  color: string;
  bgColor: string;
}

const JOB_SITES: ExternalJobSite[] = [
  {
    name: '사람인',
    buildSearchUrl: (keyword: string) =>
      `https://www.saramin.co.kr/zf_user/search/recruit?searchType=search&searchword=${encodeURIComponent(keyword)}`,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    name: '잡코리아',
    buildSearchUrl: (keyword: string) =>
      `https://www.jobkorea.co.kr/recruit/joblist?menucode=local&searchword=${encodeURIComponent(keyword)}`,
    color: 'text-green-700',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  {
    name: '원티드',
    buildSearchUrl: (keyword: string) =>
      `https://www.wanted.co.kr/search?query=${encodeURIComponent(keyword)}&tab=position`,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
  },
  {
    name: '점핏',
    buildSearchUrl: (keyword: string) =>
      `https://www.jumpit.co.kr/positions?search=${encodeURIComponent(keyword)}`,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
  },
  {
    name: '인크루트',
    buildSearchUrl: (keyword: string) =>
      `https://search.incruit.com/list/search.asp?col=job&kw=${encodeURIComponent(keyword)}`,
    color: 'text-rose-700',
    bgColor: 'bg-rose-50 hover:bg-rose-100 border-rose-200',
  },
];

interface ExternalJobLinksProps {
  keywords: string[];
}

export default function ExternalJobLinks({ keywords }: ExternalJobLinksProps) {
  const [customKeyword, setCustomKeyword] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const activeKeywords = customKeyword.trim()
    ? [customKeyword.trim()]
    : keywords.length > 0
    ? keywords
    : ['채용'];

  const primaryKeyword = activeKeywords[0];

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex justify-between items-center mb-3"
      >
        <h2 className="text-lg font-bold text-gray-800">
          채용사이트에서 더 찾아보기
        </h2>
        {isExpanded ? (
          <ChevronUp size={20} className="text-gray-500" />
        ) : (
          <ChevronDown size={20} className="text-gray-500" />
        )}
      </button>

      {isExpanded && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            각 채용사이트의 검색 결과 페이지로 이동합니다. (새 탭에서 열림)
          </p>

          {/* 키워드 직접 입력 */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={customKeyword}
                onChange={(e) => setCustomKeyword(e.target.value)}
                placeholder={`검색 키워드 (기본: ${keywords[0] || '채용'})`}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 현재 검색 키워드 표시 */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs text-gray-500">검색 키워드:</span>
            {activeKeywords.map((kw, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs"
              >
                {kw}
              </span>
            ))}
          </div>

          {/* 채용사이트 링크 그리드 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {JOB_SITES.map((site) => (
              <a
                key={site.name}
                href={site.buildSearchUrl(primaryKeyword)}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${site.bgColor}`}
              >
                <span className={`font-medium text-sm ${site.color}`}>
                  {site.name}
                </span>
                <ExternalLink size={14} className={site.color} />
              </a>
            ))}
          </div>

          {/* 추가 키워드로 검색 */}
          {activeKeywords.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">다른 키워드로도 검색:</p>
              <div className="flex flex-wrap gap-2">
                {activeKeywords.slice(1).map((kw, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomKeyword(kw)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
