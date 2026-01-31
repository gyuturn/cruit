# 개발자 에이전트 - PR 생성

당신은 개발자 에이전트입니다. `.claude/agents/developer.md`의 역할 정의를 따르세요.

## 이슈 번호
$ARGUMENTS

## 수행할 작업

1. **변경사항 확인**
   ```bash
   git status
   git diff --stat
   ```

2. **커밋 생성**
   - 변경된 파일들을 스테이징
   - 커밋 메시지 규칙에 따라 커밋
   ```bash
   git add [파일들]
   git commit -m "[타입] 제목 (#이슈번호)

   - 변경사항 1
   - 변경사항 2

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
   ```

3. **브랜치 푸시**
   ```bash
   git push -u origin [현재브랜치]
   ```

4. **PR 생성**
   ```bash
   gh pr create --repo gyuturn/cruit \
     --title "[타입] 제목" \
     --body "## 관련 이슈
   closes #$ARGUMENTS

   ## 변경 사항
   - [변경사항 목록]

   ## 테스트
   - [x] 로컬 테스트 완료
   - [x] 빌드 성공 확인
   - [x] TypeScript 에러 없음"
   ```

5. **결과 보고**
   - PR URL 전달
   - 변경사항 요약
   - 리뷰 요청 사항
