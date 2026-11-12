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
import { useTrainingContext } from '../context/TrainingContext';
import React from 'react';
import { Steps } from '../components/Steps';
import { Criteria } from '../components/Criteria';
import { useAnalysisView } from '../hooks/useAnalysisView';

export default function RewritePage() {
  const { session, update, saveDraft, recheck, complete, downloadText } =
    useTrainingContext();
  const view = useAnalysisView('rewrite');
  return (
    <>
      <Steps index={3} />
      <TopicCard session={session} />
      <WritingLayout>
        <Card>
          <Eyebrow>REWRITE</Eyebrow>
          <h2>내 글 다시 쓰기</h2>
          <MutedText>
            최초 초안을 바탕으로 비교 분석을 참고해 직접 수정해보세요.
          </MutedText>
          <WritingTextarea
            value={session.final}
            onChange={(e) => update('final', e.target.value)}
            placeholder="나의 글을 직접 다듬어보세요."
          />
          <Actions>
            <Button variant="secondary" onClick={saveDraft}>
              임시 저장
            </Button>
            <Button variant="secondary" onClick={recheck}>
              다시 검사하기
            </Button>
            <Button onClick={complete}>훈련 완료</Button>
          </Actions>
          <p>
            <Button variant="secondary" onClick={downloadText}>
              텍스트 파일 저장
            </Button>
          </p>
        </Card>
        <WritingSidebar>
          <h2>비교 분석 참고</h2>
          <h3>종합 피드백</h3>
          <MutedText>
            {view.summary}
          </MutedText>
          <h3>강점</h3>
          <MutedText>{view.strengths}</MutedText>
          <h3>보완점</h3>
          <MutedText>{view.improvements}</MutedText>
          <details>
            <summary>항목별 비교 펼쳐보기</summary>
            <Criteria items={view.criteria} />
          </details>
          <h3>사고 확장 질문</h3>
          <MutedText>
            {view.questions.map((q, i) => (
              <React.Fragment key={q}>
                {i > 0 && <br />}
                {q}
              </React.Fragment>
            ))}
          </MutedText>
        </WritingSidebar>
      </WritingLayout>
    </>
  );
}
