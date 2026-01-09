# 활동 자료 폴더

이 폴더에는 대회, 프로젝트, 활동 관련 PDF 자료를 저장합니다.

## 폴더 구조

```
data/
├── index.json    # 활동 자료 목록
└── *.pdf         # PDF 파일들
```

## 활동 자료 추가 방법

### 1. PDF 파일 업로드

`data/` 폴더에 PDF 파일을 업로드합니다.

예: `data/iaai-2025-presentation.pdf`

### 2. index.json 업데이트

`data/index.json` 파일에 활동 자료 정보를 추가합니다:

```json
{
  "activities": [
    {
      "id": 1,
      "title": "활동 자료 제목",
      "date": "2026-01-15",
      "description": "활동 자료에 대한 설명을 작성합니다.",
      "filename": "iaai-2025-presentation.pdf",
      "category": "대회"
    },
    {
      "id": 2,
      "title": "다른 활동 자료",
      "date": "2026-01-20",
      "description": "또 다른 활동 자료 설명",
      "filename": "project-report.pdf",
      "category": "프로젝트"
    }
  ]
}
```

### 필드 설명

- **id**: 고유 번호 (각 항목마다 다른 번호 사용)
- **title**: 활동 자료 제목
- **date**: 날짜 (YYYY-MM-DD 형식)
- **description**: 활동 자료 설명 (선택사항)
- **filename**: PDF 파일명 (data 폴더 내의 실제 파일명과 일치해야 함)
- **category**: 카테고리 (예: "대회", "프로젝트", "활동" 등)

### 3. GitHub에 커밋 및 푸시

파일을 추가하고 `index.json`을 업데이트한 후 커밋 및 푸시합니다.

## PDF 파일 권장사항

- 파일명은 영문과 하이픈(-) 사용 권장
- 파일 크기는 10MB 이하 권장 (GitHub 제한)
- PDF는 웹에서 바로 볼 수 있도록 최적화된 형식 권장

## 카테고리 예시

- 대회
- 프로젝트
- 활동
- 발표
- 논문
- 기타

## 접근 방법

활동 자료는 `activities.html` 페이지에서 확인할 수 있습니다:
- 목록에서 활동 자료 클릭
- PDF가 웹 뷰어로 표시됨
- 다운로드 버튼으로 파일 다운로드 가능
