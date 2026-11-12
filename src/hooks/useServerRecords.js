// 서버 기록을 화면이 읽는 records · saved · selected에 채우는 훅 (TrainingContext에서 호출)
import { useEffect, useState } from 'react';
import { getAllTrainings, getTrainingDetail } from '../api/records';
import { getHome, getDashboard } from '../api/home';
import {
  toRecord,
  toSaved,
  toInProgress,
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
  // 대시보드 연속 완료 일수 (streakDays)
  const [serverStreakDays, setServerStreakDays] = useState(null);
  // 진행 중 훈련 전체 (최근 날짜순). saved에는 기존처럼 가장 최근 1건만 넣음
  const [inProgressList, setInProgressList] = useState([]);
  // 삭제 직후 목록에서 바로 빼기
  const removeInProgress = (id) =>
    setInProgressList((list) =>
      list.filter((t) => String(t.id) !== String(id)),
    );
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // ① 완료 목록(전체 페이지) + 진행 중 목록 + 홈 + 대시보드 → records · saved · 비율
  useEffect(() => {
    if (!user) {
      // 로그아웃·탈퇴·세션 만료: 이전 계정의 서버 값(비율·대시보드·진행 중 목록) 초기화
      setServerRatio(null);
      setServerGrowth(null);
      setServerStreakDays(null);
      setInProgressList([]);
      return;
    }
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
        // saved에는 가장 최근 1건(이어서 작성 로직용), inProgressList에는 전체(홈·기록 화면 목록)
        if (inProgress) setSaved(inProgress.length ? toSaved(inProgress[0]) : null);
        if (inProgress) setInProgressList(inProgress.map(toInProgress));
        // 홈·대시보드 모두 "최근 완료 3회 평균". 완료 기록이 없으면 null → 0
        const ratio = home?.selfThoughtRatio ?? dashboard?.selfThoughtRatio;
        setServerRatio(
          ratio === null || ratio === undefined ? 0 : Math.round(ratio),
        );
        if (dashboard)
          setServerGrowth({
            strongest: dashboard.mostImproved?.label || null,
            focus: dashboard.focusArea?.label || null,
            // 선 그래프용 추이(오래된 순, 두 비율이 모두 숫자인 항목만)
            trend: (dashboard.trend ?? [])
              .filter(
                (t) =>
                  typeof t?.selfThoughtRatio === 'number' &&
                  typeof t?.aiDependencyRatio === 'number',
              )
              .map((t) => ({
                trainingId: t.trainingId,
                self: t.selfThoughtRatio,
                ai: t.aiDependencyRatio,
              })),
            // 증감 카드용 (최근 - 첫, %p). 완료 훈련이 부족하면 null
            aiChange: dashboard.aiDependencyChange ?? null,
            selfChange: dashboard.selfThoughtChange ?? null,
          });
        if (dashboard) setServerStreakDays(dashboard.streakDays ?? 0);
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

  return {
    serverRatio,
    serverGrowth,
    serverStreakDays,
    inProgressList,
    removeInProgress,
    reload,
  };
}
