import PageIntro from '../components/PageIntro';
import { Eyebrow, MutedText } from '../components/Typography';
import Button from '../components/Button';
import Card from '../components/Card';
import { useModalContext } from '../context/ModalContext';
import { useAuthContext } from '../context/AuthContext';
import { useTrainingContext } from '../context/TrainingContext';
import React from 'react';

export default function HomePage() {
  const { openModal } = useModalContext();
  const openLoginPrompt = () =>
    openModal({
      title: '로그인이 필요해요',
      message: '새 글을 작성하려면 먼저 로그인해 주세요.',
      confirmLabel: '로그인하러 가기',
      onConfirm: () => navigate('/login'),
    });
  const { user, navigate } = useAuthContext();
  const { records, saved, startNewWriting, ratio, resume } =
    useTrainingContext();
  return (
    <>
      <PageIntro>
        <Eyebrow>글적글적 · 생각을 쓰고 다듬는 시간</Eyebrow>
        <h1>
          내 생각에서 시작해,
          <br />더 깊은 글로.
        </h1>
        <MutedText>
          먼저 스스로 쓰고, AI 글과 비교하며, 나만의 관점을 발전시켜보세요.
        </MutedText>
        <Button
          onClick={() => {
            if (!user) {
              openLoginPrompt();
              return;
            }
            startNewWriting();
          }}
        >
          새 글 작성하기
        </Button>
      </PageIntro>
      {user && (
        <div className="flex flex-col items-stretch gap-8 rounded-4.5 border border-[#E6E9E4] bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div className="flex-1 [&_h3]:my-2 [&_h3]:text-base [&_h3_strong]:ml-2 [&_h3_strong]:text-3xl [&_h3_strong]:text-[#727D67] [&_p]:m-0 [&_p]:text-xs [flex:1]">
            <Eyebrow>MY GROWTH</Eyebrow>
            <h3>
              자기 사고 구성 비율 <strong>{ratio}%</strong>
            </h3>
            <MutedText>
              지난 훈련보다 내 생각을 더 분명하게 구성하고 있어요.
            </MutedText>
          </div>
          <div className="w-full md:w-[36%] md:min-w-55">
            <div className="h-3 overflow-hidden rounded-full bg-[#E8EAE6] [&_span]:block [&_span]:h-full [&_span]:rounded-full [&_span]:bg-[#727D67] [height:12px]   [overflow:hidden]">
              <span style={{ width: ratio + '%' }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#7B8078]  [justify-content:space-between]  [font-size:11px] [margin-top:8px]">
              <span>첫 훈련 {records.at(-1)?.thoughtRatio || 0}%</span>
              <span>최근 훈련 {records[0]?.thoughtRatio || 0}%</span>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-y border-[#E8EAE6] px-1.5 py-8 md:py-10 [&>div]:flex [&>div]:flex-1 [&>div]:flex-col [&>div]:gap-3 [&_span]:text-xs [&_span]:font-extrabold [&_span]:text-[#727D67] [&_strong]:text-base [&_small]:text-xs [&_small]:text-[#7B8078]">
        <div>
          <span>01</span>
          <strong>먼저 쓰기</strong>
          <small>내 생각으로 초안 작성</small>
        </div>
        <i>→</i>
        <div>
          <span>02</span>
          <strong>비교 분석</strong>
          <small>차이와 강점 발견</small>
        </div>
        <i>→</i>
        <div>
          <span>03</span>
          <strong>다시 쓰기</strong>
          <small>직접 수정하고 재검사</small>
        </div>
      </div>
      {user && saved && (
        <Card>
          <h2>작성 중인 글이 있어요</h2>
          <MutedText>{saved.topic || '제목 없는 글'} · 임시 저장됨</MutedText>
          <Button variant="secondary" onClick={resume}>
            이어서 작성하기
          </Button>
        </Card>
      )}
    </>
  );
}
