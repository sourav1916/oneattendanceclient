// components/ScrollableArea.jsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ScrollableArea = ({ 
  children, 
  className = '', 
  variant = 'default',
  maxHeight = 'auto',
  maxWidth = 'auto',
  hideScrollbar = false,
  showGradient = false,
  ...props 
}) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Ensure the component is scrollable
    if (scrollRef.current) {
      scrollRef.current.style.overflowY = 'auto';
      scrollRef.current.style.overflowX = 'hidden';
    }
  }, []);

  const getScrollbarClass = () => {
    switch (variant) {
      case 'thin':
        return 'scrollbar-thin';
      case 'extra-thin':
        return 'scrollbar-extra-thin';
      case 'gradient':
        return 'scrollbar-gradient';
      case 'primary':
        return 'scrollbar-primary';
      case 'success':
        return 'scrollbar-success';
      case 'warning':
        return 'scrollbar-warning';
      case 'danger':
        return 'scrollbar-danger';
      default:
        return '';
    }
  };

  return (
    <motion.div
      ref={scrollRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        overflow-auto
        ${getScrollbarClass()}
        ${hideScrollbar ? 'scrollbar-hidden' : ''}
        ${showGradient ? 'scrollbar-container' : ''}
        ${className}
      `}
      style={{ 
        maxHeight, 
        maxWidth,
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollableArea;