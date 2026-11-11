# API 연동 변경 기록

브랜치: `feat/api-integration` (기준 `dev`) · 백엔드 명세: `openapi.json` (https://mind-test.store/v3/api-docs)

## 기존 파일 수정 기록

### 1. src/hooks/useAuth.js
- **변경 이유**: localStorage에만 저장하던 시연용 로그인을 실제 인증 API(회원가입·로그인·로그아웃·토큰 재발급)에 연결
- **바꾼 곳**
  - import (1~4줄): `useEffect`, `../api/auth`, `../api/client` 추가
  - 파일 상단 (5~12줄): 아이디 형식 정규식, `authErrorMessage` 함수 추가
  - `clearUser` 함수와 `useEffect` 2개 추가: 새로고침하면 `/auth/reissue`로 access token을 복구하고, 재발급이 실패하면 로그아웃 상태로 전환
  - 내부 함수 `signupRequest`, `loginRequest` 추가: 회원가입 성공 시 `/login`으로 이동(자동 로그인 안 함), 로그인 성공 시 `/`로 이동
  - `submitAuth`: 가짜 로그인 4줄을 지우고, 회원가입 검증(아이디 `^[a-z0-9]{4,30}$`, 비밀번호 8자 이상)과 API 호출로 교체
  - `logout`: 첫 줄에 `authApi.logout()` 호출 추가
- **유지한 것**: 반환 객체 키 12개, `submitAuth(e, isSignup)`·`logout()`의 인자와 반환값(undefined), `user`의 `{ id }` 형태, localStorage `user` 키. 화면 파일은 수정하지 않음. 에러는 기존 `authError` 문구 자리에 표시
- **되돌리는 법**: `git checkout dev -- src/hooks/useAuth.js`

### 2. src/hooks/useWriting.js
- **변경 이유**: 새 글 설정 → 초안 작성 → 임시저장 → 초안 제출(분석 상태 확인 반복) 흐름을 훈련 API에 연결
- **바꾼 곳**
  - import: `useRef`, `../api/trainings`, `../api/analyses`, `./trainingSession` 추가. `makeAI`(가짜 AI 글) import 삭제 (`mocks/demoAI.js` 파일은 남겨 둠)
  - 파일 상단: `errorText` 함수 추가 (서버 에러면 서버 메시지, 그 외에는 기본 문구)
  - 인자: `openModal`, `closeModal`을 선택 인자로 추가 (기본값이 있어 기존 호출과 호환)
  - `startNewWriting`: `clearTrainingId()` 1줄 추가
  - `saveDraft`: 기존 2줄을 `saveLocal`로 묶음. 훈련이 있고 초안 제출 전이면 `PUT /trainings/{id}/temp`가 성공한 뒤 실행. 제출 후(다시 쓰기)는 기존처럼 로컬 저장만
  - `resume`: `saved.trainingId`를 sessionStorage에 다시 기록하는 1줄 추가. 이동 조건에 `saved.trainingId` 추가 (훈련이 있으면 `/writing`으로 보내 중복 생성 방지)
  - `begin`: 기존 `update`/`setSeconds`/`navigate`를 `POST /trainings` 성공 후 실행하도록 이동. trainingId를 session과 sessionStorage에 저장. 중복 클릭 방지
  - `submit`: 가짜 AI 글 생성을 `POST /trainings/{id}/draft` → `GET /analyses/{aid}/status` 2초 간격 확인 → `GET /analyses/{aid}`로 교체. `session.ai`에 `aiWriting.content` 저장. `/writing`에 있을 때만 `/analysis`로 이동
  - 내부 함수 `waitForAnalysis`, `retry`, `runAnalysisTask` 추가 (외부에 노출 안 함). 대기와 실패 안내는 기존 CommonModal 사용, 실패 시 "다시 시도" 버튼으로 `POST /analyses/{aid}/retry` 호출, 3분 초과 시 notify로 안내
  - session에 새 필드 추가: `trainingId`, `analysisId`, `pendingAnalysisId`
- **유지한 것**: 반환 객체 키 13개, 각 함수의 인자와 반환값(undefined). `recheck`·`complete`·`downloadText`는 수정하지 않음. 화면 파일과 `models/training.js`는 수정하지 않음
- **되돌리는 법**: `git checkout dev -- src/hooks/useWriting.js`

### 3. src/context/TrainingContext.jsx
- **변경 이유**: useWriting에 모달 열기/닫기 함수를 넘기고, 새로고침 시 초안 작성 화면을 서버 데이터로 복구
- **바꾼 곳** (기존 줄은 삭제·변경 없이 추가만)
  - 7줄 뒤: import 2줄 (`getTraining`, `getTrainingId`)
  - 13줄 뒤: `const { closeModal } = useModalContext();`
  - `useWriting({...})` 호출 안: `openModal,`, `closeModal,` 2줄
  - `useEffect` 1개: `/writing`에서 `session.trainingId`가 없고 sessionStorage에 id가 있으면 `GET /trainings/{id}`로 topic·genre·requirements·minutes·draft를 복구. 서버 상태가 ANALYZING이면 `pendingAnalysisId` 설정. 타이머는 `timerMinutes × 60`으로 다시 시작
- **유지한 것**: Provider가 제공하는 value 키 전부, 기존 로직 줄. 화면 파일은 수정하지 않음
- **되돌리는 법**: `git checkout dev -- src/context/TrainingContext.jsx`

### 4. src/hooks/useAuth.js (추가 수정: logout)
- **변경 이유**: 로그아웃 후 같은 탭에서 다른 계정으로 로그인했을 때, 이전 사용자의 trainingId로 복구 요청을 보내지 않도록 정리
- **바꾼 곳**: import 1줄(`clearTrainingId`) 추가, `logout`의 `authApi.logout()` 다음 줄에 `clearTrainingId();` 1줄 추가 (기존 줄은 변경하지 않음)
- **유지한 것**: `logout()`의 인자와 반환값, 반환 객체 키. 화면 파일은 수정하지 않음
- **되돌리는 법**: `git checkout dev -- src/hooks/useAuth.js` (1번 변경까지 함께 되돌아감. 이 줄만 되돌리려면 위 2줄만 삭제)

### 5. vite.config.js
- **변경 이유**: 백엔드에 CORS 설정이 없어 브라우저가 `localhost:5173`에서 보낸 API 요청을 막음. **개발 전용**으로 Vite dev 서버 프록시를 거쳐 우회
- **바꾼 곳**: 3번째 줄 `export default defineConfig({ plugins: [tailwindcss()] });`를 여러 줄로 펼치고 `server.proxy` 추가 (사용자 승인)
  - `/api` → `https://mind-test.store`, `changeOrigin: true`, `secure: true`
  - `cookieDomainRewrite: { '*': '' }`: refresh 쿠키의 Domain을 제거해 localhost 쿠키로 저장되게 함
- **유지한 것**: `plugins: [tailwindcss()]` 설정과 import 2줄. 다른 설정은 삭제·변경하지 않음. 배포 빌드(`vite build`) 결과에는 영향 없음 (proxy는 dev/preview 서버에서만 동작)
- **함께 바꾼 환경변수** (기존 소스 파일 아님)
  - `.env.local`: `VITE_API_BASE_URL=` (빈 값) → 개발 중에는 `/api/...` 상대 경로로 요청하고 proxy가 전달
  - `.env.production` (새 파일): `VITE_API_BASE_URL=https://mind-test.store` → 배포 빌드에서 사용 (`.env.local`보다 우선 적용됨)
  - `src/api/client.js`는 이미 `VITE_API_BASE_URL ?? ''`를 쓰고 있어 수정하지 않음
- **되돌리는 법**: `git checkout dev -- vite.config.js` (그다음 `.env.local`을 `VITE_API_BASE_URL=https://mind-test.store`로 되돌릴 것)

## 신규 파일 목록과 역할
- `src/api/client.js`: 공통 fetch 래퍼. access token을 메모리에 보관하고, 401이 오면 1회 재발급 후 재시도. `ApiError` 정의
- `src/api/auth.js`: 회원가입, 로그인, 재발급, 로그아웃, 아이디 중복 확인 API
- `.env.local`: `VITE_API_BASE_URL=https://mind-test.store` (`.git/info/exclude`로 git 제외)
- `src/api/trainings.js`: 훈련 생성(multipart, 첨부파일 제외), 작업 정보 조회, 임시저장, 초안 제출 API. writingType을 서버 값으로 바꾸는 함수가 여기 한 곳에 있음
- `src/api/analyses.js`: 분석 상태, 분석 결과, 재시도 API와 `pollAnalysis`(2초 간격, 3분 제한)
- `src/hooks/trainingSession.js`: 진행 중인 trainingId를 sessionStorage에 저장·조회·삭제
- `.env.production`: 배포 빌드용 `VITE_API_BASE_URL=https://mind-test.store` (커밋 대상)

## 나중에 바꿀 것
- **에러 메시지 형식**: `ApiError`가 서버 응답의 `body.message`를 가정함. 명세에 에러 응답 형식이 없어 보류 중이며, 확정되면 `src/api/client.js`의 `ApiError`를 수정
- **writingType 논설문 고정 전송 (A안)**: 서버 enum이 `논설문`만 허용해서 `src/api/trainings.js`의 `toServerWritingType`이 항상 `'논설문'`을 반환함. 백엔드가 enum을 늘리면 `(genre) => genre;`로 한 줄 교체 (B안). 화면 선택지 6개와 `models/training.js`의 기본값은 그대로 둠
- **새로고침 시 글 종류가 "논설문"으로 표시됨**: TrainingContext의 복구 `useEffect`가 `genre`를 서버의 `writingType`으로 채우는데, 위 고정 때문에 항상 논설문. writingType을 B안으로 바꾸면 함께 해결됨
- **첨부파일 업로드 제외**: `createTraining`이 `files` 부분을 보내지 않음. SetupPage는 파일 이름만 보관 중이라, 업로드하려면 `File` 객체 보관이 필요 (화면 파일 수정 승인 필요)
- **타이머는 클라이언트 기준**: 서버 `timerEndsAt`을 쓰지 않아 새로고침하면 처음부터 다시 셈
- **비교 분석 `items`와 리포트는 mock 유지**: 이번에는 AI 글(`aiWriting.content`)만 실제 값. 나머지는 비교 분석 화면 단계에서 연결
- **배포 시 백엔드 CORS 설정 필요, 프록시는 개발 전용**: `vite.config.js`의 `server.proxy`는 dev 서버에서만 동작함. 배포 사이트에서는 백엔드가 프론트 도메인을 허용하고 `Access-Control-Allow-Credentials: true`를 설정해야 하며, refresh 쿠키는 `SameSite=None; Secure`여야 함. 백엔드 CORS 설정이 끝나면 프록시를 제거하고 `.env.local`에 다시 `https://mind-test.store`를 넣어도 됨
- **COMPARED/REWRITING 상태에서 새로고침한 경우 미처리**: 복구는 DRAFTING/ANALYZING만 처리함. 다음 단계(비교 분석/다시 쓰기)에서 처리
