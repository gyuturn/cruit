import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const keyword = searchParams.get('keyword');
    const experienceLevel = searchParams.get('experienceLevel');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Prisma where 조건
    const where: Record<string, unknown> = {
      isActive: true,
    };

    if (source && source !== 'all') {
      where.source = source;
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { company: { contains: keyword, mode: 'insensitive' } },
        { skills: { hasSome: [keyword] } },
      ];
    }

    if (experienceLevel) {
      where.experienceLevel = { contains: experienceLevel, mode: 'insensitive' };
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        orderBy: { crawledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          externalId: true,
          source: true,
          title: true,
          company: true,
          location: true,
          experienceLevel: true,
          education: true,
          skills: true,
          salary: true,
          deadline: true,
          url: true,
          summary: true,
          crawledAt: true,
        },
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({
      jobs: jobs.map(job => ({
        id: job.externalId,
        title: job.title,
        company: job.company,
        location: job.location || '미정',
        experienceLevel: job.experienceLevel || '미정',
        education: job.education || '',
        skills: job.skills,
        salary: job.salary || '',
        deadline: job.deadline || '',
        url: job.url,
        source: job.source,
        summary: job.summary || '',
        createdAt: job.crawledAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json(
      { error: '공고 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
