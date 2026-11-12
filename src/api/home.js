// 홈 · 대시보드 · 회원 API
import { request } from './client';

// GET /api/v1/home → { selfThoughtRatio, firstRatio, latestRatio }
export const getHome = () => request('/api/v1/home');

// GET /api/v1/dashboard
// → { completedCount, selfThoughtRatio, streakDays, trend[{ trainingId, completedAt, selfThoughtRatio, aiDependencyRatio }],
//     aiDependencyChange, selfThoughtChange, mostImproved, focusArea, recent[4] }
export const getDashboard = () => request('/api/v1/dashboard');

// GET /api/v1/users/me → { userId, loginId, completedCount, createdAt } (현재 화면 연결에는 사용하지 않음)
export const getMe = () => request('/api/v1/users/me');

// DELETE /api/v1/users/me → 204 (회원탈퇴. 훈련 기록은 서버에 보존됨)
export const withdraw = () => request('/api/v1/users/me', { method: 'DELETE' });
