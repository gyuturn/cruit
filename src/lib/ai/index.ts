import { UserProfile, JobPosting, Recommendation, CareerHistory, RatingWithJobInfo, AIFeedbackData } from '@/types';
import OpenAI from 'openai';

// OpenAI 클라이언트 (환경변수 설정 필요)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// 총 경력 기간 계산 (개월 수)
function calculateTotalCareerMonths(careerHistory?: CareerHistory[]): number {
  if (!careerHistory || careerHistory.length === 0) return 0;

  let totalMonths = 0;
  careerHistory.forEach((career) => {
    const startDate = new Date(career.startDate + '-01');
    const endDate = career.endDate === '재직중' ? new Date() : new Date(career.endDate + '-01');
    const months =
      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
      (endDate.getMonth() - startDate.getMonth());
    totalMonths += Math.max(0, months);
  });

  return totalMonths;
}

// 경력 기간 문자열 생성
function formatCareerDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years > 0 && remainingMonths > 0) {
    return `${years}년 ${remainingMonths}개월`;
  } else if (years > 0) {
    return `${years}년`;
  } else {
    return `${remainingMonths}개월`;
  }
}

// 경력사항 요약 생성
function summarizeCareerHistory(careerHistory?: CareerHistory[]): string {
  if (!careerHistory || careerHistory.length === 0) return '없음';

  return careerHistory
    .map((career) => {
      const duration = career.endDate === '재직중' ? '재직중' : career.endDate;
      return `${career.company}(${career.position}, ${career.startDate}~${duration})`;
    })
    .join(', ');
}

// 기본 매칭 점수 계산 (규칙 기반)
function calculateMatchScore(profile: UserProfile, job: JobPosting): number {
  let score = 50; // 기본 점수

  // 경력 조건 매칭
  const isJuniorJob = job.experienceLevel.includes('신입') || job.experienceLevel.includes('무관');
  const isExperiencedJob = job.experienceLevel.includes('경력');
  const totalCareerMonths = calculateTotalCareerMonths(profile.careerHistory);
  const totalCareerYears = totalCareerMonths / 12;

  if (profile.experienceLevel === 'junior' && isJuniorJob) {
    score += 20;
  } else if (profile.experienceLevel === 'experienced' && isExperiencedJob) {
    score += 15;

    // 경력 연차 매칭 (경력 N년 이상 조건)
    const yearMatch = job.experienceLevel.match(/(\d+)년/);
    if (yearMatch) {
      const requiredYears = parseInt(yearMatch[1]);
      if (totalCareerYears >= requiredYears) {
        score += 10; // 경력 연차 충족
      } else if (totalCareerYears >= requiredYears * 0.7) {
        score += 5; // 경력 연차 근접
      }
    } else {
      score += 5; // 연차 조건 명시 없음
    }
  } else if (job.experienceLevel.includes('신입/경력')) {
    score += 15;
  }

  // 학력 조건 매칭
  const requires4Year = job.education.includes('4년') || job.education.includes('대졸');
  const educationFlexible = job.education.includes('무관') || job.education.includes('2~3년');

  if (profile.isFourYearUniv && requires4Year) {
    score += 10;
  } else if (educationFlexible) {
    score += 10;
  }

  // 자격증 매칭
  const matchedCerts = profile.certifications.filter(cert =>
    job.skills.some(skill =>
      skill.toLowerCase().includes(cert.toLowerCase()) ||
      cert.toLowerCase().includes(skill.toLowerCase())
    )
  );

  score += matchedCerts.length * 10;

  // 전공 관련도 (간단한 키워드 매칭)
  const majorKeywords = profile.major.toLowerCase();
  const techRelated = ['컴퓨터', '소프트웨어', '정보', 'it', '전산', '데이터'];
  const isTechMajor = techRelated.some(keyword => majorKeywords.includes(keyword));

  if (isTechMajor) {
    score += 10;
  }

  // 경력 직무 관련도 (경력자만)
  if (profile.careerHistory && profile.careerHistory.length > 0) {
    const careerKeywords = profile.careerHistory
      .map(c => `${c.position} ${c.description || ''}`.toLowerCase())
      .join(' ');

    const jobKeywords = `${job.title} ${job.summary || ''}`.toLowerCase();

    // 직무 키워드 매칭
    const relevantKeywords = ['개발', '엔지니어', '프론트', '백엔드', '풀스택', '데이터', 'ai', 'ml'];
    const matchedKeywords = relevantKeywords.filter(
      kw => careerKeywords.includes(kw) && jobKeywords.includes(kw)
    );

    score += matchedKeywords.length * 5;
  }

  return Math.min(100, Math.max(0, score));
}

// 매칭 이유 생성
function generateMatchReasons(profile: UserProfile, job: JobPosting): string[] {
  const reasons: string[] = [];

  // 경력 매칭
  const isJuniorJob = job.experienceLevel.includes('신입') || job.experienceLevel.includes('무관');
  const totalCareerMonths = calculateTotalCareerMonths(profile.careerHistory);

  if (profile.experienceLevel === 'junior' && isJuniorJob) {
    reasons.push('신입 지원 가능');
  } else if (profile.experienceLevel === 'experienced' && totalCareerMonths > 0) {
    reasons.push(`경력 ${formatCareerDuration(totalCareerMonths)}`);
  }

  // 학력 매칭
  if (profile.isFourYearUniv && (job.education.includes('4년') || job.education.includes('대졸'))) {
    reasons.push('학력 조건 충족');
  }

  // 대학교 정보
  if (profile.universityName) {
    reasons.push(profile.universityName);
  }

  // 자격증 매칭
  const matchedCerts = profile.certifications.filter(cert =>
    job.skills.some(skill =>
      skill.toLowerCase().includes(cert.toLowerCase()) ||
      cert.toLowerCase().includes(skill.toLowerCase())
    )
  );

  if (matchedCerts.length > 0) {
    reasons.push(`자격증 일치: ${matchedCerts.join(', ')}`);
  }

  // 경력 직무 관련도
  if (profile.careerHistory && profile.careerHistory.length > 0) {
    const relevantCompanies = profile.careerHistory
      .filter(c => {
        const positionLower = c.position.toLowerCase();
        const jobTitleLower = job.title.toLowerCase();
        return positionLower.split(' ').some(word => jobTitleLower.includes(word));
      })
      .map(c => c.company);

    if (relevantCompanies.length > 0) {
      reasons.push(`관련 경력: ${relevantCompanies[0]}`);
    }
  }

  return reasons;
}

// 별점 피드백 컨텍스트 생성 (사용자 피드백 포함)
function buildRatingContext(
  ratings: RatingWithJobInfo[],
  userFeedback?: AIFeedbackData
): string {
  const hasRatings = ratings && ratings.length > 0;
  const hasFeedback = userFeedback && (
    userFeedback.generalFeedback ||
    userFeedback.selectedTags.length > 0 ||
    userFeedback.preferenceKeywords.length > 0 ||
    userFeedback.avoidKeywords.length > 0
  );

  if (!hasRatings && !hasFeedback) {
    return '';
  }

  let context = '\n## 사용자 피드백 분석\n';

  // 사용자가 직접 입력한 피드백 (최우선)
  if (hasFeedback) {
    context += '### 사용자가 직접 전달한 선호도 (매우 중요)\n';

    if (userFeedback.generalFeedback) {
      context += `**종합 의견**: "${userFeedback.generalFeedback}"\n\n`;
    }

    if (userFeedback.selectedTags.length > 0) {
      context += `**선호하는 조건**: ${userFeedback.selectedTags.join(', ')}\n`;
    }

    if (userFeedback.preferenceKeywords.length > 0) {
      context += `**선호 키워드**: ${userFeedback.preferenceKeywords.join(', ')}\n`;
    }

    if (userFeedback.avoidKeywords.length > 0) {
      context += `**비선호/피하고 싶은 키워드**: ${userFeedback.avoidKeywords.join(', ')}\n`;
    }

    context += '\n';
  }

  // 별점 데이터
  if (hasRatings) {
    const highRated = ratings.filter(r => r.rating >= 4);
    const lowRated = ratings.filter(r => r.rating <= 2);
    const midRated = ratings.filter(r => r.rating === 3);

    context += '### 이전 추천에 대한 별점\n';

    if (highRated.length > 0) {
      context += '**선호하는 공고 (4-5점)**\n';
      context += highRated.map(r =>
        `- ${r.company} - ${r.jobTitle} (${r.rating}점) [기술: ${r.skills.slice(0, 3).join(', ')}]`
      ).join('\n');
      context += '\n\n';
    }

    if (lowRated.length > 0) {
      context += '**비선호 공고 (1-2점)**\n';
      context += lowRated.map(r =>
        `- ${r.company} - ${r.jobTitle} (${r.rating}점) [기술: ${r.skills.slice(0, 3).join(', ')}]`
      ).join('\n');
      context += '\n\n';
    }

    if (midRated.length > 0) {
      context += '**보통 공고 (3점)**\n';
      context += midRated.map(r =>
        `- ${r.company} - ${r.jobTitle}`
      ).join('\n');
      context += '\n\n';
    }
  }

  // 최종 지시사항
  context += '### 추천 시 반드시 반영할 사항\n';

  if (hasFeedback) {
    context += '1. **사용자가 직접 입력한 의견을 최우선으로 반영**하세요.\n';
    if (userFeedback.selectedTags.length > 0) {
      context += `2. 선호 조건(${userFeedback.selectedTags.slice(0, 5).join(', ')})에 해당하는 공고에 높은 점수를 부여하세요.\n`;
    }
    if (userFeedback.avoidKeywords.length > 0) {
      context += `3. 비선호 키워드(${userFeedback.avoidKeywords.join(', ')})가 포함된 공고에는 낮은 점수를 부여하세요.\n`;
    }
  }

  if (hasRatings) {
    context += `${hasFeedback ? '4' : '1'}. 높은 별점을 준 공고와 유사한 특성의 공고를 우선 추천하세요.\n`;
    context += `${hasFeedback ? '5' : '2'}. 낮은 별점을 준 공고와 유사한 특성의 공고는 피하세요.\n`;
  }

  context += '\n';

  return context;
}

// AI 기반 추천 (OpenAI 사용)
async function getAIRecommendations(
  profile: UserProfile,
  jobs: JobPosting[],
  ratings?: RatingWithJobInfo[],
  userFeedback?: AIFeedbackData
): Promise<Recommendation[]> {
  if (!openai) {
    return getRuleBasedRecommendations(profile, jobs);
  }

  try {
    // 경력 정보 구성
    const totalCareerMonths = calculateTotalCareerMonths(profile.careerHistory);
    const careerSummary = summarizeCareerHistory(profile.careerHistory);

    // 대학교 정보 구성
    const universityInfo = profile.isFourYearUniv
      ? `${profile.universityName || ''}${profile.universityRegion ? ` (${profile.universityRegion})` : ''} - 4년제`.trim()
      : '기타';

    // 별점 피드백 컨텍스트 (사용자 피드백 포함)
    const ratingContext = buildRatingContext(ratings || [], userFeedback);
    const hasRatings = ratings && ratings.length > 0;
    const hasFeedback = userFeedback && (
      userFeedback.generalFeedback ||
      userFeedback.selectedTags.length > 0 ||
      userFeedback.preferenceKeywords.length > 0 ||
      userFeedback.avoidKeywords.length > 0
    );

    const hasFeedbackOrRatings = hasRatings || hasFeedback;

    const prompt = `
당신은 취업 매칭 전문가입니다. 아래 사용자 프로필${hasFeedbackOrRatings ? '과 사용자가 전달한 피드백' : ''}을 분석하여 가장 적합한 채용 공고를 추천해주세요.

## 사용자 프로필
- 경력 구분: ${profile.experienceLevel === 'junior' ? '신입' : '경력'}
- 총 경력 기간: ${totalCareerMonths > 0 ? formatCareerDuration(totalCareerMonths) : '없음'}
- 경력 사항: ${careerSummary}
- 학력: ${universityInfo}
- 전공: ${profile.major}
- 자격증: ${profile.certifications.join(', ') || '없음'}
${ratingContext}
## 채용 공고 목록
${jobs.slice(0, 20).map(job => `- ID: ${job.id}
  제목: ${job.title}
  회사: ${job.company}
  위치: ${job.location}
  경력조건: ${job.experienceLevel}
  학력조건: ${job.education}
  요구기술: ${job.skills.join(', ') || '없음'}
  요약: ${job.summary || '없음'}`).join('\n\n')}

## 요청사항
위 사용자에게 가장 적합한 공고를 매칭도 높은 순서대로 정렬하여 JSON 배열로 응답해주세요.
${hasFeedback ? '**중요**: 사용자가 직접 입력한 선호도와 의견을 반드시 최우선으로 반영하세요.' : ''}
${hasRatings ? '사용자의 이전 피드백(별점)도 참고하여 선호도를 반영하세요.' : ''}
각 공고에 대해:
1. 매칭 점수 (0-100): 경력, 학력, 자격증, 직무 연관성${hasFeedbackOrRatings ? ', 사용자 선호도' : ''}를 종합 평가
2. 매칭 이유: 구체적인 이유 2-3개${hasFeedback ? ' (사용자 선호도 반영 시 반드시 명시)' : ''}

## 응답 형식 (JSON만 출력)
[{"id": "공고ID", "score": 85, "reasons": ["이유1", "이유2"]}, ...]
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '[]';

    // JSON 파싱 시도
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const rankings: Array<{ id: string; score: number; reasons: string[] }> =
        JSON.parse(jsonMatch[0]);

      const aiResults = rankings
        .map(ranking => {
          const job = jobs.find(j => j.id === ranking.id);
          if (!job) return null;

          return {
            jobPosting: job,
            matchScore: ranking.score,
            matchReasons: ranking.reasons,
          };
        })
        .filter((r): r is Recommendation => r !== null);

      // AI 결과가 부족하면 규칙 기반으로 보충
      if (aiResults.length < jobs.length) {
        const aiJobIds = new Set(aiResults.map(r => r.jobPosting.id));
        const remainingJobs = jobs.filter(j => !aiJobIds.has(j.id));
        const ruleBasedRemaining = remainingJobs
          .map(job => ({
            jobPosting: job,
            matchScore: calculateMatchScore(profile, job),
            matchReasons: generateMatchReasons(profile, job),
          }))
          .sort((a, b) => b.matchScore - a.matchScore);

        return [...aiResults, ...ruleBasedRemaining];
      }

      return aiResults;
    }
  } catch (error) {
    console.error('AI recommendation failed:', error);
  }

  // AI 실패 시 규칙 기반 추천
  return getRuleBasedRecommendations(profile, jobs);
}

// 규칙 기반 추천
function getRuleBasedRecommendations(
  profile: UserProfile,
  jobs: JobPosting[]
): Recommendation[] {
  return jobs
    .map(job => ({
      jobPosting: job,
      matchScore: calculateMatchScore(profile, job),
      matchReasons: generateMatchReasons(profile, job),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

// 메인 추천 함수
export async function getRecommendations(
  profile: UserProfile,
  jobs: JobPosting[],
  useAI: boolean = false,
  ratings?: RatingWithJobInfo[],
  userFeedback?: AIFeedbackData
): Promise<Recommendation[]> {
  if (useAI && openai) {
    return getAIRecommendations(profile, jobs, ratings, userFeedback);
  }

  return getRuleBasedRecommendations(profile, jobs);
}
