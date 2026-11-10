export const STORAGE = 'geuljeok_react_records';
export const DRAFT = 'geuljeok_react_draft';
export const USER = 'geuljeok_react_user';
export const get = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
export const set = (key, v) => {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {}
};
