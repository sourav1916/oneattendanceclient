import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';
import ModalScrollLock from './ModalScrollLock';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 300 } },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  size = 'lg',      // 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl'
  footer,
  children,
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  };

  const selectedSize = sizeMap[size] || sizeMap.lg;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <ModalScrollLock />
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full ${selectedSize} max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/60 m-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white p-5 sm:px-6">
              <div className="flex items-center gap-4">
                {icon && (
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-indigo-600 border border-indigo-100 shadow-sm shrink-0">
                    {icon}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-800 truncate leading-tight">{title}</h2>
                  {subtitle && (
                    <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6">
              {children}
            </div>

            {/* FOOTER */}
            {footer && (
              <div className="shrink-0 flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
