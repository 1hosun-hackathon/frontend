// 서버 기록을 화면이 읽는 records · saved · selected에 채우는 훅 (TrainingContext에서 호출)
import { useEffect, useState } from 'react';
import { getAllTrainings, getTrainingDetail } from '../api/records';
import { getHome, getDashboard } from '../api/home';
import {
  toRecord,
  toSaved,
  toRecordDetail,
  applyRatios,
} from '../api/recordView';

// 이 화면에 들어올 때마다 목록 · 홈 · 대시보드를 다시 불러온다
const LIST_PATHS = ['/', '/history', '/dashboard', '/mypage'];
const isCompletionPath = (pathname) =>
  pathname === '/completion' || pathname.startsWith('/completion/');

export function useServerRecords({
  user,
  pathname,
  records,
  setRecords,
  setSaved,
  selected,
  setSelected,
}) {
  const [serverRatio, setServerRatio] = useState(null);
  // 대시보드 가장 성장한 항목 / 집중 개선 항목 (label만 사용)
  const [serverGrowth, setServerGrowth] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // ① 완료 목록(전체 페이지) + 진행 중 목록 + 홈 + 대시보드 → records · saved · 비율
  useEffect(() => {
    if (!user) return;
    if (!LIST_PATHS.includes(pathname) && !isCompletionPath(pathname)) return;
    let cancelled = false;
    Promise.all([
      getAllTrainings('COMPLETED'),
      getAllTrainings('IN_PROGRESS').catch(() => null),
      getHome().catch(() => null),
      getDashboard().catch(() => null),
    ])
      .then(([completed, inProgress, home, dashboard]) => {
        if (cancelled) return;
        const list = applyRatios(completed.map(toRecord), {
          trend: dashboard?.trend,
          home,
        });
        // 상세로 채운 본문(draft·final·versions)은 목록을 새로 받아도 유지
        setRecords((prev) => {
          const prevById = new Map(prev.map((r) => [String(r.id), r]));
          return list.map((r) => {
            const p = prevById.get(String(r.id));
            return p?.detailLoaded ? { ...p, ...r } : r;
          });
        });
        // 진행 중은 가장 최근 1건만 (화면의 진행 중 자리가 1개)
        if (inProgress) setSaved(inProgress.length ? toSaved(inProgress[0]) : null);
        // 홈·대시보드 모두 "최근 완료 3회 평균". 완료 기록이 없으면 null → 0
        const ratio = home?.selfThoughtRatio ?? dashboard?.selfThoughtRatio;
        setServerRatio(
          ratio === null || ratio === undefined ? 0 : Math.round(ratio),
        );
        if (dashboard)
          setServerGrowth({
            strongest: dashboard.mostImproved?.label || null,
            focus: dashboard.focusArea?.label || null,
          });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, pathname, reloadKey]);

  // ② 완료 결과 화면: 본문이 없으면 GET /detail로 draft · final · versions 채우기
  useEffect(() => {
    if (!user || !isCompletionPath(pathname)) return;
    const match = pathname.match(/^\/completion\/(\d+)$/);
    const id = match ? Number(match[1]) : selected?.trainingId ?? selected?.id;
    if (typeof id !== 'number' || !id) return;
    const current = match
      ? records.find((r) => String(r.id) === String(id))
      : selected;
    if (current?.detailLoaded) return;
    let cancelled = false;
    getTrainingDetail(id)
      .then((d) => {
        if (cancelled || !d) return;
        const detail = toRecordDetail(d);
        setRecords((rs) =>
          rs.some((r) => String(r.id) === String(id))
            ? rs.map((r) => (String(r.id) === String(id) ? { ...r, ...detail } : r))
            : [detail, ...rs],
        );
        setSelected((s) =>
          s && String(s.id) === String(id) ? { ...s, ...detail } : s,
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user, pathname, selected?.id]);

  return { serverRatio, serverGrowth, reload };
}
