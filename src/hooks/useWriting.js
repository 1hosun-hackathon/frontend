import { useState } from 'react';
import { blank } from '../models/training';
import { makeAI } from '../mocks/demoAI';
import { today } from '../lib/date';
export function useWriting({
  navigate,
  notify,
  setSaved,
  saved,
  setRecords,
  setSelected,
  setSeconds,
}) {
  const [session, setSession] = useState(blank);
  const [files, setFiles] = useState([]);
  const update = (k, v) => setSession((s) => ({ ...s, [k]: v }));
  const startNewWriting = () => {
    setSession(blank());
    navigate('/setup');
  };
  const saveDraft = () => {
    setSaved({ ...session, date: today(), status: '진행 중' });
    notify('임시 저장했어요.');
  };
  const resume = () => {
    if (!saved) return;
    setSession(saved);
    setSeconds((saved.minutes ?? 15) * 60);
    navigate(saved.draft ? '/writing' : '/setup');
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
    update('minutes', min);
    setSeconds((min ?? 15) * 60);
    navigate('/writing');
  };
  const submit = () => {
    if (!session.draft.trim()) {
      notify('초안을 작성해 주세요.');
      return;
    }
    setSession((s) => ({
      ...s,
      ai: s.ai || makeAI(s.topic),
      final: s.final || s.draft,
    }));
    navigate('/analysis');
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
