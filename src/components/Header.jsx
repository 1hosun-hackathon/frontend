import React from 'react';
import { NavLink } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useModalContext } from '../context/ModalContext';
import { useTrainingContext } from '../context/TrainingContext';

export default function Header() {
  const { user, navigate } = useAuthContext();
  const { openModal } = useModalContext();
  const { startNewWriting } = useTrainingContext();
  const requireLogin = (to) => {
    if (user) {
      navigate(to);
      return;
    }
    openModal({
      title: '로그인이 필요해요',
      message: '이 기능을 이용하려면 먼저 로그인해 주세요.',
      confirmLabel: '로그인하러 가기',
      onConfirm: () => navigate('/login'),
    });
  };
  const linkClass = ({ isActive }) =>
    `rounded-xl px-3 py-3 text-sm sm:px-4 ${isActive ? 'bg-stone-100 font-bold text-[#59654F]' : 'text-[#6E716B] hover:bg-stone-50'}`;
  return (
    <header className="flex min-h-18 flex-wrap items-center justify-between gap-4 border-b border-stone-200 bg-white px-5 py-3 md:px-12">
      <NavLink
        to="/"
        className="inline-flex items-center"
        aria-label="글적글적 홈으로"
      >
        <img
          className="h-auto w-[75px] object-contain sm:w-24"
          src="/logo.png"
          alt="글적글적"
        />
      </NavLink>
      <nav
        className="flex w-full flex-wrap items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2"
        aria-label="주요 메뉴"
      >
        <button
          type="button"
          className="rounded-xl bg-[#727D67] px-3 py-3 text-sm font-semibold text-white hover:bg-[#59654F] sm:px-4"
          onClick={() => {
            if (!user) {
              requireLogin('/setup');
              return;
            }
            startNewWriting();
          }}
        >
          새 글 작성하기
        </button>
        {user ? (
          <NavLink className={linkClass} to="/history">
            훈련 기록
          </NavLink>
        ) : (
          <button
            className="rounded-xl px-3 py-3 text-sm text-[#6E716B] hover:bg-stone-50 sm:px-4"
            onClick={() => requireLogin('/history')}
          >
            훈련 기록
          </button>
        )}
        {user ? (
          <NavLink className={linkClass} to="/dashboard">
            성장 대시보드
          </NavLink>
        ) : (
          <button
            className="rounded-xl px-3 py-3 text-sm text-[#6E716B] hover:bg-stone-50 sm:px-4"
            onClick={() => requireLogin('/dashboard')}
          >
            성장 대시보드
          </button>
        )}
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-full bg-[#727D67] text-white hover:bg-[#59654F]"
          aria-label={user ? '마이페이지' : '로그인'}
          onClick={() => navigate(user ? '/mypage' : '/login')}
        >
          <UserRound size={20} />
        </button>
      </nav>
    </header>
  );
}
