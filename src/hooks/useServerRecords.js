// 서버 기록을 화면이 읽는 records · inProgressList · selected에 채우는 훅 (TrainingContext에서 호출)
import { useEffect, useRef, useState } from 'react';
import { getAllTrainings, getTrainingDetail } from '../api/records';
import { getHome, getDashboard } from '../api/home';
import {
  toRecord,
  toInProgress,
  toRecordDetail,
  applyRatios,
} from '../api/recordView';

// 이 화면에 들어올 때 목록 · 홈 · 대시보드를 불러온다
const LIST_PATHS = ['/', '/history', '/dashboard', '/mypage'];
// 위 화면끼리 이동할 때는 마지막 조회 후 이 시간 안이면 다시 부르지 않음.
// 작성 흐름 화면(설정·작성·분석·다시 쓰기·완료)에 들어가거나, 삭제·상태 변경·로그아웃이 있으면 무효화
const CACHE_MS = 30 * 1000;
const isCompletionPath = (pathname) =>
  pathname === '/completion' || pathname.startsWith('/completion/');

export function useServerRecords({
  user,
  pathname,
  records,
  setRecords,
  selected,
  setSelected,
}) {
  const [serverRatio, setServerRatio] = useState(null);
  // 대시보드 가장 성장한 항목 / 집중 개선 항목 (label만 사용)
  const [serverGrowth, setServerGrowth] = useState(null);
  // 대시보드 연속 완료 일수 (streakDays)
  const [serverStreakDays, setServerStreakDays] = useState(null);
  // 진행 중 훈련 전체 (최근 날짜순, 홈·기록 화면 목록)
  const [inProgressList, setInProgressList] = useState([]);
  // 삭제 직후 목록에서 바로 빼기
  const removeInProgress = (id) =>
    setInProgressList((list) =>
      list.filter((t) => String(t.id) !== String(id)),
    );
  const [reloadKey, setReloadKey] = useState(0);
  // 마지막으로 목록 화면에서 조회를 마친 시각 (0이면 캐시 없음)
  const fetchedAtRef = useRef(0);
  const invalidate = () => {
    fetchedAtRef.current = 0;
  };
  const reload = () => {
    invalidate();
    setReloadKey((k) => k + 1);
  };

  // ① 완료 목록(전체 페이지) + 진행 중 목록 + 홈 + 대시보드 → records · 진행 중 목록 · 비율
  useEffect(() => {
    if (!user) {
      // 로그아웃·탈퇴·세션 만료: 이전 계정의 서버 값(비율·대시보드·진행 중 목록) 초기화
      setServerRatio(null);
      setServerGrowth(null);
      setServerStreakDays(null);
      setInProgressList([]);
      invalidate();
      return;
    }
    const isList = LIST_PATHS.includes(pathname);
    if (!isList && !isCompletionPath(pathname)) {
      invalidate();
      return;
    }
    if (isList && Date.now() - fetchedAtRef.current < CACHE_MS) return;
    let cancelled = false;
    Promise.all([
      getAllTrainings('COMPLETED'),
      getAllTrainings('IN_PROGRESS').catch(() => null),
      getHome().catch(() => null),
      getDashboard().catch(() => null),
    ])
      .then(([completed, inProgress, home, dashboard]) => {
        if (cancelled) return;
        fetchedAtRef.current = isList ? Date.now() : 0;
        const list = applyRatios(completed.map(toRecord), {
          trend: dashboard?.trend,
          home,
        });
        // 상세로 채운 본문(draft·final·versions)과 완료 직후 작성 내용으로 넣은 본문은 목록을 새로 받아도 유지
        setRecords((prev) => {
          const prevById = new Map(prev.map((r) => [String(r.id), r]));
          return list.map((r) => {
            const p = prevById.get(String(r.id));
            return p?.detailLoaded || p?.bodyFromSession ? { ...p, ...r } : r;
          });
        });
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
    invalidate,
  };
}
