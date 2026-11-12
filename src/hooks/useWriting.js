import { useRef, useState } from 'react';
import { blank } from '../models/training';
import { today } from '../lib/date';
import {
  createTraining,
  getTraining,
  saveTemp,
  submitDraft,
  submitRevision,
  completeTraining,
} from '../api/trainings';
import { getAnalysis, pollAnalysis, retryAnalysis } from '../api/analyses';
import { toAnalysisView } from '../api/analysisView';
import { setTrainingId, clearTrainingId } from './trainingSession';
import { remainingSeconds } from './timerClock';
// 서버 응답 에러(ApiError)면 그 메시지, 네트워크 오류 등은 fallback 문구
const errorText = (err, fallback) => (err?.status ? err.message : fallback);
// 서버 진행 중 항목을 이어서 열 때 상태별 이동 화면
const RESUME_PATH = {
  DRAFTING: '/writing',
  ANALYZING: '/writing',
  COMPARED: '/analysis',
  REWRITING: '/rewrite',
};
// 첨부파일 검증 기준 (SetupPage input의 accept와 같은 확장자, 명세: 0~5개, 각 10MB 이하)
const ALLOWED_FILE_EXT = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg'];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// 파일 크기 표시: 1024KB 미만은 KB(정수, 최소 1KB), 이상은 MB(소수 1자리)
const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number') return '';
  const kb = Math.max(1, Math.round(bytes / 1024));
  return kb < 1024 ? `${kb}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};
const toFileItem = (f) => ({
  name: f.name,
  size: f.size,
  sizeLabel: formatFileSize(f.size),
});
// 훈련 생성 에러: 413 = 파일 크기, 첨부가 있을 때 400 = 파일 형식으로 안내 (에러 JSON 형식이 확정되지 않아 HTTP 상태로 구분)
const createErrorText = (err, hasFiles) => {
  if (err?.status === 413)
    return '첨부파일 크기가 너무 커요.\n각 파일은 10MB 이하로 올려 주세요.';
  if (err?.status === 400 && hasFiles)
    return '첨부할 수 없는 형식의 파일이 있어요.\nPDF, PPT, 문서, 이미지 파일만 올릴 수 있어요.';
  return errorText(err, '글 작성을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.');
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
  // 화면 목록용: [{ name, size, sizeLabel }] (File 객체는 fileObjectsRef에 같은 순서로 보관)
  const [files, setFileNames] = useState([]);
  // 업로드할 실제 File 객체 (이름 목록 files와 함께 갱신. 메모리에만 있어 새로고침하면 사라짐)
  const fileObjectsRef = useRef([]);
  // 검증 공통: 형식·10MB·중복을 걸러내고, 기존 목록(base)과 합쳐 최대 5개까지 반영
  const applyFiles = (base, list) => {
    const items = Array.from(list ?? []);
    const problems = [];
    const sameFile = (a, b) =>
      a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    let valid = items.filter((f) => {
      const ext = f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : '';
      if (!ALLOWED_FILE_EXT.includes(ext)) {
        problems.push(`${f.name} · 올릴 수 없는 형식`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        problems.push(`${f.name} · 10MB 초과`);
        return false;
      }
      if (base.some((b) => sameFile(b, f))) {
        problems.push(`${f.name} · 이미 추가한 파일`);
        return false;
      }
      return true;
    });
    let next = [...base, ...valid];
    if (next.length > MAX_FILES) {
      problems.push(`최대 ${MAX_FILES}개까지 올릴 수 있어 앞의 ${MAX_FILES}개만 첨부했어요.`);
      next = next.slice(0, MAX_FILES);
    }
    fileObjectsRef.current = next;
    setFileNames(next.map(toFileItem));
    if (problems.length)
      notify(`첨부하지 못한 파일이 있어요.\n${problems.join('\n')}`);
  };
  // 기존 setFiles: 목록을 새로 고른 파일로 바꿈 (File 배열이 아니면 이름만 저장)
  const setFiles = (list) => {
    const items = Array.from(list ?? []);
    const isFile = (f) => typeof File !== 'undefined' && f instanceof File;
    if (!items.every(isFile)) {
      fileObjectsRef.current = [];
      setFileNames(items.map((name) => ({ name, size: null, sizeLabel: '' })));
      return;
    }
    applyFiles([], items);
  };
  // 파일을 더 고르면 기존 목록 뒤에 이어 붙임 (최대 5개, 같은 파일은 건너뜀)
  const addFiles = (list) => applyFiles(fileObjectsRef.current, list);
  // 목록의 index번째 파일을 화면 목록과 업로드 대상(ref) 모두에서 제거
  const removeFile = (index) => {
    const next = fileObjectsRef.current.filter((_, i) => i !== index);
    fileObjectsRef.current = next;
    setFileNames((prev) => prev.filter((_, i) => i !== index));
  };
  const busy = useRef(false);
  const update = (k, v) => setSession((s) => ({ ...s, [k]: v }));
  const startNewWriting = () => {
    clearTrainingId();
    // 이전 글의 첨부가 남지 않도록 비움 (기존에는 비우지 않던 버그)
    fileObjectsRef.current = [];
    setFileNames([]);
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
  // 서버 목록에서 온 진행 중 항목(본문 없음) 이어서 열기: session을 비우고,
  // 상태에 맞는 화면으로 이동하면 그 화면의 복구 effect가 서버에서 불러옴
  const resumeTraining = (item) => {
    if (!item?.trainingId) return;
    setTrainingId(item.trainingId);
    setSession(blank());
    navigate(RESUME_PATH[item.trainingStatus] ?? '/writing');
  };
  const resume = () => {
    if (!saved) return;
    if (saved.trainingId && saved.trainingStatus) {
      resumeTraining(saved);
      return;
    }
    if (saved.trainingId) setTrainingId(saved.trainingId);
    setSession(saved);
    setSeconds(
      remainingSeconds(saved.timerEndsAt, saved.minutes) ??
        (saved.minutes ?? 15) * 60,
    );
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
    const attachedFiles = fileObjectsRef.current;
    createTraining({
      topic: session.topic.trim(),
      genre: session.genre,
      requirements: session.requirements,
      minutes: min,
      files: attachedFiles,
    })
      .then((res) => {
        setTrainingId(res.trainingId);
        update('trainingId', res.trainingId);
        update('status', 'DRAFTING');
        update('minutes', min);
        update('timerEndsAt', res.timerEndsAt ?? null);
        update('attachments', res.attachments ?? []);
        setSeconds(remainingSeconds(res.timerEndsAt, min) ?? (min ?? 15) * 60);
        navigate('/writing');
        // 업로드 확인: 서버가 돌려준 첨부 수가 보낸 수보다 적으면 안내
        if ((res.attachments?.length ?? 0) < attachedFiles.length)
          notify('일부 첨부파일이 업로드되지 않았어요.\n글 작성은 계속할 수 있어요.');
      })
      .catch((err) => notify(createErrorText(err, attachedFiles.length > 0)))
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
  // 서버 상태를 다시 확인해 이미 제출된 훈련이면 상태에 맞는 화면으로 이동.
  // 처리했으면 true, 서버가 아직 DRAFTING이면 false(호출한 쪽에서 제출 진행)
  const resumeSubmitted = async () => {
    const w = await getTraining(session.trainingId);
    const analysisId = w?.latestAnalysisId;
    if (w?.status === 'DRAFTING') return false;
    // ANALYZING: 결과 대기 이어가기 / COMPARED: 결과 조회 후 /analysis (waitForAnalysis가 이동까지 처리)
    if ((w?.status === 'ANALYZING' || w?.status === 'COMPARED') && analysisId) {
      await waitForAnalysis(analysisId);
      return true;
    }
    if (w?.status === 'REWRITING') {
      const analysis = analysisId
        ? await getAnalysis(analysisId).catch(() => null)
        : null;
      setSession((s) => ({
        ...s,
        status: 'REWRITING',
        analysisId: analysisId ?? s.analysisId,
        analysis: analysis ? toAnalysisView(analysis) : s.analysis,
        ai: analysis?.aiWriting?.content || s.ai,
        final: w.editorContent ?? s.final,
        pendingAnalysisId: null,
      }));
      navigate('/rewrite');
      return true;
    }
    notify('이미 제출한 글이에요.');
    return true;
  };
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
    const submitAndWait = () =>
      submitDraft(session.trainingId, session.draft).then((res) =>
        waitForAnalysis(res.analysisId),
      );
    // 이미 제출한 훈련(제출 후 뒤로가기 등): 다시 제출하지 않고 서버 상태에 맞는 화면으로
    if (session.status && session.status !== 'DRAFTING') {
      runAnalysisTask(
        () =>
          resumeSubmitted().then((handled) => (handled ? null : submitAndWait())),
        '초안을 제출하지 못했어요. 잠시 후 다시 시도해 주세요.',
      );
      return;
    }
    runAnalysisTask(
      () =>
        submitAndWait().catch((err) => {
          // 409: 서버에서는 이미 제출된 상태 → 같은 처리
          if (err?.status !== 409) throw err;
          return resumeSubmitted().then((handled) => {
            if (!handled) throw err;
          });
        }),
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
        // id가 들어간 주소로 이동해야 새로고침해도 상세(GET /detail)로 복구됨
        navigate(`/completion/${item.id}`);
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
    addFiles,
    removeFile,
    update,
    startNewWriting,
    saveDraft,
    resume,
    resumeTraining,
    begin,
    submit,
    recheck,
    complete,
    downloadText,
  };
}
