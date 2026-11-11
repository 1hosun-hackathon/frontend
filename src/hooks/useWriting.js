import { useRef, useState } from 'react';
import { blank } from '../models/training';
import { today } from '../lib/date';
import { createTraining, saveTemp, submitDraft } from '../api/trainings';
import { getAnalysis, pollAnalysis, retryAnalysis } from '../api/analyses';
import { setTrainingId, clearTrainingId } from './trainingSession';
// 서버 응답 에러(ApiError)면 그 메시지, 네트워크 오류 등은 fallback 문구
const errorText = (err, fallback) => (err?.status ? err.message : fallback);
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
    // 초안 제출 전에만 서버 임시저장. 제출 후(다시 쓰기)는 다음 단계 연결 전까지 기존처럼 로컬 저장만.
    if (session.trainingId && !session.analysisId) {
      saveTemp(session.trainingId, session.draft)
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
  // 분석 상태를 2초마다 확인 → SUCCESS면 결과 조회 후 /writing에 있을 때만 /analysis로 이동
  const waitForAnalysis = async (analysisId) => {
    update('pendingAnalysisId', analysisId);
    openModal({
      title: '비교 분석 중이에요',
      message:
        'AI 글 작성과 비교 분석에 시간이 조금 걸릴 수 있어요.\n완료되면 비교 분석 화면으로 이동합니다.',
    });
    const result = await pollAnalysis(analysisId);
    if (result.status === 'SUCCESS') {
      const analysis = await getAnalysis(analysisId);
      setSession((s) => ({
        ...s,
        ai: analysis?.aiWriting?.content || '',
        final: s.final || s.draft,
        analysisId,
        pendingAnalysisId: null,
      }));
      closeModal();
      if (window.location.pathname === '/writing') navigate('/analysis');
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
    notify('분석이 지연되고 있어요. 잠시 후 초안 제출 버튼을 다시 눌러 확인해 주세요.');
  };
  // 실패/지연 처리 공통: 대기 모달을 닫고 에러 안내
  const runAnalysisTask = (task, fallback) => {
    if (busy.current) return;
    busy.current = true;
    task()
      .catch((err) => {
        closeModal();
        notify(errorText(err, fallback));
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
    setSession((s) => ({
      ...s,
      recheckCount: s.recheckCount + 1,
      versions: [
        ...s.versions,
        { version: s.recheckCount + 1, text: s.final, date: today() },
      ],
    }));
    navigate('/analysis');
  };
  const complete = () => {
    if (!session.final.trim()) {
      notify('최종 글을 작성해 주세요.');
      return;
    }
    const item = {
      ...session,
      id: Date.now(),
      date: today(),
      status: '완료',
      thoughtRatio: session.thoughtRatio || 70,
    };
    setRecords((rs) => [item, ...rs]);
    setSelected(item);
    setSaved(null);
    navigate('/completion');
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
