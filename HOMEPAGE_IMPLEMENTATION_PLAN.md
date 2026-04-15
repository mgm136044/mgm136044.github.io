# Homepage Implementation Plan

작성일: 2026-04-14  
대상 저장소: `/Users/mingyeongmin/development/mgm136044.github.io`

## 1. 목표

이 프로젝트의 목표는 현재의 정적 HTML 중심 개인 사이트를 `React` 기반 구조로 재구성하고, 최종적으로 `mingyeongmin.com`에서 운영 가능한 형태로 전환하는 것이다. 단순히 디자인만 바꾸는 것이 아니라 아래 문제를 같이 해결해야 한다.

- 현재 분산된 페이지 구조를 컴포넌트 기반으로 정리한다.
- 블로그, 연구, 스터디, 활동 자료 같은 기존 콘텐츠를 유지한다.
- `GitHub Pages 전용 구조`에서 벗어나 `Mac mini 자가 호스팅`까지 고려한 배포 구조를 만든다.
- 이후 콘텐츠 추가가 쉬운 구조로 바꾼다.
- 포트폴리오 사이트다운 정체성과 완성도를 확보한다.

핵심 판단은 다음과 같다.

- 첫 릴리스는 `정적 React 사이트`로 간다.
- 운영 서버는 `Node SSR 서버`가 아니라 `정적 파일 서버 + Caddy`로 시작한다.
- 콘텐츠는 DB나 CMS 없이 `Markdown/JSON` 파일 기반으로 유지한다.
- URL은 장기적으로 `.html` 없는 구조로 정리한다.

## 2. 현재 상태 진단

저장소를 기준으로 확인한 현재 구조는 다음과 같다.

- `index.html`, `blog.html`, `research.html`, `study.html`, `activities.html`, `404.html`
- 공통 스타일은 `styles.css`
- 블로그/연구/스터디는 `js/markdown-loader.js`가 `posts/*/index.json`과 Markdown 파일을 브라우저에서 직접 불러오는 구조
- 활동 자료는 `data/index.json`과 PDF iframe 뷰어를 직접 사용하는 구조
- 빌드 도구, 라우터, 타입 시스템, 테스트, 콘텐츠 스키마 검증이 없다
- SEO 메타는 페이지별로 직접 하드코딩되어 있다

현재 구조의 장점:

- 단순하다
- GitHub Pages 배포가 쉽다
- Markdown 기반 콘텐츠를 이미 일부 갖고 있다

현재 구조의 한계:

- 페이지가 늘수록 공통 레이아웃 재사용이 어렵다
- 스타일과 UI 로직이 여러 페이지에 분산된다
- 콘텐츠 스키마가 느슨해서 누락이나 오타를 빌드 시점에 잡기 어렵다
- `.html` 페이지 중심 구조라 URL과 정보 구조가 투박하다
- Mac mini 자가 호스팅으로 옮겨도 운영 방식이 여전히 수작업 위주가 될 가능성이 높다

## 3. 추천 아키텍처

### 최종 권장안

- 프론트엔드: `Vite + React + TypeScript`
- 라우팅: `react-router-dom`
- 콘텐츠: `Markdown + JSON + 빌드 시점 인덱스 생성`
- 스타일링: `CSS Modules` 또는 `전역 CSS + 컴포넌트 단위 CSS`
- 메타 태그: `react-helmet-async`
- Markdown 렌더링: `react-markdown` + `remark-gfm`
- 정적 자산 서빙: `Caddy`
- 배포 대상: `Mac mini`

### 이 구성을 고르는 이유

1. 지금 사이트는 동적 서버가 꼭 필요한 요구사항이 없다.
2. 포트폴리오/블로그/연구 기록 중심 사이트는 정적 빌드가 가장 단순하고 안정적이다.
3. Mac mini에서 항상 Node 앱을 띄우는 것보다, 빌드된 `dist`를 Caddy가 서빙하는 편이 훨씬 운영 부담이 낮다.
4. React를 쓰면서도 서버 복잡도를 최소화할 수 있다.

### 당장 추천하지 않는 선택

- `Next.js SSR`: 현재 요구 대비 과하다
- DB 기반 CMS: 콘텐츠 양과 운영 방식에 비해 복잡하다
- 완전 실시간 백엔드 도입: 필요성이 아직 없다

## 4. 제품 방향

이 사이트는 일반적인 학생 포트폴리오보다 `연구자 지향 포트폴리오`에 가깝게 가져가는 것이 맞다. 현재 소개 문구와 콘텐츠 카테고리를 보면 중심축은 다음 네 가지다.

- Physical AI
- Embedded Systems
- On-device AI
- Robot Control

따라서 홈페이지는 단순 자기소개보다 아래 인상을 줘야 한다.

- 무엇에 관심 있는 사람인지 명확하다
- 실제로 축적 중인 연구/학습 흔적이 있다
- 프로젝트와 기록이 연결되어 있다
- 개인 블로그가 아니라 `연구 노트 + 포트폴리오`처럼 보인다

### 권장 비주얼 방향

테마 키워드:

- research notebook
- embedded lab
- field manual

구현 원칙:

- 첫 화면에서 이름과 관심 분야가 강하게 보여야 한다
- 화려함보다 밀도와 구조감을 우선한다
- 카드 남발보다는 섹션별 위계와 리듬을 분명히 한다
- 모바일에서 내용이 무너지지 않아야 한다

## 5. 정보 구조

### 라우트 구조

권장 URL은 다음과 같다.

- `/`
- `/about`
- `/projects`
- `/blog`
- `/blog/:slug`
- `/research`
- `/research/:slug`
- `/study`
- `/study/:slug`
- `/activities`
- `/activities/:slug`
- `/contact`

초기에는 `about`, `projects`, `contact`를 홈 내부 섹션으로 두고 별도 페이지를 만들지 않아도 된다. 중요한 것은 기존의 `blog/research/study/activities`를 독립 허브로 유지하는 것이다.

### 홈 화면 구성

홈은 아래 순서가 좋다.

1. Hero
2. Focus Areas
3. Selected Projects
4. Research / Study Highlights
5. Timeline or Current Status
6. Latest Writing
7. Contact

### 각 섹션의 역할

`Hero`

- 이름
- 한 줄 소개
- 관심 분야
- GitHub, Email, CV, Research로 빠르게 이동하는 CTA

`Focus Areas`

- Physical AI
- Embedded
- On-device AI
- Robot Control

`Selected Projects`

- 가장 보여주고 싶은 3개 정도만 노출
- 나머지는 Projects 또는 Activities로 연결

`Latest Writing`

- Blog, Research, Study를 합쳐 최신 항목 몇 개만 보여줌

`Timeline`

- 학교, 연구실, 대회, 수상, 인턴 경험을 간단히 배치

## 6. 콘텐츠 모델

현재 구조를 최대한 버리지 않고 옮기려면 콘텐츠 모델을 먼저 정리해야 한다.

### 공통 Markdown frontmatter

`blog`, `research`, `study` 글은 공통적으로 다음 필드를 가지게 한다.

```yaml
title: ""
slug: ""
date: "2026-04-14"
description: ""
tags: []
category: "blog"
draft: false
featured: false
lang: "ko"
```

### 활동 자료 모델

`activities`는 문서 파일과 설명이 같이 필요하므로 JSON 또는 Markdown + 첨부파일 구조를 유지한다.

권장 필드:

```json
{
  "id": "sic-2025",
  "title": "IAAI 2025 종합 학술대회",
  "date": "2025-11-01",
  "description": "연구 결과 발표 및 은상 수상",
  "category": "conference",
  "file": "/activities/sic-2025.pdf",
  "featured": true
}
```

### 콘텐츠 정리 원칙

- 파일명과 slug를 분리한다
- 날짜 형식은 ISO로 통일한다
- 태그와 카테고리를 제한된 값으로 관리한다
- 대표 포스트와 일반 포스트를 구분할 수 있게 `featured`를 둔다

## 7. 구현 전략

### 전략 개요

한 번에 전면 교체하지 않고 `2단계 마이그레이션`으로 가는 것이 안전하다.

### 1단계: React 셸과 기존 콘텐츠 연결

목적:

- 빠르게 새 UI와 라우팅 구조를 만든다
- 기존 Markdown/JSON 자산을 최대한 유지한다

작업:

- Vite React 프로젝트 생성
- 공통 레이아웃, 헤더, 푸터, 페이지 프레임 구축
- `blog/research/study/activities` 페이지를 React 라우트로 옮김
- 초기에는 기존 `posts/*/index.json`, `data/index.json`을 그대로 읽어 사용
- Markdown 본문은 `fetch + react-markdown`으로 렌더링

장점:

- 현재 자산을 거의 버리지 않는다
- 빠르게 새 사이트를 눈으로 확인할 수 있다
- 마이그레이션 리스크가 낮다

### 2단계: 빌드 시점 콘텐츠 인덱싱

목적:

- 런타임 fetch 의존도를 줄인다
- 콘텐츠 오류를 빌드 단계에서 잡는다
- 검색, 태그, 추천 글 같은 기능의 기반을 만든다

작업:

- `scripts/generate-content-index.mjs` 작성
- Markdown frontmatter를 읽어 category별 index JSON 생성
- 잘못된 필드나 누락된 slug를 빌드 실패로 처리
- 홈 최신 글, featured 글, 태그 목록까지 빌드 산출물로 생성

이 2단계를 마치면 콘텐츠는 여전히 파일 기반이지만 운영 품질은 크게 올라간다.

## 8. 권장 디렉터리 구조

```text
mgm136044.github.io/
  src/
    app/
    components/
    features/
    pages/
    content/
    assets/
    styles/
  public/
    images/
    files/
  scripts/
  dist/
  Caddyfile
  package.json
```

보다 구체적으로는 다음 구성이 좋다.

```text
src/
  app/
    router.tsx
    providers.tsx
  components/
    layout/
    ui/
  features/
    blog/
    research/
    study/
    activities/
    home/
  content/
    blog/
    research/
    study/
    activities/
  pages/
    HomePage.tsx
    BlogListPage.tsx
    BlogPostPage.tsx
    ResearchListPage.tsx
    ResearchPostPage.tsx
    StudyListPage.tsx
    StudyPostPage.tsx
    ActivitiesPage.tsx
    ActivityDetailPage.tsx
    NotFoundPage.tsx
```

## 9. 디자인 및 UI 구현 계획

### 레이아웃

- 상단 네비게이션은 유지하되 더 명확한 섹션 구분 제공
- 모바일에서는 메뉴를 접히는 형태로 변경
- 페이지 폭은 현재처럼 너무 넓지 않게 유지
- 긴 글 읽기 화면은 별도 reading layout 적용

### 컴포넌트 단위

우선 구현할 컴포넌트:

- `SiteHeader`
- `SiteFooter`
- `HeroSection`
- `SectionTitle`
- `Tag`
- `ProjectCard`
- `Timeline`
- `PostList`
- `PostCard`
- `MarkdownRenderer`
- `PdfViewer`
- `EmptyState`

### 시각적 방향

- 기본 배경은 밝게 유지하고, 강조색은 연구/기술 느낌이 나는 제한된 색으로 사용
- 타이포그래피는 산세리프 본문 + 코드성 모노 포인트 조합이 적합
- 카드보다는 라인, 간격, 타이포 위계로 밀도를 만든다
- 애니메이션은 과하게 넣지 말고 page enter, section reveal 정도만 적용

## 10. SEO, 접근성, 성능 기준

### SEO

- 모든 페이지에 title, description, canonical 적용
- Open Graph 이미지 기본값 준비
- `sitemap.xml`, `robots.txt` 생성
- 깨끗한 slug 기반 URL 사용
- 기존 `.html` 페이지는 새 URL로 리다이렉트

### 접근성

- 키보드 탐색 가능
- 명확한 heading 구조
- 이미지 alt 작성
- 명도 대비 확보
- PDF 링크에 파일 형식 명시

### 성능

- 첫 화면 JS 번들 최소화
- 큰 이미지 최적화
- route-level code splitting
- Markdown 목록은 필요한 정보만 먼저 로드

권장 목표:

- Lighthouse Performance 90+
- Accessibility 95+
- 모바일 첫 화면 체감 지연 최소화

## 11. URL 호환성과 리다이렉트 계획

현재 외부에 노출된 URL이 있을 가능성이 있으므로 다음 리다이렉트를 준비한다.

- `/blog.html` -> `/blog`
- `/research.html` -> `/research`
- `/study.html` -> `/study`
- `/activities.html` -> `/activities`
- `/index.html` -> `/`

Mac mini에서 Caddy를 쓰면 이 리다이렉트는 서버에서 처리하면 된다.

## 12. Mac mini 배포 계획

### 배포 방식

첫 운영 버전은 아래 구성이 가장 현실적이다.

- 개발: 로컬 머신
- 빌드: `npm run build`
- 산출물: `dist/`
- 운영 서버: Mac mini
- 웹서버: `Caddy`

### Caddy 역할

- 정적 파일 서빙
- HTTP -> HTTPS 리다이렉트
- Let's Encrypt 인증서 자동 발급
- SPA deep link fallback 처리
- 기존 `.html` URL 리다이렉트

예상 설정 예시는 다음과 같다.

```caddy
mingyeongmin.com, www.mingyeongmin.com {
    encode zstd gzip
    root * /Users/mingyeongmin/sites/mingyeongmin/current/dist

    redir /blog.html /blog 308
    redir /research.html /research 308
    redir /study.html /study 308
    redir /activities.html /activities 308
    redir /index.html / 308

    try_files {path} {path}/ /index.html
    file_server

    header /assets/* Cache-Control "public, max-age=31536000, immutable"
}
```

### 운영 전 체크리스트

- Mac mini 절전 해제
- 공유기 포트포워딩 80, 443 설정
- 공인 IP 또는 DDNS 확보
- DNS를 Mac mini 공인 IP로 변경
- CAA 레코드가 있다면 `letsencrypt.org` 허용

### 배포 자동화 수준

초기:

- 수동 배포로 충분
- `git pull`
- `npm ci`
- `npm run build`
- Caddy가 새 `dist` 서빙

후속:

- `deploy.sh` 작성
- 필요 시 GitHub Actions 또는 self-hosted runner 도입

## 13. 홈서버 운영 리스크와 대응

### 리스크

- 집 인터넷 IP 변경
- 공유기나 Mac mini 재부팅
- 외부에서 80/443 포트 접근 불가
- 인증서 자동 갱신 실패
- 정전 또는 네트워크 불안정

### 대응

- DNS TTL을 짧게 유지
- DDNS 또는 DNS API 자동 갱신 고려
- Mac mini 절전 해제
- launchd로 Caddy 자동 시작
- 필요하면 일시적 대체 배포처를 준비

중요한 판단:

집 서버 운영이 막히면 `프론트엔드 구조`는 그대로 두고 `Vercel`이나 `Cloudflare Pages`로 바로 옮길 수 있어야 한다. 따라서 앱은 처음부터 `정적 호스팅 친화적`으로 설계해야 한다.

## 14. 구현 단계별 일정

### Phase 0. 설계 확정

산출물:

- 정보 구조 확정
- 콘텐츠 모델 확정
- 디자인 방향 보드 확정

완료 기준:

- 어떤 페이지가 필요한지
- 어떤 콘텐츠를 어디에 둘지
- 어떤 URL 체계를 쓸지

### Phase 1. React 기본 골격

산출물:

- Vite + React + TypeScript 프로젝트
- 공통 레이아웃
- 홈 페이지 초안
- 라우터 구성

완료 기준:

- 홈, 블로그 목록, 연구 목록, 스터디 목록, 활동 목록 이동 가능

### Phase 2. 콘텐츠 마이그레이션

산출물:

- 기존 Markdown과 JSON 연동
- 개별 글 페이지 렌더링
- PDF 활동 자료 뷰어 React화

완료 기준:

- 현재 사이트의 모든 핵심 콘텐츠가 React 버전에서도 열림

### Phase 3. 디자인 정교화

산출물:

- 최종 Hero
- 프로젝트 카드
- 타임라인
- 최신 글 섹션
- 모바일 최적화

완료 기준:

- 포트폴리오로 공개 가능한 수준의 시각 완성도 확보

### Phase 4. 운영 품질 보강

산출물:

- SEO 메타
- sitemap
- robots
- 404 처리
- old URL redirect 정책

완료 기준:

- 검색, 공유, 직접 URL 접근 시 문제 없음

### Phase 5. Mac mini 배포

산출물:

- Caddy 설정
- dist 배포 경로
- HTTPS 활성화
- 도메인 연결 완료

완료 기준:

- `https://mingyeongmin.com`과 `https://www.mingyeongmin.com` 모두 정상 동작

## 15. 우선순위 백로그

반드시 먼저 할 것:

1. 기술 스택 확정
2. 새 디렉터리 구조 생성
3. 홈 페이지와 라우터 뼈대 작성
4. 콘텐츠 목록 페이지 마이그레이션
5. 개별 글 렌더러 구현
6. 활동 PDF 뷰어 이관
7. SEO/리다이렉트 추가
8. Mac mini 배포

나중에 해도 되는 것:

- 다국어 지원
- 검색 기능
- 태그 페이지
- 다크모드 세부 커스터마이징
- 분석 도구 연동
- 관리용 CMS

## 16. 완료 정의

다음 조건을 만족하면 1차 구현 완료로 본다.

- 홈이 React 기반으로 재구성되었다
- 블로그, 연구, 스터디, 활동 자료가 모두 새 구조에서 열린다
- 기존 주요 URL이 새 URL로 연결된다
- 모바일과 데스크톱에서 기본 품질이 확보된다
- Mac mini에서 HTTPS로 정상 서빙된다
- 이후 글 추가가 파일 단위 작업으로 가능하다

## 17. 결론

가장 현실적인 방향은 `React로 프론트엔드를 재구성하되, 운영은 정적 사이트처럼 단순하게 유지`하는 것이다. 지금 단계에서 중요한 것은 서버 기술을 복잡하게 고르는 것이 아니라, 현재 쌓여 있는 콘텐츠를 손실 없이 옮기고 장기적으로 관리 가능한 구조를 만드는 것이다.

따라서 구현 순서는 아래 한 줄로 요약할 수 있다.

`정적 HTML -> React 앱 셸 -> 기존 콘텐츠 이관 -> SEO/리다이렉트 정리 -> Mac mini + Caddy 배포`

## 18. 2026-04-15 기준 제약 재점검

아래 항목은 실제 구현 착수 직전에 다시 확인한 제약 사항이다. 계획 자체를 뒤집는 수준의 문제는 없지만, 구현 순서와 배포 방식을 결정하는 조건으로 봐야 한다.

### 로컬 및 코드베이스 제약

- 현재 저장소는 React 프로젝트가 아니라 정적 HTML 사이트다.
- 핵심 파일은 `index.html`, `blog.html`, `research.html`, `study.html`, `activities.html`, `styles.css`, `js/markdown-loader.js`다.
- 따라서 이번 작업은 기존 프로젝트의 단순 리팩터링이 아니라 `React 앱 스캐폴딩 + 단계적 마이그레이션`에 가깝다.
- 기존 콘텐츠는 `posts/*`와 `data/index.json`에 쌓여 있으므로 1차 구현에서는 반드시 이 자산을 그대로 읽을 수 있어야 한다.
- 현재 git 워크트리는 깨끗하지 않다. 확인 당시 untracked는 `.DS_Store`, `Agent.md`, `HOMEPAGE_IMPLEMENTATION_PLAN.md`, `posts/.DS_Store`였다.
- 따라서 커밋 시에는 변경 파일을 명시적으로 선별해야 하며, 광범위한 스테이징은 피하는 것이 안전하다.

### 로컬 툴체인 제약

- 로컬 환경에는 `Node v25.8.2`, `npm 11.12.0`이 있다.
- `caddy`는 아직 설치되어 있지 않다.
- Vite 시작과 빌드는 가능한 환경으로 보이지만, 장기 운영 안정성을 고려하면 `Node 22 LTS` 계열로 맞추는 편이 더 안전하다.
- 따라서 1차 구현은 바로 시작 가능하지만, Mac mini 운영 전에는 `Caddy 설치`가 추가 작업으로 필요하다.

### 배포 및 운영 제약

- `mingyeongmin.com`과 `www.mingyeongmin.com`은 2026-04-15 기준 여전히 GitHub Pages를 가리키고 있다.
- 즉, 현재 프로덕션 도메인은 Mac mini가 아니라 GitHub Pages에 연결된 상태다.
- 따라서 실제 구현 초기에는 `GitHub Pages를 임시 배포처로 유지`하고, 나중에 `Mac mini + Caddy`로 컷오버하는 2단계 배포 전략이 가장 안전하다.
- 현재 저장소에는 `.github/workflows`가 없으므로, React/Vite 빌드 결과를 GitHub Pages에 올리려면 GitHub Actions 워크플로를 새로 추가해야 한다.
- `vite preview`는 운영 서버가 아니므로 최종 배포 방식으로 사용하면 안 된다.
- Mac mini 최종 배포에는 `Caddy`, `공인 DNS`, `외부 80/443 접근`, `공유기 포트포워딩`, `맥미니 절전 해제`가 필요하다.
- 홈서버가 `CGNAT` 환경이면 외부 공개가 막힐 수 있다. 이 경우 Mac mini 직접 호스팅 계획은 수정이 필요하다.

### 기능 범위 제약

- 현재 계획은 `정적 React 사이트` 전제다.
- 따라서 로그인, 관리자 페이지, 댓글, DB 검색, 메일 발송 같은 서버 기능은 기본 범위에 포함되지 않는다.
- 이런 기능이 필요해지면 별도 API 서버나 외부 서비스를 붙여야 한다.

### 라우팅 및 호환성 제약

- React Router 같은 클라이언트 라우팅을 쓰면 최종적으로는 Caddy의 `try_files`로 deep link를 처리할 수 있다.
- 하지만 GitHub Pages를 중간 배포처로 쓸 경우 서버 rewrite를 자유롭게 구성할 수 없으므로, 1차 구현에서는 정적 호스팅 친화적인 방식으로 라우팅을 설계해야 한다.
- 기존 외부 링크를 고려하면 `.html` URL을 곧바로 끊지 말고, 새 구조와 함께 리다이렉트 전략을 유지해야 한다.

### 구현 순서에 대한 최종 판단

- 지금 당장 구현을 막는 치명적 제약은 없다.
- 가장 안전한 진행 방식은 `Vite + React + TypeScript`로 프론트엔드를 먼저 재구성하는 것이다.
- 배포는 당분간 `GitHub Actions 기반 GitHub Pages`를 사용하고, 이후 준비가 끝나면 `Mac mini + Caddy`로 전환한다.
- 즉, 실제 실행 순서는 `React 구조 수립 -> 기존 콘텐츠 이관 -> Pages 임시 배포 -> Mac mini 전환`으로 유지하는 것이 맞다.
