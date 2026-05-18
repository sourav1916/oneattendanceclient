import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { FaArrowRight, FaTimes, FaSignInAlt, FaSignOutAlt, FaCoffee, FaClock } from 'react-icons/fa';

const ACTION_CONFIG = {
  'punch-in': {
    label: 'Punch In',
    icon: FaSignInAlt,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    shadow: 'shadow-emerald-200'
  },
  'punch-out': {
    label: 'Punch Out',
    icon: FaSignOutAlt,
    color: 'rose',
    gradient: 'from-rose-500 to-pink-600',
    shadow: 'shadow-rose-200'
  },
  'break-in': {
    label: 'Start Break',
    icon: FaCoffee,
    color: 'amber',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-200'
  },
  'break-out': {
    label: 'End Break',
    icon: FaSignInAlt,
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-600',
    shadow: 'shadow-indigo-200'
  }
};

const SwipeConfirmationModal = ({ isOpen, onClose, onConfirm, actionType, isLoading }) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 150], [1, 0]);
  const config = ACTION_CONFIG[actionType] || ACTION_CONFIG['punch-in'];
  const Icon = config.icon;

  useEffect(() => {
    if (!isOpen || (!isLoading && isSwiped)) {
      setIsSwiped(false);
      x.set(0);
    }
  }, [isOpen, isLoading, x]);

  const handleDragEnd = (_, info) => {
    // If dragged more than 200px, confirm
    if (info.offset.x > 180) {
      setIsSwiped(true);
      x.set(240); // Snap to end
      setTimeout(() => {
        onConfirm();
      }, 300);
    } else {
      x.set(0); // Snap back
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 backdrop-blur-md bg-black/40"
          onClick={() => !isLoading && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-sm overflow-hidden rounded-[32px] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Icon Section */}
            <div className={`relative px-8 pt-10 pb-6 text-center`}>
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`absolute right-6 top-6 rounded-full bg-gray-100 p-2 text-gray-400 hover:bg-gray-200 transition-all ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              >
                <FaTimes size={14} />
              </button>

              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} ${config.shadow} shadow-lg text-white`}>
                <Icon size={32} />
              </div>

              <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                Confirm {config.label}
              </h2>
              <p className="mt-2 text-sm font-medium text-gray-500">
                Please swipe the button below to confirm your attendance action.
              </p>
            </div>

            {/* Swipe Area */}
            <div className="px-8 pb-10">
              <div className="relative h-16 w-full rounded-xl bg-gray-100 p-1 flex items-center border border-gray-200/50">
                {/* Track Hint Text */}
                <motion.div
                  style={{ opacity: isLoading ? 0 : opacity }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    {isLoading ? 'Processing...' : 'Swipe to confirm'}
                  </span>
                </motion.div>

                {/* The Swipe Button */}
                <motion.div
                  drag={isLoading ? false : "x"}
                  dragConstraints={{ left: 0, right: 240 }}
                  dragElastic={0.1}
                  style={{ x }}
                  onDragEnd={handleDragEnd}
                  animate={isSwiped ? { x: 240 } : { x: 0 }}
                  className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-lg transition-shadow hover:shadow-xl ${isLoading ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FaArrowRight size={18} />
                  )}
                </motion.div>

                {/* Progress Overlay (optional but looks nice) */}
                <motion.div
                  className={`absolute left-1 top-1 bottom-1 rounded-xl bg-gradient-to-r ${config.gradient} opacity-20`}
                  style={{ width: x, maxWidth: 'calc(100% - 8px)' }}
                />
              </div>

              {/* Cancel Button */}
              <button
                onClick={onClose}
                disabled={isLoading}
                className={`mt-6 w-full py-3 text-sm font-bold text-gray-400 transition-all hover:text-gray-600 ${isLoading ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                Cancel Action
              </button>
            </div>

            {/* Status Footer */}
            <div className="bg-gray-50 px-8 py-4 flex items-center justify-center gap-2 border-t border-gray-100">
              <FaClock className="text-gray-400" size={12} />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Timestamp: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SwipeConfirmationModal;
