import { useModalContext } from '../context/ModalContext';
import Button from './Button';
import React, { useEffect } from 'react';

export default function CommonModal() {
  const { modal, closeModal } = useModalContext();
  useEffect(() => {
    if (!modal) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modal, closeModal]);
  if (!modal) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="common-modal-title"
        className="w-full max-w-110 rounded-2xl bg-white p-7 shadow-xl"
      >
        <h2
          id="common-modal-title"
          className="mb-3 text-xl font-bold text-[#343632]"
        >
          {modal.title}
        </h2>
        <p className="whitespace-pre-line text-sm leading-7 text-[#7B8078]">
          {modal.message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            size="compact"
            variant="secondary"
            onClick={closeModal}
          >
            {modal.onConfirm ? modal.cancelLabel || '취소' : '확인'}
          </Button>
          {modal.onConfirm && (
            <Button
              type="button"
              size="compact"
              variant={modal.danger ? 'danger' : 'primary'}
              onClick={() => {
                const action = modal.onConfirm;
                closeModal();
                action();
              }}
            >
              {modal.confirmLabel || '확인'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
