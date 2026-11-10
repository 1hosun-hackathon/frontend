import { useState } from 'react';
import { USER, get, set } from '../lib/storage';
export function useAuth(navigate) {
  const [user, setUser] = useState(() => get(USER, null));
  const [authId, setAuthId] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [authError, setAuthError] = useState('');
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
    const u = { id: authId.trim() };
    setUser(u);
    set(USER, u);
    navigate('/');
  };
  const logout = () => {
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
