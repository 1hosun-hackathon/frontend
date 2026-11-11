import { useRef, useState } from 'react';
import { blank } from '../models/training';
import { today } from '../lib/date';
import {
  createTraining,
  saveTemp,
  submitDraft,
  submitRevision,
  completeTraining,
} from '../api/trainings';
import { getAnalysis, pollAnalysis, retryAnalysis } from '../api/analyses';
import { toAnalysisView } from '../api/analysisView';
import { setTrainingId, clearTrainingId } from './trainingSession';
// 서버 응답 에러(ApiError)면 그 메시지, 네트워크 오류 등은 fallback 문구
const errorText = (err, fallback) => (err?.status ? err.message : fallback);
// 서버 진행 중 항목을 이어서 열 때 상태별 이동 화면
const RESUME_PATH = {
  DRAFTING: '/writing',
  ANALYZING: '/writing',
  COMPARED: '/analysis',
  REWRITING: '/rewrite',
};
// 재검사 에러: 에러 JSON 형식이 확정되지 않아 HTTP 상태로 구분 (409는 NO_CHANGES·상태 불일치 모두 포괄)
const revisionErrorText = (err) => {
  if (err?.status === 409)
    return '직전 제출본과 달라진 내용이 없거나, 지금은 다시 검사할 수 없는 상태예요.\n글을 수정했는지 확인해 주세요.';
  if (err?.status === 400) return '수정본 내용을 입력해 주세요.';
  return errorText(err, '수정본을 다시 검사하지 못했어요. 잠시 후 다시 시도해 주세요.');
};
// 완료 에러: 완료는 REWRITING 상태에서만 가능
const completeErrorText = (err) => {
  if (err?.status === 409)
    return '지금은 훈련을 완료할 수 없는 상태예요.\n분석이 진행 중이면 끝난 뒤 다시 시도해 주세요.';
  if (err?.status === 400) return '최종 글 내용을 입력해 주세요.';
  return errorText(err, '훈련을 완료하지 못했어요. 잠시 후 다시 시도해 주세요.');
};
export function useWriting({
  navigate,
  notify,
  setSaved,
  saved,
  setRecords,
  setSelected,
  setSeconds,
  openModal = (config) => notify(config.message),
  closeModal = () => {},
}) {
  const [session, setSession] = useState(blank);
  const [files, setFiles] = useState([]);
  const busy = useRef(false);
  const update = (k, v) => setSession((s) => ({ ...s, [k]: v }));
  const startNewWriting = () => {
    clearTrainingId();
    setSession(blank());
    navigate('/setup');
  };
  const saveDraft = () => {
    const saveLocal = () => {
      setSaved({ ...session, date: today(), status: '진행 중' });
      notify('임시 저장했어요.');
    };
    // 서버 임시저장: DRAFTING이면 초안, REWRITING이면 수정본. 그 외 상태(분석 중·비교 완료)는 로컬 저장만.
    const status =
      session.status ?? (session.analysisId ? null : 'DRAFTING');
    const tempContent =
      status === 'DRAFTING'
        ? session.draft
        : status === 'REWRITING'
          ? session.final
          : null;
    if (session.trainingId && tempContent !== null) {
      saveTemp(session.trainingId, tempContent)
        .then(saveLocal)
        .catch((err) =>
          notify(errorText(err, '임시 저장에 실패했어요. 잠시 후 다시 시도해 주세요.')),
        );
      return;
    }
    saveLocal();
  };
  const resume = () => {
    if (!saved) return;
    // 서버 목록에서 온 진행 중 항목(본문 없음): session을 비우고, 이동한 화면의 복구 effect가 서버에서 불러오게 함
    if (saved.trainingId && saved.trainingStatus) {
      setTrainingId(saved.trainingId);
      setSession(blank());
      navigate(RESUME_PATH[saved.trainingStatus] ?? '/writing');
      return;
    }
    if (saved.trainingId) setTrainingId(saved.trainingId);
    setSession(saved);
    setSeconds((saved.minutes ?? 15) * 60);
    navigate(saved.draft || saved.trainingId ? '/writing' : '/setup');
  };
  const begin = () => {
    if (!session.topic.trim()) {
      notify('글 주제를 입력해 주세요.');
      return;
    }
    const min =
      session.minutes === null
        ? null
        : Math.max(1, Number(session.minutes) || 15);
    if (busy.current) return;
    busy.current = true;
    createTraining({
      topic: session.topic.trim(),
      genre: session.genre,
      requirements: session.requirements,
      minutes: min,
    })
      .then((res) => {
        setTrainingId(res.trainingId);
        update('trainingId', res.trainingId);
        update('status', 'DRAFTING');
        update('minutes', min);
        setSeconds((min ?? 15) * 60);
        navigate('/writing');
      })
      .catch((err) =>
        notify(errorText(err, '글 작성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')),
      )
      .finally(() => {
        busy.current = false;
      });
  };
  // 분석 상태를 2초마다 확인 → SUCCESS면 결과 조회 후 /writing·/rewrite에 있을 때만 /analysis로 이동
  const waitForAnalysis = async (analysisId) => {
    update('pendingAnalysisId', analysisId);
    update('status', 'ANALYZING');
    openModal({
      title: '비교 분석 중이에요',
      message:
        'AI 글 작성과 비교 분석에 시간이 조금 걸릴 수 있어요.\n완료되면 비교 분석 화면으로 이동합니다.',
    });
    const result = await pollAnalysis(analysisId);
    if (result.status === 'SUCCESS') {
      const analysis = await getAnalysis(analysisId);
      setSession((s) => {
        // seqNo 0 = 초안 분석, 1 이상 = 재검사
        const seqNo = analysis?.seqNo ?? 0;
        const isRecheck = seqNo > 0;
        const versions = s.versions || [];
        return {
          ...s,
          ai: analysis?.aiWriting?.content || s.ai || '',
          final: isRecheck
            ? (analysis?.myWriting?.content ?? s.final)
            : s.final || s.draft,
          recheckCount: isRecheck ? seqNo : s.recheckCount,
          versions:
            isRecheck && !versions.some((v) => v.version === seqNo)
              ? [
                  ...versions,
                  {
                    version: seqNo,
                    text: analysis?.myWriting?.content ?? s.final,
                    date: today(),
                  },
                ]
              : versions,
          analysis: toAnalysisView(analysis),
          analysisId,
          pendingAnalysisId: null,
          status: 'COMPARED',
        };
      });
      closeModal();
      if (['/writing', '/rewrite'].includes(window.location.pathname))
        navigate('/analysis');
      return;
    }
    closeModal();
    if (result.status === 'FAILED') {
      openModal({
        title: '분석에 실패했어요',
        message: '비교 분석을 완료하지 못했어요. 다시 시도할까요?',
        confirmLabel: '다시 시도',
        onConfirm: () => retry(analysisId),
      });
      return;
    }
    notify('분석이 지연되고 있어요. 잠시 후 같은 버튼을 다시 눌러 확인해 주세요.');
  };
  // 실패/지연 처리 공통: 대기 모달을 닫고 에러 안내 (fallback: 문구 또는 err → 문구 함수)
  const runAnalysisTask = (task, fallback) => {
    if (busy.current) return;
    busy.current = true;
    task()
      .catch((err) => {
        closeModal();
        notify(
          typeof fallback === 'function'
            ? fallback(err)
            : errorText(err, fallback),
        );
      })
      .finally(() => {
        busy.current = false;
      });
  };
  const retry = (analysisId) =>
    runAnalysisTask(
      () => retryAnalysis(analysisId).then(() => waitForAnalysis(analysisId)),
      '분석을 다시 시도하지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  const submit = () => {
    if (!session.draft.trim()) {
      notify('초안을 작성해 주세요.');
      return;
    }
    if (!session.trainingId) {
      notify('훈련 정보를 찾을 수 없어요. 새 글 작성하기로 다시 시작해 주세요.');
      return;
    }
    // 이미 제출해서 분석 중이면(지연·새로고침) 다시 제출하지 않고 상태 확인만 이어서 한다
    if (session.pendingAnalysisId) {
      runAnalysisTask(
        () => waitForAnalysis(session.pendingAnalysisId),
        '분석 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      return;
    }
    runAnalysisTask(
      () =>
        submitDraft(session.trainingId, session.draft).then((res) =>
          waitForAnalysis(res.analysisId),
        ),
      '초안을 제출하지 못했어요. 잠시 후 다시 시도해 주세요.',
    );
  };
  const recheck = () => {
    if (!session.final.trim()) {
      notify('수정본을 작성해 주세요.');
      return;
    }
    if (!session.trainingId) {
      notify('훈련 정보를 찾을 수 없어요. 새 글 작성하기로 다시 시작해 주세요.');
      return;
    }
    // 이미 제출해서 분석 중이면(지연·새로고침) 다시 제출하지 않고 상태 확인만 이어서 한다
    if (session.pendingAnalysisId) {
      runAnalysisTask(
        () => waitForAnalysis(session.pendingAnalysisId),
        '분석 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      return;
    }
    // POST /revisions → 상태 확인 반복 → 결과 조회 (versions 추가는 waitForAnalysis에서)
    runAnalysisTask(
      () =>
        submitRevision(session.trainingId, session.final).then((res) =>
          waitForAnalysis(res.analysisId),
        ),
      revisionErrorText,
    );
  };
  const complete = () => {
    if (!session.final.trim()) {
      notify('최종 글을 작성해 주세요.');
      return;
    }
    if (!session.trainingId) {
      notify('훈련 정보를 찾을 수 없어요. 새 글 작성하기로 다시 시작해 주세요.');
      return;
    }
    if (busy.current) return;
    busy.current = true;
    // POST /complete 성공 후 기존 로컬 처리 (완료 화면·기록은 다음 단계에서 서버 데이터로 교체)
    completeTraining(session.trainingId, session.final)
      .then((res) => {
        const item = {
          ...session,
          id: res?.trainingId ?? session.trainingId,
          date: today(),
          status: '완료',
          thoughtRatio: session.thoughtRatio || 70,
        };
        setRecords((rs) => [item, ...rs]);
        setSelected(item);
        setSaved(null);
        clearTrainingId();
        navigate('/completion');
      })
      .catch((err) => notify(completeErrorText(err)))
      .finally(() => {
        busy.current = false;
      });
  };
  const downloadText = () => {
    const content = session.final || session.draft || '';
    if (!content.trim()) {
      notify('저장할 글이 없습니다.');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '글적글적.txt';
    a.click();
    URL.revokeObjectURL(url);
  };
  return {
    session,
    setSession,
    files,
    setFiles,
    update,
    startNewWriting,
    saveDraft,
    resume,
    begin,
    submit,
    recheck,
    complete,
    downloadText,
  };
}
