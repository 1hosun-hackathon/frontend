# API 연동 변경 요약

백엔드 API(`https://mind-test.store`, 팀 API 명세서 기준(Swagger와 다를 때는 명세서 우선))를 기존 화면에 연결했습니다. 로직은 `src/api/`, `src/hooks/`, `src/context/`에 두고, 화면 파일은 데이터 출처 교체와 꼭 필요한 UI 추가만 했습니다.

## 1. 연결한 API

| 기능 | API | 상태 |
|---|---|---|
| 회원가입 · 아이디 중복 확인 | `POST /auth/signup`, `GET /auth/check-login-id` | 연결 |
| 로그인 · 로그아웃 · 토큰 재발급 | `POST /auth/login`, `/auth/logout`, `/auth/reissue` | 연결 (access token은 메모리, refresh는 쿠키) |
| 회원탈퇴 | `DELETE /users/me` | 연결 |
| 훈련 생성(첨부 포함) | `POST /trainings` (multipart) | 연결 |
| 작업 정보 · 새로고침 복구 | `GET /trainings/{id}` | 연결 |
| 임시 저장 | `PUT /trainings/{id}/temp` | 연결 |
| 초안 제출 · 재검사 · 완료 | `POST /trainings/{id}/draft`, `/revisions`, `/complete` | 연결 |
| 다시 쓰기 시작 | `POST /trainings/{id}/rewrite` | 연결 |
| 분석 상태 · 결과 · 재시도 | `GET /analyses/{id}/status`, `GET /analyses/{id}`, `POST /analyses/{id}/retry` | 연결 (2초 간격 폴링) |
| 훈련 기록 · 상세 · 삭제 | `GET /trainings`, `GET /trainings/{id}/detail`, `DELETE /trainings/{id}` | 연결 |
| 홈 · 대시보드 | `GET /home`, `GET /dashboard` | 연결 |
| 내 정보 | `GET /users/me` | 미연결 (5번) |
| 회차별 분석 목록 | `GET /trainings/{id}/analyses` | 미연결 (5번) |

## 2. 수정한 기존 파일

**로직 파일**

| 파일 | 왜 바꿨는지 | 화면 변화 |
|---|---|---|
| `src/hooks/useAuth.js` | 시연용 로그인을 실제 인증 API로 교체, 아이디 중복 확인 추가 | 없음 |
| `src/hooks/useWriting.js` | 훈련 생성·임시저장·제출·재검사·완료·첨부 업로드를 서버에 연결 | 없음 (안내는 기존 모달) |
| `src/hooks/useRecords.js` | 기록 초기값을 mock 대신 빈 배열로 (서버 값으로 채움) | 없음 |
| `src/hooks/useTimer.js` | 서버 종료 시각(`timerEndsAt`) 기준으로 남은 시간 계산 | 없음 |
| `src/context/TrainingContext.jsx` | 새로고침 복구, 다시 쓰기 시작, 서버 기록·삭제·탈퇴 연결 | 문구 (탈퇴 모달) |
| `vite.config.js` | 개발 중 CORS 우회용 `/api` 프록시 추가 | 없음 |

**화면 파일**

| 파일 | 왜 바꿨는지 | 화면 변화 |
|---|---|---|
| `src/pages/AuthPage.jsx` | 중복 확인 API를 부를 자리가 없었음 | UI 추가 |
| `src/pages/SetupPage.jsx` | 첨부를 파일 이름만 저장해 업로드할 수 없었음 | UI 추가, 문구 |
| `src/pages/ComparisonPage.jsx` | 리포트·강점·보완점·질문이 mock이나 고정 문구였음 | 없음 (값만 서버로) |
| `src/pages/RewritePage.jsx` | 사이드바가 mock이나 고정 문구였음 | 없음 (값만 서버로) |
| `src/components/Criteria.jsx` | mock을 직접 읽어 서버 값을 받을 통로가 없었음 | 없음 (등급이 없으면 숨김) |
| `src/pages/GrowthDashboardPage.jsx` | 시안의 선 그래프와 서버 추이·증감값 연결 | UI 추가, 문구 |
| `src/pages/HomePage.jsx` | 진행 중 훈련을 1건만 표시했음 | UI 추가, 문구 |
| `src/pages/HistoryPage.jsx` | 진행 중 훈련을 1건만 표시했음 | 없음 (기존 목록 행 재사용) |

새 파일: `src/api/*`, `src/hooks/{useServerRecords, trainingSession, timerClock, chartPath}.js`, `.env.production`

## 3. 추가한 UI
- **회원가입**: 아이디 입력칸을 벗어나면 중복 확인, 입력칸 아래에 "사용 가능한 아이디예요" / "이미 사용 중인 아이디예요"
- **새 글 설정**: 첨부 목록(파일 이름 · 크기)과 파일별 빼기(X) 버튼. 더 고르면 이어 붙이기(최대 5개, 10MB, 형식 검사)
- **대시보드**: 시안대로 SVG 선 그래프 2개(자기 사고 구성 · AI 의존도), 범례, 증감 카드 2개("AI 의존 감소율", "자기 구성 증가율"). 색은 `src/hooks/chartPath.js`의 `CHART_COLORS` 한 곳에서 관리
- **홈**: "작성 중인 글" 카드를 목록으로(최대 3건, 상태·날짜 표시) + "진행 중인 글 N개 모두 보기 →"

## 4. 서버 기준으로 바꾼 문구
- 대시보드 세 번째 카드: "훈련 기록 날짜" → **"연속 완료 일수"** (`streakDays`)
- 대시보드 비율 카드 설명: "훈련 기록 평균 · 시연용" → **"최근 훈련 기준"**
- 대시보드 그래프 설명: "…현재 수치는 시연용 예시입니다." → **"최근 훈련에서 나타난 사고 구성의 변화를 살펴보세요."**
- 회원탈퇴 모달: "훈련 기록이 삭제되며…" → **"회원탈퇴를 진행하면 로그아웃됩니다. 작성한 훈련 기록은 삭제되지 않고 보존됩니다."**
- 새 글 설정 첨부 안내: "시연용 파일 선택" → **"파일 선택"**
- 홈 진행 중 카드: "· 임시 저장됨" → **상태(작성 중 / 분석 중 / 분석 완료 / 다시 쓰기 중) · 날짜**
- 비교 분석 질문: 고정 2개 → 서버 질문 전부(①②③…)

## 5. 연결하지 않은 API
- **`GET /users/me`**: 마이페이지의 아이디와 완료 편수는 로그인 응답과 완료 목록 개수로 이미 같은 값을 보여주고, 가입일은 표시할 자리가 없음. 연결하려면 MyPage 값 출처만 바꾸면 됨(`getMe`는 `src/api/home.js`에 있음)
- **`GET /trainings/{id}/analyses`**: 비교 분석 화면이 최신 분석 1개만 보여주는 구조라 회차별 이력을 표시할 UI가 없음. 연결하려면 회차 선택 UI를 추가하고, 선택한 `analysisId`로 `GET /analyses/{id}` 호출

## 6. 백엔드 확인 필요
- **AI 임시값**: 비교 분석의 강점·보완점·질문·항목 비교가 "[임시] 강점", "[임시] 질문 1"처럼 임시 문자열로 옴. 실제 AI 연동 일정 확인 필요. 프론트는 값만 바뀌면 그대로 표시됨
- **비율 고정값**: 대시보드 trend의 비율이 모든 훈련에서 자기 사고 약 70 / AI 의존 약 30으로 같아 그래프가 평평하게 보이고, 홈의 첫·최근 비율도 같음. 실제 계산값으로 바뀌는지 확인 필요
- **등급·성장 리포트 API 없음**: 항목별 등급(보통→우수)과 완료 화면의 성장 리포트·점수·잘한 점이 API에 없어 mock 유지 중 (비교 분석의 등급은 숨김 처리)
- **writingType 논설문 고정**: 서버 enum이 `논설문`만 허용해 화면 선택(6종)과 상관없이 `논설문`으로 전송 중. enum이 늘어나면 `toServerWritingType` 한 줄만 바꾸면 됨
- **시간대 표시 (UTC)**: `timerEndsAt` 등 시각이 UTC인데 시간대 표시(`Z`) 없이 내려옴. 프론트는 UTC로 해석 중이라, 서버 시간대 설정이 바뀌면 타이머가 어긋남 → 시간대 포함 요청
- **탈퇴 아이디 재사용**: 탈퇴 후 같은 아이디로 가입하면 409 `DUPLICATE_LOGIN_ID`. 탈퇴가 soft delete(`deleted_at`)라 아이디가 남는 것으로 보임. 재사용 허용 여부 결정 필요
- **에러 응답 형식**: 에러 JSON 형식이 명세에 없어 HTTP 상태로만 구분 중(예: 409를 "변경 없음/상태 불일치" 포괄 문구로 안내)
- **첨부 업로드**: 여러 파일 합계가 `max-request-size`(Spring 기본 10MB)를 넘으면 413 가능성, `.txt`·`.md` 허용 여부

## 7. 알아둘 것
- **개발용 Vite 프록시**: `vite.config.js`의 `/api` 프록시는 `npm run dev`에서만 동작함. 배포 시에는 백엔드 CORS 설정(프론트 도메인 허용, `Allow-Credentials`, refresh 쿠키 `SameSite=None; Secure`, 타이머 보정용 `Expose-Headers: Date`) 또는 호스팅의 rewrites 설정이 필요
- **환경변수**: 개발은 `.env.local`(`VITE_API_BASE_URL` 비움 → 프록시 사용, git 제외), 배포 빌드는 `.env.production`(`https://mind-test.store`)
- **node_modules가 레포에 포함돼 있음**: dev 서버를 켤 때마다 `node_modules/.vite` 변경이 잡히므로 커밋할 때 파일을 골라서 add
- **완료 결과 주소**: 완료 후와 대시보드 최근 항목에서 `/completion/{trainingId}`로 이동해, 새로고침해도 상세(`GET /trainings/{id}/detail`)로 복구됨
- **로그아웃·탈퇴·세션 만료 시 초기화**: 작성 중인 글, 첨부, 기록, 진행 중 목록, 선택한 기록, 서버 비율·대시보드 값, sessionStorage trainingId, localStorage 기록 캐시를 모두 비워 다른 계정에 이전 데이터가 보이지 않음
- **남은 제약**: 새로고침하면 선택한 첨부가 사라짐(다시 선택), 시작 후 뒤로가기로 다시 시작하면 훈련이 하나 더 생성됨, 첨부 목록은 작성 화면에 표시하지 않음, 완료 훈련이 적으면 대시보드 성장/집중 항목은 예시 값 표시, 재검사 분석 중인 항목을 이어서 열면 초안 화면으로 감, 서버 문자열 줄바꿈이 일부 `<p>`에서 한 줄로 보임, 분석 결과를 기다리는 중에 로그아웃하면 로그인 화면에 "분석 상태를 확인하지 못했어요" 안내 모달이 한 번 뜰 수 있음(데이터는 섞이지 않음)

## 8. 되돌리는 법
`git checkout dev -- <파일 경로>` (새 파일은 삭제)
