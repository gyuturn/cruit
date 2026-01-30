import { JobPosting } from '@/types';
import * as fs from 'fs';
import * as path from 'path';

// 저장 파일 경로
const DATA_DIR = path.join(process.cwd(), 'data');
const SEEN_JOBS_FILE = path.join(DATA_DIR, 'seen_jobs.json');

// 최대 저장 개수
const MAX_SEEN_JOBS = 1000;

// 저장 데이터 구조
interface SeenJobsData {
  seenKeys: string[];
  lastUpdated: string;
}

// 공고 키 생성 (회사명 + 제목 정규화)
export function generateJobKey(job: JobPosting): string {
  const normalized = `${job.company}_${job.title}`
    .toLowerCase()
    .replace(/\s+/g, '')           // 공백 제거
    .replace(/[^가-힣a-z0-9_]/g, '') // 특수문자 제거 (언더스코어 유지)
    .substring(0, 100);            // 최대 길이 제한
  return normalized;
}

// 데이터 디렉토리 확인/생성
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 본 공고 목록 로드
export function loadSeenJobs(): Set<string> {
  try {
    ensureDataDir();

    if (!fs.existsSync(SEEN_JOBS_FILE)) {
      return new Set();
    }

    const data = fs.readFileSync(SEEN_JOBS_FILE, 'utf-8');
    const parsed: SeenJobsData = JSON.parse(data);
    return new Set(parsed.seenKeys || []);
  } catch (error) {
    console.error('Error loading seen jobs:', error);
    return new Set();
  }
}

// 본 공고 목록 저장
export function saveSeenJobs(seenKeys: Set<string>): void {
  try {
    ensureDataDir();

    // 최대 개수 초과 시 오래된 것 삭제 (앞에서부터 삭제)
    let keysArray = Array.from(seenKeys);
    if (keysArray.length > MAX_SEEN_JOBS) {
      keysArray = keysArray.slice(-MAX_SEEN_JOBS);
    }

    const data: SeenJobsData = {
      seenKeys: keysArray,
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving seen jobs:', error);
  }
}

// 새 공고 키들 추가
export function addSeenJobs(jobs: JobPosting[]): void {
  const seenKeys = loadSeenJobs();

  jobs.forEach(job => {
    const key = generateJobKey(job);
    seenKeys.add(key);
  });

  saveSeenJobs(seenKeys);
}

// 중복 제거 (이미 본 공고 필터링)
export function filterSeenJobs(jobs: JobPosting[]): JobPosting[] {
  const seenKeys = loadSeenJobs();

  const filtered = jobs.filter(job => {
    const key = generateJobKey(job);
    return !seenKeys.has(key);
  });

  console.log(`Dedup: ${jobs.length} -> ${filtered.length} (${jobs.length - filtered.length} duplicates removed)`);

  return filtered;
}

// 중복 제거 + 본 공고 기록 (한 번에 처리)
export function filterAndMarkSeenJobs(jobs: JobPosting[]): JobPosting[] {
  const seenKeys = loadSeenJobs();

  // 중복 필터링
  const filtered = jobs.filter(job => {
    const key = generateJobKey(job);
    return !seenKeys.has(key);
  });

  // 필터링된 공고들을 seen으로 기록
  filtered.forEach(job => {
    const key = generateJobKey(job);
    seenKeys.add(key);
  });

  // 저장
  saveSeenJobs(seenKeys);

  console.log(`Dedup: ${jobs.length} -> ${filtered.length} (${jobs.length - filtered.length} duplicates removed)`);

  return filtered;
}

// 본 공고 기록 초기화
export function clearSeenJobs(): void {
  try {
    ensureDataDir();

    const data: SeenJobsData = {
      seenKeys: [],
      lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    console.log('Seen jobs cleared');
  } catch (error) {
    console.error('Error clearing seen jobs:', error);
  }
}

// 본 공고 개수 조회
export function getSeenJobsCount(): number {
  const seenKeys = loadSeenJobs();
  return seenKeys.size;
}

// 특정 공고가 이미 본 것인지 확인
export function isJobSeen(job: JobPosting): boolean {
  const seenKeys = loadSeenJobs();
  const key = generateJobKey(job);
  return seenKeys.has(key);
}
