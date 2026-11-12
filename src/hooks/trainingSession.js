// 진행 중인 훈련 ID를 sessionStorage에 보관 (새로고침 시 복구용)
const KEY = 'geuljeok_training_id';

export const getTrainingId = () => {
  try {
    const v = sessionStorage.getItem(KEY);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};

export const setTrainingId = (id) => {
  try {
    if (id === null || id === undefined) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, String(id));
  } catch {}
};

export const clearTrainingId = () => setTrainingId(null);
