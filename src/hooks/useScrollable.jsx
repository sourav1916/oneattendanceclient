// hooks/useScrollable.js
import { useEffect, useRef } from 'react';

export const useScrollable = (isMobile) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const handleWheel = (e) => {
      // For desktop mouse wheel
      if (!isMobile) {
        e.stopPropagation();
      }
    };

    const handleTouchStart = (e) => {
      // For mobile touch start
      if (isMobile) {
        // Store initial touch position
        const touch = e.touches[0];
        element.dataset.touchStartY = touch.clientY;
        element.dataset.touchStartScrollTop = element.scrollTop;
      }
    };

    const handleTouchMove = (e) => {
      // For mobile touch move
      if (isMobile) {
        const touch = e.touches[0];
        const touchStartY = parseFloat(element.dataset.touchStartY || 0);
        const touchStartScrollTop = parseFloat(element.dataset.touchStartScrollTop || 0);
        
        // Calculate scroll delta
        const deltaY = touchStartY - touch.clientY;
        const newScrollTop = touchStartScrollTop + deltaY;
        
        // Check if scrolling should be allowed
        const isAtTop = newScrollTop <= 0;
        const isAtBottom = newScrollTop >= element.scrollHeight - element.clientHeight;
        
        // Prevent default only when at boundaries to avoid page pull-to-refresh
        if ((isAtTop && deltaY < 0) || (isAtBottom && deltaY > 0)) {
          e.preventDefault();
        } else {
          // Allow normal scrolling
          element.scrollTop = newScrollTop;
          e.preventDefault(); // Still prevent default to avoid page scroll
        }
      }
    };

    const handleTouchEnd = () => {
      // Clean up
      delete element.dataset.touchStartY;
      delete element.dataset.touchStartScrollTop;
    };

    // Add event listeners
    element.addEventListener('wheel', handleWheel, { passive: false });
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile]);

  return scrollRef;
};