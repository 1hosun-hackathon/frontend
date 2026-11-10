import React from 'react';

export const Steps = ({ index }) => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {['글 설정', '초안 작성', '비교 분석', '다시 쓰기'].map((s, i) => (
      <div
        key={s}
        className={
          'flex-1 rounded-lg p-3 text-center text-sm ' +
          (i < index
            ? 'bg-[#E6EAE2] text-[#59654F]'
            : i === index
              ? 'bg-[#727D67] font-bold text-white'
              : 'bg-[#F1F3EF] text-[#7B8078]')
        }
      >
        {i + 1}. {s}
      </div>
    ))}
  </div>
);
