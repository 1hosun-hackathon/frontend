// 기록 · 상세 · 대시보드 응답을 화면이 읽는 records 모양으로 바꾸는 함수들
// records 항목 모양(기존 mock과 동일): { id, topic, genre, date, recheckCount, status, draft, final, versions, thoughtRatio }

// ISO 날짜 → 'YYYY.MM.DD' (기존 mock 기록과 같은 형식. 대시보드 그래프가 date.slice(5)로 'MM.DD'를 표시함)
export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
};

// 목록 항목 → records 항목 (본문 draft·final·versions는 상세 조회 때 채움)
export const toRecord = (item) => ({
  id: item.trainingId,
  trainingId: item.trainingId,
  topic: item.topic ?? '',
  genre: item.writingType ?? '',
  date: formatDate(item.date),
  recheckCount: item.recheckCount ?? 0,
  status: item.status === 'COMPLETED' ? '완료' : '진행 중',
  trainingStatus: item.status,
});

// 진행 중 훈련 상태 → 화면 라벨
const IN_PROGRESS_LABEL = {
  DRAFTING: '작성 중',
  ANALYZING: '분석 중',
  COMPARED: '분석 완료',
  REWRITING: '다시 쓰기 중',
};

// 진행 중 목록 항목 → 홈 "작성 중인 글" 목록, 기록 화면 진행 중 행
// (status에 상태 라벨, inProgress로 완료 기록과 구분)
export const toInProgress = (item) => ({
  ...toRecord(item),
  status: IN_PROGRESS_LABEL[item.status] ?? '진행 중',
  inProgress: true,
});

// 상세 응답 → records 항목에 합칠 값
export const toRecordDetail = (d) => ({
  id: d.trainingId,
  trainingId: d.trainingId,
  topic: d.topic ?? '',
  genre: d.writingType ?? '',
  date: formatDate(d.completedAt),
  recheckCount: d.recheckCount ?? 0,
  status: '완료',
  trainingStatus: 'COMPLETED',
  draft: d.draft?.content ?? '',
  final: d.finalWriting?.content ?? '',
  versions: (d.revisions ?? []).map((r) => ({
    version: r.seqNo,
    text: r.content ?? '',
    date: formatDate(r.createdAt),
  })),
  detailLoaded: true,
});

// 기록에 자기 사고 구성 비율(thoughtRatio)을 합친다.
// - dashboard.trend(최근 완료 최대 10개)의 비율을 trainingId로 매칭
// - 비율이 비어 있는 가장 최근 기록에는 home.latestRatio, 가장 오래된 기록에는 home.firstRatio
// records는 최근 날짜순(0번이 가장 최근)이어야 한다.
export const applyRatios = (records, { trend, home } = {}) => {
  const byId = new Map(
    (trend ?? [])
      .filter((t) => t?.selfThoughtRatio !== null && t?.selfThoughtRatio !== undefined)
      .map((t) => [String(t.trainingId), Math.round(t.selfThoughtRatio)]),
  );
  const out = records.map((r) =>
    byId.has(String(r.id)) ? { ...r, thoughtRatio: byId.get(String(r.id)) } : r,
  );
  if (out.length && home) {
    const last = out.length - 1;
    if (out[0].thoughtRatio === undefined && home.latestRatio !== null && home.latestRatio !== undefined)
      out[0] = { ...out[0], thoughtRatio: Math.round(home.latestRatio) };
    if (out[last].thoughtRatio === undefined && home.firstRatio !== null && home.firstRatio !== undefined)
      out[last] = { ...out[last], thoughtRatio: Math.round(home.firstRatio) };
  }
  return out;
};
