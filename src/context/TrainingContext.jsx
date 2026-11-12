import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useRecords } from '../hooks/useRecords';
import { useTimer } from '../hooks/useTimer';
import { useWriting } from '../hooks/useWriting';
import { useAuthContext } from './AuthContext';
import { useModalContext } from './ModalContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTrainingId, clearTrainingId } from '../hooks/trainingSession';
import { useSessionRestore } from '../hooks/useSessionRestore';
import { useServerRecords } from '../hooks/useServerRecords';
import { deleteTraining } from '../api/records';
import { withdraw as withdrawAccount } from '../api/home';
import { blank } from '../models/training';

const TrainingContext = createContext(null);
export function TrainingProvider({ children }) {
  const { navigate, logout, user } = useAuthContext();
  const { pathname } = useLocation();
  const routerNavigate = useNavigate();
  const { openModal, notify, closeModal } = useModalContext();
  const recordsState = useRecords();
  const { setRecords, setSelected, setMenu } = recordsState;
  // 서버 기록으로 records · 진행 중 목록 · selected 채우기 (홈·기록·대시보드·마이페이지·완료 화면)
  const {
    serverRatio,
    serverGrowth,
    serverStreakDays,
    inProgressList,
    removeInProgress,
    reload: reloadRecords,
    invalidate: invalidateRecords,
  } = useServerRecords({
    user,
    pathname,
    records: recordsState.records,
    setRecords,
    selected: recordsState.selected,
    setSelected,
  });
  // useWriting이 타이머보다 먼저 만들어지므로 남은 시간 설정은 ref로 연결
  // (setSeconds는 렌더 중이 아니라 버튼·응답 처리에서만 호출됨)
  const setSecondsRef = useRef(null);
  const writing = useWriting({
    navigate,
    notify,
    setRecords,
    setSelected,
    setSeconds: (s) => setSecondsRef.current?.(s),
    openModal,
    closeModal,
  });
  // 타이머: session의 제한 시간과 서버 종료 시각(timerEndsAt, UTC)을 직접 읽음
  const timer = useTimer(
    pathname,
    writing.session.minutes,
    writing.session.timerEndsAt ?? null,
  );
  setSecondsRef.current = timer.setSeconds;
  // id 없이 /completion으로 온 경우(화면 이동은 모두 id 주소를 쓰므로 주소 직접 입력 등 예외용): 선택한 훈련의 id 주소로 바꿈.
  // 새로고침해도 상세로 복구되고, replace라서 뒤로가기 기록이 쌓이지 않음
  useEffect(() => {
    const id = recordsState.selected?.trainingId ?? recordsState.selected?.id;
    if (pathname !== '/completion' || typeof id !== 'number') return;
    routerNavigate(`/completion/${id}`, { replace: true });
  }, [pathname, recordsState.selected?.id]);
  // 로그아웃·회원탈퇴·세션 만료로 user가 없어지면 이전 계정 데이터를 모두 비움
  useEffect(() => {
    if (user) return;
    writing.setSession(blank());
    writing.setFiles([]);
    setRecords([]);
    setSelected(null);
    setMenu(null);
    clearTrainingId();
  }, [user]);
  // 이 탭에서 훈련 상태가 바뀌면(시작·제출·분석 완료·다시 쓰기) 목록 캐시 무효화.
  // 분석 대기 중 홈으로 나가도 완료되면 다음 목록 화면 진입 때 새 상태를 불러옴
  useEffect(() => invalidateRecords(), [writing.session.status]);
  // 새로고침으로 session이 비었을 때 sessionStorage의 trainingId로 복구 (/writing, /analysis, /rewrite)
  useSessionRestore({
    pathname,
    trainingId: writing.session.trainingId,
    setSession: writing.setSession,
    setSeconds: timer.setSeconds,
    // /rewrite 새로고침 복구 시 서버가 아직 COMPARED면 REWRITING으로 전환
    enterRewriting: writing.enterRewriting,
  });
  const requestDelete = (id) => {
    setMenu(null);
    // 진행 중 목록의 항목인지 (모달 제목, 목록에서 바로 빼기)
    const isInProgress = inProgressList.some(
      (t) => String(t.id) === String(id),
    );
    openModal({
      title: isInProgress
        ? '작성 중인 글을 삭제할까요?'
        : '훈련 기록을 삭제할까요?',
      message:
        '초안, 비교 분석, 수정본과 최종 글이 삭제됩니다. 삭제 후에는 복구할 수 없습니다.',
      danger: true,
      confirmLabel: '삭제하기',
      onConfirm: () => {
        // 비율·연속 일수 등도 바뀌므로 다음 목록 화면 진입 때 다시 불러옴
        invalidateRecords();
        // 서버 삭제. 화면에서는 아래 기존 줄로 먼저 지우고, 실패하면 안내 후 목록을 다시 불러옴
        // 진행 중 항목: 목록에서 바로 빼고, 현재 작업 중인 훈련이면 sessionStorage에서도 삭제
        if (isInProgress) {
          removeInProgress(id);
          if (String(id) === String(getTrainingId())) clearTrainingId();
        }
        if (id)
          deleteTraining(id).catch(() => {
            notify('기록을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
            reloadRecords();
          });
        setRecords((rs) => rs.filter((r) => String(r.id) !== String(id)));
      },
    });
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
        // 화면이 읽는 ratio를 서버 값(최근 완료 3회 평균)으로. 불러오기 전에는 기존 계산값
        ratio: serverRatio ?? recordsState.ratio,
        // 대시보드 mostImproved / focusArea의 label ({ strongest, focus }), 불러오기 전에는 null
        serverGrowth,
        // 대시보드 연속 완료 일수, 불러오기 전에는 null
        serverStreakDays,
        // 진행 중 훈련 목록 (홈·기록 화면)
        inProgressList,
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
