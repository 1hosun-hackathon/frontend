# 글적글적 — React + Vite + Tailwind CSS

## 실행

```bash
npm install
npm run dev
```

## 구조
- `src/pages/`: 페이지 파일을 하위 폴더 없이 배치. 간단한 종합 리포트는 해당 페이지 안에서 구성
- `src/components/Header.jsx`: 공개 홈에서도 보이는 공통 헤더. 비로그인 시 보호 메뉴 클릭은 로그인 안내 모달 표시
- `src/components/CommonModal.jsx`: 공통 안내·확인 모달
- `src/routes/AppRoutes.jsx`: 공개 페이지와 인증이 필요한 페이지의 라우팅
- `src/context/AuthContext.jsx`: 인증 상태
- `src/context/TrainingContext.jsx`: 훈련 기록·글쓰기 상태
- `src/context/ModalContext.jsx`: 공통 모달 상태
- `src/components/`: 버튼, 카드, 배지, 페이지 소개, 글쓰기 레이아웃 등 공통 UI. 페이지에서는 필요한 컴포넌트를 직접 가져와 사용
- `src/components/Steps.jsx`: 설정·작성·분석·수정 화면에서 공유하는 진행 단계
- `src/components/CompareTexts.jsx`, `src/components/Criteria.jsx`: 여러 페이지에서 공유하는 글 비교·항목별 평가 UI
- 각 페이지는 필요한 Auth·Training·Modal Context를 직접 사용
- `src/hooks/`: 기능별 훅
- `src/mocks/`: 추후 API 연동 시 제거할 목 데이터
- `src/models/`: 훈련 초기값 등 도메인 모델

**참고:** 현재 인증과 AI 응답은 데모용이며 실제 백엔드와 연결되지 않았습니다.
