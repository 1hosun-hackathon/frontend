import PageIntro from '../components/PageIntro';
import { Eyebrow, MutedText } from '../components/Typography';
import Badge from '../components/Badge';
import Card from '../components/Card';
import TwoColumnGrid from '../components/TwoColumnGrid';
import InfoBox from '../components/InfoBox';
import Actions from '../components/Actions';
import Button from '../components/Button';
import { useTrainingContext } from '../context/TrainingContext';
import { useAuthContext } from '../context/AuthContext';
import React from 'react';
import { useParams } from 'react-router-dom';
import { CompareTexts } from '../components/CompareTexts';
import { Criteria } from '../components/Criteria';
import { criteria } from '../mocks/criteria';
import { demoAnalysis } from '../mocks/analysis';

export default function CompletionPage() {
  const { selected, records } = useTrainingContext();
  const { navigate } = useAuthContext();
  const { recordId } = useParams();
  const currentRecord = recordId
    ? records.find((r) => String(r.id) === recordId)
    : selected;
  if (!currentRecord)
    return (
      <div className="p-6">
        선택된 훈련이 없습니다.{' '}
        <button onClick={() => navigate('/history')}>훈련 기록으로</button>
      </div>
    );
  return (
    <>
      <PageIntro as="div">
        <Eyebrow>TRAINING COMPLETE</Eyebrow>
        <h1>훈련 완료 결과</h1>
        <MutedText>
          최초 초안부터 최종 글까지, 이번 훈련에서 발전한 부분을 확인해 보세요.
        </MutedText>
        <Badge>{currentRecord.topic}</Badge>
      </PageIntro>
      <Card>
        <h2>최초 초안과 최종 글</h2>
        <CompareTexts
          left={currentRecord.draft}
          right={currentRecord.final}
          leftTitle="최초 초안"
          rightTitle="최종 글"
        />
      </Card>
      <Card>
        <Eyebrow>TRAINING SUMMARY</Eyebrow>
        <h2>종합 성장 리포트</h2>
        {demoAnalysis.completionReport.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </Card>
      <Card>
        <h2>5개 항목별 성장 평가</h2>
        <MutedText>
          최초 초안과 최종 글의 평가 수준을 비교합니다. 현재는 시연용 예시
          평가입니다.
        </MutedText>
        <div className="score-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {criteria.map((c) => (
            <div
              className="flex flex-col gap-2 rounded-xl bg-[#F5F5F2] px-2.5 py-4 text-center [&_span]:text-sm [&_span]:text-[#796052] [&_b]:text-[#59654F]       "
              key={c.name}
            >
              <strong>{c.name}</strong>
              <span>
                {c.before} → <b>{c.after}</b>
              </span>
            </div>
          ))}
        </div>
        <Criteria completion />
      </Card>
      <Card>
        <h2>이번 훈련에서 확인한 점</h2>
        <TwoColumnGrid>
          <InfoBox>
            <b>잘한 점</b>
            <p>{demoAnalysis.completion.good}</p>
          </InfoBox>
          <InfoBox>
            <b>다음에 보완할 점</b>
            <p>{demoAnalysis.completion.next}</p>
          </InfoBox>
        </TwoColumnGrid>
        {currentRecord.versions?.length > 0 && (
          <div className="mt-6 rounded-2xl border border-[#E6E9E4] p-6">
            <h2 className="mb-4 text-xl font-semibold">
              수정 과정 · {currentRecord.versions.length}개 버전
            </h2>
            <div className="space-y-3">
              {currentRecord.versions.map((v, i) => (
                <details className="rounded-xl bg-[#F5F5F2] p-4" key={i}>
                  <summary className="cursor-pointer font-medium">
                    수정본 {v.version} · {v.date}
                  </summary>
                  <article className="mt-3 whitespace-pre-wrap leading-8">
                    {v.text}
                  </article>
                </details>
              ))}
            </div>
          </div>
        )}
        <Actions>
          <Button variant="secondary" onClick={() => navigate('/')}>
            홈으로
          </Button>
          <Button onClick={() => navigate('/history')}>훈련 기록 보기 →</Button>
        </Actions>
      </Card>
    </>
  );
}
