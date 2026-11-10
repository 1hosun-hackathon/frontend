import {
  TopicCard,
  WritingLayout,
  WritingTextarea,
  WritingSidebar,
} from '../components/WritingLayout';
import Card from '../components/Card';
import { Eyebrow, MutedText } from '../components/Typography';
import Actions from '../components/Actions';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { useTrainingContext } from '../context/TrainingContext';
import { demoAnalysis } from '../mocks/analysis';
import React from 'react';
import { Steps } from '../components/Steps';

export default function WritePage() {
  const { session, seconds, update, saveDraft, submit, fmt } =
    useTrainingContext();
  return (
    <>
      <Steps index={1} />
      <TopicCard session={session} />
      <WritingLayout>
        <Card>
          <Eyebrow>FIRST DRAFT</Eyebrow>
          <h2>나의 초안 작성</h2>
          <MutedText>
            AI의 답을 보기 전, 지금 떠오르는 생각을 자유롭게 적어보세요.
          </MutedText>
          <WritingTextarea
            value={session.draft}
            onChange={(e) => update('draft', e.target.value)}
            placeholder="내 생각을 자유롭게 작성하세요."
          />
          <Actions>
            <Button variant="secondary" onClick={saveDraft}>
              임시 저장
            </Button>
            <Button onClick={submit}>초안 제출 · 비교 분석 →</Button>
          </Actions>
        </Card>
        <WritingSidebar>
          <Eyebrow>집중 작성 시간</Eyebrow>
          <div className="text-4xl font-extrabold tabular-nums text-[#727D67] max-sm:text-4xl !my-3 !text-3xl !leading-[1.3] [font-size:28px] [line-height:1.3] [margin:12px_0_18px]">
            {session.minutes === null ? '자유 작성' : fmt(seconds)}
          </div>
          <Badge>AI 초안 잠금 중</Badge>
          {seconds === 0 && session.minutes !== null && (
            <MutedText>
              설정한 시간이 끝났어요. 작성한 글을 제출할 수 있습니다.
            </MutedText>
          )}
          <h3>초안 작성 가이드</h3>
          <MutedText>
            <b>1. 나의 생각 먼저 적기</b>
            <br />
            완벽한 문장보다 떠오르는 생각을 우선 적어보세요.
          </MutedText>
          <MutedText>
            <b>2. 근거 2~3가지 떠올리기</b>
            <br />
            주장을 뒷받침할 경험이나 사례를 적어보세요.
          </MutedText>
          <MutedText>
            <b>3. 서론·본론·결론 구상하기</b>
            <br />
            어떤 순서로 전개할지 정리해보세요.
          </MutedText>
          <h3>제출 전 확인</h3>
          {demoAnalysis.writingChecklist.map((x) => (
            <label
              className="my-3 flex items-center gap-2.5 text-sm text-[#59654F] [&_input]:h-4.5 [&_input]:w-4.5 [&_input]:accent-[#727D67]   [align-items:center] [margin:12px_0]  [font-size:14px]"
              key={x}
            >
              <input type="checkbox" />
              {x}
            </label>
          ))}
        </WritingSidebar>
      </WritingLayout>
    </>
  );
}
