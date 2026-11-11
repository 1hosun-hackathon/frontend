import { useEffect, useState } from 'react';
import { USER, get, set } from '../lib/storage';
import * as authApi from '../api/auth';
import { onAuthExpired } from '../api/client';
import { clearTrainingId } from './trainingSession';
const LOGIN_ID_PATTERN = /^[a-z0-9]{4,30}$/;
const authErrorMessage = (err, isSignup) => {
  if (!isSignup && err?.status === 401)
    return '아이디 또는 비밀번호가 올바르지 않습니다.';
  if (isSignup && err?.status === 409) return '이미 사용 중인 아이디입니다.';
  if (err?.status) return err.message;
  return '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.';
};
export function useAuth(navigate) {
  const [user, setUser] = useState(() => get(USER, null));
  const [authId, setAuthId] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [authError, setAuthError] = useState('');
  const clearUser = () => {
    setUser(null);
    try {
      localStorage.removeItem(USER);
    } catch {}
  };
  // 새로고침 시 refresh 쿠키로 access token 복구, 실패하면 로그아웃 상태로
  useEffect(() => {
    if (!get(USER, null)) return;
    authApi
      .reissue()
      .then((ok) => {
        if (!ok) clearUser();
      })
      .catch(() => {});
  }, []);
  // API 호출 중 재발급까지 실패하면 로그아웃 상태로
  useEffect(() => onAuthExpired(clearUser), []);
  const signupRequest = async (loginId) => {
    try {
      await authApi.signup({ loginId, password: pw, passwordConfirm: pw2 });
      setPw('');
      setPw2('');
      navigate('/login');
    } catch (err) {
      setAuthError(authErrorMessage(err, true));
    }
  };
  const loginRequest = async (loginId) => {
    try {
      const data = await authApi.login({ loginId, password: pw });
      const u = { id: data?.loginId ?? loginId };
      setUser(u);
      set(USER, u);
      setPw('');
      navigate('/');
    } catch (err) {
      setAuthError(authErrorMessage(err, false));
    }
  };
  const submitAuth = (e, isSignup) => {
    e.preventDefault();
    setAuthError('');
    if (!authId.trim() || !pw.trim()) {
      setAuthError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    if (isSignup && pw !== pw2) {
      setAuthError('비밀번호가 일치하지 않습니다.');
      return;
    }
    const loginId = authId.trim();
    if (isSignup && !LOGIN_ID_PATTERN.test(loginId)) {
      setAuthError('아이디는 영문 소문자와 숫자 4~30자로 입력해 주세요.');
      return;
    }
    if (isSignup && pw.length < 8) {
      setAuthError('비밀번호는 8자 이상 입력해 주세요.');
      return;
    }
    if (isSignup) signupRequest(loginId);
    else loginRequest(loginId);
  };
  const logout = () => {
    authApi.logout().catch(() => {});
    clearTrainingId();
    setUser(null);
    try {
      localStorage.removeItem(USER);
    } catch {}
    setPw('');
    setPw2('');
    navigate('/login');
  };
  return {
    user,
    setUser,
    authId,
    setAuthId,
    pw,
    setPw,
    pw2,
    setPw2,
    authError,
    setAuthError,
    submitAuth,
    logout,
  };
}
