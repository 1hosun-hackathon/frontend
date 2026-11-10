import { useEffect, useState } from 'react';
export function useTimer(pathname, minutes) {
  const [seconds, setSeconds] = useState(900);
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    if (pathname !== '/writing' || minutes === null) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [pathname, minutes]);
  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return { seconds, setSeconds, custom, setCustom, fmt };
}
