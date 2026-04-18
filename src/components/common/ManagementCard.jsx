import React from 'react';
import { motion } from 'framer-motion';
import ActionMenu from '../ActionMenu';

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

export default function ManagementCard({
  title,
  subtitle,
  eyebrow,
  icon,
  badge,
  headerAction,
  children,
  footer,
  actions,
  menuId,
  activeId,
  onToggle,
  onClick,
  className = '',
  bodyClassName = '',
  footerClassName = '',
  accent = 'slate',
  delay = 0,
  hoverable = true,
}) {
  const accentMap = {
    slate: 'border-slate-200 shadow-slate-100',
    blue: 'border-blue-100 shadow-blue-100',
    green: 'border-green-100 shadow-green-100',
    emerald: 'border-emerald-100 shadow-emerald-100',
    indigo: 'border-indigo-100 shadow-indigo-100',
    violet: 'border-violet-100 shadow-violet-100',
    rose: 'border-rose-100 shadow-rose-100',
    amber: 'border-amber-100 shadow-amber-100',
  };

  const cardBody = (
    <div
      className={joinClasses(
        'rounded-2xl border bg-white p-5 shadow-md transition-all duration-300',
        accentMap[accent] || accentMap.slate,
        hoverable && 'hover:-translate-y-1 hover:shadow-xl',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {(eyebrow || title || subtitle || badge || headerAction || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-2">
              {icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600">{icon}</span>}
              <div className="min-w-0">
                {title && <h3 className="truncate text-base font-bold text-slate-900">{title}</h3>}
                {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {badge}
            {headerAction}
            {actions && (
              <ActionMenu
                menuId={menuId || title || 'card'}
                activeId={activeId}
                onToggle={onToggle}
                actions={actions}
              />
            )}
          </div>
        </div>
      )}

      <div className={bodyClassName}>{children}</div>

      {footer && (
        <div className={joinClasses('mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4', footerClassName)}>
          {footer}
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
    >
      {cardBody}
    </motion.div>
  );
}
