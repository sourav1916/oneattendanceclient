import { useEffect } from 'react';

let lockCount = 0;
let previousOverflow = '';

const ModalScrollLock = () => {
  useEffect(() => {
    const body = document.body;

    if (lockCount === 0) {
      previousOverflow = body.style.overflow;
      body.style.overflow = 'hidden';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount === 0) {
        body.style.overflow = previousOverflow;
      }
    };
  }, []);

  return null;
};

export default ModalScrollLock;
