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

// 진행 중인 로그아웃 요청 (응답이 오기 전에 다시 로그인하는 경우 대비)
let pendingLogout = null;

// POST /api/v1/auth/login → { accessToken, expiresIn, loginId }
// refresh token은 HttpOnly 쿠키로 내려오므로 credentials: 'include' 필요
export async function login({ loginId, password }) {
  // 로그아웃 응답(토큰·refresh 쿠키 삭제)이 새 로그인보다 늦게 처리되지 않도록 먼저 기다림
  // (네트워크가 멈춰도 로그인이 막히지 않게 최대 3초)
  if (pendingLogout)
    await Promise.race([
      pendingLogout,
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
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
// (access token 만료로 401이면 기존처럼 재발급 후 재시도해 서버의 refresh token까지 폐기)
// 응답이 오기 전에 다시 로그인하면 login()이 이 요청이 끝날 때까지 기다리므로,
// 늦게 끝난 로그아웃이 새로 로그인한 토큰·쿠키를 지우지 않는다.
export function logout() {
  const req = (async () => {
    try {
      await request('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      clearAccessToken();
    }
  })();
  const done = req.catch(() => {}).finally(() => {
    if (pendingLogout === done) pendingLogout = null;
  });
  pendingLogout = done;
  return req;
}

// GET /api/v1/auth/check-login-id?loginId= → { available }
export const checkLoginId = (loginId) =>
  request(
    `/api/v1/auth/check-login-id?loginId=${encodeURIComponent(loginId)}`,
    { auth: false },
  );
