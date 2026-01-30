import { JobPosting } from '@/types';

const BASE_URL = 'https://www.wanted.co.kr';
const API_URL = 'https://www.wanted.co.kr/api/v4/jobs';

interface WantedSearchParams {
  keywords?: string;
  experienceLevel?: 'junior' | 'experienced';
}

// 원티드 크롤링 (API 기반)
export async function crawlWanted(params: WantedSearchParams = {}): Promise<JobPosting[]> {
  const jobs: JobPosting[] = [];

  try {
    // 원티드 API 파라미터 구성
    const searchParams = new URLSearchParams();
    searchParams.set('country', 'kr');
    searchParams.set('job_sort', 'job.latest_order');
    searchParams.set('locations', 'all');
    searchParams.set('limit', '20');

    // 경력 필터 (-1: 전체, 0: 신입, 1+: 경력)
    if (params.experienceLevel === 'junior') {
      searchParams.set('years', '0');
    } else if (params.experienceLevel === 'experienced') {
      searchParams.set('years', '1');
    } else {
      searchParams.set('years', '-1');
    }

    const url = `${API_URL}?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://www.wanted.co.kr/',
      },
    });

    if (!response.ok) {
      console.error(`Wanted fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const jobList = data?.data || [];

    jobList.forEach((item: any, index: number) => {
      try {
        // API 응답 구조에 맞게 파싱
        const title = item.position || '';
        const company = item.company?.name || '';
        const location = item.address?.full_location || item.address?.location || '미정';
        const jobId = item.id;

        if (!title || !company || !jobId) return;

        const job: JobPosting = {
          id: `wanted_${jobId}_${Date.now()}`,
          title,
          company,
          location,
          experienceLevel: formatWantedExperience(item.annual_from, item.annual_to),
          education: '학력무관',
          skills: [], // 상세 페이지에서만 확인 가능
          salary: item.reward?.formatted_total ? `추천보상금 ${item.reward.formatted_total}` : '',
          deadline: item.due_time || '상시채용',
          url: `${BASE_URL}/wd/${jobId}`,
          source: 'wanted',
          summary: title,
          createdAt: new Date().toISOString(),
        };

        jobs.push(job);
      } catch (err) {
        console.error('Error parsing wanted item:', err);
      }
    });

    console.log(`Wanted: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error('Wanted crawl error:', error);
    return [];
  }
}

// 경력 포맷팅 (annual_from, annual_to 기반)
function formatWantedExperience(from?: number, to?: number): string {
  if (from === undefined || from === null) return '경력무관';
  if (from === 0 && (!to || to === 0)) return '신입';
  if (from === 0 && to) return `신입~${to}년`;
  if (to) return `경력 ${from}~${to}년`;
  return `경력 ${from}년 이상`;
}
