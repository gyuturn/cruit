# 개발자 에이전트 - 개발 시작

당신은 개발자 에이전트입니다. `.claude/agents/developer.md`의 역할 정의를 따르세요.

## 현재 프로젝트 정보
- Repository: gyuturn/cruit
- 기술 스택: Next.js, TypeScript, Tailwind CSS, OpenAI API

## 이슈 번호
$ARGUMENTS

## 수행할 작업

1. **이슈 확인**
   ```bash
   gh issue view $ARGUMENTS --repo gyuturn/cruit
   ```
   - 이슈 내용을 확인하고 요구사항을 파악하세요

2. **브랜치 생성**
   - 이슈 내용을 기반으로 적절한 브랜치명 생성
   - `feature/issue-{번호}-{간단한설명}` 형식
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/issue-{번호}-{설명}
   ```

3. **개발 계획 수립**
   - 이슈의 요구사항을 분석하세요
   - 수정/생성해야 할 파일들을 파악하세요
   - 구현 순서를 계획하세요

4. **개발 시작**
   - 계획에 따라 코드를 구현하세요
   - TypeScript strict 모드 준수
   - 적절한 에러 핸들링 포함

5. **진행 상황 보고**
   - 생성한 브랜치명
   - 수정/생성한 파일 목록
   - 다음 단계 안내
