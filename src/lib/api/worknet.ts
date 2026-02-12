/**
 * 워크넷(고용24) 공공데이터 API 클라이언트
 *
 * 엔드포인트:
 *   목록: https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do
 *   상세: https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210D01.do
 *
 * 인증: authKey 쿼리 파라미터 (고용24 OPEN-API에서 발급받은 UUID)
 * 응답: XML (UTF-8)
 *
 * 사전 준비:
 *   1. https://www.work24.go.kr 회원가입
 *   2. 고객센터 > OPEN-API > 서비스 소개 및 신청 > 채용정보 신청
 *   3. 인증키 발급 후 WORKNET_API_KEY 환경변수에 설정
 */

import * as cheerio from 'cheerio';

const WORKNET_LIST_URL =
  'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do';

export interface WorknetJobRaw {
  wantedAuthNo: string;
  company: string;
  title: string;
  salTpNm: string;
  sal: string;
  minSal: string;
  maxSal: string;
  region: string;
  career: string; // N=신입, E=경력, Z=관계없음
  minEdubg: string;
  maxEdubg: string;
  closeDt: string;
  wantedInfoUrl: string;
  empTpCd: string;
  holidayTpNm: string;
  basicAddr: string;
}

export interface WorknetFetchOptions {
  startPage?: number;
  display?: number;
  career?: 'N' | 'E' | 'Z';
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
 * 워크넷 학력 코드 → 한국어
 */
function formatEducation(minEdubg: string, maxEdubg: string): string {
  const eduMap: Record<string, string> = {
    '00': '학력무관',
    '01': '초졸이하',
    '02': '중졸',
    '03': '고졸',
    '04': '대졸(2~3년)',
    '05': '대졸(4년)',
    '06': '석사',
    '07': '박사',
  };
  const min = eduMap[minEdubg];
  const max = eduMap[maxEdubg];
  if (!min && !max) return '';
  if (min === max || !max) return min || '';
  if (!min) return max;
  return `${min} ~ ${max}`;
}

/**
 * 워크넷 API에서 채용공고 목록을 가져온다.
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

  const { startPage = 1, display = 100, career } = options;

  const params = new URLSearchParams({
    authKey: apiKey,
    callTp: 'L',
    returnType: 'XML',
    startPage: String(startPage),
    display: String(display),
    keyword,
  });

  if (career) {
    params.set('career', career);
  }

  const url = `${WORKNET_LIST_URL}?${params.toString()}`;

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

    // 에러 응답 체크
    if (xml.includes('<error>') || xml.includes('<messageCd>')) {
      const errorMatch = xml.match(/<error>([^<]+)<\/error>/);
      const msgMatch = xml.match(/<message>([^<]+)<\/message>/);
      console.error(`워크넷 API 에러: ${errorMatch?.[1] || msgMatch?.[1] || xml}`);
      return [];
    }

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
    const title = $(el).find('title').text().trim();

    if (wantedAuthNo && title) {
      jobs.push({
        wantedAuthNo,
        company: $(el).find('company').text().trim(),
        title,
        salTpNm: $(el).find('salTpNm').text().trim(),
        sal: $(el).find('sal').text().trim(),
        minSal: $(el).find('minSal').text().trim(),
        maxSal: $(el).find('maxSal').text().trim(),
        region: $(el).find('region').text().trim(),
        career: $(el).find('career').text().trim(),
        minEdubg: $(el).find('minEdubg').text().trim(),
        maxEdubg: $(el).find('maxEdubg').text().trim(),
        closeDt: $(el).find('closeDt').text().trim(),
        wantedInfoUrl: $(el).find('wantedInfoUrl').text().trim(),
        empTpCd: $(el).find('empTpCd').text().trim(),
        holidayTpNm: $(el).find('holidayTpNm').text().trim(),
        basicAddr: $(el).find('basicAddr').text().trim(),
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
    location: raw.region || raw.basicAddr || '미정',
    experienceLevel: mapCareer(raw.career),
    education: formatEducation(raw.minEdubg, raw.maxEdubg),
    skills: [] as string[],
    salary: raw.sal || '',
    deadline: raw.closeDt || '',
    url: raw.wantedInfoUrl || `https://www.work24.go.kr/wk/a/b/1200/dtlReqstView.do?wantedAuthNo=${raw.wantedAuthNo}`,
    source: 'worknet' as const,
    summary: '',
  };
}
