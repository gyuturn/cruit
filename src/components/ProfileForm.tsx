'use client';

import { useState } from 'react';
import { Plus, X, Briefcase, GraduationCap } from 'lucide-react';
import { ProfileFormData, UserProfile, CareerHistory, UniversityRegion } from '@/types';

// 대학교 지역 목록
const UNIVERSITY_REGIONS: UniversityRegion[] = [
  '서울',
  '경기',
  '인천',
  '강원',
  '충북',
  '충남/대전',
  '전북',
  '전남/광주',
  '경북/대구',
  '경남/부산/울산',
  '제주',
];
import { saveProfile } from '@/lib/storage';

interface ProfileFormProps {
  onComplete: (profile: UserProfile) => void;
}

const emptyCareer: CareerHistory = {
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  description: '',
};

export default function ProfileForm({ onComplete }: ProfileFormProps) {
  const [formData, setFormData] = useState<ProfileFormData>({
    experienceLevel: 'junior',
    isFourYearUniv: true,
    universityRegion: undefined,
    universityName: '',
    major: '',
    certifications: [],
    careerHistory: [],
  });
  const [certInput, setCertInput] = useState('');
  const [showCareerForm, setShowCareerForm] = useState(false);
  const [currentCareer, setCurrentCareer] = useState<CareerHistory>(emptyCareer);
  const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);

  const handleAddCertification = () => {
    if (certInput.trim() && !formData.certifications.includes(certInput.trim())) {
      setFormData({
        ...formData,
        certifications: [...formData.certifications, certInput.trim()],
      });
      setCertInput('');
    }
  };

  const handleRemoveCertification = (cert: string) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((c) => c !== cert),
    });
  };

  const handleAddCareer = () => {
    if (!currentCareer.company.trim() || !currentCareer.position.trim() || !currentCareer.startDate) {
      alert('회사명, 직무, 시작일은 필수입니다.');
      return;
    }

    const newCareer: CareerHistory = {
      ...currentCareer,
      endDate: isCurrentlyWorking ? '재직중' : currentCareer.endDate,
    };

    setFormData({
      ...formData,
      careerHistory: [...(formData.careerHistory || []), newCareer],
    });

    setCurrentCareer(emptyCareer);
    setIsCurrentlyWorking(false);
    setShowCareerForm(false);
  };

  const handleRemoveCareer = (index: number) => {
    setFormData({
      ...formData,
      careerHistory: formData.careerHistory?.filter((_, i) => i !== index) || [],
    });
  };

  const handleExperienceLevelChange = (level: 'junior' | 'experienced') => {
    setFormData({
      ...formData,
      experienceLevel: level,
      careerHistory: level === 'junior' ? [] : formData.careerHistory,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.major.trim()) {
      alert('전공을 입력해주세요.');
      return;
    }

    const profile: UserProfile = {
      id: crypto.randomUUID(),
      ...formData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProfile(profile);
    onComplete(profile);
  };

  // 경력 기간 계산
  const calculateDuration = (start: string, end: string): string => {
    if (!start) return '';
    const startDate = new Date(start + '-01');
    const endDate = end === '재직중' ? new Date() : new Date(end + '-01');
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years}년 ${remainingMonths}개월`;
    } else if (years > 0) {
      return `${years}년`;
    } else {
      return `${remainingMonths}개월`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800">프로필 등록</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 경력 구분 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            경력 구분
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="experienceLevel"
                value="junior"
                checked={formData.experienceLevel === 'junior'}
                onChange={() => handleExperienceLevelChange('junior')}
                className="mr-2"
              />
              <span className="text-gray-700">신입</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="experienceLevel"
                value="experienced"
                checked={formData.experienceLevel === 'experienced'}
                onChange={() => handleExperienceLevelChange('experienced')}
                className="mr-2"
              />
              <span className="text-gray-700">경력</span>
            </label>
          </div>
        </div>

        {/* 경력사항 (경력 선택 시에만 표시) */}
        {formData.experienceLevel === 'experienced' && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Briefcase size={16} />
                경력사항 (선택)
              </label>
              {!showCareerForm && (
                <button
                  type="button"
                  onClick={() => setShowCareerForm(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + 경력 추가
                </button>
              )}
            </div>

            {/* 등록된 경력 목록 */}
            {formData.careerHistory && formData.careerHistory.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.careerHistory.map((career, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start bg-white p-3 rounded border border-gray-200"
                  >
                    <div>
                      <div className="font-medium text-gray-800">{career.company}</div>
                      <div className="text-sm text-gray-600">{career.position}</div>
                      <div className="text-xs text-gray-500">
                        {career.startDate} ~ {career.endDate}
                        <span className="ml-2 text-blue-600">
                          ({calculateDuration(career.startDate, career.endDate)})
                        </span>
                      </div>
                      {career.description && (
                        <div className="text-xs text-gray-500 mt-1">{career.description}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCareer(index)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 경력 추가 폼 */}
            {showCareerForm && (
              <div className="bg-white p-3 rounded border border-gray-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">회사명 *</label>
                    <input
                      type="text"
                      value={currentCareer.company}
                      onChange={(e) => setCurrentCareer({ ...currentCareer, company: e.target.value })}
                      placeholder="회사명"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">직무/직책 *</label>
                    <input
                      type="text"
                      value={currentCareer.position}
                      onChange={(e) => setCurrentCareer({ ...currentCareer, position: e.target.value })}
                      placeholder="예: 백엔드 개발자"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">시작일 *</label>
                    <input
                      type="month"
                      value={currentCareer.startDate}
                      onChange={(e) => setCurrentCareer({ ...currentCareer, startDate: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">종료일</label>
                    <input
                      type="month"
                      value={isCurrentlyWorking ? '' : currentCareer.endDate}
                      onChange={(e) => setCurrentCareer({ ...currentCareer, endDate: e.target.value })}
                      disabled={isCurrentlyWorking}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 text-gray-900"
                    />
                    <label className="flex items-center mt-1">
                      <input
                        type="checkbox"
                        checked={isCurrentlyWorking}
                        onChange={(e) => setIsCurrentlyWorking(e.target.checked)}
                        className="mr-1"
                      />
                      <span className="text-xs text-gray-600">재직중</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">업무 내용 (선택)</label>
                  <input
                    type="text"
                    value={currentCareer.description || ''}
                    onChange={(e) => setCurrentCareer({ ...currentCareer, description: e.target.value })}
                    placeholder="주요 업무 내용"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddCareer}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    추가
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCareerForm(false);
                      setCurrentCareer(emptyCareer);
                      setIsCurrentlyWorking(false);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 학력 */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
            <GraduationCap size={16} />
            학력
          </label>

          {/* 4년제 여부 */}
          <div className="flex gap-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="isFourYearUniv"
                checked={formData.isFourYearUniv}
                onChange={() => setFormData({ ...formData, isFourYearUniv: true })}
                className="mr-2"
              />
              <span className="text-gray-700">4년제 대학교</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="isFourYearUniv"
                checked={!formData.isFourYearUniv}
                onChange={() => setFormData({
                  ...formData,
                  isFourYearUniv: false,
                  universityRegion: undefined,
                  universityName: '',
                })}
                className="mr-2"
              />
              <span className="text-gray-700">기타</span>
            </label>
          </div>

          {/* 대학교 정보 (4년제 선택 시) */}
          {formData.isFourYearUniv && (
            <div className="space-y-3 bg-white p-3 rounded border border-gray-200">
              {/* 대학교 지역 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">대학교 지역</label>
                <select
                  value={formData.universityRegion || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    universityRegion: e.target.value as UniversityRegion || undefined,
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">지역 선택</option>
                  {UNIVERSITY_REGIONS.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {/* 대학교명 */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">대학교명</label>
                <input
                  type="text"
                  value={formData.universityName || ''}
                  onChange={(e) => setFormData({ ...formData, universityName: e.target.value })}
                  placeholder="예: 서울대학교"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* 전공 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            전공
          </label>
          <input
            type="text"
            value={formData.major}
            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
            placeholder="예: 컴퓨터공학"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        {/* 자격증 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            자격증
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
              placeholder="자격증명 입력"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <button
              type="button"
              onClick={handleAddCertification}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <Plus size={20} />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.certifications.map((cert) => (
              <span
                key={cert}
                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {cert}
                <button
                  type="button"
                  onClick={() => handleRemoveCertification(cert)}
                  className="hover:text-blue-600"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 저장 버튼 */}
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          저장하기
        </button>
      </form>
    </div>
  );
}
