import Card from '../components/Card';
import { Eyebrow, MutedText, FieldLabel } from '../components/Typography';
import Button from '../components/Button';
import { useTrainingContext } from '../context/TrainingContext';
import React from 'react';
import { Steps } from '../components/Steps';
import { X } from 'lucide-react';

export default function SetupPage() {
  const { session, custom, files, setCustom, addFiles, removeFile, update, begin } =
    useTrainingContext();
  return (
    <>
      <Steps index={0} />
      <Card>
        <Eyebrow>NEW WRITING</Eyebrow>
        <h1>새 글 작성하기</h1>
        <MutedText>글의 주제와 조건을 간단히 정하고 시작해보세요.</MutedText>
        <FieldLabel>글 주제</FieldLabel>
        <input
          value={session.topic}
          onChange={(e) => update('topic', e.target.value)}
          placeholder="예: 기후변화가 우리 생활에 미치는 영향"
        />
        <FieldLabel>글 종류 (선택)</FieldLabel>
        <select
          value={session.genre}
          onChange={(e) => update('genre', e.target.value)}
        >
          {['에세이', '수필', '보고서', '논설문', '비평문', '자유 글'].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
        <FieldLabel>분량 및 과제 요구사항 (선택)</FieldLabel>
        <textarea
          className="!min-h-28 !max-h-40 !resize-none [min-height:110px] [max-height:160px] [resize:none]"
          value={session.requirements}
          onChange={(e) => update('requirements', e.target.value)}
          placeholder="예: 800~1,000자, 근거 2개 포함"
        />
        <FieldLabel>참고자료 첨부 (선택)</FieldLabel>
        <div className="rounded-xl border border-dashed border-[#C5CDBF] bg-white p-4    ">
          <input
            type="file"
            multiple
            accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
            onChange={(e) => {
              addFiles([...e.target.files]);
              // 선택값을 비워 input 옆 표시와 목록이 어긋나지 않게 하고, 같은 파일도 다시 고를 수 있게 함
              e.target.value = '';
            }}
          />
          <MutedText>PDF, PPT, 문서, 이미지 · 파일 선택</MutedText>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${i}`}
              className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-[#F5F5F2] px-3 py-2 text-sm text-[#59654F]"
            >
              <span className="min-w-0 truncate">
                {f.name}
                {f.sizeLabel && (
                  <span className="text-[#7B8078]"> · {f.sizeLabel}</span>
                )}
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md p-1 text-[#7B8078] hover:bg-[#E8EAE6]"
                aria-label={`${f.name} 첨부 빼기`}
                onClick={() => removeFile(i)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <FieldLabel>집중 작성 시간</FieldLabel>
        <select
          value={
            custom
              ? 'custom'
              : session.minutes === null
                ? 'none'
                : String(session.minutes)
          }
          onChange={(e) => {
            setCustom(e.target.value === 'custom');
            if (e.target.value === 'none') update('minutes', null);
            else if (e.target.value !== 'custom')
              update('minutes', Number(e.target.value));
          }}
        >
          {[5, 10, 15, 20, 30].map((n) => (
            <option value={n} key={n}>
              {n}분
            </option>
          ))}
          <option value="custom">직접 설정 (분)</option>
          <option value="none">설정 안 함</option>
        </select>
        {custom && (
          <input
            type="number"
            min="1"
            max="600"
            placeholder="작성 시간 (분)"
            onChange={(e) => update('minutes', Number(e.target.value))}
          />
        )}
        <MutedText>
          작성하는 동안 AI 글은 잠겨 있어요. 시간과 관계없이 직접 제출할 수
          있습니다.
        </MutedText>
        <Button onClick={begin}>글 작성 시작하기 →</Button>
      </Card>
    </>
  );
}
