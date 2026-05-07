import React from 'react';
import { motion } from 'framer-motion';
import { FaSyncAlt } from 'react-icons/fa';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function RefreshButton({
  children = 'Refresh',
  loading = false,
  onClick,
  className = '',
  title = 'Refresh',
  type = 'button',
  ...rest
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={loading ? undefined : { scale: 1.02, y: -1 }}
      whileTap={loading ? undefined : { scale: 0.98 }}
      disabled={loading}
      title={title}
      className={joinClasses(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...rest}
    >
      <FaSyncAlt className={loading ? 'animate-spin' : ''} size={13} />
      <span className="whitespace-nowrap">{children}</span>
    </motion.button>
  );
}
