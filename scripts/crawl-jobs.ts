/**
 * [비활성화] 배치 크롤링 스크립트
 *
 * 이 스크립트는 법적 리스크(저작권법 제93조, 부정경쟁방지법)로 인해 비활성화되었습니다.
 * - Issue #26: 크롤러 비활성화 및 아웃링크 방식 전환
 * - 기존: 사람인/원티드/점핏 HTML/API 크롤링 → DB 저장
 * - 현재: 공공기관 채용정보 API만 사용 (scripts/fetch-jobs-api.ts)
 *
 * 채용공고 데이터는 다음 방식으로 확보합니다:
 * 1. 공공기관 채용정보 API (data.go.kr) - scripts/fetch-jobs-api.ts
 * 2. 아웃링크 방식으로 각 채용사이트 검색 URL 제공 (UI에서 처리)
 */

console.log("=".repeat(60));
console.log("[비활성화] 이 크롤링 스크립트는 법적 리스크로 비활성화되었습니다.");
console.log("대신 scripts/fetch-jobs-api.ts (공공기관 채용정보 API)를 사용하세요.");
console.log("=".repeat(60));
process.exit(0);
