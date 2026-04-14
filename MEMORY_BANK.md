# Memory Bank - english-with-me

## 프로젝트 개요
- **시작일**: 2026-04-13
- **프로젝트명**: English With Me
- **타입**: 개인 프로젝트
- **목표**: 영어 학습 활동(한국어→영어 변환, 스피킹 연습 등)을 하나의 앱으로 통합. 개인 영어 롤모델 스타일 일관 적용.
- **Tech Stack**: Expo (React Native), FastAPI (Python), PostgreSQL, Claude API
- **Distribution**: iOS (TestFlight) + Mac
- **Status**: 개발 중 — v1 기능 완료, TestFlight 배포 전 마무리 단계

### 핵심 기능 (우선순위 순)
1. **Convert Mode** — 한국어 입력 → 카테고리/상황별 영어 표현 여러 옵션 (v1 ✅)
2. **History** — 변환 기록 로그, 검색(한국어+영어) 가능 (v1 ✅)
3. **Settings** — 영어 롤모델 프로필, 활성 모드 관리, 테마 선택 (v1 ✅)
4. **Learn Mode** — 카테고리/컨텍스트 선택 → AI 유용한 표현 5개 생성 (v1 ✅)
5. **Review Mode** — 변환 기록 기반 플래시카드 복습 (v1 ✅)
6. **Speaking Practice** — 발음 피드백 (v2)
7. **To-do Integration** — 앱 내 to-do 관리 (v2)
8. **Podcast Study Mode** — TBD (v2)

### 향후 목표 (v2+)
- Speaking practice: 녹음 → AI 발음 교정
- To-do 앱 내 통합 관리
- Podcast 공부 모드
- 퍼블릭 배포 (앱 퀄리티 보고 결정)

---

## ⚠️ 세션 시작 시 반드시 읽기

새 세션 시작 전 아래 파일들을 먼저 읽어야 함:

1. **`.impeccable.md`** — 디자인 컨텍스트. `/teach-impeccable` 실행 후 생성 예정.
2. **`.taskmaster/docs/prd.md`** — 최신 PRD. 현재 구현 상태, 기능 명세, 설계 결정 포함.

## ⚠️ 세션 종료 전 반드시 할 것

- PRD(`.taskmaster/docs/prd.md`)에 이번 세션의 변경사항 업데이트

---

## 주요 결정사항

### 2026-04-13 — 설계 확정 (인터뷰 기반)

- **플랫폼**: Expo (React Native) — iOS (TestFlight) + Mac. v1부터 네이티브.
- **모델**: OpenAI (v1, 크레딧 보유) → Claude API로 교체 예정 (LangChain 덕에 코드 변경 최소화)
- **인증**: v1은 hardcoded user ID. 멀티 디바이스 대비 user 기반 구조.
- **영어 롤모델**: 유저가 자유 텍스트로 기술. 모든 AI 출력에 일관 적용.
- **Convert 출력 형식**: 상황별 2-3개 옵션 (표현 + 상황 레이블 + 간단한 설명)
- **To-do 통합**: v1은 변환만 (배우는 용도). 앱 내 to-do 관리는 v2.
- **Speaking practice**: v2. 변환 로그 기반 암기 확인 → 발음 교정. 대안 표현은 그 이후.
- **변환 로그**: 자동 저장 (별도 저장 액션 없음). History 화면에서 탐색 가능.

---

## 진행 상황

### 2026-04-13 — 프로젝트 시작 + Task 1~5 완료

**완료된 것:**
- /interview-me로 설계 확정, PRD 작성 완료
- Task Master 초기화 (10개 task, OpenAI provider)
- `.impeccable.md` 생성 (Calm · Clear · Capable, warm coral-terracotta)
- PostgreSQL 16 설치 + `english_with_me` DB 생성
- FastAPI 백엔드 세팅 (SQLAlchemy, `users` + `conversions` 테이블 자동 생성)
- Expo 프론트엔드 세팅 (TypeScript, expo-router)
- `GET/PATCH /users/me` API 완성 + 테스트
- 커스텀 햄버거 드로어 메뉴 구현 (Animated + Modal)
- Convert Mode 전체 구현 (4개 preset, LangChain + GPT-4o)
- Mode 시스템: speaking / messaging / email / writing (4종)
- In Academia preset 추가 (남편 대학원 사용 케이스)
- Work Email sub-category 추가
- History 화면 구현 (검색, 펼치기/접기, tap-to-copy)
- Expo Go 실기기(iPhone) 테스트 완료 — 핫스팟 경유

**네비게이션 구조 확정:**
- Bottom tab bar → 커스텀 햄버거 메뉴로 교체
- 이유: Convert 중 다른 메뉴가 보이면 집중 방해. 메뉴는 필요할 때만 노출.
- 카테고리(At Work / In Academia / With Friends / To-do list)를 메뉴 최상단에 직접 노출

**중요 설계 결정:**
- `presets.ts` = 모든 preset 데이터의 single source of truth. 각 screen은 여기서 import만 함.
- `BASE_URL` in `api.ts`: 네트워크 바꿀 때마다 Mac IP 업데이트 필요 (개발 환경 한계)

### 2026-04-14 — Design System + Learn/Review + Settings 개선

**완료된 것:**
- `ThemeContext` 도입: Light / Dark / Warm 3종 테마, AsyncStorage 영속
- `constants/colors.ts` 전면 개편: AppScheme 타입, P palette (0–10), getChipStyle / getPaletteStyle / getPresetStyle
- 모든 스크린 하드코딩 색상 → 토큰 교체 완료
- **Learn Mode** 화면 완성 (`app/(app)/learn.tsx` + `POST /learn` 백엔드)
- **Review Mode** 화면 완성 (`app/(app)/review.tsx` — 히스토리 기반 플래시카드)
- **Warm 테마** 정의: parchment (#F0EDEA) + white cards (#FFFFFF) 모티브
- "Add details" 기능 추가 (Convert + Learn — 선택적 상황 설명 입력)
- Learn 화면: enabled_modes 기반 카테고리 필터링 (Settings 비활성화 반영)
- Settings — Display: 3-way segmented control (Light / Dark / Warm), 테마 전환 flash 제거
- Settings — Sticky Save bar: 변경사항 있을 때만 하단 고정 노출
- `ExpressionCard` 컴포넌트 추출: Convert + Learn에서 공유 (중복 스타일 제거)
- `useMemo(() => makeStyles(c), [scheme])` 패턴 전 스크린 적용

**용어 확정:**
- **Category**: 메뉴 preset (At Work / In Academia / With Friends / To-do list)
- **Context**: sub-category 칩 (In-person / Video call / Slack / 등)
- **Details**: Convert/Learn 화면의 선택적 추가 설명 입력 (이전: "Add context" → 이름 충돌로 변경)

---

## 이슈 & 해결

- **Task Master provider**: `anthropic` → 터미널에서 이슈 → `openai`로 유지 (Study With Me와 동일한 패턴)
- **iOS 시뮬레이터**: Xcode 26 (beta) + Expo Go 설치 중 충돌 → 웹으로 대체 개발 중. 안정 Xcode 출시 후 재시도.
- **react-native-web 설치 충돌**: `react@19.1.0` vs `react-dom@19.2.5` peer 충돌 → `--legacy-peer-deps`로 해결
- **expo-linking 누락**: expo-router 사용 시 수동 설치 필요 (`npx expo install expo-linking`)
- **@react-navigation/drawer 웹 불가**: reanimated → react-native-worklets 미지원 → 커스텀 drawer로 교체 (Animated + Modal)
- **index.ts 진입점**: blank template는 App.tsx 사용 → expo-router 사용 시 `import "expo-router/entry"`로 교체 필요
- **TextInput 색상 iOS 시스템 다크 + 앱 라이트 충돌**: 시스템 다크 모드가 네이티브 레벨에서 TextInput 텍스트 색 override → inline `style={{ color: c.textPrimary }}` + `key={scheme}` remount로 해결
- **"Two children with same key $warm" 에러**: 같은 부모에 `key={scheme}`인 View + TextInput이 같은 키 공유 → TextInput에 `key={\`rolemodel-${scheme}\`}` 로 구분
- **Segmented control 전환 시 flash**: `key={scheme}` on container → 스킴 변경 시 전체 remount로 해결
- **`useCallback` stale closure**: `details` 상태가 deps 배열 누락 → 항상 초기값(`""`) 사용. `details` 추가로 해결.
- **Review 텍스트 overflow**: 긴 표현이 카드 밖으로 삐져나옴 → outputs를 `ScrollView` + `flex: 1` 컨테이너로 감싸서 해결

---

## 다음 단계

- [x] Task 1: 프로젝트 세팅 (Expo + FastAPI + PostgreSQL)
- [x] Task 2: User Profile API + Settings 화면
- [x] Task 10: `.impeccable.md` 디자인 컨텍스트
- [x] Task 3: Convert Mode UI
- [x] Task 4: Conversion Logic (LangChain + GPT-4o, 롤모델 적용)
- [x] Task 5: Conversion Log / History 화면
- [x] Learn Mode 화면 (카테고리/컨텍스트 선택 → 표현 5개 생성)
- [x] Review Mode 화면 (히스토리 기반 플래시카드)
- [x] Design System (ThemeContext + 3종 테마 + 색상 토큰 전면 교체)
- [ ] TestFlight 배포 (backend Railway 배포 → Apple Developer 등록 → TestFlight 업로드)
- [ ] 하루 사용 후 피드백 반영
- [ ] Task 6: Copy & Edit 기능 (v1 필요 여부 재검토)
