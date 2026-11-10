import { useEffect, useState } from 'react';
import { STORAGE, DRAFT, get, set } from '../lib/storage';
import { sampleRecords } from '../mocks/records';
export function useRecords() {
  const [records, setRecords] = useState(() => get(STORAGE, sampleRecords));
  const [saved, setSaved] = useState(() => get(DRAFT, null));
  const [selected, setSelected] = useState(null);
  const [menu, setMenu] = useState(null);
  const [deleting, setDeleting] = useState(null);
  useEffect(() => set(STORAGE, records), [records]);
  useEffect(() => {
    if (saved) set(DRAFT, saved);
    else {
      try {
        localStorage.removeItem(DRAFT);
      } catch {}
    }
  }, [saved]);
  const ratio = records.length
    ? Math.round(
        records.reduce((n, r) => n + (Number(r.thoughtRatio) || 70), 0) /
          records.length,
      )
    : 0;
  return {
    records,
    setRecords,
    saved,
    setSaved,
    selected,
    setSelected,
    menu,
    setMenu,
    deleting,
    setDeleting,
    ratio,
  };
}
