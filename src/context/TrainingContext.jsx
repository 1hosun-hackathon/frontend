import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRecords } from '../hooks/useRecords';
import { useTimer } from '../hooks/useTimer';
import { useWriting } from '../hooks/useWriting';
import { useAuthContext } from './AuthContext';
import { useModalContext } from './ModalContext';
import { useLocation } from 'react-router-dom';

const TrainingContext = createContext(null);
export function TrainingProvider({ children }) {
  const { navigate, logout } = useAuthContext();
  const { pathname } = useLocation();
  const { openModal, notify } = useModalContext();
  const recordsState = useRecords();
  const { setRecords, setSaved, saved, setSelected, setMenu, setDeleting } =
    recordsState;
  const [writingMinutes, setWritingMinutes] = useState(null);
  const timer = useTimer(pathname, writingMinutes);
  const writing = useWriting({
    navigate,
    notify,
    setSaved,
    saved,
    setRecords,
    setSelected,
    setSeconds: timer.setSeconds,
  });
  useEffect(
    () => setWritingMinutes(writing.session.minutes),
    [writing.session.minutes],
  );
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
      message: '회원탈퇴 시 저장한 훈련 기록이 삭제되며 복구할 수 없습니다.',
      danger: true,
      confirmLabel: '탈퇴하기',
      onConfirm: () => {
        setRecords([]);
        setSaved(null);
        logout();
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
