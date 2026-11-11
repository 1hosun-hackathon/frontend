// 훈련 · 글 작성 API (openapi.json: 훈련 / 글 작성 태그)
import { request } from './client';

// TODO(writingType): 현재 서버 enum은 '논설문'만 허용해서, 화면에서 무엇을 고르든 '논설문'으로 고정 전송한다.
// 백엔드가 enum을 늘리면 아래 한 줄을 `(genre) => genre;` 로 바꾸면 고른 값이 그대로 전송된다.
export const toServerWritingType = (genre) => '논설문';

// POST /api/v1/trainings (multipart/form-data)
// request 파트(JSON) → { trainingId, status, startedAt, timerEndsAt, attachments }
// 첨부파일(files 파트)은 이번 범위에서 제외 — 보내지 않는다.
export function createTraining({ topic, genre, requirements, minutes }) {
  const payload = {
    topic,
    writingType: toServerWritingType(genre),
    requirements: requirements?.trim() || undefined,
    timerMinutes: minutes ?? null,
  };
  const form = new FormData();
  form.append(
    'request',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  );
  return request('/api/v1/trainings', { method: 'POST', body: form });
}

// GET /api/v1/trainings/{id} → TrainingWorkspaceResponse
// (topic, writingType, requirements, status, timerMinutes, editorContent, latestAnalysisId ...)
export const getTraining = (trainingId) =>
  request(`/api/v1/trainings/${trainingId}`);

// PUT /api/v1/trainings/{id}/temp → { tempSavedAt } (DRAFTING·REWRITING 상태에서만)
export const saveTemp = (trainingId, content) =>
  request(`/api/v1/trainings/${trainingId}/temp`, {
    method: 'PUT',
    body: { content },
  });

// POST /api/v1/trainings/{id}/draft → { versionId, seqNo, analysisId, status }
export const submitDraft = (trainingId, content) =>
  request(`/api/v1/trainings/${trainingId}/draft`, {
    method: 'POST',
    body: { content },
  });

// POST /api/v1/trainings/{id}/rewrite → TrainingWorkspaceResponse
// COMPARED → REWRITING. 이미 REWRITING이면 그대로 200 (여러 번 호출해도 결과 같음)
export const startRewrite = (trainingId) =>
  request(`/api/v1/trainings/${trainingId}/rewrite`, { method: 'POST' });

// POST /api/v1/trainings/{id}/revisions → 202 { versionId, seqNo, analysisId, status }
// REWRITING → ANALYZING. 직전 제출본과 같으면 409(NO_CHANGES), 빈 내용이면 400(EMPTY_CONTENT)
export const submitRevision = (trainingId, content) =>
  request(`/api/v1/trainings/${trainingId}/revisions`, {
    method: 'POST',
    body: { content },
  });

// POST /api/v1/trainings/{id}/complete → { trainingId, status, finalVersionId, completedAt }
// REWRITING 상태에서만 가능
export const completeTraining = (trainingId, content) =>
  request(`/api/v1/trainings/${trainingId}/complete`, {
    method: 'POST',
    body: { content },
  });
