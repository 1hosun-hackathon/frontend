import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRecords } from '../hooks/useRecords';
import { useTimer } from '../hooks/useTimer';
import { useWriting } from '../hooks/useWriting';
import { useAuthContext } from './AuthContext';
import { useModalContext } from './ModalContext';
import { useLocation } from 'react-router-dom';
import { getTraining } from '../api/trainings';
import { getTrainingId } from '../hooks/trainingSession';
import { startRewrite } from '../api/trainings';
import { getAnalysis } from '../api/analyses';
import { toAnalysisView } from '../api/analysisView';
import { useServerRecords } from '../hooks/useServerRecords';
import { deleteTraining } from '../api/records';
import { withdraw as withdrawAccount } from '../api/home';
import { clearTrainingId } from '../hooks/trainingSession';
import { remainingSeconds } from '../hooks/timerClock';

const TrainingContext = createContext(null);
export function TrainingProvider({ children }) {
  const { navigate, logout } = useAuthContext();
  const { user } = useAuthContext();
  const { pathname } = useLocation();
  const { openModal, notify } = useModalContext();
  const { closeModal } = useModalContext();
  const recordsState = useRecords();
  const { setRecords, setSaved, saved, setSelected, setMenu, setDeleting } =
    recordsState;
  // 서버 기록으로 records · saved · selected 채우기 (홈·기록·대시보드·마이페이지·완료 화면)
  const { serverRatio, serverGrowth, serverStreakDays, reload: reloadRecords } = useServerRecords({
    user,
    pathname,
    records: recordsState.records,
    setRecords,
    setSaved,
    selected: recordsState.selected,
    setSelected,
  });
  const [writingMinutes, setWritingMinutes] = useState(null);
  // 서버 timerEndsAt (session과 동기화, writingMinutes와 같은 방식)
  const [writingEndsAt, setWritingEndsAt] = useState(null);
  const timer = useTimer(pathname, writingMinutes, writingEndsAt);
  const writing = useWriting({
    navigate,
    notify,
    setSaved,
    saved,
    setRecords,
    setSelected,
    setSeconds: timer.setSeconds,
    openModal,
    closeModal,
  });
  useEffect(
    () => setWritingMinutes(writing.session.minutes),
    [writing.session.minutes],
  );
  useEffect(
    () => setWritingEndsAt(writing.session.timerEndsAt ?? null),
    [writing.session.timerEndsAt],
  );
  // 새로고침으로 session이 비었을 때 sessionStorage의 trainingId로 초안 작성 화면 복구
  useEffect(() => {
    if (pathname !== '/writing' || writing.session.trainingId) return;
    const id = getTrainingId();
    if (!id) return;
    let cancelled = false;
    getTraining(id)
      .then((w) => {
        if (cancelled || !w) return;
        writing.setSession((s) => ({
          ...s,
          trainingId: w.trainingId,
          status: w.status,
          topic: w.topic ?? '',
          genre: w.writingType ?? s.genre,
          requirements: w.requirements ?? '',
          minutes: w.timerMinutes ?? null,
          timerEndsAt: w.timerEndsAt ?? null,
          draft: w.editorContent ?? '',
          pendingAnalysisId:
            w.status === 'ANALYZING' ? w.latestAnalysisId : null,
        }));
        timer.setSeconds(
          remainingSeconds(w.timerEndsAt, w.timerMinutes) ??
            (w.timerMinutes ?? 15) * 60,
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, writing.session.trainingId]);
  // /analysis·/rewrite에서 새로고침으로 session이 비었을 때 훈련 정보와 최근 분석 결과로 복구
  useEffect(() => {
    if (
      !['/analysis', '/rewrite'].includes(pathname) ||
      writing.session.trainingId
    )
      return;
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
        writing.setSession((s) => ({
          ...s,
          trainingId: w.trainingId,
          status: w.status,
          topic: w.topic ?? '',
          genre: w.writingType ?? s.genre,
          requirements: w.requirements ?? '',
          minutes: w.timerMinutes ?? null,
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
          pendingAnalysisId:
            w.status === 'ANALYZING' ? w.latestAnalysisId : null,
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, writing.session.trainingId]);
  // 다시 쓰기 화면 진입 시 COMPARED → REWRITING 전환
  // (비교 분석 화면의 "다시 쓰기" 버튼은 화면 파일이라 핸들러 대신 여기서 호출. 여러 번 호출해도 결과 같음)
  useEffect(() => {
    const { trainingId, status } = writing.session;
    if (pathname !== '/rewrite' || !trainingId || status !== 'COMPARED') return;
    startRewrite(trainingId)
      .then((w) => {
        writing.setSession((s) => ({
          ...s,
          status: w?.status ?? 'REWRITING',
          final: s.final || w?.editorContent || '',
        }));
      })
      .catch(() =>
        notify('다시 쓰기를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.'),
      );
  }, [pathname, writing.session.trainingId, writing.session.status]);
  const requestDelete = (id) => {
    setMenu(null);
    openModal({
      title:
        id === 'draft'
          ? '작성 중인 글을 삭제할까요?'
          : '훈련 기록을 삭제할까요?',
      message:
        '초안, 비교 분석, 수정본과 최종 글이 삭제됩니다. 삭제 후에는 복구할 수 없습니다.',
      danger: true,
      confirmLabel: '삭제하기',
      onConfirm: () => {
        // 서버 삭제. 화면에서는 아래 기존 줄로 먼저 지우고, 실패하면 안내 후 목록을 다시 불러옴
        const targetId = id === 'draft' ? saved?.trainingId : id;
        if (id === 'draft' && targetId && targetId === getTrainingId())
          clearTrainingId();
        if (targetId)
          deleteTraining(targetId).catch(() => {
            notify('기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
            reloadRecords();
          });
        if (id === 'draft') setSaved(null);
        else setRecords((rs) => rs.filter((r) => String(r.id) !== String(id)));
      },
    });
  };
  const remove = () => {
    if (recordsState.deleting === 'draft') setSaved(null);
    else
      setRecords((rs) =>
        rs.filter((r) => String(r.id) !== String(recordsState.deleting)),
      );
    setDeleting(null);
    setMenu(null);
  };
  const withdraw = () =>
    openModal({
      title: '회원탈퇴를 진행할까요?',
      message:
        '회원탈퇴를 진행하면 로그아웃됩니다. 작성한 훈련 기록은 삭제되지 않고 보존됩니다.',
      danger: true,
      confirmLabel: '탈퇴하기',
      onConfirm: () => {
        // DELETE /users/me 성공 후에만 기존 처리(기록 비우기·로그아웃). 실패하면 안내하고 로그인 상태 유지
        withdrawAccount()
          .then(() => {
            setRecords([]);
            setSaved(null);
            logout();
          })
          .catch(() =>
            notify('회원탈퇴를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.'),
          );
      },
    });
  return (
    <TrainingContext.Provider
      value={{
        ...recordsState,
        ...timer,
        ...writing,
        withdraw,
        requestDelete,
        remove,
        // 화면이 읽는 ratio를 서버 값(최근 완료 3회 평균)으로. 불러오기 전에는 기존 계산값
        ratio: serverRatio ?? recordsState.ratio,
        // 대시보드 mostImproved / focusArea의 label ({ strongest, focus }), 불러오기 전에는 null
        serverGrowth,
        // 대시보드 연속 완료 일수, 불러오기 전에는 null
        serverStreakDays,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}
export function useTrainingContext() {
  const ctx = useContext(TrainingContext);
  if (!ctx) throw new Error('TrainingProvider가 필요합니다.');
  return ctx;
}
