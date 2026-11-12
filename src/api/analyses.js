// 비교 분석 API (openapi.json: 비교 분석 태그)
import { request } from './client';

// GET /api/v1/analyses/{id}/status → { analysisId, status(PENDING|GENERATING|SUCCESS|FAILED), trainingStatus }
export const getAnalysisStatus = (analysisId) =>
  request(`/api/v1/analyses/${analysisId}/status`);

// GET /api/v1/analyses/{id} → AnalysisResultResponse
// (myWriting, aiWriting, baseline, overallSummary, strengths, improvements, items, questions)
export const getAnalysis = (analysisId) =>
  request(`/api/v1/analyses/${analysisId}`);

// POST /api/v1/analyses/{id}/retry → { analysisId, status: 'PENDING' } (FAILED 분석만 가능)
export const retryAnalysis = (analysisId) =>
  request(`/api/v1/analyses/${analysisId}/retry`, { method: 'POST' });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 분석 상태를 2초 간격으로 확인한다.
// SUCCESS 또는 FAILED면 그 응답을, 제한 시간(기본 3분)이 지나면 { status: 'TIMEOUT' }을 반환한다.
export async function pollAnalysis(
  analysisId,
  { interval = 2000, timeout = 180000 } = {},
) {
  const deadline = Date.now() + timeout;
  for (;;) {
    const res = await getAnalysisStatus(analysisId);
    if (res?.status === 'SUCCESS' || res?.status === 'FAILED') return res;
    if (Date.now() + interval > deadline) return { analysisId, status: 'TIMEOUT' };
    await wait(interval);
  }
}
