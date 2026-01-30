import * as cheerio from 'cheerio';
import { JobPosting } from '@/types';

const BASE_URL = 'https://www.jobkorea.co.kr';
const MOBILE_URL = 'https://m.jobkorea.co.kr';
const MOBILE_SEARCH_URL = `${MOBILE_URL}/Search/Adv`;

interface JobKoreaSearchParams {
  keywords?: string;
  experienceLevel?: 'junior' | 'experienced';
}

// 잡코리아 크롤링 (모바일 버전 사용)
export async function crawlJobKorea(params: JobKoreaSearchParams = {}): Promise<JobPosting[]> {
  const jobs: JobPosting[] = [];

  try {
    // 모바일 검색 쿼리 구성
    const searchParams = new URLSearchParams();
    searchParams.set('Keyword', params.keywords || 'IT 개발');

    // 경력 필터
    if (params.experienceLevel === 'junior') {
      searchParams.set('CareerType', '1'); // 신입
    } else if (params.experienceLevel === 'experienced') {
      searchParams.set('CareerType', '2'); // 경력
    }

    const url = `${MOBILE_SEARCH_URL}?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Referer': 'https://m.jobkorea.co.kr/',
      },
    });

    if (!response.ok) {
      console.error(`JobKorea fetch failed: ${response.status}`);
      return [];
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 모바일 버전 구조: li[data-gino] 형태의 채용공고 리스트
    // 1. 합격축하금 공고 (OnePick 섹션)
    $('li.section-item[data-gino]').each((index, element) => {
      try {
        const $item = $(element);
        const giNo = $item.attr('data-gino');
        const gNo = $item.attr('data-gno');

        if (!giNo || !gNo) return;

        const company = $item.find('.item-corp_name').text().trim();
        const title = $item.find('.item-title').text().trim();
        const celebrateText = $item.find('.celebrate-badge em').text().trim();

        if (title && company) {
          jobs.push({
            id: `jobkorea_${giNo}_${Date.now()}`,
            title,
            company,
            location: '미정',
            experienceLevel: '경력무관',
            education: '학력무관',
            skills: [],
            salary: celebrateText ? `합격축하금 ${celebrateText}` : '',
            deadline: '',
            url: `${BASE_URL}/Recruit/GI_Read/${gNo}`,
            source: 'jobkorea',
            summary: title,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error parsing jobkorea onepick item:', err);
      }
    });

    // 2. 일반 채용공고 리스트 (recruit-list 섹션)
    $('article.list-item, li.list-item').each((index, element) => {
      try {
        const $item = $(element);
        const $link = $item.find('a').first();
        const href = $link.attr('href') || '';

        // URL에서 공고 번호 추출
        const gNoMatch = href.match(/\/(\d+)/);
        const gNo = gNoMatch ? gNoMatch[1] : '';

        if (!gNo) return;

        const company = $item.find('.list-item_corp, .corp-name').text().trim();
        const title = $item.find('.list-item_title, .recruit-title').text().trim();

        // 조건 정보 추출
        const conditions = $item.find('.list-item_condition span, .recruit-condition span');
        let location = '미정';
        let experienceLevel = '경력무관';
        let education = '학력무관';

        conditions.each((_, el) => {
          const text = $(el).text().trim();
          if (text.includes('신입') || text.includes('경력')) {
            experienceLevel = text;
          } else if (text.includes('대졸') || text.includes('고졸') || text.includes('석사') || text.includes('학력')) {
            education = text;
          } else if (text.includes('시') || text.includes('구') || text.includes('도')) {
            location = text;
          }
        });

        const deadline = $item.find('.list-item_date, .recruit-date').text().trim();

        if (title && company) {
          jobs.push({
            id: `jobkorea_${gNo}_${Date.now()}`,
            title,
            company,
            location,
            experienceLevel,
            education,
            skills: [],
            salary: '',
            deadline: parseJobKoreaDeadline(deadline),
            url: `${BASE_URL}/Recruit/GI_Read/${gNo}`,
            source: 'jobkorea',
            summary: title,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error parsing jobkorea list item:', err);
      }
    });

    // 3. 검색 결과 리스트 (다른 구조)
    $('div.list-section ul.list li').each((index, element) => {
      try {
        const $item = $(element);
        const $link = $item.find('a.list-item_link').first();

        if (!$link.length) return;

        const href = $link.attr('href') || '';
        const gNoMatch = href.match(/\/(\d+)/);
        const gNo = gNoMatch ? gNoMatch[1] : `gen_${index}`;

        const company = $item.find('.list-item_corp').text().trim();
        const title = $item.find('.list-item_title').text().trim();
        const location = $item.find('.list-item_loc').text().trim() || '미정';
        const experienceLevel = $item.find('.list-item_career').text().trim() || '경력무관';
        const deadline = $item.find('.list-item_date').text().trim();

        if (title && company) {
          jobs.push({
            id: `jobkorea_${gNo}_${Date.now()}`,
            title,
            company,
            location,
            experienceLevel,
            education: '학력무관',
            skills: [],
            salary: '',
            deadline: parseJobKoreaDeadline(deadline),
            url: href.startsWith('http') ? href : `${BASE_URL}${href}`,
            source: 'jobkorea',
            summary: title,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error parsing jobkorea search item:', err);
      }
    });

    // 중복 제거 (같은 공고가 여러 섹션에 있을 수 있음)
    const uniqueJobs = removeDuplicateJobKoreaJobs(jobs);

    console.log(`JobKorea: ${uniqueJobs.length} jobs found`);
    return uniqueJobs;
  } catch (error) {
    console.error('JobKorea crawl error:', error);
    return [];
  }
}

// 잡코리아 공고 중복 제거
function removeDuplicateJobKoreaJobs(jobs: JobPosting[]): JobPosting[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    // URL에서 공고 번호 추출
    const match = job.url.match(/\/(\d+)/);
    const key = match ? match[1] : `${job.company}_${job.title}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// 잡코리아 마감일 파싱
function parseJobKoreaDeadline(text: string): string {
  if (!text) return '';

  // "~01/31(금)" 또는 "01/31" 형식
  const match = text.match(/~?(\d{1,2})\/(\d{1,2})/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }

  // "D-7" 형식
  const dDayMatch = text.match(/D-(\d+)/i);
  if (dDayMatch) {
    const daysLeft = parseInt(dDayMatch[1]);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysLeft);
    return deadline.toISOString().split('T')[0];
  }

  if (text.includes('상시') || text.includes('채용시')) {
    return '상시채용';
  }

  return text;
}
