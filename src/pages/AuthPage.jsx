import { MutedText, FieldLabel } from '../components/Typography';
import Button from '../components/Button';
import { useAuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import React from 'react';

export default function AuthPage() {
  const {
    authId,
    pw,
    pw2,
    authError,
    setAuthId,
    setPw,
    setPw2,
    setAuthError,
    navigate,
    submitAuth,
    idCheck,
    checkAuthId,
  } = useAuthContext();
  const { pathname } = useLocation();
  const isSignup = pathname === '/signup';
  return (
    <div className="auth-layout min-h-[75vh] flex items-center justify-center px-4">
      <div className="card-content w-full max-w-115 rounded-2xl border border-[#E6E9E4] bg-white p-6 sm:p-10 [&_h1]:text-3xl">
        <div className="mb-4.5 flex items-center justify-center [&_img]:h-auto [&_img]:w-full [&_img]:max-w-60">
          <img src="/logo.png" alt="글적글적" />
        </div>
        <h1>{isSignup ? '회원가입' : '로그인'}</h1>
        <MutedText>내 생각에서 시작해 더 깊은 글로.</MutedText>
        <form className="pt-2 [&>label:first-child]:mt-0" onSubmit={submitAuth}>
          <FieldLabel>아이디</FieldLabel>
          <input
            value={authId}
            onChange={(e) => setAuthId(e.target.value)}
            placeholder="아이디를 입력하세요"
            onBlur={() => isSignup && checkAuthId()}
          />
          {isSignup && idCheck && (
            <small
              className="mt-2 block text-xs leading-relaxed"
              style={{ color: idCheck === 'available' ? '#59654F' : '#b34848' }}
            >
              {idCheck === 'available'
                ? '사용 가능한 아이디예요'
                : '이미 사용 중인 아이디예요'}
            </small>
          )}
          <FieldLabel>비밀번호</FieldLabel>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호를 입력하세요"
          />
          {isSignup && (
            <>
              <FieldLabel>비밀번호 확인</FieldLabel>
              <input
                type="password"
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
              />
            </>
          )}
          {authError && <p style={{ color: '#b34848' }}>{authError}</p>}
          <Button className="mt-7 w-full" type="submit">
            {isSignup ? '회원가입' : '로그인'}
          </Button>
        </form>
        <MutedText style={{ textAlign: 'center' }}>
          {isSignup ? '이미 계정이 있나요?' : '아직 계정이 없나요?'}{' '}
          <button
            className="text-button    [text-decoration:underline] [cursor:pointer]"
            onClick={() => {
              setAuthError('');
              navigate(isSignup ? '/login' : '/signup');
            }}
          >
            {isSignup ? '로그인' : '회원가입'}
          </button>
        </MutedText>
        <MutedText
          as="small"
          className="block text-xs leading-relaxed text-[#7B8078]"
        >
          시연용 로그인입니다. 실제 계정 인증은 연결되어 있지 않습니다.
        </MutedText>
      </div>
    </div>
  );
}
