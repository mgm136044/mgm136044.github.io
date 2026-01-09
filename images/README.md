# 프로필 사진 추가 방법

이 폴더에 `profile.jpg` 파일을 추가하세요.

## 지원하는 파일 형식
- `.jpg` 또는 `.jpeg`
- `.png`
- `.webp`

## 권장 사항
- 파일명: `profile.jpg` (현재 HTML에서 이 이름을 사용합니다)
- 크기: 최소 200x200px 이상 (정사각형 권장)
- 용량: 500KB 이하 권장 (로딩 속도 최적화)

## 다른 파일명 사용하기
다른 파일명을 사용하려면 `index.html` 파일의 다음 부분을 수정하세요:

```html
<img src="./images/profile.jpg" alt="민경민 프로필 사진" ... />
```

예: `profile.png`를 사용하려면 `./images/profile.jpg`를 `./images/profile.png`로 변경하세요.
