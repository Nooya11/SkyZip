# 하늘채집

> 하루 동안 본 하늘을 채집해 병에 담고, 병 3개를 모아 작은 캐릭터 **볼따구**를 탄생시키는 감성 수집 앱

HTML/CSS/JS 프로토타입을 Capacitor로 감싸 안드로이드 앱으로 배포합니다.
빌드 도구나 프레임워크 없이 `www/` 폴더가 그대로 앱이 됩니다.

## 바로 실행해보기 (브라우저)

```bash
npm install
npm run dev          # → http://localhost:5173
```

- 카메라는 `localhost`에서만 열립니다(보안 컨텍스트). 카메라가 없거나 권한을 거절하면 셔터가 사진 선택으로 바뀝니다.
- **`http://localhost:5173/?debug`** 로 열면 테스트 패널이 나옵니다.
  - 시간대 강제 선택 (새벽/아침/점심/저녁/밤)
  - "가짜 병 +1" — 선택한 시간대의 가짜 하늘 사진·병을 만듭니다. 하루 3병 제한에 걸리지 않아 17종 조합 테스트에 씁니다.
  - 전체 초기화

## 구조

```
www/
  index.html            구름 clipPath 정의 + 진입점
  css/style.css         디자인 시스템 (색·폰트·병·얼굴·화면별 스타일)
  fonts/                로컬 번들 폰트 (npm run fonts 로 생성)
  js/
    app.js              해시 라우터
    nav.js              화면 스택 (안드로이드 뒤로가기와 같은 길을 걷게)
    db.js               IndexedDB (사진은 Blob 저장) + 설정 플래그
    store.js            채집 · 하루 3병 제한 · 볼따구 탄생 로직
    color.js            대표색 추출 · 선형광 블렌딩 · 색 계열 판정
    species.js          볼따구 17종 정의와 판정 규칙
    ui.js               병 / 얼굴 컴포넌트, 모달, 토스트, 아이콘
    debug.js            ?debug 패널
    screens/            onboarding · home · capture · diary · viewer · storage · birth · detail · dex
android/                Capacitor 안드로이드 프로젝트 (CAMERA 권한 추가됨)
```

## 핵심 규칙 구현 메모

| 항목 | 구현 |
| --- | --- |
| 대표색 | 48×48로 줄인 뒤 채널당 3비트(512칸)로 양자화, 가장 붐비는 칸의 평균색. 스포이드는 그 색이 모인 무게중심을 찍음 |
| 촬영 시각 | 색 추출 **후** 캔버스에 직접 인쇄(`'26 09 25  18:42`, Cutive Mono, 필름 주황). 저장된 JPEG에 박혀서 지워지지 않음 |
| 하루 3병 | 오늘 날짜로 만들어진 병 수로 판정. 넘으면 버튼이 "사진만 저장하기"로 바뀌고 안내 문구 표시. 사진은 다이어리에만 저장 |
| 저장 | 사진은 `photos`(다이어리, 영구)와 `bottles`(보관함, 소모형) 양쪽에 남음. 볼따구를 만들면 병만 소모되고 사진은 그대로 |
| 종 판정 | **히든 먼저** → 동일 시간대 ×3 → 서로 다른 시간대 3개 |
| 알록따구 | 세 색이 모두 유채색이고 계열(빨강·노랑·초록·파랑·보라·분홍)이 전부 다를 때 |
| 닮은꼴따구 | 세 색의 CIELAB 색차(ΔE)가 모든 쌍에서 8 미만일 때 |
| 포인트 컬러 | 세 병의 색을 선형광 공간에서 평균. 물감처럼 탁해지지 않고 빛처럼 섞임 |
| 첫 3병 안내 | 생애 첫 병이 3개가 되는 순간 1회만 보관함 사용법 팝업 |

### 기획서에 없어서 임의로 정한 것

- **2+1 조합** (예: 아침 2병 + 밤 1병): 표에 없어서 **두 번 나온 시간대의 동일 시간대 종**(이 예시는 파란따구)으로 태어나게 했습니다. `species.js`의 `judge()` 마지막 줄만 바꾸면 됩니다.
- 볼따구 만들기는 **정확히 3개**를 골라야 활성화됩니다(판정 규칙이 3개 기준이라서).
- 도감에서 못 만난 일반 종은 탭하면 레시피 힌트("새벽 + 아침 + 점심의 하늘을 좋아한대요")를 보여줍니다. 히든은 "색이 부른다"는 힌트만 줍니다.
- 볼따구 이름은 카드 화면에서 이름을 탭하면 바꿀 수 있습니다.

## 캐릭터 일러스트 교체

`www/js/species.js`에서 각 종의 `img`에 투명 PNG 경로를 넣으면 이모티콘 대신 일러스트가 나옵니다.

```js
{ id: 'blue', name: '파란따구', ..., img: 'img/boltagu/blue.png' },
```

도감 실루엣은 `.face--silhouette { filter: brightness(0) }` 한 줄로 처리되니 실루엣 파일은 따로 필요 없습니다.
배경 원의 색(그날 하늘 블렌딩 색)은 PNG 뒤에 그대로 깔립니다.

## 안드로이드 배포 (플레이스토어)

`npx cap init`과 `npx cap add android`, 카메라 권한(`AndroidManifest.xml`)은 이미 되어 있습니다. 남은 단계:

```bash
npm install
npm run sync         # www → android 로 복사 (웹 코드를 고칠 때마다)
npm run android      # Android Studio 열기
```

1. Android Studio에서 실기기(USB 디버깅) 또는 에뮬레이터로 실행 → 첫 실행 때 카메라 권한 허용
2. **Build → Generate Signed App Bundle / APK** → AAB 선택 → 업로드 키 생성 (키스토어 파일과 비밀번호는 절대 잃어버리면 안 됨. 저장소에 커밋하지 말 것)
3. Play Console에서 앱 만들기 → 내부 테스트 트랙에 AAB 업로드
4. 스토어 등록정보: 카메라 권한을 쓰는 이유("하늘 사진 채집")와 개인정보처리방침 URL이 필요합니다. 사진은 기기 안(IndexedDB)에만 저장되고 외부로 나가지 않는다는 점을 적어두면 됩니다.

- 앱 ID: `com.haneulchaejip.app` (`capacitor.config.json`에서 변경 가능. 스토어 첫 업로드 후에는 못 바꿈)
- minSdk 24 / targetSdk 36 (Capacitor 8 기본값)
- 앱 아이콘은 아직 Capacitor 기본 아이콘입니다. `android/app/src/main/res/mipmap-*` 교체 필요 (Android Studio의 Image Asset 도구 추천)
