import PageIntro from '../components/PageIntro';
import { Eyebrow, MutedText } from '../components/Typography';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import TwoColumnGrid from '../components/TwoColumnGrid';
import InfoBox from '../components/InfoBox';
import { useTrainingContext } from '../context/TrainingContext';
import { useAuthContext } from '../context/AuthContext';
import React from 'react';
import { demoAnalysis } from '../mocks/analysis';
import {
  CHART_COLORS,
  smoothPath,
  toY,
  aiChangeLabel,
  selfChangeLabel,
} from '../hooks/chartPath';

export default function GrowthDashboardPage() {
  const { records, setSelected, ratio, serverGrowth, serverStreakDays } = useTrainingContext();
  const { navigate } = useAuthContext();
  // 선 그래프: 서버 trend(오래된 순) → 왼쪽(오래된 훈련)에서 오른쪽(최근 훈련)
  const trend = serverGrowth?.trend ?? [];
  const selfPath = smoothPath(trend.map((t) => t.self));
  const aiPath = smoothPath(trend.map((t) => t.ai));
  return (
    <>
      <PageIntro>
        <Eyebrow>GROWTH DASHBOARD</Eyebrow>
        <h1>성장 대시보드</h1>
        <MutedText>내가 쓴 글의 변화를 확인하는 공간입니다.</MutedText>
      </PageIntro>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="완료 훈련 횟수" value={`${records.length}회`} />
        <StatCard
          label="자기 사고 구성 비율"
          value={`${ratio}%`}
          note="최근 훈련 기준"
        />
        <StatCard
          label="연속 완료 일수"
          value={`${serverStreakDays ?? 0}일`}
        />
      </div>
      <Card>
        <h2>AI 의존도 vs 자기 사고 구성</h2>
        <MutedText>최근 훈련에서 나타난 사고 구성의 변화를 살펴보세요.</MutedText>
        <div
          className="relative mt-6 rounded-xl p-4"
          style={{ background: CHART_COLORS.background }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="block h-48 w-full sm:h-56"
            role="img"
            aria-label="훈련별 자기 사고 구성과 AI 의존도 변화"
          >
            {[0, 25, 50, 75].map((v) => (
              <line
                key={v}
                x1="0"
                x2="100"
                y1={toY(v)}
                y2={toY(v)}
                stroke={CHART_COLORS.grid}
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {aiPath && (
              <path
                d={aiPath}
                fill="none"
                stroke={CHART_COLORS.ai}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {selfPath && (
              <path
                d={selfPath}
                fill="none"
                stroke={CHART_COLORS.self}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          {trend.length < 2 && (
            <p className="absolute inset-0 m-0 flex items-center justify-center px-4 text-center text-sm text-[#7B8078]">
              훈련을 2회 이상 완료하면 변화 그래프가 나타나요.
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#7B8078]">
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CHART_COLORS.self }}
            />
            자기 사고 구성
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: CHART_COLORS.ai }}
            />
            AI 의존도
          </span>
        </div>
        <TwoColumnGrid>
          <InfoBox>
            <b>AI 의존 감소율</b>
            <p>{aiChangeLabel(serverGrowth?.aiChange)}</p>
          </InfoBox>
          <InfoBox>
            <b>자기 구성 증가율</b>
            <p>{selfChangeLabel(serverGrowth?.selfChange)}</p>
          </InfoBox>
        </TwoColumnGrid>
        <TwoColumnGrid>
          <InfoBox>
            <b>가장 성장한 항목</b>
            <p>{serverGrowth?.strongest || demoAnalysis.growth.strongest}</p>
          </InfoBox>
          <InfoBox>
            <b>집중 개선 항목</b>
            <p>{serverGrowth?.focus || demoAnalysis.growth.focus}</p>
          </InfoBox>
        </TwoColumnGrid>
      </Card>
      <Card>
        <h2>최근 완료한 훈련</h2>
        {records.slice(0, 5).map((r) => (
          <div
            className="cursor-pointer rounded-xl border border-[#E6E9E4] p-5 hover:bg-[#F5F5F2] [&_p]:mt-2"
            key={r.id}
            onClick={() => {
              setSelected(r);
              navigate('/completion');
            }}
          >
            <b>{r.topic}</b>
            <MutedText>
              {r.date} · 재검사 {r.recheckCount || 0}회
            </MutedText>
          </div>
        ))}
      </Card>
    </>
  );
}
