# 이슈 목록 확인

GitHub 이슈 현황을 확인합니다.

## 수행할 작업

1. **전체 이슈 목록 확인**
   ```bash
   gh issue list --repo gyuturn/cruit --state all --limit 20
   ```

2. **열린 이슈만 확인**
   ```bash
   gh issue list --repo gyuturn/cruit --state open
   ```

3. **나에게 할당된 이슈**
   ```bash
   gh issue list --repo gyuturn/cruit --assignee @me
   ```

4. **결과 요약**
   - 열린 이슈 수
   - 각 이슈의 제목, 번호, 라벨
   - 우선순위별 정리
