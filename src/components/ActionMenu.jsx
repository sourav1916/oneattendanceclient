import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FaEllipsisV } from 'react-icons/fa';

/**
 * Standardized Action Menu component — renders via a Portal (fixed positioning).
 * AnimatePresence is intentionally omitted: it injects a ref through the portal
 * boundary which triggers a React "ref is not a prop" warning.
 *
 * @param {Array}    actions  - [{ label, icon, onClick, className, disabled, title }]
 * @param {String}   activeId - Current active menu ID (external control)
 * @param {Function} onToggle - (e, menuId) => void
 * @param {any}      menuId   - Unique id for this menu instance
 * @param {ReactNode}trigger  - Optional custom trigger element
 */
const ActionMenu = ({ actions = [], activeId, onToggle, menuId, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  // coords: viewport-relative (for position:fixed)
  // triggerTop = top of trigger button, triggerBottom = bottom of trigger button
  const [coords, setCoords] = useState({ triggerTop: 0, triggerBottom: 0, triggerRight: 0 });
  const triggerRef = useRef(null);
  const menuRef    = useRef(null);

  const isMenuOpen = activeId !== undefined ? activeId === menuId : isOpen;

  const captureCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        triggerTop:    rect.top,
        triggerBottom: rect.bottom,
        triggerRight:  rect.right,
      });
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    captureCoords();
    if (onToggle) {
      onToggle(e, menuId);
    } else {
      setIsOpen((prev) => !prev);
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
    if (!isMenuOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current    && !menuRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        closeMenu();
      }
    };

    const handleScroll = () => captureCoords();
    const handleEscape = (e) => { if (e.key === 'Escape') closeMenu(); };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown',   handleEscape);
    window.addEventListener('scroll',      handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown',   handleEscape);
      window.removeEventListener('scroll',      handleScroll, true);
    };
  }, [isMenuOpen]); 
  // ── Position (all viewport-relative for position:fixed) ──────────────────────
  const menuWidth  = 192;
  const menuHeight = actions.length * 44 + 16;

  // Default: open below-right of trigger, aligned to right edge of trigger
  let top  = coords.triggerBottom + 6;
  let left = coords.triggerRight  - menuWidth;

  // Clamp horizontally
  if (left < 8)                                 left = 8;
  if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8;

  // Flip above if not enough room below
  if (top + menuHeight > window.innerHeight - 8) {
    top = coords.triggerTop - menuHeight - 6;
  }

  // Only portal-render when open (avoids constant re-animation / freezing)
  const menuPortal = isMenuOpen ? createPortal(
    <motion.div
      ref={menuRef}
      key={`action-menu-${String(menuId ?? 'default')}`}
      initial={{ opacity: 0, scale: 0.95, y: -6 }}
      animate={{ opacity: 1, scale: 1,    y: 0  }}
      transition={{ duration: 0.13, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top:      `${top}px`,
        left:     `${left}px`,
        zIndex:   9999,
        width:    `${menuWidth}px`,
      }}
      className="overflow-hidden rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl ring-1 ring-black/5"
    >
      {actions.map((action, index) => (
        <button
          key={index}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!action.disabled) { action.onClick(); closeMenu(); }
          }}
          disabled={action.disabled}
          title={action.title || ''}
          className={`
            flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold
            transition-all duration-150
            ${action.disabled
              ? 'cursor-not-allowed opacity-50 text-gray-400'
              : `hover:bg-gray-50 hover:pl-4 ${action.className || 'text-gray-700 hover:text-purple-600'}`
            }
          `}
        >
          {action.icon && <span className="flex-shrink-0 opacity-80">{action.icon}</span>}
          <span className="truncate">{action.label}</span>
        </button>
      ))}
    </motion.div>,
    document.body
  ) : null;

  return (
    <div className="relative inline-block text-left">
      <div ref={triggerRef} onClick={toggleMenu} className="cursor-pointer">
        {trigger || (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200
                       bg-white text-gray-500 transition-all hover:border-purple-300
                       hover:text-purple-600 hover:shadow-sm active:scale-95"
          >
            <FaEllipsisV size={14} />
          </button>
        )}
      </div>

      {menuPortal}
    </div>
  );
};

export default ActionMenu;
