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

export default function GrowthDashboardPage() {
  const { records, setSelected, ratio, serverGrowth } = useTrainingContext();
  const { navigate } = useAuthContext();
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
          note="훈련 기록 평균 · 시연용"
        />
        <StatCard
          label="훈련 기록 날짜"
          value={`${new Set(records.map((r) => r.date)).size}일`}
        />
      </div>
      <Card>
        <h2>AI 의존도 vs 자기 사고 구성</h2>
        <MutedText>
          기록별 자기 사고 구성 비율을 확인해 보세요. 현재 수치는 시연용
          예시입니다.
        </MutedText>
        <div className="demo-chart [height:240px]  [align-items:end]  [border-bottom:1px_solid_#D8DDD5] [margin:35px_0_45px] ">
          {records
            .slice(0, 8)
            .reverse()
            .map((r) => (
              <div
                className="[&_small]:whitespace-nowrap [&_small]:text-xs [&_small]:text-[#7B8078] [height:100%] [flex:1]  [align-items:center] [justify-content:end]  "
                key={r.id}
              >
                <div
                  className="chart-bar  [width:75%] [max-width:65px] "
                  style={{ height: (r.thoughtRatio || 70) + '%' }}
                />
                <small>{r.date?.slice(5)}</small>
              </div>
            ))}
        </div>
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
