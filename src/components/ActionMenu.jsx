import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaEllipsisV } from 'react-icons/fa';

/**
 * Standardized Action Menu component that renders via a Portal
 * to avoid clipping issues with parent overflow.
 * 
 * @param {Array} actions - Array of action objects: { label, icon, onClick, className, disabled, title }
 * @param {String} activeId - (Optional) Current active menu ID for external control
 * @param {Function} onToggle - (Optional) External toggle handler
 * @param {any} menuId - (Optional) Unique identifier for this menu
 */
const ActionMenu = ({ actions = [], activeId, onToggle, menuId, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // Use external state if provided, otherwise use internal state
  const isMenuOpen = activeId !== undefined ? activeId === menuId : isOpen;

  const toggleMenu = (e) => {
    e.stopPropagation();
    
    if (onToggle) {
      onToggle(e, menuId);
    } else {
      setIsOpen(!isOpen);
    }

    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
      });
    }
  };

  const closeMenu = () => {
    if (onToggle) {
      onToggle(null, null);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (isMenuOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + window.scrollY,
          left: rect.right + window.scrollX,
        });
      }
    };

    const handleClickOutside = (e) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target) && !triggerRef.current.contains(e.target)) {
        closeMenu();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') closeMenu();
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isMenuOpen]);

  // Adjust coordinates if menu goes off screen
  const menuWidth = 180; // Estimated max width
  const menuHeight = actions.length * 40 + 10;
  
  let refinedTop = coords.top + 8;
  let refinedLeft = coords.left - menuWidth;

  // Horizontal check
  if (refinedLeft < 10) refinedLeft = 10;
  if (refinedLeft + menuWidth > window.innerWidth - 10) refinedLeft = window.innerWidth - menuWidth - 10;

  // Vertical check
  if (refinedTop + menuHeight > window.innerHeight + window.scrollY - 10) {
    if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        refinedTop = rect.top + window.scrollY - menuHeight - 8;
    }
  }

  return (
    <div className="relative inline-block text-left">
      <div ref={triggerRef} onClick={toggleMenu} className="cursor-pointer">
        {trigger || (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:border-purple-300 hover:text-purple-600 active:scale-95 hover:shadow-sm"
          >
            <FaEllipsisV size={14} />
          </button>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              key={`action-menu-${menuId || 'default'}`}
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                top: `${refinedTop}px`,
                left: `${refinedLeft}px`,
                zIndex: 9999,
                width: `${menuWidth}px`,
              }}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white/80 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5"
            >
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!action.disabled) {
                      action.onClick();
                      closeMenu();
                    }
                  }}
                  disabled={action.disabled}
                  title={action.title || ''}
                  className={`
                    flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200
                    ${action.disabled 
                      ? 'cursor-not-allowed opacity-50 grayscale text-gray-400' 
                      : `hover:bg-gray-50 hover:pl-4 ${action.className || 'text-gray-700 hover:text-purple-600'}`
                    }
                  `}
                >
                  {action.icon && <span className="flex-shrink-0 opacity-80">{action.icon}</span>}
                  <span className="truncate">{action.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default ActionMenu;
