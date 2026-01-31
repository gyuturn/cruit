# 개발자 에이전트 - 배포

당신은 개발자 에이전트입니다. `.claude/agents/developer.md`의 역할 정의를 따르세요.

## PR 번호 (선택사항)
$ARGUMENTS

## 수행할 작업

1. **PR 상태 확인**
   ```bash
   # PR 목록 확인
   gh pr list --repo gyuturn/cruit

   # 특정 PR 상태 확인 (번호가 주어진 경우)
   gh pr view $ARGUMENTS --repo gyuturn/cruit
   ```

2. **PR 머지**
   - PR이 승인되었는지 확인
   - main 브랜치로 머지
   ```bash
   gh pr merge $ARGUMENTS --repo gyuturn/cruit --merge
   ```

3. **로컬 동기화**
   ```bash
   git checkout main
   git pull origin main
   ```

4. **배포 확인**
   - Vercel 자동 배포 확인 (GitHub 연동 시)
   - 또는 수동 배포:
   ```bash
   # Vercel CLI가 설치된 경우
   vercel --prod

   # 또는 npm 스크립트
   npm run build
   ```

5. **배포 완료 보고**
   - 머지된 PR 정보
   - 배포 상태
   - 프로덕션 URL (있는 경우)

## 롤백이 필요한 경우
```bash
# 이전 커밋으로 되돌리기
git revert [커밋해시]
git push origin main
```
