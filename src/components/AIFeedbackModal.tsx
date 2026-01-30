'use client';

import { useState } from 'react';
import { X, Brain, Sparkles } from 'lucide-react';
import { AIFeedbackData } from '@/types';

// 빠른 선택 태그 정의
const QUICK_TAGS = {
  workStyle: {
    label: '근무형태',
    tags: ['재택근무', '유연근무', '주4일', '출퇴근'],
  },
  compensation: {
    label: '보상',
    tags: ['높은연봉', '스톡옵션', '성과급', '연봉협상가능'],
  },
  benefits: {
    label: '복지',
    tags: ['좋은복지', '식대지원', '자기개발비', '건강검진'],
  },
  environment: {
    label: '환경',
    tags: ['워라밸', '야근없음', '자유로운분위기', '수평적문화'],
  },
  growth: {
    label: '성장',
    tags: ['성장가능성', '교육지원', '커리어개발', '해외진출'],
  },
  tech: {
    label: '기술',
    tags: ['최신기술', '관심기술', '기술공유문화', '코드리뷰'],
  },
  company: {
    label: '회사',
    tags: ['대기업', '스타트업', '외국계', '안정적'],
  },
  location: {
    label: '위치',
    tags: ['가까운거리', '교통편리', '서울', '판교/분당'],
  },
};

interface AIFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: AIFeedbackData) => void;
  ratingsCount: number;
}

export default function AIFeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  ratingsCount,
}: AIFeedbackModalProps) {
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [preferenceInput, setPreferenceInput] = useState('');
  const [avoidInput, setAvoidInput] = useState('');

  if (!isOpen) return null;

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    const feedback: AIFeedbackData = {
      generalFeedback: generalFeedback.trim(),
      selectedTags,
      preferenceKeywords: preferenceInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0),
      avoidKeywords: avoidInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0),
    };
    onSubmit(feedback);
  };

  const handleSkip = () => {
    // 피드백 없이 진행
    onSubmit({
      generalFeedback: '',
      selectedTags: [],
      preferenceKeywords: [],
      avoidKeywords: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain size={24} />
              <h2 className="text-lg font-semibold">AI 학습을 위한 피드백</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-white/80 mt-1">
            {ratingsCount}개의 별점에 대한 의견을 알려주세요
          </p>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 종합 의견 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Sparkles size={16} className="inline mr-1 text-purple-500" />
              어떤 공고를 원하시나요?
            </label>
            <textarea
              value={generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              placeholder="예: 재택근무가 가능하고, React를 사용하는 회사를 찾고 있어요. 워라밸이 좋으면 좋겠어요."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-900"
              rows={3}
            />
          </div>

          {/* 빠른 선택 태그 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              빠른 선택 (선호하는 조건)
            </label>
            <div className="space-y-3">
              {Object.entries(QUICK_TAGS).map(([key, { label, tags }]) => (
                <div key={key}>
                  <span className="text-xs text-gray-500 mb-1 block">{label}</span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선호/비선호 키워드 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-green-600">+</span> 선호 키워드
              </label>
              <input
                type="text"
                value={preferenceInput}
                onChange={(e) => setPreferenceInput(e.target.value)}
                placeholder="예: React, 복지"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">쉼표로 구분</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <span className="text-red-600">-</span> 비선호 키워드
              </label>
              <input
                type="text"
                value={avoidInput}
                onChange={(e) => setAvoidInput(e.target.value)}
                placeholder="예: 야근, 출장"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900"
              />
              <p className="text-xs text-gray-500 mt-1">쉼표로 구분</p>
            </div>
          </div>

          {/* 선택된 태그 요약 */}
          {selectedTags.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-sm text-purple-700">
                <span className="font-medium">선택된 조건:</span>{' '}
                {selectedTags.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t flex justify-between">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          >
            건너뛰기
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 flex items-center gap-2"
            >
              <Brain size={18} />
              AI 학습 시작
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
