// src/contexts/ModalContext.jsx
import React, { createContext, useState, useCallback, useContext } from 'react';
import Modal from '../components/Modal'; // Assuming your Modal component is here

const ModalContext = createContext(null);

export const ModalProvider = ({ children }) => {
  const [modalContent, setModalContent] = useState(null);

  const openModal = useCallback((title, message, options = {}) => {
    setModalContent({ title, message, ...options });
  }, []);

  const closeModal = useCallback(() => {
    setModalContent(null);
  }, []);

  const value = React.useMemo(() => ({ openModal, closeModal }), [openModal, closeModal]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Modal
        show={!!modalContent}
        title={modalContent?.title}
        message={modalContent?.message}
        onClose={closeModal}
        content={modalContent?.content}
        hideFooter={modalContent?.hideFooter}
        isSuccess={modalContent?.isSuccess}
      />
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  return useContext(ModalContext);
};