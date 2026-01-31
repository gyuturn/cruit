# 기능 개발 요청 (통합 워크플로우)

사용자의 요구사항을 받아 PM과 개발자 역할을 순차적으로 수행하여 이슈 생성부터 PR까지 자동으로 처리합니다.

## 요구사항
$ARGUMENTS

---

## 워크플로우 실행

### Phase 1: PM 역할 - 요구사항 분석 및 이슈 생성

1. **요구사항 분석**
   - 위 요구사항을 기술적으로 분석하세요
   - 구현 범위, 영향받는 파일, 구현 방향을 파악하세요

2. **GitHub 이슈 생성**
   - `gh issue create` 명령으로 이슈를 생성하세요
   - 라벨: feature, enhancement, bug 중 적절한 것
   - assignee: gyuturn

   ```bash
   gh issue create --repo gyuturn/cruit \
     --title "[제목]" \
     --body "[분석 내용]" \
     --assignee gyuturn \
     --label "feature"
   ```

3. **생성된 이슈 번호 확인**
   - 이슈 생성 결과에서 이슈 번호를 파악하세요

---

### Phase 2: 개발자 역할 - 개발 및 PR 생성

4. **Feature 브랜치 생성**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/issue-[이슈번호]-[간단설명]
   ```

5. **코드 구현**
   - 이슈의 요구사항에 따라 코드를 구현하세요
   - TypeScript strict 모드 준수
   - 기존 코드 패턴 따르기

6. **커밋 및 푸시**
   ```bash
   git add [수정한 파일들]
   git commit -m "[타입] 제목 (#이슈번호)

   - 변경사항

   Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"

   git push -u origin [브랜치명]
   ```

7. **PR 생성**
   ```bash
   gh pr create --repo gyuturn/cruit \
     --title "[타입] 제목" \
     --body "## 관련 이슈
   closes #[이슈번호]

   ## 변경 사항
   - [변경사항]

   ## 테스트
   - [x] 빌드 성공
   - [x] 기능 동작 확인"
   ```

---

### Phase 3: 결과 보고

8. **완료 보고**
   - 생성된 이슈 URL
   - 생성된 PR URL
   - 변경된 파일 목록
   - 다음 단계 (배포가 필요하면 `/deploy [PR번호]`)
