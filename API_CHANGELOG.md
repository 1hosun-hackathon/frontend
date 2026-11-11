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

### 6. src/hooks/useWriting.js (비교 분석 → 다시 쓰기 → 재검사 → 완료)
- **왜 바꿔야 했는지**
  - `recheck`: 로컬 배열에 추가만 하던 가짜 처리를 `POST /revisions` + 상태 확인 + 결과 조회로 교체 (서버에 재검사가 기록되려면 필요)
  - `complete`: 서버 `POST /complete`가 성공한 뒤 기존 로컬 처리를 그대로 실행 (서버에서 COMPLETED가 되어야 기록·홈·대시보드에 반영됨)
  - `saveDraft`: 임시저장 조건을 서버 status 기준으로 변경 (REWRITING에서도 서버 저장 필요)
  - `waitForAnalysis`: 재검사 결과도 받도록 보강하고 `session.analysis`에 저장 (나중에 화면 연결용)
- **바꾼 곳**
  - import: `submitRevision`, `completeTraining`, `toAnalysisView` 추가
  - 파일 상단: `revisionErrorText`(409 포괄 문구, 400), `completeErrorText`(409, 400) 추가
  - `saveDraft`: 조건을 `!session.analysisId`에서 `session.status` 기준으로 변경 (DRAFTING → 초안, REWRITING → 수정본, 그 외 → 로컬만)
  - `begin`: `update('status', 'DRAFTING')` 1줄 추가
  - `waitForAnalysis`: 시작 시 `status: 'ANALYZING'`. 성공 시 `analysis`(`toAnalysisView` 결과)와 `status: 'COMPARED'` 저장. 재검사(seqNo ≥ 1)면 `final`·`recheckCount`·`versions` 갱신. 이동 조건을 `/writing`·`/rewrite`로 확장. 지연 안내 문구를 "같은 버튼"으로 일반화
  - `runAnalysisTask`: `fallback`으로 문구 대신 함수(err → 문구)도 받을 수 있게 함
  - `recheck`: 본문 교체 (`POST /revisions` → `waitForAnalysis`. 분석 중이면 상태 확인만 이어서 함)
  - `complete`: `POST /complete` 성공 후 기존 로컬 처리 실행 + `clearTrainingId()`. id는 trainingId 사용. 중복 클릭 방지
- **유지한 것**: 함수 이름, 인자, 반환 키 13개, 반환값(undefined). 화면 파일·`models/training.js`·`AppRoutes.jsx`는 수정하지 않음. 비교 분석 화면의 리포트·강점·보완점·질문·Criteria는 mock 그대로 표시 (A0)
- **되돌리는 법**: `git checkout dev -- src/hooks/useWriting.js` (2번 변경까지 함께 되돌아감)

### 7. src/context/TrainingContext.jsx (추가만, 기존 줄 변경 없음)
- **왜 바꿔야 했는지**
  - `/rewrite` 진입 시 `POST /rewrite` 호출 effect: "다시 쓰기" 버튼 핸들러가 화면 파일(ComparisonPage) 안에 있어서, 화면을 수정하지 않으려고 여기서 호출
  - `/analysis`·`/rewrite` 새로고침 복구 effect: 새로고침하면 session이 사라져 화면이 비는 문제 방지
  - `status` 1줄: 새로고침 후에도 임시저장이 서버 상태를 알아야 함
- **바꾼 곳**
  - import 3줄 추가 (`startRewrite`, `getAnalysis`, `toAnalysisView`. 기존 import 줄을 고치지 않으려고 별도 줄로 추가)
  - 기존 `/writing` 복구 effect의 객체 안에 `status: w.status,` 1줄 삽입
  - 새 `useEffect` ①: `/analysis`·`/rewrite`에서 `session.trainingId`가 없고 sessionStorage에 id가 있으면 `GET /trainings/{id}` + `GET /analyses/{latestAnalysisId}`로 draft·final·ai·recheckCount·analysis·status 복구 (ANALYZING이면 결과 조회는 생략하고 `pendingAnalysisId`만 설정)
  - 새 `useEffect` ②: `/rewrite`에서 `status === 'COMPARED'`면 `POST /rewrite`를 호출해 REWRITING으로 전환 (여러 번 호출해도 결과 같음). 실패 시 notify
- **유지한 것**: Provider value 키 전부, 기존 줄 전부(삭제·변경 없음). 화면 파일은 수정하지 않음
- **되돌리는 법**: `git checkout dev -- src/context/TrainingContext.jsx` (3번 변경까지 함께 되돌아감)

### 8. src/hooks/useRecords.js (기록·완료·홈·대시보드·마이페이지)
- **불가피한 이유**: 화면들이 `records`를 읽는데 초기값이 mock(`sampleRecords`) 또는 localStorage 캐시라서, 서버 데이터가 오기 전에 가짜 기록이나 이전 계정의 기록이 보이고, API가 실패하면 가짜 기록이 그대로 남음
- **바꾼 곳**: 5줄 `useState(() => get(STORAGE, sampleRecords))` → `useState([])` (주석 1줄 포함)
- **유지한 것**: 반환 키 전부(`records`·`setRecords`·`saved`·…·`ratio`), import와 localStorage 저장 effect(지우지 않음. `sampleRecords` import는 쓰이지 않는 채로 남음). 화면 파일은 수정하지 않음
- **되돌리는 법**: `git checkout dev -- src/hooks/useRecords.js`

### 9. src/hooks/useWriting.js (resume: 서버 진행 중 항목 이어서 열기)
- **불가피한 이유**: 홈·기록 화면의 "작성 중인 글"이 서버 목록 항목(본문 없음)으로 바뀌어, 기존처럼 `setSession(saved)`로 열면 빈 화면이 됨. 이어서 열기 버튼 핸들러는 화면 파일에 있어서 `resume` 안에서 처리해야 함
- **바꾼 곳**: 파일 상단 `RESUME_PATH`(상태별 이동 화면) 추가. `resume` 앞부분에 분기 7줄 추가: `saved.trainingStatus`가 있으면 trainingId 저장 → `setSession(blank())` → DRAFTING·ANALYZING은 `/writing`, COMPARED는 `/analysis`, REWRITING은 `/rewrite`로 이동 (내용은 기존 새로고침 복구 effect가 서버에서 불러옴)
- **유지한 것**: 기존 `resume` 줄 전부(로컬 저장본 경로), 함수 이름·인자·반환 키. 화면 파일은 수정하지 않음
- **되돌리는 법**: `git checkout dev -- src/hooks/useWriting.js` (2·6번 변경까지 함께 되돌아감)

### 10. src/context/TrainingContext.jsx (기록·삭제·탈퇴·비율)
- **불가피한 이유**
  - 화면이 읽는 `records`·`saved`·`selected`·`ratio`가 모두 이 Provider에서 나오므로, 서버 데이터를 채울 곳이 여기뿐임
  - 기록 삭제·회원탈퇴 버튼 핸들러가 화면 파일에 있고, 실제 처리(`requestDelete`·`withdraw`)가 여기 있음
- **바꾼 곳**
  - import 4줄(`useServerRecords`, `deleteTraining`, `withdraw as withdrawAccount`, `clearTrainingId`), `const { user } = useAuthContext();` 1줄 추가
  - `useServerRecords({...})` 호출 추가 → `serverRatio`, `reloadRecords`
  - `requestDelete`의 `onConfirm`: 기존 2줄 **앞에** 서버 삭제(`DELETE /trainings/{id}`, 진행 중 항목은 `saved.trainingId`) 삽입. 실패하면 notify 후 목록 다시 불러오기. 지우는 진행 중 글이 현재 trainingId면 sessionStorage에서도 삭제
  - `withdraw`의 `onConfirm`: 기존 3줄(`setRecords([])`, `setSaved(null)`, `logout()`)을 `DELETE /users/me` 성공 뒤(`.then`)로 이동 (사용자 결정 (b)). 실패하면 notify, 로그인 상태 유지
  - Provider value 끝에 `ratio: serverRatio ?? recordsState.ratio` 1줄 추가 (키 이름 같음, 불러오기 전에는 기존 계산값)
- **유지한 것**: value 키 전부, 모달 제목·문구(탈퇴 문구 포함), `remove` 함수(화면에서 쓰지 않아 수정하지 않음), 이전 단계의 effect. 화면 파일은 수정하지 않음
- **되돌리는 법**: `git checkout dev -- src/context/TrainingContext.jsx` (3·7번 변경까지 함께 되돌아감)

### 11. src/pages/ComparisonPage.jsx (화면 파일 — 사용자 승인 범위: 문구·mock 출처만)
- **왜 고쳤는지**: 강점·보완점·생각해볼 질문 문구가 JSX에 글자로 박혀 있고, 종합 리포트는 mock(`demoAnalysis.comparisonReport`)을 직접 읽고 있어, 서버 값(`session.analysis`)을 넣을 통로가 없었음. `{}` 안의 데이터 출처만 교체
- **바꾼 곳**: 47줄(종합 리포트), 56줄(강점), 60줄(보완점), 71줄(질문 ①), 72줄(질문 ②)
  - 47줄: `(session.analysis?.report?.length ? session.analysis.report : demoAnalysis.comparisonReport).map(...)` (서버 문단 배열, 없으면 mock 3문단)
  - `<p>{session.analysis?.strengths || '기존 문구'}</p>`, `improvements`도 같은 형태
  - `<p>① {session.analysis?.questions?.[0] || '기존 문구'}</p>`, ②는 `[1]` (번호 기호는 `{}` 밖에 유지)
  - 빈 문자열일 때도 기존 문구가 나오도록 `??` 대신 `||` 사용 (사용자 결정)
- **유지한 것**: 태그·className·props·레이아웃 무수정 (태그·속성 순서와 줄 수를 원본과 자동 비교해 동일함을 확인). 질문 `<p>` 2개 그대로. 종합 리포트의 `<p key={index}>` 그대로. Criteria는 수정하지 않음. 새 API 호출이나 import 없음 (기존 `session` 사용)
- **되돌리는 법**: `git checkout dev -- src/pages/ComparisonPage.jsx`

### 12. src/pages/RewritePage.jsx (화면 파일 — 사용자 승인 범위: 사이드바 문구·mock 출처만)
- **왜 고쳤는지**: 사이드바의 종합 피드백 문구는 JSX에 글자로, 강점·보완점·질문은 mock(`demoAnalysis`)이 직접 박혀 있어 서버 값(`session.analysis`)을 넣을 통로가 없었음. `{}` 안의 데이터 출처만 교체
- **바꾼 곳**
  - 55줄 종합 피드백: `{session.analysis?.report?.[0] || '기존 문구'}` (첫 문단만, 사용자 결정 (b))
  - 58줄 강점: `{session.analysis?.strengths || demoAnalysis.strengths}`
  - 60줄 보완점: `{session.analysis?.improvements || demoAnalysis.improvements}`
  - 67줄 질문: `(session.analysis?.questions?.length ? session.analysis.questions : demoAnalysis.reflectionQuestions).map(...)` (서버 질문 전부 표시, 0개면 mock 전체)
- **유지한 것**: 태그·className·props·레이아웃 무수정 (태그·속성 순서와 줄 수를 원본과 자동 비교해 동일함을 확인). `key={q}`, Criteria(63줄)는 수정하지 않음. 새 API 호출·import 없음
- **되돌리는 법**: `git checkout dev -- src/pages/RewritePage.jsx`

### 13. src/components/Criteria.jsx (화면 파일 — 사용자 승인 범위: 데이터 출처·등급 표시만)
- **왜 고쳤는지**: mock(`mocks/criteria`)을 직접 import하고 props가 없어서 서버 값(`session.analysis.criteria`)을 받을 통로가 없었음. props를 늘리지 않고 context에서 읽도록 함수를 본문 형태(`=> { … return ( … ); }`)로 변경
- **바꾼 곳**
  - import 1줄 추가: `useTrainingContext`
  - 7줄: `=> (` → `=> {` + 데이터 선택(`const items = !completion && serverItems?.length ? serverItems : criteria;`) + `return (`
  - 9줄: `criteria.map` → `items.map`
  - 30·34·44·48줄 등급: `· {c.before}` → ``{c.before ? ` · ${c.before}` : ''}`` (등급이 비면 " · 등급"만 숨김, 값이 있으면 기존과 같은 글자)
  - 64줄: `);` → `  );` + `};`
- **유지한 것**: props 시그니처 `({ completion = false })`와 호출부 3곳, 태그·className·`key`·`open`·`defaultOpen` (태그·속성 순서를 원본과 자동 비교해 동일), JSX 안의 나머지 줄. **completion 모드(완료 화면)는 항상 mock** (등급이 있어 표시 글자도 기존과 동일)
- **되돌리는 법**: `git checkout dev -- src/components/Criteria.jsx`

### 14. src/hooks/useServerRecords.js (대시보드 성장/집중 항목)
- **이유**: `GET /dashboard` 응답을 이미 받고 있었지만 `mostImproved`/`focusArea`를 화면까지 전달할 값이 없었음
- **바꾼 곳**: `serverGrowth` state 추가, 대시보드 응답 처리에 `setServerGrowth({ strongest: mostImproved.label, focus: focusArea.label })` 추가(응답이 실패하면 이전 값 유지), return에 `serverGrowth` 추가
- **유지한 것**: 기존 effect 2개의 동작, 반환 키 `serverRatio`·`reload`
- **되돌리는 법**: `git checkout dev -- src/hooks/useServerRecords.js` (이 파일이 dev에 없으면 이번 3줄 묶음만 삭제)

### 15. src/context/TrainingContext.jsx (serverGrowth 전달)
- **이유**: 대시보드 화면이 읽을 수 있도록 `serverGrowth`를 Provider value로 노출해야 함
- **바꾼 곳**: 29줄 `useServerRecords` 결과에서 `serverGrowth`도 꺼냄 (10번에서 추가한 줄), value 끝에 `serverGrowth` 키 1줄 추가
- **유지한 것**: 기존 value 키 전부, 원본 줄 전부. 화면이 읽는 기존 값의 의미 변화 없음
- **되돌리는 법**: `git checkout dev -- src/context/TrainingContext.jsx`

### 16. src/pages/GrowthDashboardPage.jsx (화면 파일 — 사용자 승인 범위: 성장/집중 항목 label만 + 13줄)
- **왜 고쳤는지**: 가장 성장한 항목 / 집중 개선 항목이 mock(`demoAnalysis.growth`)을 직접 읽고 있어 서버 값을 넣을 통로가 없었음. `{}` 안의 데이터 출처만 교체
- **바꾼 곳**
  - 13줄: `useTrainingContext()`에서 `serverGrowth`도 꺼냄 (화면에 보이지 않는 줄, 사용자 승인)
  - 60줄: `{serverGrowth?.strongest || demoAnalysis.growth.strongest}`
  - 64줄: `{serverGrowth?.focus || demoAnalysis.growth.focus}`
- **유지한 것**: 태그·className·props·레이아웃 무수정 (태그·속성 순서와 줄 수를 원본과 자동 비교해 동일), 세 번째 카드·그래프·최근 목록. 빈 상태는 mock으로 대체 (사용자 결정 (a))
- **되돌리는 법**: `git checkout dev -- src/pages/GrowthDashboardPage.jsx`

### 17. [건 2] 대시보드 세 번째 카드 — 화면 문구를 서버 기준으로 변경 (화면과 서버가 달라 서버 우선)
- **파일**: `src/hooks/useServerRecords.js`, `src/context/TrainingContext.jsx`, `src/pages/GrowthDashboardPage.jsx`
- **바꾼 곳**
  - `useServerRecords.js`: `serverStreakDays` state 추가, 대시보드 응답에서 `streakDays ?? 0` 저장, 반환 값에 추가
  - `TrainingContext.jsx`: 29줄에서 `serverStreakDays`도 받음, Provider value에 `serverStreakDays` 키 추가
  - `GrowthDashboardPage.jsx` 13줄: `serverStreakDays`를 받아옴. 31줄 라벨 `"훈련 기록 날짜"` → `"연속 완료 일수"`. 32줄 값 `기록 날짜 수` → ``${serverStreakDays ?? 0}일`` (서버 값이 없으면 0, 기존 계산값은 쓰지 않음 — 사용자 결정)
- **바꾼 이유**: 화면은 기록이 있는 날짜 수를 직접 계산했고, 서버는 연속 완료 일수(`streakDays`)를 줌. 화면과 서버가 달라 서버 기준으로 진행
- **유지한 것**: StatCard 태그와 props 구성(label·value), 다른 카드
- **되돌리는 법**: `git checkout dev -- src/pages/GrowthDashboardPage.jsx` (로직까지 되돌리려면 `src/hooks/useServerRecords.js`, `src/context/TrainingContext.jsx`도)

### 18. [건 3] 회원탈퇴 모달 문구 — 화면 문구를 서버 기준으로 변경 (화면과 서버가 달라 서버 우선)
- **파일**: `src/context/TrainingContext.jsx` (`withdraw` 모달 `message`, 187줄)
- **바꾼 곳**: `'회원탈퇴 시 저장한 훈련 기록이 삭제되며 복구할 수 없습니다.'` → `'회원탈퇴를 진행하면 로그아웃됩니다. 작성한 훈련 기록은 삭제되지 않고 보존됩니다.'` (후보 B: 명세와 코드로 확인된 동작만 담음)
- **바꾼 이유**: 명세상 탈퇴는 `deleted_at`만 기록하고 훈련 기록을 보존하는데, 문구는 "기록 삭제"라고 안내했음. 화면과 서버가 달라 서버 기준으로 진행
- **유지한 것**: 모달 제목, 버튼 문구(`탈퇴하기`), `danger` 스타일, 탈퇴 처리 로직
- **되돌리는 법**: `git checkout dev -- src/context/TrainingContext.jsx`

### 19. [건 4] 비교 분석 생각해볼 질문 — `<p>`를 map으로 변경, 스타일 동일
- **파일**: `src/pages/ComparisonPage.jsx` (기존 71·72줄)
- **바꾼 곳**: 고정 `<p>` 2개 → `(서버 질문 배열, 없으면 기존 문구 2개).map((q, i) => <p key={i}>{번호} {q}</p>)`. 번호는 `①②③…⑳` 자동 생성(21번째부터 `21.`)
- **바꾼 이유**: 서버 질문 개수가 정해져 있지 않은데 화면은 2개로 고정돼 있었음(3개 이상이면 잘리고, 1개면 예시 문구가 섞임). 화면과 서버가 달라 서버 기준으로 진행
- **유지한 것**: `<p>` 태그(원래도 className 없음)와 같은 Card 안의 간격, "번호 + 공백 + 질문" 형식, 서버 값이 없을 때 기존 문구 2개(①②)
- **되돌리는 법**: `git checkout dev -- src/pages/ComparisonPage.jsx`

### 20. [건 1] 회원가입 아이디 중복 확인 — 서버 API(check-login-id)가 있으나 화면에 호출 자리가 없어 UI 추가
- **파일**: `src/hooks/useAuth.js`, `src/pages/AuthPage.jsx`
- **바꾼 이유**: `GET /api/v1/auth/check-login-id`(`{ available }`)가 있고 `src/api/auth.js`에 `checkLoginId`도 있었지만, 회원가입 화면에 호출할 자리가 없었음
- **바꾼 곳**
  - `useAuth.js`: `useRef` import. `idCheck` 상태(`null`/`'available'`/`'taken'`), 최신 아이디 ref, 아이디가 바뀌면 결과를 지우는 effect. `checkAuthId()`(형식 `^[a-z0-9]{4,30}$` 통과 시에만 호출, 응답 전에 아이디가 바뀌면 결과 버림, 호출 실패 시 표시 없음 → 가입 시 서버 409로 처리). 반환 키에 `idCheck`, `checkAuthId` 추가
  - `AuthPage.jsx`: `useAuthContext()`에서 `idCheck`, `checkAuthId`를 꺼냄(18줄 뒤 2줄), 아이디 input 뒤에 아래 UI 요소 추가
- **추가한 UI 요소**
  1. 아이디 `<input>`의 `onBlur={() => isSignup && checkAuthId()}` 속성 1개 (로그인 화면에서는 호출하지 않음)
  2. `<small className="mt-2 block text-xs leading-relaxed">` 안내 문구 1개 (회원가입 화면에서 결과가 있을 때만): 사용 가능 `#59654F` "사용 가능한 아이디예요" / 사용 불가 `#b34848` "이미 사용 중인 아이디예요". 화면 하단 안내 문구의 글자 크기·줄 간격, 기존 오류 문구 색, 앱의 진한 초록을 따름
- **유지한 것**: 기존 반환 키 12개와 `submitAuth`·`logout`의 동작, 빨간 `authError` 문구 자리, input의 `value`·`onChange`·`placeholder`. 결과가 "사용 중"이어도 가입 버튼을 막지 않음(서버 409에 맡김). 태그 점검: dev 대비 변화는 위 2개뿐
- **되돌리는 법**: `git checkout dev -- src/pages/AuthPage.jsx` (로직까지 되돌리려면 `src/hooks/useAuth.js`도)

### 21. [건 2] 서버 타이머 — 서버 timerEndsAt이 있으나 클라이언트 타이머만 써서 새로고침 시 초기화되던 문제 해결
- **파일**: `src/hooks/timerClock.js`(새 파일), `src/api/client.js`, `src/hooks/useTimer.js`, `src/hooks/useWriting.js`, `src/context/TrainingContext.jsx`
- **바꾼 이유**: 서버가 `timerEndsAt`(종료 시각)을 주는데 화면 타이머는 `분 × 60`부터 매초 1씩 빼기만 해서, 새로고침하거나 다른 화면에 다녀오면 시간이 처음부터 다시 시작되거나 멈춰 있었음
- **바꾼 곳**
  - `timerClock.js`: `parseServerTime`(시간대 표시가 없으면 **UTC(`Z`)로 해석** — 처음엔 KST `+09:00`으로 가정했으나 실제 응답이 UTC로 확인되어 수정, 소수 초 3자리), `remainingSeconds(endsAt, timerMinutes)`(서버 기준 현재 시각으로 계산, 음수면 0, 잘못된 값이면 null, **안전장치**: `timerMinutes × 60 + 60`초보다 크면 시간대 오류로 보고 null → 기존 방식)
  - `client.js`: `clockOffset`·`serverNow()` 추가, `request()`에서 응답 `Date` 헤더를 읽을 수 있을 때만 시계 차이 갱신 (못 읽으면 브라우저 시계)
  - `useTimer.js`: 세 번째 선택 인자 `endsAt`. 있으면 `/writing` 진입 시와 매초 남은 시간 재계산, 없으면 기존처럼 1씩 감소
  - `useWriting.js`: `begin`에서 `timerEndsAt`을 session에 저장하고 남은 시간으로 시작. `resume` 로컬 경로도 `saved.timerEndsAt` 사용 (없으면 기존 `분 × 60`)
  - `TrainingContext.jsx`: 39줄 `useTimer(pathname, writingMinutes, writingEndsAt)` (사용자 승인), `writingEndsAt` 상태와 동기화 effect, `/writing` 복구 시 `timerEndsAt` 저장 및 남은 시간으로 시작
- **유지한 것**: `timerEndsAt`이 없으면 기존 동작 그대로, 타이머 미설정(`minutes === null`) 동작, `useTimer`·`useWriting` 반환 키. 화면 파일 수정 없음
- **되돌리는 법**: `git checkout dev -- src/hooks/useTimer.js src/hooks/useWriting.js src/context/TrainingContext.jsx src/api/client.js` 후 `src/hooks/timerClock.js` 삭제

### 참고: 화면 파일 태그 점검 스크립트 정정
- 13·16·19번 등에서 보고한 "태그·속성 시퀀스 동일" 자동 점검은, 여러 줄에 걸친 태그의 속성이 비교에서 빠지는 허점이 있었음
- 태그를 하나씩 읽는 방식으로 고친 스크립트로 화면 4개(ComparisonPage·RewritePage·Criteria·GrowthDashboardPage)를 dev와 다시 비교함 → **승인한 변경(질문 `<p>` map, 세 번째 카드 label) 외에 태그·속성 변화 없음**

### 22. 첨부파일 업로드 — 서버 API files 파트가 있으나 화면이 파일 이름만 저장해 File 객체가 없었음
- **파일**: `src/api/trainings.js`, `src/hooks/useWriting.js`, `src/pages/SetupPage.jsx`, `src/context/TrainingContext.jsx`
- **바꾼 이유**: `POST /api/v1/trainings`는 `files` 파트(0~5개, 각 10MB 이하)를 받지만, 설정 화면이 첨부를 파일 이름만 저장해서 업로드할 File 객체가 없었고 `createTraining`도 `request` 파트만 보냈음
- **바꾼 곳**
  - `trainings.js` 10-11줄: 주석 수정, `createTraining` 인자에 `files = []` 추가. 22줄 뒤: `files.forEach((file) => form.append('files', file))` (첨부가 없으면 `files` 파트를 보내지 않음)
  - `useWriting.js`
    - 파일 상단: 검증 기준(확장자 `pdf·ppt·pptx·doc·docx·txt·md·png·jpg·jpeg` = SetupPage `accept`와 동일, 최대 5개, 10MB), `createErrorText`(413 → 크기 안내, 첨부가 있을 때 400 → 형식 안내, 그 외 기존 문구)
    - 50줄: 상태 setter를 `setFileNames`로 바꾸고 `fileObjectsRef`와 감싸는 `setFiles` 추가 (File 배열이면 검증 후 이름은 `files`, 객체는 ref에 보관. 문자열 배열이면 기존처럼 이름만)
    - `startNewWriting`: 첨부 목록과 ref를 비움 (**기존 버그 수정**: 새 글을 시작해도 이전 글의 첨부 이름이 남았음)
    - `begin`: `createTraining`에 `files` 전달, 성공 시 `session.attachments` 저장 및 업로드 개수 확인, 실패 시 `createErrorText`로 안내
  - `SetupPage.jsx` 48줄: `setFiles([...e.target.files].map((f) => f.name))` → `setFiles([...e.target.files])` (File 객체를 그대로 넘김)
  - `SetupPage.jsx` 50줄 문구: `PDF, PPT, 문서, 이미지 · 시연용 파일 선택` → `PDF, PPT, 문서, 이미지 · 파일 선택` (글자만 변경)
  - `TrainingContext.jsx`: 새로고침 복구 시 서버 `attachments`를 `session.attachments`에 보관 — `/writing` 복구 effect와 `/analysis`·`/rewrite` 복구 effect의 객체에 `attachments: w.attachments ?? [],` 각 1줄씩 추가 (기존 줄 삭제·변경 없음, 화면 표시 없음)
- **추가한 notify 문구** (새 UI 없음, 기존 notify 모달 사용)
  - 파일을 고를 때: "첨부하지 못한 파일이 있어요." + 해당 항목 — "`파일명` · 올릴 수 없는 형식" / "`파일명` · 10MB 초과" / "최대 5개까지 올릴 수 있어 앞의 5개만 첨부했어요."
  - 시작 버튼, 서버 413: "첨부파일 크기가 너무 커요. 각 파일은 10MB 이하로 올려 주세요."
  - 시작 버튼, 첨부가 있을 때 서버 400: "첨부할 수 없는 형식의 파일이 있어요. PDF, PPT, 문서, 이미지 파일만 올릴 수 있어요."
  - 업로드 확인: 응답 `attachments` 수 < 보낸 수 → "일부 첨부파일이 업로드되지 않았어요. 글 작성은 계속할 수 있어요."
- **유지한 것**: SetupPage 태그·속성·줄 수(고친 점검 스크립트로 확인, 바뀐 것은 `onChange` 값과 50줄 글자뿐), 51-53줄 목록 출력(`files`는 여전히 이름 배열), `useWriting` 반환 키 13개(`setFiles` 키에 감싸는 함수), `createTraining`의 기존 호출 방식(`files` 기본값 `[]`), 첨부가 없을 때의 요청 형태
- **되돌리는 법**: `git checkout dev -- src/pages/SetupPage.jsx src/hooks/useWriting.js src/api/trainings.js src/context/TrainingContext.jsx`

### 23. 제출 후 뒤로가기 → 재제출 무반응 버그
- **파일**: `src/hooks/useWriting.js`
- **바꾼 이유**: 초안 제출 후 서버 상태는 ANALYZING/COMPARED인데, 뒤로가기로 `/writing`에 돌아와 다시 제출하면 `POST /draft`가 409로 거절되고 화면에 반응이 없었음 ("나중에 확인할 것"의 버그). **"무반응"의 정확한 원인은 확인되지 않음**: 기존 코드도 409를 받으면 오류 모달을 띄우게 되어 있었음. 변경 후에는 뒤로가기 상황에서 `/draft` 자체를 호출하지 않으므로 이 경로를 타지 않음
- **바꾼 곳**
  - import: `getTraining` 추가
  - `resumeSubmitted()` 추가: `GET /trainings/{id}`로 서버 상태를 다시 확인 → DRAFTING이면 제출 진행(false 반환), ANALYZING은 결과 대기 이어가기, COMPARED는 결과 조회 후 `/analysis`(기존 `waitForAnalysis` 사용, 대기 모달이 잠깐 표시됨), REWRITING은 분석 결과·수정본을 session에 채우고 `/rewrite`, 그 밖의 상태(COMPLETED 등)는 notify "이미 제출한 글이에요."
  - `submit`: session 상태가 DRAFTING이 아니면 `/draft`를 호출하지 않고 `resumeSubmitted()` 실행. 정상 제출 경로에서 409가 오면 같은 처리
- **유지한 것**: 정상 제출 경로, 반환 키·함수 인자, 화면 파일 무수정. `/writing` 진입 시 자동 이동은 넣지 않음 (뒤로가기로 돌아오자마자 앞으로 밀려나는 문제 때문에, 제출 버튼과 409 응답 시점에만 처리)
- **되돌리는 법**: `git checkout dev -- src/hooks/useWriting.js` (2·6·9·22번 변경까지 함께 되돌아감)

### 24. 첨부 목록 시각화와 파일 빼기 — 첨부 업로드 연결 후 사용자가 파일을 확인·제거할 UI가 필요해 추가
- **파일**: `src/hooks/useWriting.js`, `src/pages/SetupPage.jsx`
- **바꾼 이유**: 22번에서 실제 업로드가 연결됐지만, 화면 목록은 파일 이름만 보여주고 잘못 고른 파일을 뺄 방법이 없었음
- **결정 내용**
  - **이어 붙이기**: 파일을 더 고르면 기존 목록을 덮어쓰지 않고 뒤에 이어 붙임(최대 5개 유지). 같은 파일(이름·크기·수정 시각 동일)은 "`파일명` · 이미 추가한 파일"로 안내하고 건너뜀
  - **input 값 초기화**: 고른 직후 `e.target.value = ''`. 브라우저가 input 옆에 그리는 "파일 N개" 표시는 항상 "선택된 파일 없음"이 되고 아래 목록이 유일한 기준이 됨. 뺐던 파일도 다시 고를 수 있음
- **바꾼 곳**
  - `useWriting.js`: `formatFileSize`(1024KB 미만 KB 정수·최소 1KB, 이상 MB 소수 1자리), `toFileItem` 추가. `files` 상태를 이름 배열 → `[{ name, size, sizeLabel }]`로 변경(File 객체는 `fileObjectsRef`에 같은 순서로 보관). 검증을 `applyFiles(base, list)`로 묶고 중복 검사 추가. `setFiles`(목록 교체, 기존 키·동작 유지), `addFiles`(이어 붙이기), `removeFile(index)`(목록과 ref에서 함께 제거). 반환 키에 `addFiles`, `removeFile` 추가
  - `SetupPage.jsx`: `lucide-react`의 `X` import 1줄, 9줄 받아오는 값 `setFiles` → `addFiles, removeFile`, 48줄 `onChange`에서 `addFiles` 호출 후 선택값 초기화, 51-53줄 목록 교체
- **추가한 UI** (고친 점검 스크립트로 dev 대비 변화 확인)
  - 목록 행 `<div key={이름-순번}>`: `mt-2 flex items-center justify-between gap-3 rounded-lg bg-[#F5F5F2] px-3 py-2 text-sm text-[#59654F]`
  - 파일 이름 `<span>`: `min-w-0 truncate` / 크기 `<span>`: `text-[#7B8078]`, 내용 ` · 50KB`
  - 빼기 `<button type="button">`: `shrink-0 rounded-md p-1 text-[#7B8078] hover:bg-[#E8EAE6]`, `aria-label="파일명 첨부 빼기"`, 안에 `<X size={14} />`
  - 색·모서리·글자 크기는 기존 화면 톤(InfoBox 배경 `#F5F5F2`, 기록 화면 메뉴의 `rounded-lg text-sm`, 진한 초록 `#59654F`, 안내 회색 `#7B8078`, 구분선 `#E8EAE6`)을 따름
- **유지한 것**: input의 `type`·`multiple`·`accept`, 50줄 문구, 다른 입력 필드. `files`를 쓰는 곳은 SetupPage뿐이라 다른 화면 영향 없음. useWriting 기존 반환 키 13개
- **되돌리는 법**: `git checkout dev -- src/pages/SetupPage.jsx src/hooks/useWriting.js` (useWriting의 이전 변경까지 함께 되돌아감)

### 25. 대시보드 그래프 — 원래 디자인(선 그래프)대로 복원 + 서버 trend/증감값 연결
- **파일**: `src/hooks/chartPath.js`(새 파일), `src/hooks/useServerRecords.js`, `src/pages/GrowthDashboardPage.jsx`
- **바꾼 이유**: 대시보드 그래프가 팀 디자인 시안(선 그래프 2개 + 범례 + 증감 카드)과 달리 `div` 막대로 되어 있었고, `demo-chart`·`chart-bar` 스타일이 src에 없어 막대가 보이지 않을 가능성이 있었음(21번). 서버 `trend[].aiDependencyRatio`와 증감값도 표시되지 않았음(20번)
- **바꾼 곳**
  - `chartPath.js`: `CHART_COLORS`(색 상수를 한 곳에 모음 — 시안과 비교해 바꿀 때 여기만 수정), `toY`(비율 → SVG y, 5~95 범위), `smoothPath`(Catmull-Rom → 3차 베지어 곡선, 점 2개 미만이면 빈 값), `aiChangeLabel`·`selfChangeLabel`(증감 문구)
  - `useServerRecords.js`: `serverGrowth`에 `trend`(`{ trainingId, self, ai }`, 두 비율이 숫자인 항목만, 오래된 순), `aiChange`, `selfChange` 추가 (A안: TrainingContext 수정 없음)
  - `GrowthDashboardPage.jsx`
    - import와 `trend`·`selfPath`·`aiPath` 계산 3줄
    - 27줄 StatCard note 문구: `"훈련 기록 평균 · 시연용"` → `"최근 훈련 기준"` (글자만)
    - 36-39줄 설명 문구: "기록별 자기 사고 구성 비율을 확인해 보세요. 현재 수치는 시연용 예시입니다." → "최근 훈련에서 나타난 사고 구성의 변화를 살펴보세요." (시안 문구)
    - 40-56줄: `div` 막대 그래프 삭제 → SVG 선 그래프 + 범례 + 증감 카드 2개
- **추가한 UI**
  - 그래프 영역 `<div className="relative mt-6 rounded-xl p-4">` (배경 `CHART_COLORS.background`)
  - `<svg viewBox="0 0 100 100" preserveAspectRatio="none" className="block h-48 w-full sm:h-56" role="img">`: 가로 격자선 4개(0·25·50·75%), 선 2개(자기 사고 구성 초록, AI 의존도 회색, 마커 없음, `vectorEffect="non-scaling-stroke"`로 두께 일정)
  - 데이터 부족 안내(trend 2개 미만): "훈련을 2회 이상 완료하면 변화 그래프가 나타나요." (`text-sm text-[#7B8078]`, 그래프 영역 가운데)
  - 범례 `<div className="mt-3 flex flex-wrap gap-4 text-xs text-[#7B8078]">`: "● 자기 사고 구성", "● AI 의존도" (점 `h-2 w-2 rounded-full`, 선과 같은 색)
  - 증감 카드 2개(기존 `TwoColumnGrid` + `InfoBox` 재사용): "AI 의존 감소율", "자기 구성 증가율"
- **증감 문구 규칙** (서버 값은 최근 − 첫의 %p, 표기는 `%`로 결정)
  - AI 의존도: 음수 → "N% 개선", 양수 → "N% 증가", 0 → "변화 없음", null → "-"
  - 자기 사고 구성: 양수 → "N% 개선", 음수 → "N% 감소", 0 → "변화 없음", null → "-"
  - 소수 첫째 자리 반올림, `.0`이면 정수 (12.0 → 12, 5.46 → 5.5). 반올림해 0이면 "변화 없음"
- **새로 쓴 색**: `#F9FAF8`(그래프 영역 배경, 시안), `#A9AEA6`(AI 의존도 선). 자기 사고 구성 선은 기존 `#727D67`, 격자선은 기존 `#E8EAE6`
- **사라진 것**: 막대 아래 기록별 날짜 표시(`MM.DD`), `demo-chart`·`chart-bar` 클래스, 비율이 없을 때의 70% 대체값 (시안에 날짜가 없어 x축 날짜는 넣지 않음)
- **유지한 것**: 위 카드 3개(27줄 note 글자 외), 성장/집중 항목, 최근 완료한 훈련 카드 (줄 단위로 동일 확인). TrainingContext 무수정. 새 라이브러리 없음(SVG)
- **되돌리는 법**: `git checkout dev -- src/pages/GrowthDashboardPage.jsx src/hooks/useServerRecords.js` 후 `src/hooks/chartPath.js` 삭제

### 26. 진행 중 글 여러 건 표시 — 서버가 진행 중 훈련을 여러 건 주지만 화면이 1건만 표시해 목록 UI로 변경
- **파일**: `src/api/recordView.js`, `src/hooks/useServerRecords.js`, `src/hooks/useWriting.js`, `src/context/TrainingContext.jsx`, `src/pages/HomePage.jsx`, `src/pages/HistoryPage.jsx`
- **바꾼 이유**: `GET /api/v1/trainings?status=IN_PROGRESS`는 진행 중 훈련을 모두 주는데, 홈 "작성 중인 글" 카드와 기록 화면의 진행 중 자리가 `saved` 1건만 표시했음(12번)
- **데이터 구조**: `saved`(가장 최근 1건)는 이어서 작성·임시저장·완료·탈퇴·삭제 로직이 쓰고 있어 그대로 두고, 진행 중 전체 목록 `inProgressList`를 별도로 추가
- **바꾼 곳**
  - `recordView.js`: 상태 라벨(`DRAFTING` 작성 중 / `ANALYZING` 분석 중 / `COMPARED` 분석 완료 / `REWRITING` 다시 쓰기 중)과 `toInProgress(item)`(`status`에 라벨, `inProgress: true`). `toSaved` 주석을 현재 역할에 맞게 수정
  - `useServerRecords.js`: `inProgressList` 상태(진행 중 응답 전체), `removeInProgress(id)`, 반환 값에 두 개 추가. `saved` 설정 줄의 주석을 현재 역할에 맞게 수정
  - `useWriting.js`: `resume`의 서버 경로를 `resumeTraining(item)`으로 분리해 반환 키에 추가 (기존 `resume()`은 이를 호출해 동작 동일)
  - `TrainingContext.jsx`: `inProgressList`·`removeInProgress` 받기, `requestDelete`에 진행 중 항목 판정 추가. **모달 제목 조건 1줄 변경**(진행 중 항목도 "작성 중인 글을 삭제할까요?", 사용자 결정 (b)). 삭제 확인 시 목록에서 바로 빼고, 현재 작업 중인 훈련이면 sessionStorage에서도 삭제. Provider value에 `inProgressList` 추가
  - `HomePage.jsx`: 20줄 받아오는 값(`saved`·`resume` → `inProgressList`·`resumeTraining`), 86-94줄 카드를 목록으로 교체 (최대 3건)
  - `HistoryPage.jsx`: 11줄 받아오는 값, 23·29줄 `saved` 진행 중 슬롯 → `...inProgressList`, 41·49줄 `r.id === 'draft'` → `r.inProgress`, `resume()` → `resumeTraining(r)`
- **추가한 UI** (HomePage만, 기록 화면은 기존 목록 행을 그대로 재사용 — 태그·속성 동일 확인)
  - 홈 목록 행 `<div key className="mt-3 flex flex-col gap-3 rounded-3.5 border border-[#E6E9E4] p-4.5 sm:flex-row sm:items-center sm:justify-between">` (기록 화면 목록 행과 같은 테두리·모서리·여백, 모바일 세로 / sm 이상 가로). 안의 정보와 버튼은 기존 `MutedText`·`Button variant="secondary"` 재사용
  - "모두 보기" `<button type="button" className="mt-3 text-sm text-[#59654F] underline">`: 진행 중이 4건 이상일 때 "진행 중인 글 N개 모두 보기 →" → 기록 화면으로 이동
- **문구 변경**: 홈 카드 `제목 · 임시 저장됨` → `제목 · 상태 라벨 · 날짜`. 기록 화면 배지 "진행 중" → 상태 라벨
- **동작 변화**: 홈·기록 화면은 서버 진행 중 목록만 표시하므로, 서버에 없는 **로컬 전용 `saved`(예전 localStorage 임시 저장본)는 더 이상 표시되지 않음**. `saved` 자체는 남아 있어 관련 로직은 그대로
- **많을 때**: 홈은 최대 3건 + 모두 보기, 기록 화면은 전부 표시. 진행 중 0건이면 홈 카드 숨김(기존과 같음)
- **유지한 것**: `saved`와 그것을 쓰는 로직, 기존 `resume()` 동작, 기록 화면 목록 행 디자인과 "⋯ 기록 삭제" 메뉴, 완료 기록 클릭 동작
- **되돌리는 법**: `git checkout dev -- src/pages/HomePage.jsx src/pages/HistoryPage.jsx src/context/TrainingContext.jsx src/hooks/useWriting.js src/hooks/useServerRecords.js src/api/recordView.js` (각 파일의 이전 변경까지 함께 되돌아감)

## 신규 파일 목록과 역할
- `src/api/client.js`: 공통 fetch 래퍼. access token을 메모리에 보관하고, 401이 오면 1회 재발급 후 재시도. `ApiError` 정의
- `src/api/auth.js`: 회원가입, 로그인, 재발급, 로그아웃, 아이디 중복 확인 API
- `.env.local`: `VITE_API_BASE_URL=https://mind-test.store` (`.git/info/exclude`로 git 제외)
- `src/api/trainings.js`: 훈련 생성(multipart, 첨부파일 제외), 작업 정보 조회, 임시저장, 초안 제출 API. writingType을 서버 값으로 바꾸는 함수가 여기 한 곳에 있음
- `src/api/analyses.js`: 분석 상태, 분석 결과, 재시도 API와 `pollAnalysis`(2초 간격, 3분 제한)
- `src/api/analysisView.js`: 분석 응답을 화면용 형태로 변환 (문단 나누기, items → Criteria 형태, 질문 정렬)
- `src/api/trainings.js` (추가분): 다시 쓰기 시작 `startRewrite`, 재검사 `submitRevision`, 완료 `completeTraining`
- `src/hooks/trainingSession.js`: 진행 중인 trainingId를 sessionStorage에 저장·조회·삭제
- `.env.production`: 배포 빌드용 `VITE_API_BASE_URL=https://mind-test.store` (커밋 대상)
- `src/api/records.js`: 기록 목록(전체 페이지 조회, size 50 → 400이면 10으로 재시도), 상세, 삭제 API
- `src/api/home.js`: 홈, 대시보드, 내 정보(현재 미사용), 회원탈퇴 API
- `src/api/recordView.js`: 목록·상세 응답을 화면의 records 모양으로 변환, 날짜 `YYYY.MM.DD` 변환, 비율 합치기
- `src/hooks/timerClock.js`: 서버 `timerEndsAt` 해석(시간대 없으면 KST 가정)과 남은 초 계산, 시간대 오류 안전장치
- `src/hooks/chartPath.js`: 대시보드 선 그래프 색 상수(`CHART_COLORS`), 곡선 path 계산, 증감 문구
- `src/hooks/useServerRecords.js`: 홈·기록·대시보드·마이페이지·완료 화면 진입 시 records·saved·비율을 서버 값으로 채우고, 완료 화면에서 상세 본문을 채움

## 나중에 바꿀 것
1. ~~비교 분석 화면 일부는 mock 표시 중~~ → **해결**: ComparisonPage(종합 리포트·강점·보완점·질문, 11번), RewritePage 사이드바(12번), Criteria 항목(13번) 모두 `session.analysis` 서버 값으로 연결. 서버 값이 없으면 기존 mock/문구로 대체
2. **등급(보통→우수)은 API에 없음 → 숨김 처리 중**: 비교 분석·다시 쓰기의 Criteria는 서버 항목의 등급이 빈 값이라 "· 등급"을 숨기고 `내 글` / `AI 글`만 표시 (13번). 완료 화면(completion 모드)과 점수 칸은 mock 등급 그대로. 백엔드가 등급·점수를 응답에 추가하면 `src/api/analysisView.js`의 `toCriteria`에서 `before`/`after`만 채우면 자동으로 표시됨
3. **완료 화면 성장 리포트·점수 칸·잘한 점/보완할 점은 API 없음 (mock 유지)**: 완료 화면의 Criteria(`completion` 모드)도 mock. 완료 화면에서 실제 값은 주제·최초 초안·최종 글·수정 과정
4. ~~ComparisonPage 질문 `<p>` 2개 고정~~ → **해결**: `<p>`를 map으로 바꿔 서버 질문을 전부 표시 (19번)
5. ~~새로고침하면 versions(수정 과정)가 사라짐~~ → **해결**: 완료 화면에서 `GET /trainings/{id}/detail`의 `revisions`로 채움 (`useServerRecords`)
6. ~~제출 후 뒤로가기하면 다시 제출되지 않는 버그~~ → **해결**: 제출 시 서버 상태를 확인해 상태에 맞는 화면으로 이동, 409도 같은 처리 (23번). "무반응"의 정확한 원인은 확인되지 않음
7. **409 포괄 문구**: 재검사 409를 "변경 없음"과 "상태 불일치"를 포괄하는 문구로 안내 중. 에러 JSON 형태가 확인되면 `NO_CHANGES` / `TRAINING_INVALID_STATUS`를 구분해 `revisionErrorText`·`completeErrorText`를 수정. `ApiError`가 `body.message`를 가정하는 부분(`src/api/client.js`)도 함께 확인
8. **writingType 논설문 고정**: `src/api/trainings.js`의 `toServerWritingType`이 항상 `'논설문'`을 반환. 백엔드가 enum을 늘리면 `(genre) => genre;`로 한 줄 교체. 새로고침하면 글 종류가 "논설문"으로 보이는 문제도 함께 해결됨. 화면 선택지 6개와 `models/training.js`의 기본값은 그대로 둠
9. ~~대시보드 세 번째 카드(streakDays) mock 유지~~ → **해결**: 라벨을 "연속 완료 일수"로 바꾸고 서버 `streakDays` 표시, 없으면 0 (17번)
10. ~~대시보드 가장 성장한 항목 / 집중 개선 항목 mock 유지~~ → **해결**: `mostImproved.label` / `focusArea.label`로 연결 (14~16번). `aiDependencyRatio`(AI 의존도)는 여전히 표시할 자리가 없음
11. ~~회원탈퇴 모달 문구 불일치~~ → **해결**: "작성한 훈련 기록은 삭제되지 않고 보존됩니다"로 변경 (18번)
12. ~~진행 중 글은 가장 최근 1건만 표시~~ → **해결**: 홈은 최대 3건 + 모두 보기, 기록 화면은 전부 표시 (26번)
13. **ANALYZING 상태의 재검사 항목을 이어서 열면 초안 화면으로 감**: `RESUME_PATH`가 ANALYZING을 `/writing`으로 보내서, 재검사 분석 중이던 항목이면 초안 작성 화면에 수정본 내용이 보임. 제출 버튼을 누르면 분석 결과 확인을 이어가고 끝나면 `/analysis`로 이동하므로 흐름은 이어지지만 화면 문맥이 맞지 않음. 서버에서 재검사 여부(seqNo)를 알 수 있으면 `/rewrite`로 보내도록 개선
14. **로그아웃 후 records가 메모리에 남음**: 로그아웃해도 `records`·`selected`를 비우지 않음. 보호된 화면이라 노출되지는 않고 다시 로그인하면 서버 값으로 교체됨. 비우려면 `useAuth`의 logout 또는 `useServerRecords`에서 `user`가 없을 때 초기화 필요
15. ~~서버 질문이 1개일 때 예시 문구가 섞임~~ → **해결**: map으로 바꿔 서버 질문 수만큼만 표시 (19번)
16. ~~ComparisonPage 종합 리포트(47줄)는 아직 mock~~ → **해결**: `session.analysis.report`(문단 배열)로 연결 (11번)
17. **서버 문자열의 줄바꿈이 `<p>` 안에서 한 줄로 표시됨** (종합 리포트 위치에서는 **해결**: 줄바꿈 기준으로 `<p>`를 나눔. 강점·보완점·질문·RewritePage 사이드바는 그대로): 강점·보완점·질문에 줄바꿈이 있어도 `<p>`가 줄바꿈을 그대로 보여주지 않음. 줄바꿈을 살리려면 스타일(예: `whitespace-pre-line`) 변경이 필요해 디자인 변경에 해당
18. **RewritePage 질문 `key={q}` 중복 경고**: 서버가 같은 질문 문장을 2개 주면 React가 콘솔에 key 중복 경고를 냄 (화면 표시는 정상). key를 바꾸려면 기존 코드 수정이 필요해 그대로 둠
19. **완료 훈련이 적으면 mostImproved/focusArea가 null이라 mock이 보임**: 완료한 훈련이 없거나 적어 서버가 `null`을 주면 대시보드에 mock `논지` / `근거 구성`이 표시됨 (사용자 결정 (a): 문구 추가 없이 mock으로 대체). 빈 상태 문구를 넣으려면 문구 승인 필요
20. ~~AI 의존도 미표시~~ → **해결**: 선 그래프 2시리즈(자기 사고 구성·AI 의존도)와 범례, 증감 카드로 표시 (25번)
21. ~~demo-chart/chart-bar 스타일이 src에 없어 막대가 안 보일 가능성~~ → **해결**: 막대 그래프를 시안의 SVG 선 그래프로 교체해 해당 클래스가 사라짐 (25번)
22. **timerEndsAt은 UTC로 해석 (시간대 표시 없음)**: 서버가 UTC 시각을 시간대 표시 없이 전달함. 확인된 실제 응답(`POST /trainings`, 한국 시각 00:09경 생성): `startedAt "2026-11-11T15:09:20.907969353"`, `timerEndsAt "2026-11-11T15:39:20.907969353"`. 그래서 `src/hooks/timerClock.js`는 시간대 표시가 없으면 `Z`를 붙여 해석함(표시가 있으면 그대로). **서버가 UTC 표기를 유지한다는 전제이며, 서버 시간대 설정이 바뀌면 재확인 필요.** 백엔드에 시간대 포함(ISO 8601 offset) 요청 권장
23. **타이머 안전장치와 한계**: 계산한 남은 시간이 `timerMinutes × 60 + 60`초보다 크면 시간대 오류로 보고 기존 방식(`분 × 60`, 1초씩 감소)으로 대체. 반대 방향 오류(종료 시각이 실제보다 이르게 해석되어 바로 0이 되는 경우)는 정상 종료와 구분할 수 없어 막지 못함. 처음 KST로 가정했을 때 타이머가 0초로 표시된 증상이 바로 이 경우였고, UTC 해석으로 바꿔 해결함(22번)
24. **배포 시 `Access-Control-Expose-Headers: Date` 필요**: 시계 차이 보정은 응답 `Date` 헤더를 읽을 수 있을 때만 동작. 개발 환경은 Vite 프록시로 같은 출처라 읽히지만, 배포(다른 출처)에서는 백엔드가 이 헤더를 노출해야 함. 못 읽으면 보정 없이 브라우저 시계 사용
25. **새로고침하면 선택한 첨부가 사라짐**: File 객체는 메모리(ref)에만 있고 저장소에 보관할 수 없음. 설정 화면에서 새로고침하면 이름 목록과 함께 비워지므로 다시 선택해야 함 (이미 생성된 훈련의 첨부는 서버에 남음)
26. **합계 용량으로 413 가능성**: 각 파일이 10MB 이하여도 여러 개를 합친 요청 크기가 백엔드 `spring.servlet.multipart.max-request-size`(기본 10MB)나 프록시 제한을 넘으면 413. 백엔드 설정 확인 필요
27. **.txt/.md 허용 여부 미확인**: 화면 `accept`와 클라이언트 검증은 `.txt`, `.md`를 허용하지만 명세는 "PDF·PPT·문서·이미지"라 서버가 받는지 확인 필요. 거절되면 400 형식 안내가 표시됨. 또 400은 다른 입력 오류일 수도 있어 원인 구분은 에러 형식 확정 후(7번)
28. **뒤로가기 후 재생성**: 훈련 시작 후 뒤로가기로 설정 화면에 돌아와 다시 시작하면 새 훈련이 하나 더 생성되고 첨부도 다시 업로드됨 (6번 버그와 같은 범주)
29. **첨부 목록 화면 표시 미구현**: 서버 응답 `attachments`(attachmentId·fileName·fileSize)는 `session.attachments`에 보관만 하고, 초안 작성·다시 쓰기 화면에는 표시하지 않음 (표시하려면 WritingLayout 등 화면 수정 필요)
30. ~~같은 이름 파일 2개를 고르면 key 중복 경고~~ → **해결**: 목록 key를 `이름-순번`으로 바꿈. input 옆 "파일 N개" 표시도 선택값 초기화로 목록과 어긋나지 않음 (24번)

그 밖의 임시 처리
- ~~첨부파일 업로드 제외~~ → **해결**: File 객체를 ref에 보관하고 `files` 파트로 업로드 (22번)
- ~~타이머는 클라이언트 기준~~ → **해결**: 서버 `timerEndsAt` 기준으로 남은 시간 계산 (21번)
- ~~아이디 중복 확인 UI 없음~~ → **해결**: 회원가입 아이디 입력칸 onBlur로 확인 (20번)
- **배포 시 백엔드 CORS 설정 필요, 프록시는 개발 전용**: `vite.config.js`의 `server.proxy`는 dev 서버에서만 동작함. 배포 사이트에서는 백엔드가 프론트 도메인을 허용하고 `Access-Control-Allow-Credentials: true`를 설정해야 하며, refresh 쿠키는 `SameSite=None; Secure`여야 함. 백엔드 CORS 설정이 끝나면 프록시를 제거하고 `.env.local`에 다시 `https://mind-test.store`를 넣어도 됨
- ~~완료 후 기록은 아직 로컬~~ → **해결**: `complete`가 로컬 기록에 추가한 항목은 완료 화면 진입 시 서버 목록·상세로 교체됨

## 연결하지 않은 API
명세에는 있지만 이번 연동에서 의도적으로 연결하지 않은 API와 그 이유

1. **GET /api/v1/users/me** (내 정보, 명세 1-6)
   - 이유: 마이페이지의 아이디와 완료 편수는 로그인 응답의 `loginId`와 완료 목록 개수(`records.length`)로 같은 값을 이미 보여주고 있어 별도 호출이 필요하지 않음. 가입일(`createdAt`)은 화면에 표시할 자리가 없음
   - 연결하려면: MyPage의 값 출처만 `/users/me` 응답으로 교체 (새 UI 불필요. 가입일을 표시하려면 새 UI 필요)
   - 참고: `src/api/home.js`의 `getMe` 함수는 이미 만들어져 있음
2. **GET /api/v1/trainings/{id}/analyses** (회차별 분석 목록, 명세 4-3)
   - 이유: 재검사 회차별 분석 이력(초안 분석, 1회차, 2회차…)을 보여줄 화면이 없음. 비교 분석 화면은 최신 분석 1개만 표시하는 구조라 새 UI(회차 탭이나 분석 이력 목록)가 필요함. 처음 Swagger 분석 매핑표에도 포함되지 않았음
   - 연결하려면: 비교 분석 또는 완료 화면에 회차 선택 UI를 추가하고, 선택한 `analysisId`로 `GET /api/v1/analyses/{id}`를 호출

## 나중에 확인할 것
- ~~[버그] 초안 제출 후 뒤로가기하면 다시 제출되지 않음~~ → **해결 (23번)**. "무반응"의 정확한 원인은 확인되지 않았고, 서버 상태 확인 후 이동하는 방식으로 처리함
  - 재현 방법: ① 새 글 작성 → 초안 작성 → "초안 제출 · 비교 분석" ② 분석이 끝나 `/analysis`로 이동 ③ 브라우저 뒤로가기로 `/writing`에 돌아감 ④ 초안을 고치고 다시 "초안 제출"을 누름 → 제출되지 않음 (에러 모달 또는 반응 없음)
  - 추정 원인 (확인 전): 제출 후 서버의 훈련 상태가 `COMPARED`로 바뀌는데, `POST /trainings/{id}/draft`는 `DRAFTING` 상태에서만 허용됨 → 409. 또 `session.analysisId`가 설정돼 있어 이 화면의 임시저장은 로컬에만 저장됨
  - 처리 방향 (미정): 제출 후 `/writing`에 다시 들어오면 `/analysis`로 보내거나, 수정은 "다시 쓰기(재검사)" 흐름으로 안내
