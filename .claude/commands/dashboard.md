# 개발 현황 대시보드

에이전트들의 현재 작업 현황을 확인합니다.

## 수행할 작업

dashboard.sh 스크립트를 실행하여 현황을 확인하세요:

```bash
./dashboard.sh
```

또는 아래 명령어들을 개별 실행:

### PM 에이전트 현황 (이슈)
```bash
gh issue list --repo gyuturn/cruit --state open
```

### 개발자 에이전트 현황 (브랜치)
```bash
git branch -a
git status
```

### PR 현황
```bash
gh pr list --repo gyuturn/cruit --state open
```

### 배포 현황
```bash
git log main --oneline -5
```
