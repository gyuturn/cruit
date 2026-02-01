import { JobPosting, UserProfile } from '@/types';
import { crawlSaramin } from './saramin';
import { crawlJobKorea } from './jobkorea';
import { crawlWanted } from './wanted';
import { crawlJumpit } from './jumpit';
import { crawlIncruit } from './incruit';
import { filterAndMarkSeenJobs } from '../dedup';

// 크롤링 소스 타입
export type CrawlSource = 'saramin' | 'jobkorea' | 'wanted' | 'jumpit' | 'incruit' | 'all';

// 샘플 데이터 (크롤링 실패 시 fallback)
const SAMPLE_JOBS: JobPosting[] = [
  {
    id: 'sample_1',
    title: '백엔드 개발자 (신입/경력)',
    company: '네이버',
    location: '성남시 분당구',
    experienceLevel: '신입/경력',
    education: '대졸(4년) 이상',
    skills: ['Java', 'Spring', 'MySQL', '정보처리기사'],
    salary: '회사내규에 따름',
    deadline: '2025-03-15',
    url: 'https://recruit.navercorp.com/',
    source: 'sample',
    summary: '네이버 검색 서비스 백엔드 개발 및 운영',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample_2',
    title: '프론트엔드 개발자',
    company: '카카오',
    location: '성남시 판교',
    experienceLevel: '신입',
    education: '대졸(4년) 이상',
    skills: ['React', 'TypeScript', 'JavaScript'],
    salary: '4,000만원 ~ 6,000만원',
    deadline: '2025-03-20',
    url: 'https://careers.kakao.com/',
    source: 'sample',
    summary: '카카오톡 웹 서비스 프론트엔드 개발',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample_3',
    title: 'AI/ML 엔지니어',
    company: '삼성전자',
    location: '수원시 영통구',
    experienceLevel: '경력 3년 이상',
    education: '석사 이상',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'CUDA'],
    salary: '협의',
    deadline: '2025-03-25',
    url: 'https://www.samsung.com/sec/careers/',
    source: 'sample',
    summary: '갤럭시 AI 기능 개발 및 최적화',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample_4',
    title: '데이터 엔지니어',
    company: '쿠팡',
    location: '서울시 송파구',
    experienceLevel: '신입/경력',
    education: '대졸(4년) 이상',
    skills: ['Python', 'SQL', 'Spark', 'AWS', 'SQLD'],
    salary: '5,000만원 이상',
    deadline: '2025-03-18',
    url: 'https://www.coupang.jobs/',
    source: 'sample',
    summary: '대규모 데이터 파이프라인 구축 및 운영',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sample_5',
    title: 'iOS 개발자',
    company: '토스',
    location: '서울시 강남구',
    experienceLevel: '신입',
    education: '학력무관',
    skills: ['Swift', 'iOS', 'UIKit', 'SwiftUI'],
    salary: '4,500만원 ~ 7,000만원',
    deadline: '2025-03-30',
    url: 'https://toss.im/career',
    source: 'sample',
    summary: '토스 앱 iOS 네이티브 개발',
    createdAt: new Date().toISOString(),
  },
];

// 전공-직무 매핑 테이블
const MAJOR_TO_JOB_KEYWORDS: Record<string, string[]> = {
  // IT/컴퓨터 계열
  '컴퓨터': ['백엔드 개발자', '프론트엔드 개발자', '풀스택 개발자', '소프트웨어 엔지니어'],
  '소프트웨어': ['소프트웨어 개발자', '백엔드', '프론트엔드', '앱 개발'],
  '정보통신': ['IT 엔지니어', '네트워크 엔지니어', '시스템 엔지니어'],
  '정보보안': ['보안 엔지니어', '정보보안', '사이버보안'],
  '데이터': ['데이터 엔지니어', '데이터 분석가', 'AI 엔지니어'],
  '인공지능': ['AI 엔지니어', '머신러닝', '딥러닝 엔지니어'],
  '게임': ['게임 개발자', '게임 프로그래머', '유니티 개발자'],

  // 전기/전자 계열
  '전자': ['임베디드 개발자', '펌웨어 엔지니어', '하드웨어 엔지니어'],
  '전기': ['전기 엔지니어', '전력 설계', '전기설비'],
  '반도체': ['반도체 엔지니어', '공정 엔지니어', 'FAB 엔지니어'],
  '제어': ['제어 엔지니어', 'PLC 프로그래머', '자동화 엔지니어'],

  // 기계/산업 계열
  '기계': ['기계 설계', 'CAD 엔지니어', '설비 엔지니어'],
  '산업': ['생산관리', '품질관리', 'QA 엔지니어'],
  '자동차': ['자동차 엔지니어', '차량 개발', '모빌리티'],
  '항공': ['항공 엔지니어', '항공정비사', '드론 개발'],
  '조선': ['조선 엔지니어', '선박 설계', '해양 엔지니어'],

  // 화학/재료/환경 계열
  '화학': ['화학 연구원', '품질관리', 'R&D 연구원'],
  '화공': ['공정 엔지니어', '플랜트 엔지니어', '화학공정'],
  '재료': ['재료 연구원', '소재 개발', 'R&D'],
  '환경': ['환경 엔지니어', '환경관리', 'ESG 담당자'],
  '에너지': ['에너지 엔지니어', '신재생에너지', '전력거래'],

  // 건축/토목 계열
  '건축': ['건축 설계', '건축 시공', 'BIM 엔지니어'],
  '토목': ['토목 설계', '토목 시공', '구조 엔지니어'],
  '도시': ['도시계획', '교통계획', 'GIS 분석가'],
  '조경': ['조경 설계', '환경설계', '공간 디자이너'],

  // 경영/경제 계열
  '경영': ['기획', '전략기획', '사업개발', '경영지원'],
  '경제': ['경제분석', '금융', '투자분석', '리서치'],
  '회계': ['회계', '재무', '세무', '감사'],
  '마케팅': ['마케팅', '브랜드 매니저', '퍼포먼스 마케터', 'CRM'],
  '무역': ['무역', '수출입', '해외영업', '물류'],
  '물류': ['물류관리', 'SCM', '유통관리'],
  '금융': ['금융', '펀드매니저', '자산관리', '리스크관리'],
  '보험': ['보험', '언더라이터', '손해사정', '보험영업'],
  '부동산': ['부동산', '자산관리', 'PM', '개발사업'],

  // 인문/사회 계열
  '국어': ['콘텐츠 에디터', '카피라이터', '출판 편집'],
  '영어': ['통번역', '영어 교육', '해외영업'],
  '중국어': ['중국어 통번역', '중국 무역', '중화권 영업'],
  '일본어': ['일본어 통번역', '일본 영업', 'CS'],
  '문학': ['콘텐츠 기획', '작가', '에디터'],
  '역사': ['기록관리', '아키비스트', '박물관'],
  '철학': ['콘텐츠 기획', '교육', '연구'],
  '심리': ['상담사', 'UX 리서처', 'HR 담당자'],
  '사회': ['사회조사분석', '리서치', '정책분석'],
  '정치': ['정책분석', '공공기관', '싱크탱크'],
  '행정': ['행정', '공무원', '공공기관'],
  '법학': ['법무', '컴플라이언스', '계약관리'],

  // 교육 계열
  '교육': ['교사', '강사', '교육기획', 'HRD'],
  '유아교육': ['유치원 교사', '보육교사', '아동교육'],
  '특수교육': ['특수교사', '장애인복지', '치료사'],
  '체육': ['체육교사', '트레이너', '스포츠 마케팅'],

  // 예술/디자인 계열
  '디자인': ['UI/UX 디자이너', '그래픽 디자이너', '웹 디자이너'],
  '시각': ['그래픽 디자이너', '브랜드 디자이너', '광고 디자이너'],
  '산업디자인': ['제품 디자이너', 'UX 디자이너', '3D 디자이너'],
  '패션': ['패션 디자이너', 'MD', '바이어'],
  '실내': ['인테리어 디자이너', '공간 디자이너', '가구 디자이너'],
  '영상': ['영상 편집자', 'PD', '모션그래퍼'],
  '애니': ['애니메이터', '캐릭터 디자이너', '일러스트레이터'],
  '미술': ['아트 디렉터', '일러스트레이터', '전시기획'],
  '음악': ['음향 엔지니어', '작곡가', '음악 PD'],
  '연극': ['공연기획', '무대 디자인', '배우'],
  '사진': ['사진작가', '포토그래퍼', '영상촬영'],

  // 의료/보건 계열
  '의학': ['의사', '전공의', '임상연구'],
  '치의': ['치과의사', '치과위생사', '구강보건'],
  '한의': ['한의사', '한방', '한의원'],
  '약학': ['약사', '임상약사', '제약회사'],
  '간호': ['간호사', '임상간호사', '보건교사'],
  '물리치료': ['물리치료사', '재활치료사', '스포츠 재활'],
  '작업치료': ['작업치료사', '재활', '직업재활'],
  '임상병리': ['임상병리사', '진단검사', '병리'],
  '방사선': ['방사선사', '영상의학', '핵의학'],
  '치위생': ['치과위생사', '치과', '구강보건'],
  '응급': ['응급구조사', '소방', '119'],
  '보건': ['보건관리자', '산업보건', '공중보건'],
  '영양': ['영양사', '식품', '급식관리'],
  '의료정보': ['의료정보', 'EMR', '병원 IT'],

  // 자연과학 계열
  '수학': ['데이터 분석가', '퀀트', '통계분석'],
  '통계': ['통계분석가', '데이터 사이언티스트', '리서치'],
  '물리': ['연구원', '광학 엔지니어', '물리 시뮬레이션'],
  '생물': ['생명과학 연구원', '바이오', 'R&D'],
  '생명': ['바이오 연구원', '생명공학', '제약'],
  '지질': ['지질조사', '광물자원', '환경조사'],
  '천문': ['데이터 분석', '연구원', '시뮬레이션'],
  '해양과학': ['해양연구', '수산', '해양환경'],

  // 농수산/식품 계열
  '농업': ['농업 연구원', '스마트팜', '농업기술'],
  '원예': ['조경', '원예 전문가', '플라워'],
  '축산': ['축산업', '동물사육', '수의'],
  '수산': ['수산업', '양식', '해양'],
  '식품': ['식품연구원', '품질관리', 'R&D'],
  '식품영양': ['영양사', '식품개발', 'R&D'],
  '조리': ['조리사', '셰프', 'F&B'],
  '외식': ['외식업', '프랜차이즈', 'F&B 기획'],

  // 사회복지/상담 계열
  '사회복지': ['사회복지사', '복지시설', '상담사'],
  '아동': ['보육교사', '아동상담', '아동복지'],
  '청소년': ['청소년지도사', '청소년상담', '청소년복지'],
  '노인': ['노인복지', '요양보호사', '실버산업'],
  '상담': ['상담사', '심리상담', '진로상담'],

  // 미디어/언론 계열
  '신문방송': ['기자', 'PD', '방송작가'],
  '언론': ['기자', '에디터', '미디어'],
  '광고홍보': ['광고기획', 'PR', '홍보'],
  '미디어': ['콘텐츠 크리에이터', '미디어 기획', '디지털 마케팅'],
  '방송': ['PD', '방송작가', '방송기술'],

  // 관광/호텔/항공 계열
  '관광': ['여행사', '관광기획', '호텔'],
  '호텔': ['호텔리어', '객실관리', 'F&B'],
  '항공서비스': ['승무원', '지상직', '공항'],
  '이벤트': ['이벤트 기획', '전시기획', 'MICE'],
  '컨벤션': ['컨벤션 기획', '전시', 'PCO'],
};

// 자격증-직무 매핑
const CERT_TO_JOB_KEYWORDS: Record<string, string[]> = {
  '정보처리': ['개발자', 'IT 엔지니어', '시스템'],
  'SQL': ['데이터 엔지니어', 'DBA', '데이터 분석'],
  'SQLD': ['데이터 분석', 'SQL', '데이터베이스'],
  '리눅스': ['시스템 엔지니어', '서버 관리자', 'DevOps'],
  '네트워크': ['네트워크 엔지니어', '보안 엔지니어'],
  '보안': ['정보보안', '보안 엔지니어', 'ISMS'],
  'AWS': ['클라우드 엔지니어', 'DevOps', '백엔드'],
  '빅데이터': ['데이터 엔지니어', '데이터 분석가'],
  '전기': ['전기 엔지니어', '전력 설비', '전기안전'],
  '건축': ['건축 설계', '시공관리', '건축사'],
  '토목': ['토목 설계', '시공관리', '구조'],
  '산업안전': ['안전관리자', '산업안전', 'HSE'],
  '품질관리': ['QA', 'QC', '품질관리'],
  '물류': ['물류관리', 'SCM', '유통'],
  '회계': ['회계', '재무', '세무'],
  '세무': ['세무사', '세무회계', '재무'],
  '유통': ['유통관리', 'MD', '상품기획'],
  '사회복지': ['사회복지사', '복지시설', '상담'],
  '간호': ['간호사', '임상간호', '보건'],
  '영양': ['영양사', '급식관리', '식품'],
  '조리': ['조리사', '셰프', 'F&B'],
  '미용': ['미용사', '헤어', '뷰티'],
  '운전': ['운전', '배송', '물류'],
};

// 검색 키워드 생성 (사용자 프로필 기반)
function generateSearchKeywords(profile?: UserProfile): string[] {
  const keywordSets: string[] = [];

  if (profile?.major) {
    const majorLower = profile.major.toLowerCase();

    // 전공명에서 직접 매칭되는 키워드 찾기
    for (const [key, values] of Object.entries(MAJOR_TO_JOB_KEYWORDS)) {
      if (majorLower.includes(key.toLowerCase()) || key.toLowerCase().includes(majorLower)) {
        // 상위 2개 직무 키워드 사용
        keywordSets.push(...values.slice(0, 2));
        break;
      }
    }

    // 매칭되지 않으면 전공명 자체를 키워드로 사용
    if (keywordSets.length === 0) {
      keywordSets.push(profile.major);
    }
  }

  // 자격증 기반 키워드 추가
  if (profile?.certifications && profile.certifications.length > 0) {
    profile.certifications.forEach(cert => {
      for (const [key, values] of Object.entries(CERT_TO_JOB_KEYWORDS)) {
        if (cert.includes(key)) {
          // 자격증당 1개 키워드 추가
          keywordSets.push(values[0]);
          break;
        }
      }
    });
  }

  // 경력자의 경우 이전 직무도 키워드에 추가
  if (profile?.careerHistory && profile.careerHistory.length > 0) {
    const recentJob = profile.careerHistory[0];
    if (recentJob.position) {
      keywordSets.push(recentJob.position);
    }
  }

  // 중복 제거 및 최대 3개 키워드 반환
  const uniqueKeywords = [...new Set(keywordSets)].slice(0, 3);

  // 키워드가 없으면 기본값
  if (uniqueKeywords.length === 0) {
    return ['신입 채용'];
  }

  return uniqueKeywords;
}

// 단일 키워드 문자열로 변환 (기존 호환성)
function getMainSearchKeyword(profile?: UserProfile): string {
  const keywords = generateSearchKeywords(profile);
  return keywords[0] || '신입 채용';
}

// 단일 키워드로 모든 소스 크롤링
async function crawlWithKeyword(
  keyword: string,
  source: CrawlSource,
  experienceLevel?: 'junior' | 'experienced'
): Promise<JobPosting[]> {
  const crawlPromises: Promise<JobPosting[]>[] = [];

  if (source === 'saramin' || source === 'all') {
    crawlPromises.push(
      crawlSaramin({ keywords: keyword, experienceLevel }).catch(err => {
        console.error(`Saramin error (${keyword}):`, err);
        return [];
      })
    );
  }

  if (source === 'jobkorea' || source === 'all') {
    crawlPromises.push(
      crawlJobKorea({ keywords: keyword, experienceLevel }).catch(err => {
        console.error(`JobKorea error (${keyword}):`, err);
        return [];
      })
    );
  }

  if (source === 'wanted' || source === 'all') {
    crawlPromises.push(
      crawlWanted({ keywords: keyword, experienceLevel }).catch(err => {
        console.error(`Wanted error (${keyword}):`, err);
        return [];
      })
    );
  }

  if (source === 'jumpit' || source === 'all') {
    crawlPromises.push(
      crawlJumpit({ keywords: keyword, experienceLevel }).catch(err => {
        console.error(`Jumpit error (${keyword}):`, err);
        return [];
      })
    );
  }

  if (source === 'incruit' || source === 'all') {
    crawlPromises.push(
      crawlIncruit({ keywords: keyword, experienceLevel }).catch(err => {
        console.error(`Incruit error (${keyword}):`, err);
        return [];
      })
    );
  }

  const results = await Promise.all(crawlPromises);
  return results.flat();
}

// 공고 데이터 가져오기 (다중 키워드 병렬 크롤링 + 중복 제거)
export async function fetchJobs(
  source: CrawlSource = 'all',
  profile?: UserProfile,
  skipDedup: boolean = false
): Promise<JobPosting[]> {
  const keywords = generateSearchKeywords(profile);
  const experienceLevel = profile?.experienceLevel;

  console.log(`Fetching jobs with keywords: [${keywords.join(', ')}], experience: ${experienceLevel}`);
  console.log(`Profile major: ${profile?.major || 'not set'}`);

  let allJobs: JobPosting[] = [];

  try {
    // 각 키워드별로 병렬 크롤링 실행
    const keywordPromises = keywords.map(keyword =>
      crawlWithKeyword(keyword, source, experienceLevel)
    );

    const keywordResults = await Promise.all(keywordPromises);

    // 키워드별 결과 로깅
    keywords.forEach((keyword, index) => {
      console.log(`  "${keyword}": ${keywordResults[index].length} jobs`);
    });

    // 모든 결과 병합
    keywordResults.forEach(jobs => {
      allJobs = [...allJobs, ...jobs];
    });

    // 크롤링 결과가 없으면 샘플 데이터 사용
    if (allJobs.length === 0) {
      console.log('No crawled jobs, using sample data');
      return SAMPLE_JOBS;
    }

    // 동일 크롤링 내 중복 제거 (회사명 + 제목 기준)
    const uniqueJobs = removeDuplicates(allJobs);
    console.log(`Total unique jobs from crawling: ${uniqueJobs.length}`);

    // AI 재추천 시 이전에 본 공고 제거 (skipDedup이 false일 때)
    if (!skipDedup) {
      const filteredJobs = filterAndMarkSeenJobs(uniqueJobs);
      console.log(`After dedup filter: ${filteredJobs.length}`);

      // 필터링 후 공고가 너무 적으면 일부 기존 공고 포함
      if (filteredJobs.length < 5 && uniqueJobs.length >= 5) {
        console.log('Too few new jobs, including some seen jobs');
        return uniqueJobs.slice(0, 20);
      }

      return filteredJobs;
    }

    return uniqueJobs;
  } catch (error) {
    console.error('Crawl error, using sample data:', error);
    return SAMPLE_JOBS;
  }
}

// 중복 제거 (같은 크롤링 내에서)
function removeDuplicates(jobs: JobPosting[]): JobPosting[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.company}_${job.title}`.toLowerCase().replace(/\s+/g, '');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

// 특정 소스에서 크롤링
export async function crawlFromSource(
  source: CrawlSource,
  profile?: UserProfile
): Promise<JobPosting[]> {
  return fetchJobs(source, profile);
}

// 샘플 데이터만 가져오기 (테스트용)
export function getSampleJobs(): JobPosting[] {
  return SAMPLE_JOBS;
}
