import { demoAnalysis } from '../mocks/analysis';
import Card from '../components/Card';
import { Eyebrow, MutedText } from '../components/Typography';
import TwoColumnGrid from '../components/TwoColumnGrid';
import InfoBox from '../components/InfoBox';
import Button from '../components/Button';
import { useTrainingContext } from '../context/TrainingContext';
import { useAuthContext } from '../context/AuthContext';
import React from 'react';
import { Steps } from '../components/Steps';
import { CompareTexts } from '../components/CompareTexts';
import { Criteria } from '../components/Criteria';

export default function ComparisonPage() {
  const { session } = useTrainingContext();
  const { navigate } = useAuthContext();
  return (
    <>
      <Steps index={2} />
      <Card>
        <Eyebrow>COMPARISON</Eyebrow>
        <h1>비교 분석</h1>
        <MutedText>
          나의 글과 AI 글을 비교해 차이와 개선 방향을 살펴보세요.
        </MutedText>
        <CompareTexts
          left={session.recheckCount ? session.final : session.draft}
          right={session.ai}
          leftTitle={session.recheckCount ? '현재 수정본' : '나의 초안'}
        />
      </Card>
      {session.recheckCount > 0 && (
        <Card>
          <h2>재검사 · {session.recheckCount}회차</h2>
          <MutedText>최초 초안과 현재 수정본의 변화를 확인해 보세요.</MutedText>
          <CompareTexts
            left={session.draft}
            right={session.final}
            leftTitle="최초 초안"
            rightTitle="수정본"
          />
        </Card>
      )}
      <Card>
        <Eyebrow>OVERALL COMPARISON</Eyebrow>
        <h2>종합 비교 리포트</h2>
        {(session.analysis?.report?.length ? session.analysis.report : demoAnalysis.comparisonReport).map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </Card>
      <Card>
        <h2>강점과 보완점</h2>
        <TwoColumnGrid>
          <InfoBox>
            <b>나의 강점</b>
            <p>{session.analysis?.strengths || '나만의 문제의식과 관점을 중심으로 글을 구성한 점'}</p>
          </InfoBox>
          <InfoBox>
            <b>보완할 점</b>
            <p>{session.analysis?.improvements || '주장을 뒷받침하는 자료의 출처와 문단 간 연결을 검토할 점'}</p>
          </InfoBox>
        </TwoColumnGrid>
      </Card>
      <Card>
        <h2>항목별 비교 · 5가지 관점</h2>
        <MutedText>항목을 펼쳐 내 글과 AI 글의 차이를 확인하세요.</MutedText>
        <Criteria />
      </Card>
      <Card>
        <h2>사고 확장 질문</h2>
        {(session.analysis?.questions?.length
          ? session.analysis.questions
          : [
              '이 주장에 반대하는 사람은 어떤 근거를 제시할까요?',
              '나의 관점을 더 설득력 있게 만드는 실제 사례는 무엇일까요?',
            ]
        ).map((q, i) => (
          <p key={i}>
            {i < 20 ? String.fromCharCode(0x2460 + i) : `${i + 1}.`} {q}
          </p>
        ))}
        <Button onClick={() => navigate('/rewrite')}>
          {session.recheckCount ? '계속 다시 쓰기 →' : '내 글 다시 쓰기 →'}
        </Button>
      </Card>
    </>
  );
}
