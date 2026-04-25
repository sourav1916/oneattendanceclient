import React from 'react';
import { motion } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';

const toneClasses = {
  slate: {
    solid: 'bg-slate-700 text-white hover:bg-slate-800 shadow-slate-200',
    soft: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
    outline: 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50',
  },
  blue: {
    solid: 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200',
    soft: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    outline: 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50',
  },
  green: {
    solid: 'bg-green-600 text-white hover:bg-green-700 shadow-green-200',
    soft: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
    outline: 'bg-white text-green-700 border-green-200 hover:bg-green-50',
  },
  emerald: {
    solid: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    outline: 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50',
  },
  indigo: {
    solid: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200',
    soft: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
    outline: 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50',
  },
  violet: {
    solid: 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-200',
    soft: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
    outline: 'bg-white text-violet-700 border-violet-200 hover:bg-violet-50',
  },
  amber: {
    solid: 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200',
    soft: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    outline: 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50',
  },
  rose: {
    solid: 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-200',
    soft: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    outline: 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50',
  },
};

const sizeClasses = {
  sm: 'px-3 py-2 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-sm rounded-[10px] gap-2.5',
};

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function ManagementButton({
  children,
  tone = 'slate',
  variant = 'solid',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...rest
}) {
  const palette = toneClasses[tone] || toneClasses.slate;
  const toneClass = palette[variant] || palette.solid;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={isDisabled ? undefined : { scale: 1.02, y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      disabled={isDisabled}
      className={joinClasses(
        'inline-flex items-center justify-center border font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-offset-0',
        toneClass,
        sizeClass,
        fullWidth ? 'w-full' : 'w-auto',
        isDisabled ? 'cursor-not-allowed opacity-60' : 'shadow-sm hover:shadow-md',
        className
      )}
      {...rest}
    >
      {loading ? <FaSpinner className="animate-spin" size={14} /> : leftIcon}
      <span className="whitespace-nowrap">{children}</span>
      {!loading && rightIcon}
    </motion.button>
  );
}
