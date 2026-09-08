import React, { createContext, useContext, useState, useEffect } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState({});

  const openModal = (modalId, data = {}) => {
    setActiveModal(modalId);
    setModalData(data);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalData({});
    document.body.style.overflow = '';
  };

  useEffect(() => {
    // Expose global window API for backwards compatibility with legacy HTML onclick handlers
    window.AvinyaModals = {
      openModal: (id) => openModal(id),
      closeAll: closeModal,
      closeModal: closeModal,
      closeAllModals: closeModal,
      openStoryModal: (author, title, content, image) => {
        openModal('story-modal', { author, title, content, image });
      },
      openGuideModal: (guideName, downloadUrl) => {
        openModal('guide-modal', { guideName, downloadUrl });
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ModalContext.Provider value={{ activeModal, modalData, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
