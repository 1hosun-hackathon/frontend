// 기록 API (openapi.json: 기록·대시보드 태그)
import { request } from './client';

// GET /api/v1/trainings?status=ALL|COMPLETED|IN_PROGRESS&page=&size=
// → { items[{ trainingId, topic, writingType, status, date, recheckCount }], page, size, totalElements, hasNext }
export const getTrainings = ({ status = 'ALL', page = 0, size = 10 } = {}) =>
  request(
    `/api/v1/trainings?status=${encodeURIComponent(status)}&page=${page}&size=${size}`,
  );

const MAX_ITEMS = 500;

// 모든 페이지를 hasNext를 따라 조회한다 (최대 500건).
// 페이지 크기는 50으로 시도하고, 첫 요청이 400이면 10으로 바꿔 다시 시도한다.
export async function getAllTrainings(status = 'ALL') {
  let size = 50;
  let page = 0;
  const items = [];
  while (items.length < MAX_ITEMS) {
    let res;
    try {
      res = await getTrainings({ status, page, size });
    } catch (err) {
      if (err?.status === 400 && page === 0 && size !== 10) {
        size = 10;
        continue;
      }
      throw err;
    }
    items.push(...(res?.items ?? []));
    if (!res?.hasNext) break;
    page += 1;
  }
  return items;
}

// GET /api/v1/trainings/{id}/detail → TrainingDetailResponse (COMPLETED만 조회 가능)
// (topic, writingType, completedAt, recheckCount, draft, draftAnalysisId, finalWriting, revisions[])
export const getTrainingDetail = (trainingId) =>
  request(`/api/v1/trainings/${trainingId}/detail`);

// DELETE /api/v1/trainings/{id} → 204
export const deleteTraining = (trainingId) =>
  request(`/api/v1/trainings/${trainingId}`, { method: 'DELETE' });
