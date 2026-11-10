import { useState } from 'react';
export function useModal() {
  const [modal, setModal] = useState(null);
  const openModal = (config) => setModal(config);
  const closeModal = () => setModal(null);
  const notify = (message) => openModal({ title: '안내', message });
  return { modal, openModal, closeModal, notify };
}
