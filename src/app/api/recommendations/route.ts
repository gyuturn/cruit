import { NextRequest, NextResponse } from 'next/server';
import { UserProfile, RatingWithJobInfo, AIFeedbackData } from '@/types';
import { fetchJobs } from '@/lib/crawler';
import { getRecommendations } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      profile,
      page = 1,
      limit = 5,
      refresh = false,
      ratings = [],
      useAILearning = false,
      userFeedback,
    } = body as {
      profile: UserProfile;
      page?: number;
      limit?: number;
      refresh?: boolean;
      ratings?: RatingWithJobInfo[];
      useAILearning?: boolean;
      userFeedback?: AIFeedbackData;
    };

    if (!profile) {
      return NextResponse.json(
        { error: '프로필 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    // 공고 데이터 가져오기 (프로필 기반 키워드로 크롤링)
    const jobs = await fetchJobs('all', profile);

    // AI 추천 (refresh 또는 AI 학습 시 AI 사용)
    const useAI = (refresh || useAILearning) && !!process.env.OPENAI_API_KEY;

    // AI 학습 모드일 때만 별점 데이터와 피드백 전달
    const ratingsForAI = useAILearning ? ratings : undefined;
    const feedbackForAI = useAILearning ? userFeedback : undefined;
    const recommendations = await getRecommendations(profile, jobs, useAI, ratingsForAI, feedbackForAI);

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRecommendations = recommendations.slice(startIndex, endIndex);
    const hasMore = endIndex < recommendations.length;

    return NextResponse.json({
      recommendations: paginatedRecommendations,
      pagination: {
        page,
        limit,
        total: recommendations.length,
        hasMore,
      },
      meta: {
        crawledCount: jobs.length,
        sources: [...new Set(jobs.map(j => j.source))],
        aiLearningApplied: useAILearning && useAI,
        ratingsUsed: useAILearning ? ratings.length : 0,
        feedbackApplied: useAILearning && !!userFeedback,
      },
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: '추천을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
