// hooks/useBodyScrollLock.js
import { useEffect } from 'react';

export const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (isLocked) {
      // Get the current scroll position
      const scrollY = window.scrollY;
      
      // Apply styles to lock body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Store scroll position for later restoration
      document.body.dataset.scrollY = scrollY;
    } else {
      // Restore scroll position
      const scrollY = document.body.dataset.scrollY;
      
      // Remove styles
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY));
        delete document.body.dataset.scrollY;
      }
    }
    
    // Cleanup
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [isLocked]);
};