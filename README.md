# Ainocean — 정적 사이트 소스

아임웹에 의존하지 않는 독립 호스팅용 정적 사이트입니다. 빌드 도구나 서버 사이드 로직이
없어서 파일을 그대로 올리면 동작합니다.

## 폴더 구조

```
ainocean-site/
├── index.html              한국어 페이지
├── en.html                 영문 페이지
├── css/
│   └── style.css           전체 스타일 (섹션별로 주석 구분)
├── js/
│   └── main.js             상단 바, 모바일 메뉴, 활성 메뉴 표시, 배경 영상 제어
└── assets/
    ├── img/                일러스트 · 갤러리 사진 · 뉴스 썸네일 · 영상 포스터
    ├── logo/               Ainocean / DIXSoft / ASTI 로고
    ├── partners/           파트너 로고 34개
    └── video/              hero.mp4, contact.mp4
```

## 로컬에서 확인하기

`index.html`을 브라우저로 바로 열어도 대부분 정상 동작합니다. 다만 일부 브라우저는
`file://` 에서 영상 자동재생을 막으므로, 간단한 로컬 서버로 확인하는 편이 정확합니다.

```bash
cd ainocean-site
python3 -m http.server 8000
# http://localhost:8000 접속
```

## 호스팅

정적 호스팅이면 어디든 그대로 올라갑니다 (Cloudflare Pages, Netlify, Vercel,
GitHub Pages, S3 + CloudFront, Nginx 등). 빌드 명령은 없고, 배포 디렉터리를
이 폴더로 지정하면 됩니다.

- 도메인 연결 후 `index.html`, `en.html`의 `<link rel="canonical">` 주소를
  실제 도메인으로 바꿔주세요. 현재는 `https://www.ainocean.com/` 기준입니다.
- `.mp4`에 캐시 헤더를 길게(예: 1년) 주고 HTML은 짧게 주면 재방문 로딩이 빨라집니다.

## 언어 전환

`index.html`(KR) ↔ `en.html`(EN) 두 파일이 같은 레벨에 있습니다. 상대 경로가
두 페이지에서 동일하기 때문에 하위 디렉터리 호스팅이나 로컬 열기에서도 경로가
깨지지 않습니다. `/en/` 형태의 URL을 원하면 `en.html`을 `en/index.html`로 옮기고
그 파일 안의 `assets/`, `css/`, `js/` 경로를 `../` 로 바꿔주면 됩니다.

## 상단 바 앵커

| 메뉴 | 대상 |
|---|---|
| HOME | `#home` (히어로) |
| AI TUTOR | `#ai-tutor` (03 Solution) |
| AIDC | `#aidc` (05 AI Data Center) |
| PARTNER | `#partner` (07 Network) |
| CONTACT | `#contact` (최하단 문의 섹션) |

메뉴를 늘리거나 순서를 바꿀 때는 `index.html`·`en.html`의 `nav.nav` 안 링크와
대상 섹션의 `id`만 맞춰주면 됩니다. 활성 메뉴 표시는 `js/main.js`가 `href="#..."`
를 읽어 자동으로 처리합니다.

## 배경 영상

히어로와 문의 섹션의 영상은 `<video autoplay muted loop playsinline>` 이고,
소스는 `data-src` 에 두었다가 `js/main.js`가 조건을 확인한 뒤 주입합니다.
다음 경우에는 영상 파일을 아예 내려받지 않고 포스터 이미지만 표시합니다.

- 화면 폭 768px 미만
- `prefers-reduced-motion: reduce`
- 데이터 절약 모드(`saveData`) 또는 2G 회선

원본(1920p, 8.5~9Mbps)을 1600px CRF 27로 재인코딩하고 오디오를 제거해
두 편 합계 약 3.8MB입니다. 화질을 더 올리려면 원본에서 CRF 값을 낮춰
다시 인코딩하세요.

```bash
ffmpeg -i 원본.mp4 -an -vf scale=1600:-2 -c:v libx264 -crf 22 \
  -preset slow -pix_fmt yuv420p -movflags +faststart assets/video/hero.mp4
```

포스터 이미지(`assets/img/hero-poster.jpg`, `contact-poster.jpg`)는 각 영상의
첫 프레임입니다. 영상을 교체하면 포스터도 함께 갱신해주세요.

## 파트너 로고 추가·교체

`assets/partners/` 에 파일을 넣고 `index.html`·`en.html`의 `div.lgw` 안에
한 줄 추가하면 됩니다.

```html
<div class="lgi"><img src="assets/partners/파일명.png" alt="회사명" loading="lazy"></div>
```

타일은 높이 고정 + `object-fit:contain` 이라 가로로 길든 정사각형이든 잘리지
않습니다. 로고 파일의 여백은 미리 잘라둔 상태입니다.

한 가지 참고: `theplan-g.png` 는 흰 배경이 파일에 박혀 있고 로고 색도 연한
하늘색이어서 흰 타일 위에서 거의 보이지 않습니다. 배경이 투명한 파일이나 진한
색 버전으로 교체하는 편이 좋습니다.

## 모바일 대응 메모

- 한국어는 기본적으로 글자 단위로 줄바꿈되어 단어가 중간에 끊깁니다. `#ain-app`에
  `word-break:keep-all`을 적용해 어절 단위로 끊기게 했습니다. 문구를 새로 넣을
  때도 이 규칙이 그대로 적용됩니다.
- 넓은 화면에서만 필요한 줄바꿈은 `<br class="nb">` 로 넣었습니다. 900px 이하에서는
  숨겨지고 자연스럽게 흐릅니다. 새 문장을 넣을 때도 같은 방식을 쓰세요.
- 03 비교표는 모바일에서 라벨 열이 사라지고 행 제목이 2열 위를 가로지르는 형태로,
  04 타임라인은 세로 레일 형태로 바뀝니다. `css/style.css` 의 "6) mobile" 구역에
  있습니다.

## 뉴스 섹션

기사 3건은 외부 링크입니다. 링크가 만료되면 `div.nws` 안의 `a.na` 를 수정하고
썸네일은 `assets/img/news-*.jpg` 를 교체하세요. 영문 페이지는 기사가 한국어라
"Read the article (Korean)" 으로 표기해두었습니다.
