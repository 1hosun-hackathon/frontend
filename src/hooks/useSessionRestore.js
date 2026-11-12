// 새로고침으로 session이 비었을 때 sessionStorage의 trainingId로 작업 화면을 복구하는 훅 (TrainingContext에서 호출)
// - /writing: 훈련 정보(GET /trainings/{id})로 초안·타이머 복구
// - /analysis·/rewrite: 훈련 정보 + 최근 분석 결과(GET /analyses/{id})로 복구
import { useEffect } from 'react';
import { getTraining } from '../api/trainings';
import { getAnalysis } from '../api/analyses';
import { toAnalysisView } from '../api/analysisView';
import { getTrainingId } from './trainingSession';
import { remainingSeconds } from './timerClock';

// 두 복구에서 같은 값: 훈련 정보(TrainingWorkspaceResponse) → session 공통 필드
const workspaceFields = (w, s) => ({
  trainingId: w.trainingId,
  status: w.status,
  topic: w.topic ?? '',
  genre: w.writingType ?? s.genre,
  requirements: w.requirements ?? '',
  minutes: w.timerMinutes ?? null,
  attachments: w.attachments ?? [],
  pendingAnalysisId: w.status === 'ANALYZING' ? w.latestAnalysisId : null,
});

export function useSessionRestore({
  pathname,
  trainingId,
  setSession,
  setSeconds,
  enterRewriting,
}) {
  // 초안 작성 화면 복구
  useEffect(() => {
    if (pathname !== '/writing' || trainingId) return;
    const id = getTrainingId();
    if (!id) return;
    let cancelled = false;
    getTraining(id)
      .then((w) => {
        if (cancelled || !w) return;
        setSession((s) => ({
          ...s,
          ...workspaceFields(w, s),
          timerEndsAt: w.timerEndsAt ?? null,
          draft: w.editorContent ?? '',
        }));
        setSeconds(
          remainingSeconds(w.timerEndsAt, w.timerMinutes) ??
            (w.timerMinutes ?? 15) * 60,
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, trainingId]);

  // 비교 분석·다시 쓰기 화면 복구
  useEffect(() => {
    if (!['/analysis', '/rewrite'].includes(pathname) || trainingId) return;
    const id = getTrainingId();
    if (!id) return;
    let cancelled = false;
    getTraining(id)
      .then(async (w) => {
        if (cancelled || !w) return;
        // 분석 중(ANALYZING)이면 결과가 아직 없으므로 조회하지 않음
        const analysis =
          w.latestAnalysisId && w.status !== 'ANALYZING'
            ? await getAnalysis(w.latestAnalysisId).catch(() => null)
            : null;
        if (cancelled) return;
        const seqNo = analysis?.seqNo ?? 0;
        setSession((s) => ({
          ...s,
          ...workspaceFields(w, s),
          draft:
            analysis?.baseline?.content ??
            (seqNo === 0 ? analysis?.myWriting?.content : undefined) ??
            '',
          final:
            w.status === 'REWRITING'
              ? (w.editorContent ?? '')
              : (analysis?.myWriting?.content ?? w.editorContent ?? ''),
          ai: analysis?.aiWriting?.content ?? '',
          recheckCount: seqNo,
          analysis: toAnalysisView(analysis),
          analysisId: w.latestAnalysisId ?? null,
        }));
        // 다시 쓰기 화면인데 서버가 아직 COMPARED면 전환 (버튼을 거치지 않고 들어온 경우)
        if (pathname === '/rewrite' && w.status === 'COMPARED')
          enterRewriting(w.trainingId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, trainingId]);
}
