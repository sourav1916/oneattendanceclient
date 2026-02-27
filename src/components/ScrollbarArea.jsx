// components/ScrollableArea.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ScrollableArea = ({ 
  children, 
  className = '', 
  variant = 'default', // default, thin, extra-thin, gradient, primary, success, warning, danger
  maxHeight = 'auto',
  maxWidth = 'auto',
  hideScrollbar = false,
  showGradient = false,
  ...props 
}) => {
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
        scrollBehavior: 'smooth'
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default ScrollableArea;