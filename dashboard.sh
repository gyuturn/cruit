#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

REPO="gyuturn/cruit"

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║           🚀 CRUIT 개발 현황 대시보드                        ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. PM 에이전트 현황 - GitHub 이슈
# ═══════════════════════════════════════════════════════════════
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📋 PM 에이전트 현황 (GitHub Issues)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 열린 이슈 수
OPEN_ISSUES=$(gh issue list --repo $REPO --state open --json number 2>/dev/null | jq length 2>/dev/null || echo "0")
CLOSED_ISSUES=$(gh issue list --repo $REPO --state closed --json number 2>/dev/null | jq length 2>/dev/null || echo "0")

echo ""
echo -e "  ${GREEN}● 열린 이슈:${NC} ${OPEN_ISSUES}개"
echo -e "  ${BLUE}● 완료된 이슈:${NC} ${CLOSED_ISSUES}개"
echo ""

if [ "$OPEN_ISSUES" != "0" ] && [ "$OPEN_ISSUES" != "" ]; then
    echo -e "  ${YELLOW}▶ 열린 이슈 목록:${NC}"
    gh issue list --repo $REPO --state open --limit 10 2>/dev/null | while read line; do
        echo -e "    $line"
    done
else
    echo -e "  ${GREEN}✓ 모든 이슈가 완료되었습니다${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 2. 개발자 에이전트 현황 - 브랜치 & 작업
# ═══════════════════════════════════════════════════════════════
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}👨‍💻 개발자 에이전트 현황 (Branches & Work)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 현재 브랜치
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
echo ""
echo -e "  ${GREEN}● 현재 브랜치:${NC} $CURRENT_BRANCH"

# Feature 브랜치 목록
echo ""
echo -e "  ${YELLOW}▶ Feature 브랜치:${NC}"
FEATURE_BRANCHES=$(git branch -a 2>/dev/null | grep -E "feature/|fix/|refactor/" | sed 's/^[ *]*/    /')
if [ -z "$FEATURE_BRANCHES" ]; then
    echo -e "    ${BLUE}(없음)${NC}"
else
    echo "$FEATURE_BRANCHES"
fi

# 로컬 변경사항
echo ""
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGES" != "0" ]; then
    echo -e "  ${RED}● uncommitted 변경사항:${NC} ${CHANGES}개 파일"
    git status --short 2>/dev/null | head -5 | while read line; do
        echo -e "    $line"
    done
    if [ "$CHANGES" -gt 5 ]; then
        echo -e "    ... 외 $((CHANGES - 5))개"
    fi
else
    echo -e "  ${GREEN}● uncommitted 변경사항:${NC} 없음"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 3. PR 현황
# ═══════════════════════════════════════════════════════════════
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}🔀 Pull Request 현황${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

OPEN_PRS=$(gh pr list --repo $REPO --state open --json number 2>/dev/null | jq length 2>/dev/null || echo "0")
MERGED_PRS=$(gh pr list --repo $REPO --state merged --json number --limit 100 2>/dev/null | jq length 2>/dev/null || echo "0")

echo ""
echo -e "  ${GREEN}● 열린 PR:${NC} ${OPEN_PRS}개"
echo -e "  ${BLUE}● 머지된 PR:${NC} ${MERGED_PRS}개"
echo ""

if [ "$OPEN_PRS" != "0" ] && [ "$OPEN_PRS" != "" ]; then
    echo -e "  ${YELLOW}▶ 열린 PR 목록:${NC}"
    gh pr list --repo $REPO --state open --limit 10 2>/dev/null | while read line; do
        echo -e "    $line"
    done
else
    echo -e "  ${GREEN}✓ 대기 중인 PR이 없습니다${NC}"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 4. 배포 현황
# ═══════════════════════════════════════════════════════════════
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}🚀 배포 현황 (Recent Commits on main)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "  ${YELLOW}▶ 최근 커밋 (main 브랜치):${NC}"
git log main --oneline -5 2>/dev/null | while read line; do
    echo -e "    $line"
done
echo ""

# main과 현재 브랜치 차이
if [ "$CURRENT_BRANCH" != "main" ]; then
    AHEAD=$(git rev-list --count main..$CURRENT_BRANCH 2>/dev/null || echo "0")
    BEHIND=$(git rev-list --count $CURRENT_BRANCH..main 2>/dev/null || echo "0")
    echo -e "  ${BLUE}● main 대비:${NC} +${AHEAD} commits ahead, -${BEHIND} commits behind"
fi
echo ""

# ═══════════════════════════════════════════════════════════════
# 5. 워크플로우 요약
# ═══════════════════════════════════════════════════════════════
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}📝 다음 액션 가이드${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 상황별 가이드
if [ "$OPEN_ISSUES" == "0" ] || [ "$OPEN_ISSUES" == "" ]; then
    echo -e "  ${YELLOW}💡 새 기능이 필요하다면:${NC}"
    echo -e "     /pm [요구사항] 으로 이슈 생성"
fi

if [ "$OPEN_ISSUES" != "0" ] && [ "$CURRENT_BRANCH" == "main" ]; then
    echo -e "  ${YELLOW}💡 개발을 시작하려면:${NC}"
    echo -e "     /dev-start [이슈번호] 로 개발 시작"
fi

if [ "$CHANGES" != "0" ]; then
    echo -e "  ${YELLOW}💡 변경사항이 있다면:${NC}"
    echo -e "     /dev-pr [이슈번호] 로 PR 생성"
fi

if [ "$OPEN_PRS" != "0" ]; then
    echo -e "  ${YELLOW}💡 PR이 준비되었다면:${NC}"
    echo -e "     /deploy [PR번호] 로 배포"
fi

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    대시보드 업데이트 완료                     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
