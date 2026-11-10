import { Eyebrow, MutedText } from '../components/Typography';
import Button from '../components/Button';
import Card from '../components/Card';
import { useAuthContext } from '../context/AuthContext';
import { useTrainingContext } from '../context/TrainingContext';
import React from 'react';

export default function MyPage() {
  const { user, logout } = useAuthContext();
  const { records, withdraw } = useTrainingContext();
  return (
    <section className="mx-auto w-full max-w-180 space-y-8">
      <div className="space-y-3">
        <Eyebrow>MY PAGE</Eyebrow>
        <h1>마이페이지</h1>
      </div>
      <Card className="mypage-card">
        <div className="flex items-center gap-4.5  [align-items:center] ">
          <div
            className="grid h-18 w-18 shrink-0 place-items-center rounded-full border border-[#727D67] bg-[#727D67] text-transparent"
            aria-hidden="true"
          />
          <div>
            <MutedText style={{ margin: 0 }}>아이디 · {user.id}</MutedText>
          </div>
        </div>
        <div className="my-6 flex items-center justify-between border-y border-[#E6E9E4] py-6 text-[#343632] [&_strong]:text-6 [&_strong]:text-[#727D67]  [align-items:center] [justify-content:space-between] [border-top:1px_solid_#E6E9E4] [border-bottom:1px_solid_#E6E9E4]  [margin:26px_0] ">
          <span>완료한 글</span>
          <strong>{records.length}편</strong>
        </div>
        <div className="flex flex-wrap gap-3 [&_.btn]:flex-1  ">
          <Button variant="secondary" onClick={logout}>
            로그아웃
          </Button>
          <Button variant="danger" onClick={withdraw}>
            회원탈퇴
          </Button>
        </div>
      </Card>
    </section>
  );
}
