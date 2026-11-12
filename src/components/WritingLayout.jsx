import React from 'react';
import Card from './Card';
import { Eyebrow, MutedText } from './Typography';
import { MAX_WRITING_LENGTH } from '../models/training';

export function TopicCard({ session }) {
  return (
    <Card>
      <Eyebrow>WRITING TOPIC</Eyebrow>
      <h3>{session.topic}</h3>
      <MutedText>
        {session.genre} · {session.requirements || '자유 작성'}
      </MutedText>
    </Card>
  );
}

export function WritingLayout({ children }) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-[minmax(0,2.15fr)_minmax(310px,.85fr)]">
      {children}
    </div>
  );
}

export function WritingSidebar({ children }) {
  return (
    <Card
      as="aside"
      className="[&_h3]:mt-6 [&_details]:mt-6 [&_summary]:cursor-pointer [&_summary]:rounded-lg [&_summary]:bg-[#F5F5F2] [&_summary]:p-3 [&_summary]:font-bold [&_summary]:text-[#59654F] [&_label:has(input[type=checkbox])]:my-2 [&_label:has(input[type=checkbox])]:flex [&_label:has(input[type=checkbox])]:gap-3 [&_label:has(input[type=checkbox])]:rounded-xl [&_label:has(input[type=checkbox])]:border [&_label:has(input[type=checkbox])]:p-3"
    >
      {children}
    </Card>
  );
}

export function WritingTextarea(props) {
  return (
    <>
      <textarea
        className="!h-140 !min-h-0 !max-h-140 !resize-none !overflow-y-auto max-sm:!h-110 max-sm:!max-h-110"
        {...props}
        maxLength={MAX_WRITING_LENGTH}
      />
      <p className="text-right text-sm text-[#8D938B]">
        {(props.value?.length ?? 0).toLocaleString()} / {MAX_WRITING_LENGTH.toLocaleString()}자 (공백 포함)
      </p>
    </>
  );
}
