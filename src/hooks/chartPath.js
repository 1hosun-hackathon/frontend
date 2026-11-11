// 성장 대시보드 선 그래프와 증감 카드 계산

// 그래프 색 (시안과 비교해 바꿀 때 여기만 수정)
export const CHART_COLORS = {
  background: '#F9FAF8', // 그래프 영역 배경
  grid: '#E8EAE6', // 가로 격자선
  self: '#727D67', // 자기 사고 구성 선
  ai: '#A9AEA6', // AI 의존도 선
};

const clamp = (v) => Math.min(100, Math.max(0, Number(v) || 0));
const round2 = (n) => Math.round(n * 100) / 100;

// 비율(0~100) → SVG y 좌표 (viewBox 0 0 100 100). 선이 위아래 끝에서 잘리지 않게 5~95 사이에 그림
export const toY = (value) => round2(95 - clamp(value) * 0.9);

// 비율 배열(오래된 순) → 부드러운 곡선 path. 점이 2개 미만이면 '' (선을 그리지 않음)
// 점을 Catmull-Rom 방식으로 이어 3차 베지어로 변환. 제어점은 그래프 범위(5~95) 안으로 제한
export const smoothPath = (values) => {
  if (!Array.isArray(values) || values.length < 2) return '';
  const last = values.length - 1;
  const pts = values.map((v, i) => [round2((i / last) * 100), toY(v)]);
  const limitY = (y) => round2(Math.min(95, Math.max(5, y)));
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < last; i += 1) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = round2(p1[0] + (p2[0] - p0[0]) / 6);
    const c1y = limitY(p1[1] + (p2[1] - p0[1]) / 6);
    const c2x = round2(p2[0] - (p3[0] - p1[0]) / 6);
    const c2y = limitY(p2[1] - (p3[1] - p1[1]) / 6);
    d += ` C ${c1x} ${c1y} ${c2x} ${c2y} ${p2[0]} ${p2[1]}`;
  }
  return d;
};

// 증감 숫자: 소수 첫째 자리 반올림, .0이면 정수 (12.0 → '12', 5.46 → '5.5')
const formatChange = (n) => {
  const r = Math.round(Math.abs(n) * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
};
const isEmpty = (n) => n === null || n === undefined || Number.isNaN(Number(n));
const isZero = (n) => Math.round(Math.abs(n) * 10) === 0;

// AI 의존도 변화(최근 - 첫): 줄어들수록 개선
export const aiChangeLabel = (change) => {
  if (isEmpty(change)) return '-';
  if (isZero(change)) return '변화 없음';
  return change < 0
    ? `${formatChange(change)}% 개선`
    : `${formatChange(change)}% 증가`;
};

// 자기 사고 구성 변화(최근 - 첫): 늘어날수록 개선
export const selfChangeLabel = (change) => {
  if (isEmpty(change)) return '-';
  if (isZero(change)) return '변화 없음';
  return change > 0
    ? `${formatChange(change)}% 개선`
    : `${formatChange(change)}% 감소`;
};
