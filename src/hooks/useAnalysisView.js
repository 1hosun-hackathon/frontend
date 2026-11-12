// 비교 분석 결과(session.analysis)를 화면에 보여줄 값으로 만드는 훅.
// 서버 값이 비어 있으면 화면별 예시 값을 쓴다 (비교 분석 화면과 다시 쓰기 사이드바의 예시 문구가 다름).
import { useTrainingContext } from '../context/TrainingContext';
import { demoAnalysis } from '../mocks/analysis';
import { criteria as demoCriteria } from '../mocks/criteria';

const FALLBACK = {
  // 비교 분석 화면 (/analysis)
  comparison: {
    report: demoAnalysis.comparisonReport,
    strengths: '나만의 문제의식과 관점을 중심으로 글을 구성한 점',
    improvements: '주장을 뒷받침하는 자료의 출처와 문단 간 연결을 검토할 점',
    questions: [
      '이 주장에 반대하는 사람은 어떤 근거를 제시할까요?',
      '나의 관점을 더 설득력 있게 만드는 실제 사례는 무엇일까요?',
    ],
  },
  // 다시 쓰기 화면 사이드바 (/rewrite)
  rewrite: {
    report: ['내 글의 고유한 관점을 유지하면서 근거와 구조를 보완해보세요.'],
    strengths: demoAnalysis.strengths,
    improvements: demoAnalysis.improvements,
    questions: demoAnalysis.reflectionQuestions,
  },
};

// 배열: 비었거나 없으면 예시 값
const listOr = (list, fallback) => (list?.length ? list : fallback);

// screen: 'comparison' | 'rewrite'
export function useAnalysisView(screen) {
  const { session } = useTrainingContext();
  const a = session.analysis;
  const f = FALLBACK[screen];
  return {
    // 종합 리포트 문단 전체 (비교 분석 화면)
    report: listOr(a?.report, f.report),
    // 종합 리포트 첫 문단 (다시 쓰기 사이드바. 첫 문단이 빈 문자열이어도 예시 값)
    summary: a?.report?.[0] || f.report[0],
    strengths: a?.strengths || f.strengths,
    improvements: a?.improvements || f.improvements,
    questions: listOr(a?.questions, f.questions),
    // 항목별 비교 (Criteria에 전달)
    criteria: listOr(a?.criteria, demoCriteria),
  };
}
