import { useEffect, useState } from 'react';
import { STORAGE, DRAFT } from '../lib/storage';
export function useRecords() {
  // 서버 기록(useServerRecords)으로 채우므로 빈 배열에서 시작 (mock·이전 계정 캐시 표시 방지)
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(null);
  // 예전 버전이 남긴 localStorage 기록·임시글 캐시 정리 (지금은 서버 데이터만 사용하고 읽는 곳이 없음)
  useEffect(() => {
    try {
      localStorage.removeItem(STORAGE);
      localStorage.removeItem(DRAFT);
    } catch {}
  }, []);
  const ratio = records.length
    ? Math.round(
        records.reduce((n, r) => n + (Number(r.thoughtRatio) || 70), 0) /
          records.length,
      )
    : 0;
  return {
    records,
    setRecords,
    selected,
    setSelected,
    menu,
    setMenu,
    ratio,
  };
}
