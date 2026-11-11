import { useEffect, useState } from 'react';
import { remainingSeconds } from './timerClock';
// endsAt(선택): 서버 timerEndsAt. 있으면 매초 남은 시간을 다시 계산, 없으면 기존처럼 1씩 감소
export function useTimer(pathname, minutes, endsAt = null) {
  const [seconds, setSeconds] = useState(900);
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    if (pathname !== '/writing' || minutes === null) return;
    const left = () => (endsAt ? remainingSeconds(endsAt, minutes) : null);
    const first = left();
    if (first !== null) setSeconds(first);
    const t = setInterval(() => {
      const l = left();
      setSeconds((s) => (l === null ? Math.max(0, s - 1) : l));
    }, 1000);
    return () => clearInterval(t);
  }, [pathname, minutes, endsAt]);
  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return { seconds, setSeconds, custom, setCustom, fmt };
}
