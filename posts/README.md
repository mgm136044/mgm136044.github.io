# 포스트 작성 가이드

이 폴더에는 블로그, 연구, 공부 페이지의 Markdown 포스트가 저장됩니다.

## 폴더 구조

```
posts/
├── blog/          # 블로그 포스트
│   ├── index.json # 포스트 목록
│   └── *.md       # Markdown 포스트 파일
├── research/      # 연구 포스트
│   ├── index.json
│   └── *.md
└── study/         # 공부 포스트
    ├── index.json
    └── *.md
```

## 포스트 작성 방법

### 1. Markdown 파일 생성

각 폴더에 `.md` 파일을 생성합니다. 파일명은 날짜 형식을 권장합니다:
- `2026-01-15-post-title.md`

### 2. YAML Frontmatter 작성

파일 상단에 메타데이터를 작성합니다:

```markdown
---
title: 포스트 제목
date: 2026-01-15
tags: [태그1, 태그2]
description: 포스트 설명 (선택사항)
---
```

### 3. 본문 작성

Frontmatter 아래에 Markdown 형식으로 본문을 작성합니다:

```markdown
---
title: 첫 번째 포스트
date: 2026-01-15
tags: [개발, 생각]
---

# 제목

본문 내용을 여기에 작성합니다.

## 소제목

- 리스트 항목 1
- 리스트 항목 2

**굵은 글씨**와 *기울임*도 사용 가능합니다.

\`\`\`python
def hello():
    print("Hello, World!")
\`\`\`
```

### 4. index.json 업데이트

포스트를 추가한 후, 해당 폴더의 `index.json` 파일에 포스트 정보를 추가합니다:

```json
{
  "posts": [
    {
      "filename": "2026-01-15-post-title.md",
      "title": "포스트 제목",
      "date": "2026-01-15",
      "description": "포스트 설명",
      "tags": ["태그1", "태그2"]
    }
  ]
}
```

**중요:** `filename`은 실제 파일명과 정확히 일치해야 합니다.

## Markdown 문법

지원되는 Markdown 문법:

- **제목**: `# H1`, `## H2`, `### H3`
- **강조**: `**굵게**`, `*기울임*`
- **리스트**: `- 항목` 또는 `1. 항목`
- **코드**: `` `인라인 코드` ``
- **코드 블록**: ` ```언어 `로 감싸기
- **링크**: `[텍스트](URL)`
- **이미지**: `![alt](이미지URL)`
- **인용**: `> 인용문`
- **표**: Markdown 표 문법

## 포스트 추가 예시

1. `posts/blog/2026-01-20-new-post.md` 파일 생성
2. Frontmatter와 본문 작성
3. `posts/blog/index.json`에 포스트 정보 추가
4. GitHub에 커밋 및 푸시

## 팁

- 파일명은 날짜 형식(`YYYY-MM-DD-title.md`)을 권장합니다
- 태그는 배열 형식으로 작성합니다: `[태그1, 태그2]`
- GitHub 웹 에디터에서도 직접 편집 가능합니다
- 포스트는 날짜순으로 정렬됩니다 (최신순)
