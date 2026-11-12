import TwoColumnGrid from './TwoColumnGrid';
import InfoBox from './InfoBox';
import React from 'react';
import { criteria } from '../mocks/criteria';
import { ChevronDown } from 'lucide-react';

// items: 비교 분석·다시 쓰기 화면이 넘기는 항목(useAnalysisView의 criteria: 서버 값, 없으면 mock).
// 완료 화면(completion)은 최초 초안 vs 최종 글 등급 비교용이라 mock 유지 (API 없음)
export const Criteria = ({ completion = false, items: viewItems }) => {
  const items = !completion && viewItems?.length ? viewItems : criteria;
  return (
  <div className="space-y-4">
    {items.map((c, i) => (
      <details
        className="overflow-hidden rounded-xl border border-[#E8EAE6] bg-white [&>summary]:flex [&>summary]:cursor-pointer [&>summary]:list-none [&>summary]:items-center [&>summary]:justify-between [&>summary]:gap-4 [&>summary]:p-5 [&_small]:text-xs [&_small]:text-[#7B8078]"
        key={c.name}
        open={undefined}
        defaultOpen={i === 0}
      >
        <summary>
          <span className="flex flex-col gap-1">
            <strong>{c.name}</strong>
            <small>{c.sub}</small>
          </span>
          <span className="disclosure [font-size:12px] ">
            <ChevronDown size={17} />
          </span>
        </summary>
        <div className="space-y-5 border-t border-[#E8EAE6] p-5 [&_h4]:mb-2 [&_p]:leading-[1.8]">
          {completion ? (
            <>
              <TwoColumnGrid>
                <InfoBox>
                  <b>최초 초안{c.before ? ` · ${c.before}` : ''}</b>
                  <p>{c.mine}</p>
                </InfoBox>
                <InfoBox>
                  <b>최종 글{c.after ? ` · ${c.after}` : ''}</b>
                  <p>{c.action}을 중심으로 개선했습니다.</p>
                </InfoBox>
              </TwoColumnGrid>
              <p>{c.analysis}</p>
            </>
          ) : (
            <>
              <TwoColumnGrid>
                <InfoBox>
                  <b>내 글{c.before ? ` · ${c.before}` : ''}</b>
                  <p>{c.mine}</p>
                </InfoBox>
                <InfoBox>
                  <b>AI 글{c.after ? ` · ${c.after}` : ''}</b>
                  <p>{c.ai}</p>
                </InfoBox>
              </TwoColumnGrid>
              <h4>비교 분석</h4>
              <p>{c.analysis}</p>
              <div className="mt-3.5 rounded-md border-l-[3px] border-[#727D67] bg-[#F5F5F2] px-4 py-3 [&_p]:mt-1.5 [border-left:3px_solid_#727D67]   [margin-top:14px] ">
                <b>완성한 글에 반영할 점</b>
                <p>{c.action}</p>
              </div>
            </>
          )}
        </div>
      </details>
    ))}
  </div>
  );
};
