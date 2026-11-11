// 서버 타이머 종료 시각(timerEndsAt) → 남은 초 계산
import { serverNow } from '../api/client';

// 끝에 Z 또는 ±hh:mm(±hhmm) 시간대 표시가 있는지
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

// 서버 시각 문자열 → ms. 시간대 표시가 없으면 UTC(Z)로 해석
// (확인된 실제 응답: "2026-11-11T15:09:20.907969353" = UTC, 시간대 표시 없음)
// 소수 초는 3자리(ms)까지만 사용
export const parseServerTime = (iso) => {
  if (!iso || typeof iso !== 'string') return null;
  const trimmed = iso.trim().replace(/(\.\d{3})\d+/, '$1');
  const ms = Date.parse(HAS_ZONE.test(trimmed) ? trimmed : `${trimmed}Z`);
  return Number.isNaN(ms) ? null : ms;
};

// 남은 초 = 종료 시각 - 서버 기준 현재 시각 (음수면 0)
// 값이 없거나 잘못되면 null → 호출하는 쪽에서 기존 방식(timerMinutes × 60)으로 대체
// 안전장치: 남은 시간이 timerMinutes × 60 + 60초보다 크면 시간대 오류로 보고 null
export const remainingSeconds = (endsAt, timerMinutes) => {
  const end = parseServerTime(endsAt);
  if (end === null) return null;
  const sec = Math.max(0, Math.ceil((end - serverNow()) / 1000));
  if (typeof timerMinutes === 'number' && sec > timerMinutes * 60 + 60) return null;
  return sec;
};
