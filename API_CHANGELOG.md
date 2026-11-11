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
- `src/hooks/useServerRecords.js`: 홈·기록·대시보드·마이페이지·완료 화면 진입 시 records·saved·비율을 서버 값으로 채우고, 완료 화면에서 상세 본문을 채움

## 나중에 바꿀 것
1. ~~비교 분석 화면 일부는 mock 표시 중~~ → **해결**: ComparisonPage(종합 리포트·강점·보완점·질문, 11번), RewritePage 사이드바(12번), Criteria 항목(13번) 모두 `session.analysis` 서버 값으로 연결. 서버 값이 없으면 기존 mock/문구로 대체
2. **등급(보통→우수)은 API에 없음 → 숨김 처리 중**: 비교 분석·다시 쓰기의 Criteria는 서버 항목의 등급이 빈 값이라 "· 등급"을 숨기고 `내 글` / `AI 글`만 표시 (13번). 완료 화면(completion 모드)과 점수 칸은 mock 등급 그대로. 백엔드가 등급·점수를 응답에 추가하면 `src/api/analysisView.js`의 `toCriteria`에서 `before`/`after`만 채우면 자동으로 표시됨
3. **완료 화면 성장 리포트·점수 칸·잘한 점/보완할 점은 API 없음 (mock 유지)**: 완료 화면의 Criteria(`completion` 모드)도 mock. 완료 화면에서 실제 값은 주제·최초 초안·최종 글·수정 과정
4. ~~ComparisonPage 질문 `<p>` 2개 고정~~ → **해결**: `<p>`를 map으로 바꿔 서버 질문을 전부 표시 (19번)
5. ~~새로고침하면 versions(수정 과정)가 사라짐~~ → **해결**: 완료 화면에서 `GET /trainings/{id}/detail`의 `revisions`로 채움 (`useServerRecords`)
6. **제출 후 뒤로가기하면 다시 제출되지 않는 버그**: 서버 상태가 COMPARED라 `POST /draft`가 409로 거절되는 것으로 추정. 재현 방법은 아래 "나중에 확인할 것" 참고. (재검사 후 뒤로가기는 `/rewrite` 진입 effect가 REWRITING으로 되돌려 줘서 문제없음)
7. **409 포괄 문구**: 재검사 409를 "변경 없음"과 "상태 불일치"를 포괄하는 문구로 안내 중. 에러 JSON 형태가 확인되면 `NO_CHANGES` / `TRAINING_INVALID_STATUS`를 구분해 `revisionErrorText`·`completeErrorText`를 수정. `ApiError`가 `body.message`를 가정하는 부분(`src/api/client.js`)도 함께 확인
8. **writingType 논설문 고정**: `src/api/trainings.js`의 `toServerWritingType`이 항상 `'논설문'`을 반환. 백엔드가 enum을 늘리면 `(genre) => genre;`로 한 줄 교체. 새로고침하면 글 종류가 "논설문"으로 보이는 문제도 함께 해결됨. 화면 선택지 6개와 `models/training.js`의 기본값은 그대로 둠
9. ~~대시보드 세 번째 카드(streakDays) mock 유지~~ → **해결**: 라벨을 "연속 완료 일수"로 바꾸고 서버 `streakDays` 표시, 없으면 0 (17번)
10. ~~대시보드 가장 성장한 항목 / 집중 개선 항목 mock 유지~~ → **해결**: `mostImproved.label` / `focusArea.label`로 연결 (14~16번). `aiDependencyRatio`(AI 의존도)는 여전히 표시할 자리가 없음
11. ~~회원탈퇴 모달 문구 불일치~~ → **해결**: "작성한 훈련 기록은 삭제되지 않고 보존됩니다"로 변경 (18번)
12. **진행 중 글은 가장 최근 1건만 표시**: 홈 카드와 기록 화면의 진행 중 자리가 1개(`saved`)라, 서버에 진행 중 훈련이 여러 개 있어도 1건만 보임. 여러 건을 보이려면 화면 수정 필요
13. **ANALYZING 상태의 재검사 항목을 이어서 열면 초안 화면으로 감**: `RESUME_PATH`가 ANALYZING을 `/writing`으로 보내서, 재검사 분석 중이던 항목이면 초안 작성 화면에 수정본 내용이 보임. 제출 버튼을 누르면 분석 결과 확인을 이어가고 끝나면 `/analysis`로 이동하므로 흐름은 이어지지만 화면 문맥이 맞지 않음. 서버에서 재검사 여부(seqNo)를 알 수 있으면 `/rewrite`로 보내도록 개선
14. **로그아웃 후 records가 메모리에 남음**: 로그아웃해도 `records`·`selected`를 비우지 않음. 보호된 화면이라 노출되지는 않고 다시 로그인하면 서버 값으로 교체됨. 비우려면 `useAuth`의 logout 또는 `useServerRecords`에서 `user`가 없을 때 초기화 필요
15. ~~서버 질문이 1개일 때 예시 문구가 섞임~~ → **해결**: map으로 바꿔 서버 질문 수만큼만 표시 (19번)
16. ~~ComparisonPage 종합 리포트(47줄)는 아직 mock~~ → **해결**: `session.analysis.report`(문단 배열)로 연결 (11번)
17. **서버 문자열의 줄바꿈이 `<p>` 안에서 한 줄로 표시됨** (종합 리포트 위치에서는 **해결**: 줄바꿈 기준으로 `<p>`를 나눔. 강점·보완점·질문·RewritePage 사이드바는 그대로): 강점·보완점·질문에 줄바꿈이 있어도 `<p>`가 줄바꿈을 그대로 보여주지 않음. 줄바꿈을 살리려면 스타일(예: `whitespace-pre-line`) 변경이 필요해 디자인 변경에 해당
18. **RewritePage 질문 `key={q}` 중복 경고**: 서버가 같은 질문 문장을 2개 주면 React가 콘솔에 key 중복 경고를 냄 (화면 표시는 정상). key를 바꾸려면 기존 코드 수정이 필요해 그대로 둠
19. **완료 훈련이 적으면 mostImproved/focusArea가 null이라 mock이 보임**: 완료한 훈련이 없거나 적어 서버가 `null`을 주면 대시보드에 mock `논지` / `근거 구성`이 표시됨 (사용자 결정 (a): 문구 추가 없이 mock으로 대체). 빈 상태 문구를 넣으려면 문구 승인 필요
20. **AI 의존도 미표시**: 대시보드 `trend[].aiDependencyRatio`를 그래프에 표시하지 않음. 넣으려면 그래프 2시리즈(칸마다 막대 2개)와 범례가 필요하고, 화면 약 15~25줄·새 태그 6~7개·새 색상 1~2개 규모 (데이터 쪽은 `applyRatios`에 약 3줄)
21. **demo-chart/chart-bar 스타일이 src에 없어 막대가 안 보일 가능성** (원래부터 있던 문제, 팀원 확인 필요): GrowthDashboardPage 그래프의 `demo-chart`·`chart-bar` 클래스 정의가 `index.css` 등 src 어디에도 없음. 바깥 div에 `display:flex`가 없어 `align-items`·`flex:1`이 적용되지 않고, 막대에 배경색이 없음. 서버 데이터 연결과 무관하게 막대그래프로 보이지 않을 수 있음

그 밖의 임시 처리
- **첨부파일 업로드 제외**: `createTraining`이 `files` 부분을 보내지 않음. SetupPage는 파일 이름만 보관 중이라, 업로드하려면 `File` 객체 보관이 필요 (화면 파일 수정 필요)
- **타이머는 클라이언트 기준**: 서버 `timerEndsAt`을 쓰지 않아 새로고침하면 처음부터 다시 셈
- **배포 시 백엔드 CORS 설정 필요, 프록시는 개발 전용**: `vite.config.js`의 `server.proxy`는 dev 서버에서만 동작함. 배포 사이트에서는 백엔드가 프론트 도메인을 허용하고 `Access-Control-Allow-Credentials: true`를 설정해야 하며, refresh 쿠키는 `SameSite=None; Secure`여야 함. 백엔드 CORS 설정이 끝나면 프록시를 제거하고 `.env.local`에 다시 `https://mind-test.store`를 넣어도 됨
- ~~완료 후 기록은 아직 로컬~~ → **해결**: `complete`가 로컬 기록에 추가한 항목은 완료 화면 진입 시 서버 목록·상세로 교체됨

## 나중에 확인할 것
- **[버그] 초안 제출 후 뒤로가기하면 다시 제출되지 않음**
  - 재현 방법: ① 새 글 작성 → 초안 작성 → "초안 제출 · 비교 분석" ② 분석이 끝나 `/analysis`로 이동 ③ 브라우저 뒤로가기로 `/writing`에 돌아감 ④ 초안을 고치고 다시 "초안 제출"을 누름 → 제출되지 않음 (에러 모달 또는 반응 없음)
  - 추정 원인 (확인 전): 제출 후 서버의 훈련 상태가 `COMPARED`로 바뀌는데, `POST /trainings/{id}/draft`는 `DRAFTING` 상태에서만 허용됨 → 409. 또 `session.analysisId`가 설정돼 있어 이 화면의 임시저장은 로컬에만 저장됨
  - 처리 방향 (미정): 제출 후 `/writing`에 다시 들어오면 `/analysis`로 보내거나, 수정은 "다시 쓰기(재검사)" 흐름으로 안내
