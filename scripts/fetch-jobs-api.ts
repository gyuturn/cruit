/**
 * 공공기관 채용정보 API 배치 수집 스크립트 (data.go.kr)
 * - 공공기관 채용정보 API로 채용공고를 수집하여 DB에 저장
 * - GitHub Actions 또는 수동으로 실행
 *
 * 실행 방법:
 *   RECRUITMENT_API_KEY=oH7zNp4n... npx tsx scripts/fetch-jobs-api.ts
 *
 * API: https://apis.data.go.kr/1051000/recruitment/list
 * 트래픽: 일 1,000건
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── API 클라이언트 (인라인) ──────────────────────────────────
// scripts/ 폴더는 tsconfig에서 제외되므로 @/ 경로를 사용할 수 없어 인라인으로 구현

const API_BASE = "https://apis.data.go.kr/1051000/recruitment";

interface RecruitmentItem {
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
}

interface ApiResponse {
  resultCode: number;
  resultMsg: string;
  totalCount: number;
  result: RecruitmentItem[];
}

interface JobData {
  id: string;
  title: string;
  company: string;
  location?: string;
  experienceLevel?: string;
  education?: string;
  skills?: string[];
  salary?: string;
  deadline?: string;
  url: string;
  source: string;
  summary?: string;
}

function formatDate(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) return yyyymmdd || "";
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

async function fetchRecruitmentPage(
  pageNo: number,
  numOfRows: number
): Promise<{ items: RecruitmentItem[]; totalCount: number }> {
  const apiKey = process.env.RECRUITMENT_API_KEY;
  if (!apiKey) {
    throw new Error("RECRUITMENT_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
  });

  const url = `${API_BASE}/list?${params.toString()}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API 요청 실패: ${response.status}`);
  }

  const data: ApiResponse = await response.json();

  if (data.resultCode !== 200) {
    throw new Error(`API 에러: ${data.resultMsg}`);
  }

  // 모집중인 공고만 필터링
  const ongoingItems = (data.result || []).filter(
    (item) => item.ongoingYn === "Y"
  );

  return { items: ongoingItems, totalCount: data.totalCount };
}

function mapToJobData(item: RecruitmentItem): JobData {
  return {
    id: `recruitment_${item.recrutPblntSn}`,
    title: item.recrutPbancTtl,
    company: item.instNm,
    location: item.workRgnNmLst || "미정",
    experienceLevel: item.recrutSeNm || "미정",
    education: item.acbgCondNmLst || "",
    skills: item.ncsCdNmLst
      ? item.ncsCdNmLst.split(",").map((s) => s.trim())
      : [],
    salary: "",
    deadline: formatDate(item.pbancEndYmd),
    url: item.srcUrl?.startsWith("http")
      ? item.srcUrl
      : `https://${item.srcUrl}`,
    source: "recruitment",
    summary: item.prefCondCn || "",
  };
}

// ─── DB 저장 (upsert) ────────────────────────────────────────

async function saveJobsToDb(
  jobs: JobData[]
): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const job of jobs) {
    try {
      const externalId = job.id;

      const existing = await prisma.jobPosting.findUnique({
        where: {
          source_externalId: {
            source: job.source,
            externalId,
          },
        },
      });

      if (existing) {
        await prisma.jobPosting.update({
          where: { id: existing.id },
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            experienceLevel: job.experienceLevel,
            education: job.education,
            skills: job.skills || [],
            salary: job.salary,
            deadline: job.deadline,
            url: job.url,
            summary: job.summary,
            isActive: true,
          },
        });
        updated++;
      } else {
        await prisma.jobPosting.create({
          data: {
            externalId,
            source: job.source,
            title: job.title,
            company: job.company,
            location: job.location,
            experienceLevel: job.experienceLevel,
            education: job.education,
            skills: job.skills || [],
            salary: job.salary,
            deadline: job.deadline,
            url: job.url,
            summary: job.summary,
          },
        });
        created++;
      }
    } catch (error) {
      console.error(`  DB 저장 실패 (${job.source}/${job.id}):`, error);
    }
  }

  return { created, updated };
}

// ─── 중복 제거 ────────────────────────────────────────────────

function deduplicateJobs(jobs: JobData[]): JobData[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.company}_${job.title}`.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ─── 크롤링 로그 저장 ─────────────────────────────────────────

async function saveCrawlLog(
  source: string,
  status: string,
  jobsFound: number,
  jobsCreated: number,
  jobsUpdated: number,
  duration: number,
  startedAt: Date,
  errorMsg?: string
) {
  await prisma.crawlLog.create({
    data: {
      source,
      status,
      jobsFound,
      jobsCreated,
      jobsUpdated,
      duration,
      startedAt,
      errorMsg,
    },
  });
}

// ─── 메인 ─────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("공공기관 채용정보 API 배치 수집 시작");
  console.log(`시작 시간: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const startTime = Date.now();
  const allJobs: JobData[] = [];
  const NUM_OF_ROWS = 100;
  const MAX_PAGES = 10; // 일일 트래픽 1,000건 제한 고려 (100 * 10 = 1,000)

  // 페이지별 수집
  for (let page = 1; page <= MAX_PAGES; page++) {
    console.log(`\n[페이지 ${page}/${MAX_PAGES}]`);

    try {
      const { items, totalCount } = await fetchRecruitmentPage(
        page,
        NUM_OF_ROWS
      );

      if (page === 1) {
        console.log(`  총 공고 수: ${totalCount.toLocaleString()}건`);
      }

      const jobs = items.map(mapToJobData);
      allJobs.push(...jobs);
      console.log(`  수집: ${items.length}건 (누적: ${allJobs.length}건)`);

      // 마지막 페이지 도달
      if (items.length < NUM_OF_ROWS) {
        console.log("  마지막 페이지 도달");
        break;
      }
    } catch (error) {
      console.error(`  [페이지 ${page}] 에러:`, error);
      break;
    }

    // Rate limiting (API 호출 간 500ms 대기)
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // 중복 제거
  console.log("\n" + "-".repeat(60));
  console.log(`총 수집: ${allJobs.length}건`);
  const uniqueJobs = deduplicateJobs(allJobs);
  console.log(`중복 제거 후: ${uniqueJobs.length}건`);

  // DB 저장
  console.log("\nDB 저장 중...");
  const { created, updated } = await saveJobsToDb(uniqueJobs);
  console.log(`  신규: ${created}건, 업데이트: ${updated}건`);

  // 오래된 공고 비활성화 (7일 이상 업데이트 안된 공고)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const deactivated = await prisma.jobPosting.updateMany({
    where: {
      updatedAt: { lt: sevenDaysAgo },
      isActive: true,
    },
    data: { isActive: false },
  });
  console.log(`  비활성화: ${deactivated.count}건 (7일 이상 미업데이트)`);

  const duration = Date.now() - startTime;

  // 크롤링 로그 저장
  await saveCrawlLog(
    "recruitment",
    "success",
    allJobs.length,
    created,
    updated,
    duration,
    new Date(startTime)
  );

  console.log("\n" + "=".repeat(60));
  console.log(`완료! 소요 시간: ${(duration / 1000).toFixed(1)}초`);
  console.log("=".repeat(60));
}

// 실행
main()
  .catch((error) => {
    console.error("배치 수집 실패:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
