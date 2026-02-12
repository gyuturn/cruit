/**
 * 공공기관 채용정보 API 클라이언트 (data.go.kr)
 *
 * 엔드포인트:
 *   목록: https://apis.data.go.kr/1051000/recruitment/list
 *   상세: https://apis.data.go.kr/1051000/recruitment/detail
 *
 * 인증: serviceKey 쿼리 파라미터 (data.go.kr 발급)
 * 응답: JSON
 * 트래픽: 일 1,000건
 */

const API_BASE = 'https://apis.data.go.kr/1051000/recruitment';

export interface RecruitmentItem {
  recrutPblntSn: number;
  instNm: string;
  recrutPbancTtl: string;
  hireTypeNmLst: string;
  workRgnNmLst: string;
  recrutSeNm: string;
  ncsCdNmLst: string;
  acbgCondNmLst: string;
  recrutNope: number;
  pbancBgngYmd: string;
  pbancEndYmd: string;
  srcUrl: string;
  ongoingYn: string;
  prefCondCn: string;
  aplyQlfcCn: string;
}

interface RecruitmentListResponse {
  resultCode: number;
  resultMsg: string;
  totalCount: number;
  result: RecruitmentItem[];
}

export interface RecruitmentFetchOptions {
  pageNo?: number;
  numOfRows?: number;
  ongoingYn?: string;
  recrutPbancTtl?: string;
}

/**
 * 공공기관 채용정보 목록을 가져온다.
 */
export async function fetchRecruitmentList(
  options: RecruitmentFetchOptions = {}
): Promise<{ items: RecruitmentItem[]; totalCount: number }> {
  const apiKey = process.env.RECRUITMENT_API_KEY;
  if (!apiKey) {
    console.error('RECRUITMENT_API_KEY 환경변수가 설정되지 않았습니다.');
    return { items: [], totalCount: 0 };
  }

  const { pageNo = 1, numOfRows = 100, ongoingYn, recrutPbancTtl } = options;

  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
  });

  if (ongoingYn) params.set('ongoingYn', ongoingYn);
  if (recrutPbancTtl) params.set('recrutPbancTtl', recrutPbancTtl);

  const url = `${API_BASE}/list?${params.toString()}`;

  try {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`공공기관 채용정보 API 요청 실패: ${response.status}`);
      return { items: [], totalCount: 0 };
    }

    const data: RecruitmentListResponse = await response.json();

    if (data.resultCode !== 200) {
      console.error(`공공기관 채용정보 API 에러: ${data.resultMsg}`);
      return { items: [], totalCount: 0 };
    }

    return { items: data.result || [], totalCount: data.totalCount };
  } catch (error) {
    console.error('공공기관 채용정보 API 에러:', error);
    return { items: [], totalCount: 0 };
  }
}

/**
 * API 결과를 JobPosting 호환 형식으로 변환한다.
 */
export function mapRecruitmentToJobData(item: RecruitmentItem) {
  return {
    id: `recruitment_${item.recrutPblntSn}`,
    title: item.recrutPbancTtl,
    company: item.instNm,
    location: item.workRgnNmLst || '미정',
    experienceLevel: item.recrutSeNm || '미정',
    education: item.acbgCondNmLst || '',
    skills: item.ncsCdNmLst ? item.ncsCdNmLst.split(',').map(s => s.trim()) : [],
    salary: '',
    deadline: formatDate(item.pbancEndYmd),
    url: item.srcUrl?.startsWith('http') ? item.srcUrl : `https://${item.srcUrl}`,
    source: 'recruitment' as const,
    summary: item.prefCondCn || '',
  };
}

function formatDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || '';
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}
