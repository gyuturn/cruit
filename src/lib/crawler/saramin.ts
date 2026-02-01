import * as cheerio from 'cheerio';
import { JobPosting } from '@/types';

const BASE_URL = 'https://www.saramin.co.kr';
const SEARCH_URL = `${BASE_URL}/zf_user/search/recruit`;

interface SaraminSearchParams {
  keywords?: string;
  experienceLevel?: 'junior' | 'experienced';
  education?: string;
}

// 사람인 크롤링
export async function crawlSaramin(params: SaraminSearchParams = {}): Promise<JobPosting[]> {
  const jobs: JobPosting[] = [];

  try {
    // 검색 쿼리 구성
    const searchParams = new URLSearchParams();
    searchParams.set('searchType', 'search');
    searchParams.set('searchword', params.keywords || 'IT 개발');
    searchParams.set('recruitPage', '1');
    searchParams.set('recruitSort', 'relation');
    searchParams.set('recruitPageCount', '40');

    // 경력 필터
    if (params.experienceLevel === 'junior') {
      searchParams.set('exp_cd', '1'); // 신입
    } else if (params.experienceLevel === 'experienced') {
      searchParams.set('exp_cd', '2'); // 경력
    }

    const url = `${SEARCH_URL}?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      console.error(`Saramin fetch failed: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 채용공고 리스트 파싱
    $('.item_recruit').each((index, element) => {
      try {
        const $item = $(element);

        // 기본 정보 추출
        const $titleLink = $item.find('.job_tit a');
        const title = $titleLink.text().trim();
        const relativeUrl = $titleLink.attr('href') || '';
        const jobUrl = relativeUrl.startsWith('http') ? relativeUrl : `${BASE_URL}${relativeUrl}`;

        const company = $item.find('.corp_name a').text().trim();

        // 조건 정보
        const $conditions = $item.find('.job_condition span');
        const conditions: string[] = [];
        $conditions.each((_, el) => {
          conditions.push($(el).text().trim());
        });

        const location = conditions[0] || '미정';
        const experienceLevel = conditions[1] || '무관';
        const education = conditions[2] || '학력무관';
        const _employmentType = conditions[3] || '';

        // 마감일
        const deadlineText = $item.find('.job_date .date').text().trim();
        const deadline = parseDeadline(deadlineText);

        // 직무 분야 (기술 스택으로 활용)
        const sector = $item.find('.job_sector').text().trim();
        const skills = sector.split(',').map(s => s.trim()).filter(s => s);

        // 요약 정보
        const summary = $item.find('.job_sector').text().trim() || title;

        if (title && company) {
          jobs.push({
            id: `saramin_${index}_${Date.now()}`,
            title,
            company,
            location,
            experienceLevel,
            education,
            skills,
            salary: '', // 사람인 검색 결과에서는 급여 정보가 제한적
            deadline,
            url: jobUrl,
            source: 'saramin',
            summary,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error parsing saramin item:', err);
      }
    });

    console.log(`Saramin: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error('Saramin crawl error:', error);
    return [];
  }
}

// 마감일 파싱
function parseDeadline(text: string): string {
  if (!text) return '';

  // "~03/15(토)" 형식
  const match = text.match(/~?(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }

  // "상시채용" 등
  if (text.includes('상시')) {
    return '상시채용';
  }

  return text;
}
