// 새 글 설정 화면의 첨부파일 목록·검증 훅 (useWriting에서 호출)
import { useRef, useState } from 'react';

// 첨부파일 검증 기준 (SetupPage input의 accept와 같은 확장자, 명세: 0~5개, 각 10MB 이하)
const ALLOWED_FILE_EXT = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'txt', 'md', 'png', 'jpg', 'jpeg'];
const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
// 파일 크기 표시: 1024KB 미만은 KB(정수, 최소 1KB), 이상은 MB(소수 1자리)
const formatFileSize = (bytes) => {
  if (typeof bytes !== 'number') return '';
  const kb = Math.max(1, Math.round(bytes / 1024));
  return kb < 1024 ? `${kb}KB` : `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};
const toFileItem = (f) => ({
  name: f.name,
  size: f.size,
  sizeLabel: formatFileSize(f.size),
});
export function useAttachments(notify) {
  // 화면 목록용: [{ name, size, sizeLabel }] (File 객체는 fileObjectsRef에 같은 순서로 보관)
  const [files, setFileNames] = useState([]);
  // 업로드할 실제 File 객체 (이름 목록 files와 함께 갱신. 메모리에만 있어 새로고침하면 사라짐)
  const fileObjectsRef = useRef([]);
  // 검증 공통: 형식·10MB·중복을 걸러내고, 기존 목록(base)과 합쳐 최대 5개까지 반영
  const applyFiles = (base, list) => {
    const items = Array.from(list ?? []);
    const problems = [];
    const sameFile = (a, b) =>
      a.name === b.name && a.size === b.size && a.lastModified === b.lastModified;
    let valid = items.filter((f) => {
      const ext = f.name.includes('.') ? f.name.split('.').pop().toLowerCase() : '';
      if (!ALLOWED_FILE_EXT.includes(ext)) {
        problems.push(`${f.name} · 올릴 수 없는 형식`);
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        problems.push(`${f.name} · 10MB 초과`);
        return false;
      }
      if (base.some((b) => sameFile(b, f))) {
        problems.push(`${f.name} · 이미 추가한 파일`);
        return false;
      }
      return true;
    });
    let next = [...base, ...valid];
    if (next.length > MAX_FILES) {
      problems.push(`최대 ${MAX_FILES}개까지 올릴 수 있어 앞의 ${MAX_FILES}개만 첨부했어요.`);
      next = next.slice(0, MAX_FILES);
    }
    fileObjectsRef.current = next;
    setFileNames(next.map(toFileItem));
    if (problems.length)
      notify(`첨부하지 못한 파일이 있어요.\n${problems.join('\n')}`);
  };
  // 기존 setFiles: 목록을 새로 고른 파일로 바꿈 (File 배열이 아니면 이름만 저장)
  const setFiles = (list) => {
    const items = Array.from(list ?? []);
    const isFile = (f) => typeof File !== 'undefined' && f instanceof File;
    if (!items.every(isFile)) {
      fileObjectsRef.current = [];
      setFileNames(items.map((name) => ({ name, size: null, sizeLabel: '' })));
      return;
    }
    applyFiles([], items);
  };
  // 파일을 더 고르면 기존 목록 뒤에 이어 붙임 (최대 5개, 같은 파일은 건너뜀)
  const addFiles = (list) => applyFiles(fileObjectsRef.current, list);
  // 목록의 index번째 파일을 화면 목록과 업로드 대상(ref) 모두에서 제거
  const removeFile = (index) => {
    const next = fileObjectsRef.current.filter((_, i) => i !== index);
    fileObjectsRef.current = next;
    setFileNames((prev) => prev.filter((_, i) => i !== index));
  };
  // 새 글을 시작할 때 이전 글의 첨부를 비움
  const clearFiles = () => {
    fileObjectsRef.current = [];
    setFileNames([]);
  };
  return { files, fileObjectsRef, setFiles, addFiles, removeFile, clearFiles };
}
