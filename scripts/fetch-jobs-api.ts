/**
 * 워크넷(고용24) 공공데이터 API 배치 수집 스크립트
 * - 워크넷 API로 채용공고를 수집하여 DB에 저장
 * - GitHub Actions 또는 수동으로 실행
 *
 * 실행 방법:
 *   WORKNET_API_KEY=13832447-... npx tsx scripts/fetch-jobs-api.ts
 *
 * 사전 준비:
 *   고용24(work24.go.kr) > 고객센터 > OPEN-API > 채용정보 서비스 신청 필요
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── 워크넷 API 클라이언트 (인라인) ───────────────────────────
// scripts/ 폴더는 tsconfig에서 제외되므로 @/ 경로를 사용할 수 없어 인라인으로 구현

const WORKNET_API_URL =
  "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do";

interface WorknetJobRaw {
  wantedAuthNo: string;
  company: string;
  title: string;
  sal: string;
  region: string;
  career: string; // N=신입, E=경력, Z=관계없음
  minEdubg: string;
  maxEdubg: string;
  closeDt: string;
  wantedInfoUrl: string;
  basicAddr: string;
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

function mapCareer(career: string): string {
  switch (career?.trim()) {
    case "N":
      return "신입";
    case "E":
      return "경력";
    case "Z":
      return "무관";
    default:
      return career || "미정";
  }
}

function formatEducation(minEdubg: string, maxEdubg: string): string {
  const eduMap: Record<string, string> = {
    "00": "학력무관",
    "01": "초졸이하",
    "02": "중졸",
    "03": "고졸",
    "04": "대졸(2~3년)",
    "05": "대졸(4년)",
    "06": "석사",
    "07": "박사",
  };
  const min = eduMap[minEdubg];
  const max = eduMap[maxEdubg];
  if (!min && !max) return "";
  if (min === max || !max) return min || "";
  if (!min) return max;
  return `${min} ~ ${max}`;
}

async function fetchWorknetJobs(
  keyword: string,
  startPage = 1,
  display = 100
): Promise<WorknetJobRaw[]> {
  const apiKey = process.env.WORKNET_API_KEY;
  if (!apiKey) {
    throw new Error("WORKNET_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const params = new URLSearchParams({
    authKey: apiKey,
    callTp: "L",
    returnType: "XML",
    startPage: String(startPage),
    display: String(display),
    keyword,
  });

  const url = `${WORKNET_API_URL}?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Cruit/1.0 (Job Recommendation Service)",
    },
  });

  if (!response.ok) {
    throw new Error(`워크넷 API 요청 실패: ${response.status}`);
  }

  const xml = await response.text();

  // 에러 응답 체크
  if (xml.includes("<error>") || xml.includes("<messageCd>")) {
    const errorMatch = xml.match(/<error>([^<]+)<\/error>/);
    const msgMatch = xml.match(/<message>([^<]+)<\/message>/);
    throw new Error(
      `워크넷 API 에러: ${errorMatch?.[1] || msgMatch?.[1] || "알 수 없는 에러"}`
    );
  }

  return parseWorknetXml(xml);
}

function parseWorknetXml(xml: string): WorknetJobRaw[] {
  const jobs: WorknetJobRaw[] = [];
  const wantedBlocks = xml.match(/<wanted>([\s\S]*?)<\/wanted>/g) || [];

  for (const block of wantedBlocks) {
    const getText = (tag: string): string => {
      const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
      return match ? match[1].trim() : "";
    };

    const wantedAuthNo = getText("wantedAuthNo");
    const title = getText("title");

    if (wantedAuthNo && title) {
      jobs.push({
        wantedAuthNo,
        company: getText("company"),
        title,
        sal: getText("sal"),
        region: getText("region"),
        career: getText("career"),
        minEdubg: getText("minEdubg"),
        maxEdubg: getText("maxEdubg"),
        closeDt: getText("closeDt"),
        wantedInfoUrl: getText("wantedInfoUrl"),
        basicAddr: getText("basicAddr"),
      });
    }
  }

  return jobs;
}

function mapToJobData(raw: WorknetJobRaw): JobData {
  return {
    id: `worknet_${raw.wantedAuthNo}`,
    title: raw.title,
    company: raw.company,
    location: raw.region || raw.basicAddr || "미정",
    experienceLevel: mapCareer(raw.career),
    education: formatEducation(raw.minEdubg, raw.maxEdubg),
    skills: [],
    salary: raw.sal || "",
    deadline: raw.closeDt || "",
    url:
      raw.wantedInfoUrl ||
      `https://www.work24.go.kr/wk/a/b/1200/dtlReqstView.do?wantedAuthNo=${raw.wantedAuthNo}`,
    source: "worknet",
    summary: "",
  };
}

// ─── 검색 키워드 ──────────────────────────────────────────────

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
  console.log("워크넷 API 배치 수집 시작");
  console.log(`시작 시간: ${new Date().toISOString()}`);
  console.log("=".repeat(60));

  const startTime = Date.now();
  const allJobs: JobData[] = [];
  let totalFound = 0;

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`\n[키워드: ${keyword}]`);

    try {
      const rawJobs = await fetchWorknetJobs(keyword);
      const jobs = rawJobs.map(mapToJobData);
      allJobs.push(...jobs);
      totalFound += jobs.length;
      console.log(`  [워크넷] "${keyword}": ${jobs.length}건`);
    } catch (error) {
      console.error(`  [워크넷] "${keyword}" 에러:`, error);
    }

    // Rate limiting (API 호출 간 1초 대기)
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // 중복 제거
  console.log("\n" + "-".repeat(60));
  console.log(`총 수집: ${totalFound}건`);
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
    "worknet",
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
    console.error("배치 수집 실패:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
