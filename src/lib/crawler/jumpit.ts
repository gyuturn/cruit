import { JobPosting } from '@/types';

const BASE_URL = 'https://www.jumpit.co.kr';
const API_URL = 'https://api.jumpit.co.kr/api/positions';

interface JumpitSearchParams {
  keywords?: string;
  experienceLevel?: 'junior' | 'experienced';
}

interface JumpitPosition {
  id: number;
  title: string;
  companyName: string;
  locations?: string[] | string;
  techStacks?: (string | { name: string })[];
  minCareer?: number;
  maxCareer?: number;
  endDate?: string;
}

// 점핏 크롤링 (API 기반)
export async function crawlJumpit(params: JumpitSearchParams = {}): Promise<JobPosting[]> {
  const jobs: JobPosting[] = [];

  try {
    // 점핏 API 파라미터 구성
    const searchParams = new URLSearchParams();
    searchParams.set('page', '1');
    searchParams.set('sort', 'rsp_rate');

    // 경력 필터
    if (params.experienceLevel === 'junior') {
      searchParams.set('career', '0');
    } else if (params.experienceLevel === 'experienced') {
      searchParams.set('career', '1,2,3,4,5');
    }

    const url = `${API_URL}?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://www.jumpit.co.kr/positions',
      },
      redirect: 'follow', // 리다이렉트 자동 처리
    });

    if (!response.ok) {
      console.error(`Jumpit fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();

    // API 응답 구조: { result: { positions: [...] } }
    const jobList = data?.result?.positions || [];

    jobList.forEach((item: JumpitPosition) => {
      try {
        const jobId = item.id;
        const title = item.title || '';
        const company = item.companyName || '';

        if (!title || !company || !jobId) return;

        // 위치 처리 (배열일 수 있음)
        let location = '미정';
        if (Array.isArray(item.locations) && item.locations.length > 0) {
          location = item.locations.join(', ');
        } else if (typeof item.locations === 'string') {
          location = item.locations;
        }

        // 기술스택 처리
        let skills: string[] = [];
        if (Array.isArray(item.techStacks)) {
          skills = item.techStacks.map((tech: string | { name: string }) =>
            typeof tech === 'string' ? tech : tech.name || ''
          ).filter((s: string) => s);
        }

        const job: JobPosting = {
          id: `jumpit_${jobId}_${Date.now()}`,
          title,
          company,
          location,
          experienceLevel: formatJumpitExperience(item.minCareer, item.maxCareer, item.newcomer),
          education: '학력무관',
          skills,
          salary: item.celebration ? `입사축하금 ${item.celebration}만원` : '',
          deadline: item.closedAt ? formatJumpitDeadline(item.closedAt) : '상시채용',
          url: `${BASE_URL}/position/${jobId}`,
          source: 'jumpit',
          summary: item.jobCategory || title,
          createdAt: new Date().toISOString(),
        };

        jobs.push(job);
      } catch (err) {
        console.error('Error parsing jumpit item:', err);
      }
    });

    console.log(`Jumpit: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error('Jumpit crawl error:', error);
    return [];
  }
}

// 경력 포맷팅
function formatJumpitExperience(min?: number, max?: number, newcomer?: boolean): string {
  if (newcomer) return '신입';
  if (min === undefined || min === null) return '경력무관';
  if (min === 0 && (!max || max === 0)) return '신입';
  if (min === 0 && max) return `신입~${max}년`;
  if (max) return `경력 ${min}~${max}년`;
  return `경력 ${min}년 이상`;
}

// 마감일 포맷팅
function formatJumpitDeadline(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
}
