import PageIntro from '../components/PageIntro';
import { Eyebrow, MutedText } from '../components/Typography';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useTrainingContext } from '../context/TrainingContext';
import { useAuthContext } from '../context/AuthContext';
import React from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';

export default function HistoryPage() {
  const { records, saved, menu, setSelected, setMenu, resume, requestDelete } =
    useTrainingContext();
  const { navigate } = useAuthContext();
  return (
    <>
      <PageIntro>
        <Eyebrow>WRITING HISTORY</Eyebrow>
        <h1>훈련 기록</h1>
        <MutedText>완료한 글과 임시 저장한 글을 확인하세요.</MutedText>
      </PageIntro>
      <Card>
        {[
          ...(saved ? [{ ...saved, id: 'draft', status: '진행 중' }] : []),
          ...records,
        ].length === 0 ? (
          <MutedText>아직 기록이 없습니다.</MutedText>
        ) : (
          [
            ...(saved ? [{ ...saved, id: 'draft', status: '진행 중' }] : []),
            ...records,
          ].map((r) => (
            <div
              className="mt-3 cursor-pointer rounded-3.5 border border-[#E6E9E4] p-4.5 hover:bg-[#F5F5F2] relative flex items-start justify-between gap-4"
              key={r.id}
            >
              <div
                className="flex-1 cursor-pointer [&_h3]:mt-3 [&_p]:mt-2"
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (r.id === 'draft') resume();
                  else {
                    setSelected(r);
                    navigate('/completion/' + r.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (r.id === 'draft') resume();
                    else {
                      setSelected(r);
                      navigate('/completion/' + r.id);
                    }
                  }
                }}
              >
                <Badge>{r.status || '완료'}</Badge>
                <h3>{r.topic || '제목 없는 글'}</h3>
                <MutedText>
                  {r.date} · {r.genre || '자유 글'} · 재검사{' '}
                  {r.recheckCount || 0}회
                </MutedText>
              </div>
              <div className="relative">
                <button
                  className="hover:bg-[#F5F5F2] rounded-lg p-2 hover:bg-[#F5F5F2]"
                  aria-label="기록 관리 메뉴"
                  onClick={() => setMenu(menu === r.id ? null : r.id)}
                >
                  <MoreHorizontal size={20} />
                </button>
                {menu === r.id && (
                  <div className="absolute right-0 top-full z-20 min-w-40 rounded-xl border border-[#E6E9E4] bg-white p-2 shadow-lg">
                    <button
                      className="flex w-full items-center gap-2 rounded-lg bg-white p-2.5 text-left text-sm text-[#A4524B] hover:bg-[#FBF1F0]"
                      onClick={() => requestDelete(r.id)}
                    >
                      <Trash2 size={15} /> 기록 삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
