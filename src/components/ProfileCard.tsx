'use client';

import { UserProfile } from '@/types';
import { User, GraduationCap, BookOpen, Award, Briefcase } from 'lucide-react';

interface ProfileCardProps {
  profile: UserProfile;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  // 총 경력 기간 계산
  const calculateTotalExperience = (): string => {
    if (!profile.careerHistory || profile.careerHistory.length === 0) {
      return '';
    }

    let totalMonths = 0;
    profile.careerHistory.forEach((career) => {
      const startDate = new Date(career.startDate + '-01');
      const endDate = career.endDate === '재직중' ? new Date() : new Date(career.endDate + '-01');
      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
      totalMonths += months;
    });

    const years = Math.floor(totalMonths / 12);
    const remainingMonths = totalMonths % 12;

    if (years > 0 && remainingMonths > 0) {
      return `${years}년 ${remainingMonths}개월`;
    } else if (years > 0) {
      return `${years}년`;
    } else {
      return `${remainingMonths}개월`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <User size={20} />
        내 프로필
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">경력:</span>
          <span className="font-medium text-gray-800">
            {profile.experienceLevel === 'junior' ? '신입' : '경력'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-gray-500" />
          <span className="font-medium text-gray-800">
            {profile.isFourYearUniv ? '4년제' : '기타'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-gray-500" />
          <span className="font-medium text-gray-800">{profile.major}</span>
        </div>

        <div className="flex items-center gap-2 col-span-2 md:col-span-1">
          <Award size={16} className="text-gray-500" />
          <span className="font-medium text-gray-800">
            {profile.certifications.length > 0
              ? profile.certifications.join(', ')
              : '없음'}
          </span>
        </div>
      </div>

      {/* 대학교 정보 (4년제인 경우) */}
      {profile.isFourYearUniv && (profile.universityName || profile.universityRegion) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm">
            <GraduationCap size={16} className="text-gray-500" />
            <span className="text-gray-500">대학교:</span>
            <span className="font-medium text-gray-800">
              {profile.universityName || ''}
              {profile.universityRegion && (
                <span className="ml-1 text-gray-500">({profile.universityRegion})</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* 경력사항 표시 (경력자만) */}
      {profile.experienceLevel === 'experienced' &&
        profile.careerHistory &&
        profile.careerHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                경력사항
              </span>
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                총 {calculateTotalExperience()}
              </span>
            </div>
            <div className="space-y-2">
              {profile.careerHistory.map((career, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 pl-6 border-l-2 border-gray-200"
                >
                  <div className="font-medium text-gray-800">{career.company}</div>
                  <div className="text-gray-600">{career.position}</div>
                  <div className="text-xs text-gray-500">
                    {career.startDate} ~ {career.endDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}
