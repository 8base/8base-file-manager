/* eslint-disable no-console */
// @ts-nocheck
import React, { useCallback, useLayoutEffect, useState } from 'react';

import { createPortal } from 'react-dom';

import { MODAL_STYLE } from './Modal.style';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

const CONTAINER_ID = 'root';
const ESCAPE_KEY = 'Escape';

// @ts-ignore
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const modalRoot = document.getElementById(CONTAINER_ID);

    if (!modalRoot) {
      console.warn(`@8base-react/file-input: container with ${CONTAINER_ID} id does not exist`);
      return;
    }

    setContainer(modalRoot);
  }, []);

  const onDocumentKeyPress = useCallback(
    (event: { key: string; }) => {
      if (event.key === ESCAPE_KEY) {
        onClose();
      }
    },
    [onClose],
  );

  useLayoutEffect(() => {
    document.addEventListener('keydown', onDocumentKeyPress);
    return () => {
      document.removeEventListener('keydown', onDocumentKeyPress);
    };
  }, [onDocumentKeyPress]);

  if (!isOpen) {
    return null;
  }

  if (!container) {
    return null;
  }

  return createPortal(
    <div className={ MODAL_STYLE.overlay }>
      <div className={ MODAL_STYLE.content }>{ children }</div>
    </div>,
    container,
  );
};
