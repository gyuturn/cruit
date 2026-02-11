/**
 * 워크넷 공공데이터 API 클라이언트
 * - 엔드포인트: https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do
 * - 인증: authKey 쿼리 파라미터
 * - 응답: XML
 */

import * as cheerio from 'cheerio';

const WORKNET_API_URL =
  'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do';

export interface WorknetJobRaw {
  wantedAuthNo: string;
  company: string;
  title: string;
  sal: string;
  region: string;
  career: string; // N=신입, E=경력, Z=무관
  education: string;
  closeDt: string;
  wantedInfoUrl: string;
}

export interface WorknetFetchOptions {
  startPage?: number;
  display?: number;
}

/**
 * 워크넷 경력 코드 → 한국어 변환
 */
function mapCareer(career: string): string {
  switch (career?.trim()) {
    case 'N':
      return '신입';
    case 'E':
      return '경력';
    case 'Z':
      return '무관';
    default:
      return career || '미정';
  }
}

/**
 * 워크넷 API에서 채용공고를 가져온다.
 */
export async function fetchWorknetJobs(
  keyword: string,
  options: WorknetFetchOptions = {}
): Promise<WorknetJobRaw[]> {
  const apiKey = process.env.WORKNET_API_KEY;
  if (!apiKey) {
    console.error('WORKNET_API_KEY 환경변수가 설정되지 않았습니다.');
    return [];
  }

  const { startPage = 1, display = 100 } = options;

  const params = new URLSearchParams({
    authKey: apiKey,
    callTp: 'L',
    returnType: 'XML',
    startPage: String(startPage),
    display: String(display),
    keyword,
  });

  const url = `${WORKNET_API_URL}?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Cruit/1.0 (Job Recommendation Service)',
      },
    });

    if (!response.ok) {
      console.error(`워크넷 API 요청 실패: ${response.status}`);
      return [];
    }

    const xml = await response.text();
    return parseWorknetXml(xml);
  } catch (error) {
    console.error(`워크넷 API 에러 (${keyword}):`, error);
    return [];
  }
}

/**
 * 워크넷 XML 응답을 파싱한다.
 */
function parseWorknetXml(xml: string): WorknetJobRaw[] {
  const $ = cheerio.load(xml, { xml: true });
  const jobs: WorknetJobRaw[] = [];

  $('wanted').each((_, el) => {
    const wantedAuthNo = $(el).find('wantedAuthNo').text().trim();
    const company = $(el).find('company').text().trim();
    const title = $(el).find('title').text().trim();
    const sal = $(el).find('sal').text().trim();
    const region = $(el).find('region').text().trim();
    const career = $(el).find('career').text().trim();
    const education = $(el).find('education').text().trim();
    const closeDt = $(el).find('closeDt').text().trim();
    const wantedInfoUrl = $(el).find('wantedInfoUrl').text().trim();

    if (wantedAuthNo && title) {
      jobs.push({
        wantedAuthNo,
        company,
        title,
        sal,
        region,
        career,
        education,
        closeDt,
        wantedInfoUrl,
      });
    }
  });

  return jobs;
}

/**
 * 워크넷 API 결과를 JobPosting 호환 형식으로 변환한다.
 */
export function mapWorknetToJobData(raw: WorknetJobRaw) {
  return {
    id: `worknet_${raw.wantedAuthNo}`,
    title: raw.title,
    company: raw.company,
    location: raw.region || '미정',
    experienceLevel: mapCareer(raw.career),
    education: raw.education || '',
    skills: [] as string[],
    salary: raw.sal || '',
    deadline: raw.closeDt || '',
    url: raw.wantedInfoUrl || `https://www.work24.go.kr/wk/a/b/1200/dtlReqstView.do?wantedAuthNo=${raw.wantedAuthNo}`,
    source: 'worknet' as const,
    summary: '',
  };
}
