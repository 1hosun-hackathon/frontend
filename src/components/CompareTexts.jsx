import React from 'react';

export const CompareTexts = ({
  left,
  right,
  leftTitle = '나의 초안',
  rightTitle = 'AI 작성 글',
}) => (
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 [&_h3]:mb-3 [&_article]:max-h-82 [&_article]:overflow-auto [&_article]:whitespace-pre-wrap [&_article]:rounded-3.5 [&_article]:bg-[#F5F5F2] [&_article]:p-5 [&_article]:leading-[1.8]">
    <div>
      <h3>{leftTitle}</h3>
      <article>{left || '작성된 내용이 없습니다.'}</article>
    </div>
    <div>
      <h3>{rightTitle}</h3>
      <article>{right || '작성된 내용이 없습니다.'}</article>
    </div>
  </div>
);
