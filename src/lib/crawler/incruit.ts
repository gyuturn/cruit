import * as cheerio from 'cheerio';
import { JobPosting } from '@/types';

const BASE_URL = 'https://www.incruit.com';
const SEARCH_URL = 'https://search.incruit.com/list/search.asp';

interface IncruitSearchParams {
  keywords?: string;
  experienceLevel?: 'junior' | 'experienced';
}

// 인크루트 크롤링
export async function crawlIncruit(params: IncruitSearchParams = {}): Promise<JobPosting[]> {
  const jobs: JobPosting[] = [];

  try {
    // 검색 쿼리 구성
    const searchParams = new URLSearchParams();
    searchParams.set('col', 'job');
    searchParams.set('kw', params.keywords || 'IT 개발');
    searchParams.set('startno', '0');

    const url = `${SEARCH_URL}?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Charset': 'euc-kr,utf-8;q=0.7,*;q=0.3',
      },
    });

    if (!response.ok) {
      console.error(`Incruit fetch failed: ${response.status}`);
      return [];
    }

    // EUC-KR 인코딩 처리
    const buffer = await response.arrayBuffer();
    let html: string;

    try {
      // TextDecoder로 EUC-KR 디코딩 시도
      const decoder = new TextDecoder('euc-kr');
      html = decoder.decode(buffer);
    } catch {
      // 실패 시 UTF-8로 시도
      html = new TextDecoder('utf-8').decode(buffer);
    }

    const $ = cheerio.load(html);

    // c_row 클래스를 가진 ul 요소들이 각 채용공고
    $('ul.c_row').each((index, element) => {
      try {
        const $row = $(element);
        const jobNo = $row.attr('jobno');

        if (!jobNo) return;

        // 제목과 링크 추출
        const $titleLink = $row.find('.cell_mid .cl_top a').first();
        let title = $titleLink.text().trim();
        // highlight 태그 제거
        title = title.replace(/<[^>]*>/g, '').trim();

        const relativeUrl = $titleLink.attr('href') || '';
        const jobUrl = relativeUrl.startsWith('http') ? relativeUrl : `https://job.incruit.com/jobdb_info/jobpost.asp?job=${jobNo}`;

        // 회사명 추출
        const company = $row.find('.cell_first .cl_top a').first().text().trim();

        // 조건 정보 추출 (cell_mid의 cl_md)
        const $conditions = $row.find('.cell_mid .cl_md span');
        const conditions: string[] = [];
        $conditions.each((_, el) => {
          const text = $(el).text().trim();
          if (text && text !== '|') {
            conditions.push(text);
          }
        });

        // 조건에서 정보 추출
        let experienceLevel = '경력무관';
        let education = '학력무관';
        let location = '미정';

        conditions.forEach(cond => {
          if (cond.includes('신입') || cond.includes('경력')) {
            experienceLevel = cond;
          } else if (cond.includes('대졸') || cond.includes('학력') || cond.includes('고졸') || cond.includes('석사')) {
            education = cond;
          } else if (cond.includes('시') || cond.includes('도') || cond.includes('구')) {
            location = cond;
          }
        });

        // 마감일 추출
        const deadlineText = $row.find('.cell_last .cl_btm').text().trim();
        const deadline = parseIncruitDeadline(deadlineText);

        if (title && company) {
          jobs.push({
            id: `incruit_${jobNo}_${Date.now()}`,
            title: cleanText(title),
            company: cleanText(company),
            location,
            experienceLevel,
            education,
            skills: [],
            salary: '',
            deadline,
            url: jobUrl,
            source: 'incruit',
            summary: cleanText(title),
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error parsing incruit row:', err);
      }
    });

    console.log(`Incruit: ${jobs.length} jobs found`);
    return jobs;
  } catch (error) {
    console.error('Incruit crawl error:', error);
    return [];
  }
}

// 텍스트 정리
function cleanText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/\s+/g, ' ')    // 연속 공백 제거
    .trim();
}

// 마감일 파싱
function parseIncruitDeadline(text: string): string {
  if (!text) return '';

  // "~01/31" 또는 "01.31" 형식
  const match = text.match(/~?(\d{1,2})[.\/](\d{1,2})/);
  if (match) {
    const month = match[1].padStart(2, '0');
    const day = match[2].padStart(2, '0');
    const year = new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }

  // D-day 형식
  const dDayMatch = text.match(/D-?(\d+)/i);
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
