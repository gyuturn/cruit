/**
 * 배치 크롤링 스크립트
 * - 5개 원천 시스템에서 채용공고를 크롤링하여 DB에 저장
 * - GitHub Actions 또는 수동으로 실행
 *
 * 실행 방법:
 *   npx ts-node scripts/crawl-jobs.ts
 *   또는
 *   npx tsx scripts/crawl-jobs.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 크롤러 타입 정의
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

// 검색 키워드 목록 (다양한 직군 커버)
const SEARCH_KEYWORDS = [
  "백엔드 개발자",
  "프론트엔드 개발자",
  "풀스택 개발자",
  "데이터 엔지니어",
  "AI 엔지니어",
  "DevOps",
  "신입 개발자",
  "IT 엔지니어",
  "소프트웨어 엔지니어",
  "앱 개발자",
];

// 크롤러 함수들 (기존 코드 활용)
async function crawlSaramin(keyword: string): Promise<JobData[]> {
  const jobs: JobData[] = [];

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("searchType", "search");
    searchParams.set("searchword", keyword);
    searchParams.set("recruitPage", "1");
    searchParams.set("recruitSort", "relation");
    searchParams.set("recruitPageCount", "40");

    const url = `https://www.saramin.co.kr/zf_user/search/recruit?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      console.error(`Saramin fetch failed: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // 간단한 정규식 파싱 (cheerio 없이)
    const itemRegex =
      /<div class="item_recruit"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
    const titleRegex = /<a[^>]*class="[^"]*job_tit[^"]*"[^>]*>([^<]+)<\/a>/;
    const companyRegex =
      /<a[^>]*class="[^"]*corp_name[^"]*"[^>]*>([^<]+)<\/a>/;
    const urlRegex = /<a[^>]*href="([^"]+)"[^>]*class="[^"]*job_tit/;

    let match;
    let index = 0;
    while ((match = itemRegex.exec(html)) !== null && index < 20) {
      const itemHtml = match[1];

      const titleMatch = titleRegex.exec(itemHtml);
      const companyMatch = companyRegex.exec(itemHtml);
      const urlMatch = urlRegex.exec(itemHtml);

      if (titleMatch && companyMatch) {
        const title = titleMatch[1].trim();
        const company = companyMatch[1].trim();
        const relativeUrl = urlMatch ? urlMatch[1] : "";
        const jobUrl = relativeUrl.startsWith("http")
          ? relativeUrl
          : `https://www.saramin.co.kr${relativeUrl}`;

        jobs.push({
          id: `saramin_${keyword}_${index}_${Date.now()}`,
          title,
          company,
          url: jobUrl,
          source: "saramin",
          location: "미정",
          experienceLevel: "미정",
        });
        index++;
      }
    }

    console.log(`  [사람인] "${keyword}": ${jobs.length}건`);
  } catch (error) {
    console.error(`  [사람인] "${keyword}" 에러:`, error);
  }

  return jobs;
}

async function crawlWanted(keyword: string): Promise<JobData[]> {
  const jobs: JobData[] = [];

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("country", "kr");
    searchParams.set("job_sort", "job.latest_order");
    searchParams.set("locations", "all");
    searchParams.set("limit", "20");
    searchParams.set("years", "-1");

    const url = `https://www.wanted.co.kr/api/v4/jobs?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
        Referer: "https://www.wanted.co.kr/",
      },
    });

    if (!response.ok) {
      console.error(`Wanted fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const jobList = data?.data || [];

    jobList.forEach(
      (
        item: {
          id: number;
          position?: string;
          company?: { name?: string };
          address?: { full_location?: string };
        },
        index: number
      ) => {
        if (index >= 20) return;
        const title = item.position || "";
        const company = item.company?.name || "";
        const jobId = item.id;

        if (title && company && jobId) {
          jobs.push({
            id: `wanted_${jobId}`,
            title,
            company,
            location: item.address?.full_location || "미정",
            url: `https://www.wanted.co.kr/wd/${jobId}`,
            source: "wanted",
          });
        }
      }
    );

    console.log(`  [원티드] "${keyword}": ${jobs.length}건`);
  } catch (error) {
    console.error(`  [원티드] "${keyword}" 에러:`, error);
  }

  return jobs;
}

async function crawlJumpit(keyword: string): Promise<JobData[]> {
  const jobs: JobData[] = [];

  try {
    const searchParams = new URLSearchParams();
    searchParams.set("page", "1");
    searchParams.set("sort", "rsp_rate");

    const url = `https://api.jumpit.co.kr/api/positions?${searchParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
        Referer: "https://www.jumpit.co.kr/positions",
      },
    });

    if (!response.ok) {
      console.error(`Jumpit fetch failed: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const jobList = data?.result?.positions || [];

    jobList.forEach(
      (
        item: {
          id: number;
          title?: string;
          companyName?: string;
          locations?: string[];
          techStacks?: Array<string | { name: string }>;
        },
        index: number
      ) => {
        if (index >= 20) return;
        const jobId = item.id;
        const title = item.title || "";
        const company = item.companyName || "";

        if (title && company && jobId) {
          const skills = (item.techStacks || []).map((t) =>
            typeof t === "string" ? t : t.name
          );

          jobs.push({
            id: `jumpit_${jobId}`,
            title,
            company,
            location: item.locations?.join(", ") || "미정",
            skills,
            url: `https://www.jumpit.co.kr/position/${jobId}`,
            source: "jumpit",
          });
        }
      }
    );

    console.log(`  [점핏] "${keyword}": ${jobs.length}건`);
  } catch (error) {
    console.error(`  [점핏] "${keyword}" 에러:`, error);
  }

  return jobs;
}

// 중복 제거
function deduplicateJobs(jobs: JobData[]): JobData[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${job.company}_${job.title}`.toLowerCase().replace(/\s+/g, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// DB에 저장 (upsert)
async function saveJobsToDb(jobs: JobData[]): Promise<{ created: number; updated: number }> {
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
        // 업데이트
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
        // 생성
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

// 크롤링 로그 저장
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

// 메인 함수
async function main() {
  console.log("=".repeat(60));
  console.log("채용공고 배치 크롤링 시작");
  console.log(`시작 시간: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const startTime = Date.now();
  const allJobs: JobData[] = [];
  let totalFound = 0;

  // 각 키워드별로 크롤링
  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`\n[키워드: ${keyword}]`);

    // 병렬 크롤링 (3개 소스)
    const [saraminJobs, wantedJobs, jumpitJobs] = await Promise.all([
      crawlSaramin(keyword),
      crawlWanted(keyword),
      crawlJumpit(keyword),
    ]);

    allJobs.push(...saraminJobs, ...wantedJobs, ...jumpitJobs);
    totalFound += saraminJobs.length + wantedJobs.length + jumpitJobs.length;

    // Rate limiting (원천 사이트 부하 방지)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 중복 제거
  console.log("\n" + "-".repeat(60));
  console.log(`총 크롤링: ${totalFound}건`);
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
    "all",
    "success",
    totalFound,
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
    console.error("크롤링 실패:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
