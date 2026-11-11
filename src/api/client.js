// 공통 API 클라이언트
// - access token은 메모리에만 보관한다 (새로고침 시 /auth/reissue로 복구)
// - 401 응답이면 refresh 쿠키로 1회 재발급 후 원래 요청을 재시도한다

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
const REISSUE_PATH = '/api/v1/auth/reissue';

let accessToken = null;
let refreshPromise = null;
const expiredListeners = new Set();

export const getAccessToken = () => accessToken;
export const setAccessToken = (token) => {
  accessToken = token || null;
};
export const clearAccessToken = () => {
  accessToken = null;
};

// 재발급까지 실패했을 때(세션 만료) 호출될 콜백 등록. 해제 함수를 반환한다.
export const onAuthExpired = (listener) => {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
};

export class ApiError extends Error {
  constructor(status, body) {
    // 에러 응답 형식은 명세에 없어(보류 항목) message 필드가 있을 때만 사용한다
    const serverMessage =
      body && typeof body === 'object' && typeof body.message === 'string'
        ? body.message
        : '';
    super(serverMessage || `요청에 실패했습니다. (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const parseBody = async (res) => {
  if (res.status === 204) return null;
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const send = (path, { method = 'GET', body, headers = {}, auth = true, credentials } = {}) => {
  const h = { ...headers };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) h['Content-Type'] = 'application/json';
  if (auth && accessToken) h.Authorization = `Bearer ${accessToken}`;
  return fetch(BASE_URL + path, {
    method,
    headers: h,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    ...(credentials ? { credentials } : {}),
  });
};

// refresh 쿠키로 access token 재발급. 성공 true / 인증 실패 false / 네트워크 오류는 throw.
// 동시에 여러 요청이 401을 받아도 재발급은 한 번만 실행한다.
export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await send(REISSUE_PATH, {
        method: 'POST',
        auth: false,
        credentials: 'include',
      });
      if (!res.ok) {
        clearAccessToken();
        return false;
      }
      const data = await parseBody(res);
      setAccessToken(data?.accessToken);
      return Boolean(data?.accessToken);
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
};

// options: { method, body, headers, auth(기본 true), credentials }
export async function request(path, options = {}) {
  const auth = options.auth ?? true;
  let res = await send(path, options);

  if (res.status === 401 && auth) {
    const ok = await refreshAccessToken().catch(() => false);
    if (ok) {
      res = await send(path, options);
    } else {
      expiredListeners.forEach((fn) => fn());
    }
  }

  const data = await parseBody(res);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}
