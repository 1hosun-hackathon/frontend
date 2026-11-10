import React, { createContext, useContext } from 'react';
import { useModal } from '../hooks/useModal';

const ModalContext = createContext(null);
export function ModalProvider({ children }) {
  const modal = useModal();
  return (
    <ModalContext.Provider value={modal}>{children}</ModalContext.Provider>
  );
}
export function useModalContext() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('ModalProvider가 필요합니다.');
  return ctx;
}
