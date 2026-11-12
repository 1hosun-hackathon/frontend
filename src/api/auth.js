// 인증·회원 API (openapi.json: 인증·회원 태그)
import {
  request,
  setAccessToken,
  clearAccessToken,
  refreshAccessToken,
} from './client';

// POST /api/v1/auth/signup → { userId, loginId } (토큰 발급 없음)
export const signup = ({ loginId, password, passwordConfirm }) =>
  request('/api/v1/auth/signup', {
    method: 'POST',
    body: { loginId, password, passwordConfirm },
    auth: false,
  });

// POST /api/v1/auth/login → { accessToken, expiresIn, loginId }
// refresh token은 HttpOnly 쿠키로 내려오므로 credentials: 'include' 필요
export async function login({ loginId, password }) {
  const data = await request('/api/v1/auth/login', {
    method: 'POST',
    body: { loginId, password },
    auth: false,
    credentials: 'include',
  });
  setAccessToken(data?.accessToken);
  return data;
}

// POST /api/v1/auth/reissue → 성공 true / 실패 false
export const reissue = () => refreshAccessToken();

// POST /api/v1/auth/logout → 204. 실패해도 메모리 토큰은 지운다.
export async function logout() {
  try {
    await request('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearAccessToken();
  }
}

// GET /api/v1/auth/check-login-id?loginId= → { available }
export const checkLoginId = (loginId) =>
  request(
    `/api/v1/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`,
    { auth: false },
  );
