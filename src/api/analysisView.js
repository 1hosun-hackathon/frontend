// 비교 분석 응답(GET /api/v1/analyses/{id})을 화면에서 쓰는 형태로 바꾸는 함수들
// 기준: 명세서(Swagger보다 우선) — items 필드: criterion, label, description, userSummary, aiSummary, comparison, reflectPoint

// overallSummary(문자열) → 문단 배열. 줄바꿈 기준으로 나누고 빈 줄은 버린다.
export const toParagraphs = (text) =>
  typeof text === 'string'
    ? text
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

// items → Criteria 화면이 쓰는 형태({ name, sub, mine, ai, analysis, action, before, after })
// 등급(before/after)은 API에 없어 빈 값 → Criteria에서 "· 등급" 표시를 숨긴다.
export const toCriteria = (items) =>
  Array.isArray(items)
    ? items.map((it) => ({
        criterion: it.criterion,
        name: it.label ?? '',
        sub: it.description ?? '',
        mine: it.userSummary ?? '',
        ai: it.aiSummary ?? '',
        analysis: it.comparison ?? '',
        action: it.reflectPoint ?? '',
        before: '',
        after: '',
      }))
    : [];

// questions[{ seqNo, content }] → seqNo 순 문자열 배열
export const toQuestions = (questions) =>
  Array.isArray(questions)
    ? [...questions]
        .sort((a, b) => (a.seqNo ?? 0) - (b.seqNo ?? 0))
        .map((q) => q.content)
        .filter(Boolean)
    : [];

// session.analysis에 저장할 화면용 묶음. 응답이 없으면 null (화면은 기존 mock/문구 사용)
export const toAnalysisView = (analysis) =>
  analysis
    ? {
        analysisId: analysis.analysisId,
        seqNo: analysis.seqNo,
        summary: analysis.overallSummary ?? '',
        report: toParagraphs(analysis.overallSummary),
        strengths: analysis.strengths ?? '',
        improvements: analysis.improvements ?? '',
        criteria: toCriteria(analysis.items),
        questions: toQuestions(analysis.questions),
      }
    : null;
