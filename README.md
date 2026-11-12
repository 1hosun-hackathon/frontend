# 글적글적

직접 쓴 글을 AI 글과 비교하고 다듬는 글쓰기 훈련 서비스

주제 설정 → 초안 작성 → 비교 분석 → 다시 쓰기 → 훈련 완료

## 기술 스택

React · Vite · Tailwind CSS · React Router

## 프로젝트 구조

- src/pages: 페이지별 화면
- src/components: 공통 UI
- src/context: 인증·모달·훈련 상태 공유
- src/hooks: 글쓰기·타이머·기록 조회·세션 복구
- src/api: API 요청 및 응답 데이터 변환
- src/models: 훈련 데이터 초기 구조
- src/mocks: 예시 분석·평가 데이터
- src/lib: 공통 유틸리티

## 연동 참고

- 개발 환경은 Vite 프록시, Vercel 배포는 rewrites로 API 요청을 전달합니다.
- 훈련 기록과 임시 저장은 서버 API를 사용합니다.
- 일부 분석·평가·완료 리포트에는 예시 데이터가 사용됩니다.
- 글 종류는 현재 서버 제약으로 '논설문'으로 전송됩니다.
- 상세 연동 현황과 백엔드 확인 사항은 [API_CHANGELOG.md](./API_CHANGELOG.md)를 참고해 주세요.
